package emba

import (
	"regexp"
	"strings"
)

// Helper methods for Service struct
func (s *Service) extractValue(line, prefix string) string {
	if strings.Contains(line, prefix) {
		parts := strings.Split(line, prefix)
		if len(parts) > 1 {
			return strings.TrimSpace(parts[1])
		}
	}
	return ""
}

func (s *Service) extractIPAddress(line string) string {
	// Regex to match IP addresses
	ipRegex := regexp.MustCompile(`\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b`)
	matches := ipRegex.FindAllString(line, -1)
	if len(matches) > 0 {
		return matches[0]
	}
	return ""
}

func (s *Service) extractServiceName(line string) string {
	// Extract service name from various formats
	if strings.Contains(line, "service:") {
		return s.extractValue(line, "service:")
	}
	if strings.Contains(line, "Service:") {
		return s.extractValue(line, "Service:")
	}
	
	// Try to extract from port scan results
	parts := strings.Fields(line)
	for i, part := range parts {
		if strings.Contains(part, "/tcp") || strings.Contains(part, "/udp") {
			if i+1 < len(parts) {
				return parts[i+1]
			}
		}
	}
	
	return "unknown"
}

func (s *Service) parsePortInfo(line string) (string, string) {
	// Parse port and protocol from line
	portRegex := regexp.MustCompile(`(\d+)/(tcp|udp)`)
	matches := portRegex.FindStringSubmatch(line)
	if len(matches) >= 3 {
		return matches[1], matches[2]
	}
	return "", ""
}

func (s *Service) isHighRiskPort(port string) bool {
	highRiskPorts := map[string]bool{
		"21":   true, // FTP
		"22":   true, // SSH
		"23":   true, // Telnet
		"25":   true, // SMTP
		"53":   true, // DNS
		"80":   true, // HTTP
		"110":  true, // POP3
		"135":  true, // RPC
		"139":  true, // NetBIOS
		"143":  true, // IMAP
		"443":  true, // HTTPS
		"445":  true, // SMB
		"993":  true, // IMAPS
		"995":  true, // POP3S
		"1433": true, // MSSQL
		"1521": true, // Oracle
		"3306": true, // MySQL
		"3389": true, // RDP
		"5432": true, // PostgreSQL
		"5900": true, // VNC
		"6379": true, // Redis
		"8080": true, // HTTP Alt
		"8443": true, // HTTPS Alt
	}
	
	return highRiskPorts[port]
}

func (s *Service) determineSeverity(finding string) string {
	finding = strings.ToLower(finding)
	
	// High severity indicators
	highSeverityKeywords := []string{
		"critical", "high", "exploit", "rce", "remote code execution",
		"buffer overflow", "sql injection", "authentication bypass",
		"privilege escalation", "backdoor", "malware", "trojan",
	}
	
	// Medium severity indicators
	mediumSeverityKeywords := []string{
		"medium", "warning", "vulnerable", "weak", "insecure",
		"deprecated", "outdated", "misconfiguration", "exposure",
	}
	
	for _, keyword := range highSeverityKeywords {
		if strings.Contains(finding, keyword) {
			return "high"
		}
	}
	
	for _, keyword := range mediumSeverityKeywords {
		if strings.Contains(finding, keyword) {
			return "medium"
		}
	}
	
	return "low"
}

func (s *Service) getCategoryFromModule(moduleName string) string {
	lower := strings.ToLower(moduleName)
	
	if strings.Contains(lower, "cve") {
		return "CVE Analysis"
	}
	if strings.Contains(lower, "qemu") || strings.Contains(lower, "emulator") {
		return "Emulation"
	}
	if strings.Contains(lower, "kernel") {
		return "Kernel Analysis"
	}
	if strings.Contains(lower, "perm") {
		return "Permission Analysis"
	}
	if strings.Contains(lower, "network") || strings.Contains(lower, "nmap") {
		return "Network Analysis"
	}
	if strings.Contains(lower, "web") || strings.Contains(lower, "http") {
		return "Web Analysis"
	}
	if strings.Contains(lower, "crypto") {
		return "Cryptographic Analysis"
	}
	
	return "General"
}
