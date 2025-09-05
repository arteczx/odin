import subprocess
import re
import json
import logging
import requests
from pathlib import Path
from typing import Dict, List, Any
from app.models.models import RiskLevel

logger = logging.getLogger(__name__)

class CVEAnalyzer:
    """CVE analysis for identified software components"""
    
    def __init__(self):
        self.software_patterns = {
            'busybox': {
                'version_patterns': [
                    r'BusyBox\s+v?(\d+\.\d+\.\d+)',
                    r'busybox\s+(\d+\.\d+\.\d+)'
                ],
                'binary_paths': ['bin/busybox', 'sbin/busybox']
            },
            'dropbear': {
                'version_patterns': [
                    r'Dropbear\s+SSH\s+server\s+v?(\d+\.\d+)',
                    r'dropbear_(\d+\.\d+)'
                ],
                'binary_paths': ['sbin/dropbear', 'usr/sbin/dropbear']
            },
            'lighttpd': {
                'version_patterns': [
                    r'lighttpd/(\d+\.\d+\.\d+)',
                    r'lighttpd\s+(\d+\.\d+\.\d+)'
                ],
                'binary_paths': ['sbin/lighttpd', 'usr/sbin/lighttpd']
            },
            'openssl': {
                'version_patterns': [
                    r'OpenSSL\s+(\d+\.\d+\.\d+[a-z]?)',
                    r'openssl\s+(\d+\.\d+\.\d+[a-z]?)'
                ],
                'binary_paths': ['bin/openssl', 'usr/bin/openssl']
            },
            'dnsmasq': {
                'version_patterns': [
                    r'Dnsmasq\s+version\s+(\d+\.\d+)',
                    r'dnsmasq-(\d+\.\d+)'
                ],
                'binary_paths': ['sbin/dnsmasq', 'usr/sbin/dnsmasq']
            },
            'nginx': {
                'version_patterns': [
                    r'nginx/(\d+\.\d+\.\d+)',
                    r'nginx\s+version:\s+nginx/(\d+\.\d+\.\d+)'
                ],
                'binary_paths': ['sbin/nginx', 'usr/sbin/nginx']
            }
        }
        
        # NVD API base URL
        self.nvd_api_base = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        
    def analyze(self, extract_path: str, project_id: str) -> Dict[str, Any]:
        """Analyze extracted firmware for CVE vulnerabilities"""
        try:
            results = {
                "cves": [],
                "software_inventory": [],
                "analysis_summary": {}
            }
            
            extract_dir = Path(extract_path)
            
            # Find main filesystem
            main_fs = self._find_main_filesystem(extract_dir)
            if not main_fs:
                logger.warning(f"No main filesystem found in {extract_path}")
                return results
            
            logger.info(f"Starting CVE analysis for {project_id}")
            
            # 1. Identify software components and versions
            software_inventory = self._identify_software_versions(main_fs)
            results["software_inventory"] = software_inventory
            
            # 2. Query CVE databases for each identified software
            for software in software_inventory:
                if software.get('version'):
                    cves = self._query_cves_for_software(
                        software['name'], 
                        software['version']
                    )
                    results["cves"].extend(cves)
            
            # 3. Generate analysis summary
            results["analysis_summary"] = self._generate_summary(results["cves"])
            
            logger.info(f"CVE analysis completed. Found {len(results['cves'])} CVEs for {len(software_inventory)} software components")
            return results
            
        except Exception as e:
            logger.error(f"CVE analysis failed: {str(e)}")
            return {"error": str(e), "cves": []}
    
    def _find_main_filesystem(self, extract_dir: Path) -> Path:
        """Find the main extracted filesystem directory"""
        for item in extract_dir.rglob("*"):
            if item.is_dir():
                common_dirs = ['bin', 'etc', 'usr', 'var']
                found_dirs = sum(1 for d in common_dirs if (item / d).exists())
                if found_dirs >= 2:
                    return item
        return None
    
    def _identify_software_versions(self, fs_path: Path) -> List[Dict[str, Any]]:
        """Identify software components and their versions"""
        software_inventory = []
        
        for software_name, software_info in self.software_patterns.items():
            # Try to find the binary
            binary_path = None
            for bin_path in software_info['binary_paths']:
                full_path = fs_path / bin_path
                if full_path.exists():
                    binary_path = full_path
                    break
            
            if not binary_path:
                continue
            
            # Try to get version information
            version = self._extract_version(binary_path, software_info['version_patterns'])
            
            software_entry = {
                'name': software_name,
                'binary_path': str(binary_path.relative_to(fs_path)),
                'version': version,
                'found': True
            }
            
            software_inventory.append(software_entry)
            logger.info(f"Found {software_name} version {version or 'unknown'}")
        
        return software_inventory
    
    def _extract_version(self, binary_path: Path, version_patterns: List[str]) -> str:
        """Extract version from binary using various methods"""
        version = None
        
        # Method 1: Try running binary with --version
        version = self._try_version_flag(binary_path)
        if version:
            return version
        
        # Method 2: Use strings command and pattern matching
        version = self._extract_version_from_strings(binary_path, version_patterns)
        if version:
            return version
        
        # Method 3: Check file metadata
        version = self._extract_version_from_file_info(binary_path)
        if version:
            return version
        
        return None
    
    def _try_version_flag(self, binary_path: Path) -> str:
        """Try to get version by running binary with --version flag"""
        try:
            # Try different version flags
            version_flags = ['--version', '-v', '-V', '--help']
            
            for flag in version_flags:
                try:
                    result = subprocess.run(
                        [str(binary_path), flag],
                        capture_output=True,
                        text=True,
                        timeout=5,
                        cwd='/tmp'  # Safe working directory
                    )
                    
                    if result.returncode == 0 or result.stderr:
                        output = result.stdout + result.stderr
                        
                        # Look for version patterns in output
                        version_match = re.search(r'(\d+\.\d+(?:\.\d+)?(?:[a-z])?)', output)
                        if version_match:
                            return version_match.group(1)
                            
                except (subprocess.TimeoutExpired, PermissionError):
                    continue
                    
        except Exception as e:
            logger.debug(f"Failed to run version check on {binary_path}: {str(e)}")
        
        return None
    
    def _extract_version_from_strings(self, binary_path: Path, version_patterns: List[str]) -> str:
        """Extract version using strings command and regex patterns"""
        try:
            result = subprocess.run(
                ['strings', str(binary_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                strings_output = result.stdout
                
                # Try each version pattern
                for pattern in version_patterns:
                    matches = re.findall(pattern, strings_output, re.IGNORECASE)
                    if matches:
                        return matches[0]
                        
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        return None
    
    def _extract_version_from_file_info(self, binary_path: Path) -> str:
        """Extract version from file command output"""
        try:
            result = subprocess.run(
                ['file', str(binary_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                file_output = result.stdout
                
                # Look for version in file output
                version_match = re.search(r'version\s+(\d+\.\d+(?:\.\d+)?)', file_output, re.IGNORECASE)
                if version_match:
                    return version_match.group(1)
                    
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        return None
    
    def _query_cves_for_software(self, software_name: str, version: str) -> List[Dict[str, Any]]:
        """Query CVE databases for specific software and version"""
        cves = []
        
        try:
            # Query NVD API
            nvd_cves = self._query_nvd_api(software_name, version)
            cves.extend(nvd_cves)
            
            # Add local CVE database queries here if needed
            
        except Exception as e:
            logger.error(f"Failed to query CVEs for {software_name} {version}: {str(e)}")
        
        return cves
    
    def _query_nvd_api(self, software_name: str, version: str) -> List[Dict[str, Any]]:
        """Query NIST NVD API for CVEs"""
        cves = []
        
        try:
            # Construct search query
            params = {
                'keywordSearch': f"{software_name}",
                'resultsPerPage': 50
            }
            
            response = requests.get(
                self.nvd_api_base,
                params=params,
                timeout=30,
                headers={'User-Agent': 'Odin-Firmware-Intelligence/1.0'}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                for vulnerability in data.get('vulnerabilities', []):
                    cve_data = vulnerability.get('cve', {})
                    cve_id = cve_data.get('id', '')
                    
                    # Check if this CVE affects our version
                    if self._is_version_affected(cve_data, software_name, version):
                        # Extract CVE information
                        description = ""
                        if cve_data.get('descriptions'):
                            description = cve_data['descriptions'][0].get('value', '')
                        
                        # Get CVSS score
                        cvss_score = None
                        severity_level = RiskLevel.LOW
                        
                        metrics = cve_data.get('metrics', {})
                        if 'cvssMetricV31' in metrics:
                            cvss_data = metrics['cvssMetricV31'][0]
                            cvss_score = cvss_data.get('cvssData', {}).get('baseScore')
                            severity_level = self._cvss_to_risk_level(cvss_score)
                        elif 'cvssMetricV2' in metrics:
                            cvss_data = metrics['cvssMetricV2'][0]
                            cvss_score = cvss_data.get('cvssData', {}).get('baseScore')
                            severity_level = self._cvss_to_risk_level(cvss_score)
                        
                        # Get references
                        references = []
                        for ref in cve_data.get('references', []):
                            references.append(ref.get('url', ''))
                        
                        cve_entry = {
                            'cve_id': cve_id,
                            'software_name': software_name,
                            'software_version': version,
                            'description': description,
                            'severity_score': str(cvss_score) if cvss_score else None,
                            'severity_level': severity_level.value,
                            'references': references
                        }
                        
                        cves.append(cve_entry)
                        
            else:
                logger.warning(f"NVD API request failed with status {response.status_code}")
                
        except requests.RequestException as e:
            logger.error(f"Failed to query NVD API: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing NVD response: {str(e)}")
        
        return cves
    
    def _is_version_affected(self, cve_data: Dict, software_name: str, version: str) -> bool:
        """Check if the given version is affected by the CVE"""
        # This is a simplified check - in production, you'd want more sophisticated
        # version comparison logic that handles version ranges properly
        
        configurations = cve_data.get('configurations', {})
        nodes = configurations.get('nodes', [])
        
        for node in nodes:
            cpe_matches = node.get('cpeMatch', [])
            for cpe_match in cpe_matches:
                cpe_name = cpe_match.get('criteria', '')
                
                # Simple check if software name is in CPE
                if software_name.lower() in cpe_name.lower():
                    # If no version constraints, assume affected
                    if not cpe_match.get('versionStartIncluding') and not cpe_match.get('versionEndExcluding'):
                        return True
                    
                    # Check version ranges (simplified)
                    version_start = cpe_match.get('versionStartIncluding')
                    version_end = cpe_match.get('versionEndExcluding')
                    
                    if version_start and self._compare_versions(version, version_start) >= 0:
                        if not version_end or self._compare_versions(version, version_end) < 0:
                            return True
        
        return False
    
    def _compare_versions(self, version1: str, version2: str) -> int:
        """Compare two version strings (simplified)"""
        try:
            v1_parts = [int(x) for x in version1.split('.')]
            v2_parts = [int(x) for x in version2.split('.')]
            
            # Pad shorter version with zeros
            max_len = max(len(v1_parts), len(v2_parts))
            v1_parts.extend([0] * (max_len - len(v1_parts)))
            v2_parts.extend([0] * (max_len - len(v2_parts)))
            
            for v1, v2 in zip(v1_parts, v2_parts):
                if v1 < v2:
                    return -1
                elif v1 > v2:
                    return 1
            
            return 0
        except ValueError:
            # Fallback to string comparison
            return -1 if version1 < version2 else (1 if version1 > version2 else 0)
    
    def _cvss_to_risk_level(self, cvss_score: float) -> RiskLevel:
        """Convert CVSS score to risk level"""
        if cvss_score is None:
            return RiskLevel.LOW
        
        if cvss_score >= 9.0:
            return RiskLevel.CRITICAL
        elif cvss_score >= 7.0:
            return RiskLevel.HIGH
        elif cvss_score >= 4.0:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_summary(self, cves: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary of CVE analysis"""
        summary = {
            'total_cves': len(cves),
            'severity_breakdown': {
                'critical': 0,
                'high': 0,
                'medium': 0,
                'low': 0
            },
            'affected_software': set()
        }
        
        for cve in cves:
            severity = cve.get('severity_level', 'low')
            summary['severity_breakdown'][severity] += 1
            summary['affected_software'].add(cve.get('software_name', ''))
        
        summary['affected_software'] = list(summary['affected_software'])
        
        return summary
