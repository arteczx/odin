import os
import re
import subprocess
import logging
from pathlib import Path
from typing import Dict, List, Any
from app.models.models import FindingType, RiskLevel

logger = logging.getLogger(__name__)

class StaticAnalyzer:
    """Static analysis for extracted firmware"""
    
    def __init__(self):
        self.sensitive_patterns = {
            'password': {
                'patterns': [
                    r'password\s*[=:]\s*["\']?([^"\'\s]+)["\']?',
                    r'passwd\s*[=:]\s*["\']?([^"\'\s]+)["\']?',
                    r'pwd\s*[=:]\s*["\']?([^"\'\s]+)["\']?'
                ],
                'severity': RiskLevel.HIGH,
                'type': FindingType.CREDENTIAL
            },
            'private_key': {
                'patterns': [
                    r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----',
                    r'-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----',
                    r'-----BEGIN\s+DSA\s+PRIVATE\s+KEY-----'
                ],
                'severity': RiskLevel.CRITICAL,
                'type': FindingType.PRIVATE_KEY
            },
            'api_key': {
                'patterns': [
                    r'api[_-]?key\s*[=:]\s*["\']?([a-zA-Z0-9]{20,})["\']?',
                    r'secret[_-]?key\s*[=:]\s*["\']?([a-zA-Z0-9]{20,})["\']?',
                    r'access[_-]?token\s*[=:]\s*["\']?([a-zA-Z0-9]{20,})["\']?'
                ],
                'severity': RiskLevel.HIGH,
                'type': FindingType.CREDENTIAL
            },
            'ip_address': {
                'patterns': [
                    r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
                ],
                'severity': RiskLevel.MEDIUM,
                'type': FindingType.IP_ADDRESS
            },
            'url': {
                'patterns': [
                    r'https?://[^\s<>"{}|\\^`\[\]]+',
                    r'ftp://[^\s<>"{}|\\^`\[\]]+',
                    r'telnet://[^\s<>"{}|\\^`\[\]]+'
                ],
                'severity': RiskLevel.LOW,
                'type': FindingType.URL
            },
            'email': {
                'patterns': [
                    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                ],
                'severity': RiskLevel.LOW,
                'type': FindingType.SENSITIVE_INFO
            }
        }
        
        self.binary_tools = ['strings', 'file', 'readelf']
        
    def analyze(self, extract_path: str, project_id: str) -> Dict[str, Any]:
        """Perform static analysis on extracted firmware"""
        try:
            results = {
                "findings": [],
                "binary_analysis": {},
                "file_analysis": {},
                "services": []
            }
            
            extract_dir = Path(extract_path)
            
            # Find main filesystem directory
            main_fs = self._find_main_filesystem(extract_dir)
            if not main_fs:
                logger.warning(f"No main filesystem found in {extract_path}")
                return results
            
            logger.info(f"Analyzing filesystem: {main_fs}")
            
            # 1. Search for sensitive information
            sensitive_findings = self._search_sensitive_info(main_fs)
            results["findings"].extend(sensitive_findings)
            
            # 2. Analyze binaries
            binary_findings = self._analyze_binaries(main_fs)
            results["findings"].extend(binary_findings["findings"])
            results["binary_analysis"] = binary_findings["analysis"]
            
            # 3. Analyze configuration files
            config_findings = self._analyze_configs(main_fs)
            results["findings"].extend(config_findings)
            
            # 4. Identify services
            services = self._identify_services(main_fs)
            results["services"] = services
            
            logger.info(f"Static analysis completed. Found {len(results['findings'])} findings")
            return results
            
        except Exception as e:
            logger.error(f"Static analysis failed: {str(e)}")
            return {"error": str(e), "findings": []}
    
    def _find_main_filesystem(self, extract_dir: Path) -> Path:
        """Find the main extracted filesystem directory"""
        # Look for directories that contain typical filesystem structure
        for item in extract_dir.rglob("*"):
            if item.is_dir():
                # Check for common filesystem indicators
                common_dirs = ['bin', 'etc', 'usr', 'var']
                found_dirs = sum(1 for d in common_dirs if (item / d).exists())
                
                if found_dirs >= 2:
                    return item
        
        return None
    
    def _search_sensitive_info(self, fs_path: Path) -> List[Dict[str, Any]]:
        """Search for sensitive information in text files"""
        findings = []
        
        # Search in text files
        for file_path in fs_path.rglob("*"):
            if not file_path.is_file():
                continue
                
            # Skip binary files and large files
            if file_path.stat().st_size > 10 * 1024 * 1024:  # 10MB
                continue
                
            try:
                # Try to read as text
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Search for patterns
                for pattern_name, pattern_info in self.sensitive_patterns.items():
                    for pattern in pattern_info['patterns']:
                        matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                        
                        for match in matches:
                            # Get line number
                            line_num = content[:match.start()].count('\n') + 1
                            
                            # Get context (surrounding lines)
                            lines = content.split('\n')
                            start_line = max(0, line_num - 3)
                            end_line = min(len(lines), line_num + 2)
                            context = '\n'.join(lines[start_line:end_line])
                            
                            finding = {
                                "type": pattern_info['type'].value,
                                "title": f"{pattern_name.replace('_', ' ').title()} Found",
                                "description": f"Potential {pattern_name.replace('_', ' ')} detected in {file_path.name}",
                                "severity": pattern_info['severity'].value,
                                "file_path": str(file_path.relative_to(fs_path)),
                                "line_number": line_num,
                                "content": match.group(0),
                                "context": context,
                                "metadata": {
                                    "pattern": pattern,
                                    "match_type": pattern_name
                                }
                            }
                            findings.append(finding)
                            
            except (UnicodeDecodeError, IOError, PermissionError):
                # Skip files that can't be read as text
                continue
        
        return findings
    
    def _analyze_binaries(self, fs_path: Path) -> Dict[str, Any]:
        """Analyze binary files for security information"""
        findings = []
        analysis = {}
        
        # Common binary locations
        binary_dirs = ['bin', 'sbin', 'usr/bin', 'usr/sbin']
        
        for bin_dir in binary_dirs:
            bin_path = fs_path / bin_dir
            if not bin_path.exists():
                continue
                
            for binary in bin_path.iterdir():
                if not binary.is_file():
                    continue
                    
                try:
                    # Run strings on binary
                    strings_output = self._run_strings(binary)
                    if strings_output:
                        # Search for interesting strings
                        interesting_strings = self._find_interesting_strings(strings_output)
                        
                        for string_info in interesting_strings:
                            finding = {
                                "type": FindingType.SENSITIVE_INFO.value,
                                "title": f"Interesting String in Binary: {binary.name}",
                                "description": f"Found {string_info['type']} in binary",
                                "severity": RiskLevel.MEDIUM.value,
                                "file_path": str(binary.relative_to(fs_path)),
                                "content": string_info['string'],
                                "metadata": {
                                    "string_type": string_info['type'],
                                    "binary_name": binary.name
                                }
                            }
                            findings.append(finding)
                    
                    # Analyze ELF security features
                    if binary.suffix == '' or binary.name in ['busybox', 'dropbear', 'httpd']:
                        security_analysis = self._analyze_elf_security(binary)
                        analysis[str(binary.relative_to(fs_path))] = security_analysis
                        
                        # Create findings for security issues
                        for issue in security_analysis.get('security_issues', []):
                            finding = {
                                "type": FindingType.CONFIG_ISSUE.value,
                                "title": f"Binary Security Issue: {issue['name']}",
                                "description": issue['description'],
                                "severity": issue['severity'],
                                "file_path": str(binary.relative_to(fs_path)),
                                "metadata": {
                                    "security_feature": issue['name'],
                                    "binary_name": binary.name
                                }
                            }
                            findings.append(finding)
                            
                except Exception as e:
                    logger.debug(f"Failed to analyze binary {binary}: {str(e)}")
                    continue
        
        return {"findings": findings, "analysis": analysis}
    
    def _run_strings(self, binary_path: Path) -> str:
        """Run strings command on binary"""
        try:
            result = subprocess.run(
                ['strings', str(binary_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.stdout if result.returncode == 0 else ""
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return ""
    
    def _find_interesting_strings(self, strings_output: str) -> List[Dict[str, str]]:
        """Find interesting strings in binary output"""
        interesting = []
        
        patterns = {
            'debug_info': r'debug|DEBUG|trace|TRACE',
            'credentials': r'admin|root|password|passwd',
            'network': r'http://|https://|ftp://|telnet',
            'crypto': r'AES|RSA|SHA|MD5|ssl|tls'
        }
        
        for line in strings_output.split('\n'):
            line = line.strip()
            if len(line) < 4:
                continue
                
            for pattern_type, pattern in patterns.items():
                if re.search(pattern, line, re.IGNORECASE):
                    interesting.append({
                        'string': line,
                        'type': pattern_type
                    })
                    break
        
        return interesting[:20]  # Limit results
    
    def _analyze_elf_security(self, binary_path: Path) -> Dict[str, Any]:
        """Analyze ELF binary security features"""
        analysis = {
            'security_features': {},
            'security_issues': []
        }
        
        try:
            # Check for security features using readelf
            result = subprocess.run(
                ['readelf', '-h', '-l', str(binary_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                output = result.stdout
                
                # Check for NX bit (No Execute)
                nx_enabled = 'GNU_STACK' in output and 'RWE' not in output
                analysis['security_features']['nx_bit'] = nx_enabled
                
                if not nx_enabled:
                    analysis['security_issues'].append({
                        'name': 'No NX Bit',
                        'description': 'Binary does not have NX bit enabled, making stack execution possible',
                        'severity': RiskLevel.MEDIUM.value
                    })
                
                # Check for PIE (Position Independent Executable)
                pie_enabled = 'DYN' in output
                analysis['security_features']['pie'] = pie_enabled
                
                if not pie_enabled:
                    analysis['security_issues'].append({
                        'name': 'No PIE',
                        'description': 'Binary is not position independent, making ASLR less effective',
                        'severity': RiskLevel.LOW.value
                    })
                    
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        return analysis
    
    def _analyze_configs(self, fs_path: Path) -> List[Dict[str, Any]]:
        """Analyze configuration files for security issues"""
        findings = []
        
        config_files = [
            'etc/passwd', 'etc/shadow', 'etc/hosts',
            'etc/lighttpd.conf', 'etc/httpd.conf', 'etc/nginx.conf',
            'etc/dropbear/dropbear_rsa_host_key', 'etc/ssh/ssh_host_rsa_key'
        ]
        
        for config_file in config_files:
            config_path = fs_path / config_file
            if config_path.exists():
                try:
                    with open(config_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Analyze specific config types
                    if 'passwd' in config_file:
                        passwd_findings = self._analyze_passwd_file(content, config_file)
                        findings.extend(passwd_findings)
                    elif 'shadow' in config_file:
                        shadow_findings = self._analyze_shadow_file(content, config_file)
                        findings.extend(shadow_findings)
                    elif any(web in config_file for web in ['lighttpd', 'httpd', 'nginx']):
                        web_findings = self._analyze_web_config(content, config_file)
                        findings.extend(web_findings)
                        
                except (IOError, PermissionError):
                    continue
        
        return findings
    
    def _analyze_passwd_file(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Analyze /etc/passwd file"""
        findings = []
        
        for line_num, line in enumerate(content.split('\n'), 1):
            if ':' in line:
                parts = line.split(':')
                if len(parts) >= 7:
                    username = parts[0]
                    uid = parts[2]
                    shell = parts[6]
                    
                    # Check for root user with UID 0
                    if uid == '0' and username != 'root':
                        findings.append({
                            "type": FindingType.CONFIG_ISSUE.value,
                            "title": "Non-root User with UID 0",
                            "description": f"User '{username}' has root privileges (UID 0)",
                            "severity": RiskLevel.HIGH.value,
                            "file_path": file_path,
                            "line_number": line_num,
                            "content": line,
                            "metadata": {"username": username, "uid": uid}
                        })
                    
                    # Check for users with shell access
                    if shell and shell not in ['/bin/false', '/sbin/nologin', '/dev/null']:
                        if username not in ['root']:
                            findings.append({
                                "type": FindingType.CONFIG_ISSUE.value,
                                "title": "User with Shell Access",
                                "description": f"User '{username}' has shell access: {shell}",
                                "severity": RiskLevel.MEDIUM.value,
                                "file_path": file_path,
                                "line_number": line_num,
                                "content": line,
                                "metadata": {"username": username, "shell": shell}
                            })
        
        return findings
    
    def _analyze_shadow_file(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Analyze /etc/shadow file"""
        findings = []
        
        for line_num, line in enumerate(content.split('\n'), 1):
            if ':' in line:
                parts = line.split(':')
                if len(parts) >= 2:
                    username = parts[0]
                    password_hash = parts[1]
                    
                    # Check for empty passwords
                    if not password_hash or password_hash in ['', '*', '!']:
                        findings.append({
                            "type": FindingType.CONFIG_ISSUE.value,
                            "title": "Empty Password",
                            "description": f"User '{username}' has no password set",
                            "severity": RiskLevel.CRITICAL.value,
                            "file_path": file_path,
                            "line_number": line_num,
                            "content": line,
                            "metadata": {"username": username}
                        })
        
        return findings
    
    def _analyze_web_config(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Analyze web server configuration"""
        findings = []
        
        # Look for common misconfigurations
        dangerous_patterns = [
            (r'server\.document-root\s*=\s*["\']?/["\']?', "Document root set to filesystem root"),
            (r'server\.username\s*=\s*["\']?root["\']?', "Web server running as root"),
            (r'auth\.require.*=.*\(\)', "Empty authentication requirement"),
        ]
        
        for line_num, line in enumerate(content.split('\n'), 1):
            for pattern, description in dangerous_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    findings.append({
                        "type": FindingType.CONFIG_ISSUE.value,
                        "title": "Web Server Misconfiguration",
                        "description": description,
                        "severity": RiskLevel.HIGH.value,
                        "file_path": file_path,
                        "line_number": line_num,
                        "content": line.strip(),
                        "metadata": {"config_type": "web_server"}
                    })
        
        return findings
    
    def _identify_services(self, fs_path: Path) -> List[Dict[str, Any]]:
        """Identify running services and daemons"""
        services = []
        
        # Common service binaries
        service_binaries = {
            'dropbear': {'type': 'SSH Server', 'port': 22, 'risk': 'medium'},
            'sshd': {'type': 'SSH Server', 'port': 22, 'risk': 'medium'},
            'telnetd': {'type': 'Telnet Server', 'port': 23, 'risk': 'high'},
            'httpd': {'type': 'HTTP Server', 'port': 80, 'risk': 'medium'},
            'lighttpd': {'type': 'HTTP Server', 'port': 80, 'risk': 'medium'},
            'nginx': {'type': 'HTTP Server', 'port': 80, 'risk': 'medium'},
            'ftpd': {'type': 'FTP Server', 'port': 21, 'risk': 'high'},
            'snmpd': {'type': 'SNMP Agent', 'port': 161, 'risk': 'medium'},
            'dnsmasq': {'type': 'DNS/DHCP Server', 'port': 53, 'risk': 'low'}
        }
        
        # Search for service binaries
        for service_name, service_info in service_binaries.items():
            for binary_dir in ['bin', 'sbin', 'usr/bin', 'usr/sbin']:
                binary_path = fs_path / binary_dir / service_name
                if binary_path.exists():
                    services.append({
                        'name': service_name,
                        'type': service_info['type'],
                        'port': service_info['port'],
                        'risk_level': service_info['risk'],
                        'binary_path': str(binary_path.relative_to(fs_path)),
                        'found': True
                    })
                    break
        
        return services
