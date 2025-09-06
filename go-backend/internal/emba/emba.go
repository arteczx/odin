package emba

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"odin-backend/internal/config"
	"odin-backend/internal/models"
)

type Service struct {
	config *config.Config
}

type AnalysisResult struct {
	Success      bool                   `json:"success"`
	Error        string                 `json:"error,omitempty"`
	LogDir       string                 `json:"log_dir"`
	Stdout       string                 `json:"stdout,omitempty"`
	AnalysisTime string                 `json:"analysis_time"`
	Results      ParsedResults          `json:"results"`
}

type ParsedResults struct {
	Findings       []models.Finding       `json:"findings"`
	CVEs           []models.CVEFinding    `json:"cves"`
	OSINTResults   []models.OSINTResult   `json:"osint_results"`
	FileInfo       map[string]interface{} `json:"file_info"`
	ExtractionInfo map[string]interface{} `json:"extraction_info"`
	Summary        map[string]interface{} `json:"summary"`
}

// NewService creates a new EMBA service instance

func New(cfg *config.Config) *Service {
	return &Service{config: cfg}
}

// IsAvailable checks if EMBA is available and executable
func (s *Service) IsAvailable() bool {
	embaScript := filepath.Join(s.config.EMBAPath, "emba")
	if _, err := os.Stat(embaScript); os.IsNotExist(err) {
		return false
	}

	// Check if executable
	if _, err := os.Stat(embaScript); err != nil {
		return false
	}

	return true
}

// AnalyzeFirmware runs EMBA analysis on firmware file using official EMBA parameters
func (s *Service) AnalyzeFirmware(firmwarePath, jobID string) (*AnalysisResult, error) {
	if !s.IsAvailable() {
		return nil, fmt.Errorf("EMBA is not available or not executable")
	}

	// Create log directory for this analysis
	logDir := filepath.Join(s.config.EMBALogDir, jobID)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create log directory: %w", err)
	}

	// Build EMBA command according to official documentation with advanced features
	embaScript := filepath.Join(s.config.EMBAPath, "emba")
	scanProfile := filepath.Join(s.config.EMBAPath, "scan-profiles", s.config.EMBAScanProfile)
	
	// Build command arguments dynamically based on configuration
	args := []string{
		embaScript,
		"-l", logDir,                    // Log path
		"-f", firmwarePath,              // Firmware path  
		"-p", scanProfile,               // Profile path
		"-W",                            // Enable web report creation
		"-g",                            // Create grep-able log file
		"-t", fmt.Sprintf("%d", s.config.EMBAThreads), // Thread count
	}
	
	// Add optional advanced features
	if s.config.EMBAEnableEmulation {
		args = append(args, "-E")        // Enable user-mode emulation (S115)
	}
	
	if s.config.EMBAEnableCWECheck {
		args = append(args, "-c")        // Enable CWE-checker (S120)
	}
	
	if s.config.EMBAEnableLiveTesting {
		args = append(args, "-L")        // Enable live testing modules
	}
	
	cmd := exec.Command("sudo", args...)
	cmd.Dir = s.config.EMBAPath

	log.Printf("Starting EMBA analysis for job %s", jobID)
	log.Printf("Command: sudo %s", strings.Join(args, " "))

	// Run EMBA analysis
	stdout, err := cmd.CombinedOutput()
	stdoutStr := string(stdout)

	if err != nil {
		log.Printf("EMBA analysis failed for job %s: %v", jobID, err)
		log.Printf("EMBA output: %s", stdoutStr)
		return &AnalysisResult{
			Success:      false,
			Error:        fmt.Sprintf("EMBA analysis failed: %v", err),
			LogDir:       logDir,
			Stdout:       stdoutStr,
			AnalysisTime: time.Now().UTC().Format(time.RFC3339),
		}, nil
	}

	// Parse EMBA results
	results, err := s.parseEMBAResults(logDir, jobID)
	if err != nil {
		log.Printf("Failed to parse EMBA results for job %s: %v", jobID, err)
		// Don't fail completely, return partial results
		results = &ParsedResults{
			Summary: map[string]interface{}{
				"parse_error": err.Error(),
			},
		}
	}

	log.Printf("EMBA analysis completed for job %s", jobID)

	return &AnalysisResult{
		Success:      true,
		LogDir:       logDir,
		Stdout:       stdoutStr,
		AnalysisTime: time.Now().UTC().Format(time.RFC3339),
		Results:      *results,
	}, nil
}

// parseEMBAResults parses EMBA output files to extract structured results
// Based on EMBA official documentation and output structure
func (s *Service) parseEMBAResults(logDir, jobID string) (*ParsedResults, error) {
	results := &ParsedResults{
		Findings:       []models.Finding{},
		CVEs:          []models.CVEFinding{},
		OSINTResults:  []models.OSINTResult{},
		FileInfo:      make(map[string]interface{}),
		ExtractionInfo: make(map[string]interface{}),
		Summary:       make(map[string]interface{}),
	}

	// Look for EMBA specific output files
	// EMBA creates structured output in specific directories
	
	// Parse grep-able log file (created with -g flag)
	grepLogFile := filepath.Join(logDir, "fw_grep.log")
	if _, err := os.Stat(grepLogFile); err == nil {
		s.parseGrepLog(grepLogFile, results)
	}

	// Parse CSV reports (EMBA generates CSV files for structured data)
	csvPattern := filepath.Join(logDir, "**/*.csv")
	csvFiles, err := filepath.Glob(csvPattern)
	if err == nil {
		for _, csvFile := range csvFiles {
			s.parseCSVReport(csvFile, results)
		}
	}

	// Parse text reports from specific EMBA modules
	s.parseModuleReports(logDir, results)

	// Parse advanced module outputs if enabled
	if s.config.EMBAEnableEmulation {
		s.parseEmulationResults(logDir, results)
	}
	
	if s.config.EMBAEnableCWECheck {
		s.parseCWECheckerResults(logDir, results)
	}
	
	if s.config.EMBAEnableLiveTesting {
		s.parseLiveTestingResults(logDir, results)
	}

	// Parse web report data if available
	webReportDir := filepath.Join(logDir, "html-report")
	if _, err := os.Stat(webReportDir); err == nil {
		s.parseWebReportData(webReportDir, results)
	}
	
	// Parse SBOM data (F15 module)
	s.parseSBOMData(logDir, results)
	
	// Parse advanced extraction modules
	s.parseAdvancedExtractionModules(logDir, results)

	// Generate summary based on parsed data
	results.Summary = map[string]interface{}{
		"total_findings":    len(results.Findings),
		"total_cves":       len(results.CVEs),
		"total_osint":      len(results.OSINTResults),
		"critical_count":   s.countBySeverity(results.Findings, results.CVEs, "critical"),
		"high_count":       s.countBySeverity(results.Findings, results.CVEs, "high"),
		"medium_count":     s.countBySeverity(results.Findings, results.CVEs, "medium"),
		"low_count":        s.countBySeverity(results.Findings, results.CVEs, "low"),
		"analysis_time":    time.Now().UTC().Format(time.RFC3339),
		"emba_version":     s.getEMBAVersion(),
		"log_directory":    logDir,
	}

	return results, nil
}

// parseGrepLog parses the grep-able log file created by EMBA -g flag
func (s *Service) parseGrepLog(grepLogFile string, results *ParsedResults) error {
	content, err := os.ReadFile(grepLogFile)
	if err != nil {
		return err
	}

	lines := strings.Split(string(content), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse grep log entries for security findings
		if strings.Contains(strings.ToLower(line), "vulnerability") ||
		   strings.Contains(strings.ToLower(line), "cve-") ||
		   strings.Contains(strings.ToLower(line), "exploit") {
			
			finding := models.Finding{
				Title:           s.extractTitle(line),
				Description:     line,
				Severity:        models.RiskLevel(s.determineSeverity(line)),
				Type:            models.FindingType("security"),
				FilePath:        s.extractLocation(line),
				FindingMetadata: map[string]interface{}{"raw_line": line},
			}
			results.Findings = append(results.Findings, finding)
		}
	}
	return nil
}

// parseCSVReport parses CSV reports generated by EMBA
func (s *Service) parseCSVReport(csvFile string, results *ParsedResults) error {
	filename := strings.ToLower(filepath.Base(csvFile))
	
	if strings.Contains(filename, "cve") {
		cves, err := s.parseCVEFile(csvFile)
		if err != nil {
			return err
		}
		results.CVEs = append(results.CVEs, cves...)
	} else if strings.Contains(filename, "vuln") || strings.Contains(filename, "finding") {
		findings, err := s.parseVulnerabilityCSV(csvFile)
		if err != nil {
			return err
		}
		results.Findings = append(results.Findings, findings...)
	}
	
	return nil
}

// parseModuleReports parses text reports from specific EMBA modules
func (s *Service) parseModuleReports(logDir string, results *ParsedResults) error {
	// EMBA creates module-specific log files
	moduleFiles := []string{
		"S116_qemu_version_check.txt",
		"S115_usermode_emulator.txt", 
		"S120_cve_search.txt",
		"S25_kernel_check.txt",
		"S40_weak_perm_check.txt",
	}

	for _, moduleFile := range moduleFiles {
		fullPath := filepath.Join(logDir, moduleFile)
		if _, err := os.Stat(fullPath); err == nil {
			s.parseModuleFile(fullPath, results)
		}
	}
	
	return nil
}

// parseWebReportData parses data from EMBA web report directory
func (s *Service) parseWebReportData(webReportDir string, results *ParsedResults) error {
	// Look for JSON data files in web report
	jsonFiles, err := filepath.Glob(filepath.Join(webReportDir, "*.json"))
	if err != nil {
		return err
	}

	for _, jsonFile := range jsonFiles {
		jsonData, err := s.parseJSONReport(jsonFile)
		if err != nil {
			log.Printf("Error parsing web report JSON %s: %v", jsonFile, err)
			continue
		}
		
		// Extract findings from JSON data
		if findings, ok := jsonData["findings"].([]interface{}); ok {
			for _, f := range findings {
				if finding, ok := f.(map[string]interface{}); ok {
					results.Findings = append(results.Findings, s.mapJSONToFinding(finding))
				}
			}
		}
	}
	
	return nil
}

// getEMBAVersion gets the EMBA version
func (s *Service) getEMBAVersion() string {
	embaScript := filepath.Join(s.config.EMBAPath, "emba")
	cmd := exec.Command(embaScript, "-V")
	cmd.Dir = s.config.EMBAPath
	
	output, err := cmd.Output()
	if err != nil {
		return "unknown"
	}
	
	return strings.TrimSpace(string(output))
}

// parseModuleFile parses individual EMBA module output files
func (s *Service) parseModuleFile(filePath string, results *ParsedResults) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	lines := strings.Split(string(content), "\n")
	moduleName := filepath.Base(filePath)
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse different types of findings based on module
		if strings.Contains(moduleName, "cve") && strings.Contains(line, "CVE-") {
			cve := s.parseCVELine(line)
			if cve.CVEID != "" {
				results.CVEs = append(results.CVEs, cve)
			}
		} else if strings.Contains(line, "FOUND") || strings.Contains(line, "DETECTED") {
			finding := models.Finding{
				Title:           s.extractTitle(line),
				Description:     line,
				Severity:        models.RiskLevel(s.determineSeverity(line)),
				Type:            models.FindingType(s.getCategoryFromModule(moduleName)),
				FilePath:        filePath,
				FindingMetadata: map[string]interface{}{"module": moduleName, "raw_line": line},
			}
			results.Findings = append(results.Findings, finding)
		}
	}
	
	return nil
}

// parseVulnerabilityCSV parses vulnerability findings from CSV files
func (s *Service) parseVulnerabilityCSV(csvFile string) ([]models.Finding, error) {
	var findings []models.Finding
	
	content, err := os.ReadFile(csvFile)
	if err != nil {
		return findings, err
	}

	lines := strings.Split(string(content), "\n")
	if len(lines) < 2 {
		return findings, nil
	}

	// Skip header line
	for i := 1; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}

		fields := strings.Split(line, ",")
		if len(fields) >= 3 {
			finding := models.Finding{
				Title:           s.cleanCSVField(fields[0]),
				Description:     s.cleanCSVField(fields[1]),
				Severity:        models.RiskLevel(s.normalizeSeverity(s.cleanCSVField(fields[2]))),
				Type:            models.FindingType("vulnerability"),
				FilePath:        csvFile,
				FindingMetadata: map[string]interface{}{"csv_source": csvFile},
			}
			findings = append(findings, finding)
		}
	}

	return findings, nil
}

// parseCVEFile parses CVE findings from EMBA CSV output
func (s *Service) parseCVEFile(csvFile string) ([]models.CVEFinding, error) {
	var cves []models.CVEFinding

	content, err := os.ReadFile(csvFile)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(content), "\n")
	for i, line := range lines {
		if i == 0 || strings.TrimSpace(line) == "" {
			continue // Skip header and empty lines
		}

		parts := strings.Split(line, ",")
		if len(parts) >= 4 {
			score := 0.0
			if len(parts) > 3 && parts[3] != "" {
				if parsed, err := strconv.ParseFloat(strings.TrimSpace(parts[3]), 64); err == nil {
					score = parsed
				}
			}

			cve := models.CVEFinding{
				CVEID:           strings.TrimSpace(parts[0]),
				SoftwareName:    strings.TrimSpace(parts[1]),
				SoftwareVersion: strings.TrimSpace(parts[2]),
				SeverityScore:   score,
				SeverityLevel:   models.RiskLevel(s.scoreToSeverity(score)),
			}

			if len(parts) > 4 {
				cve.Description = strings.TrimSpace(parts[4])
			}

			cves = append(cves, cve)
		}
	}

	return cves, nil
}

// parseVulnerabilityFile parses vulnerability findings from EMBA text output
func (s *Service) parseVulnerabilityFile(vulnFile string) ([]models.Finding, error) {
	var findings []models.Finding

	content, err := os.ReadFile(vulnFile)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(content), "\n")
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Look for common vulnerability patterns
		if s.containsVulnerabilityKeywords(line) {
			finding := models.Finding{
				Type:            models.FindingType("security_issue"),
				Title:           s.truncateString(line, 100),
				Description:     line,
				Severity:        models.RiskLevel(s.determineSeverity(line)),
				FilePath:        vulnFile,
				LineNumber:      i + 1,
				Content:         line,
				FindingMetadata: map[string]interface{}{"source": "vulnerability_file"},
			}
			findings = append(findings, finding)
		}
	}

	return findings, nil
}

// parseFilesystemFile parses filesystem information from EMBA output
func (s *Service) parseFilesystemFile(fsFile string) (map[string]interface{}, error) {
	fileInfo := make(map[string]interface{})

	content, err := os.ReadFile(fsFile)
	if err != nil {
		return nil, err
	}

	contentStr := string(content)
	fileInfo["filesystem_type"] = "unknown"
	fileInfo["total_files"] = strings.Count(contentStr, "\n")
	fileInfo["analysis_file"] = fsFile
	fileInfo["content_preview"] = s.truncateString(contentStr, 500)

	return fileInfo, nil
}

// parseJSONReport parses JSON reports from EMBA
func (s *Service) parseJSONReport(jsonFile string) (map[string]interface{}, error) {
	content, err := os.ReadFile(jsonFile)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(content, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// Helper functions

func (s *Service) scoreToSeverity(score float64) string {
	if score >= 9.0 {
		return "critical"
	} else if score >= 7.0 {
		return "high"
	} else if score >= 4.0 {
		return "medium"
	}
	return "low"
}

func (s *Service) classifySeverity(text string) string {
	textLower := strings.ToLower(text)
	if strings.Contains(textLower, "critical") || strings.Contains(textLower, "severe") || strings.Contains(textLower, "hardcoded password") {
		return "critical"
	} else if strings.Contains(textLower, "high") || strings.Contains(textLower, "dangerous") || strings.Contains(textLower, "exploit") {
		return "high"
	} else if strings.Contains(textLower, "medium") || strings.Contains(textLower, "moderate") || strings.Contains(textLower, "weak") {
		return "medium"
	}
	return "low"
}

func (s *Service) containsVulnerabilityKeywords(text string) bool {
	keywords := []string{"vulnerability", "weak", "insecure", "hardcoded", "password", "credential", "key", "exploit", "backdoor"}
	textLower := strings.ToLower(text)
	for _, keyword := range keywords {
		if strings.Contains(textLower, keyword) {
			return true
		}
	}
	return false
}

func (s *Service) truncateString(str string, maxLen int) string {
	if len(str) <= maxLen {
		return str
	}
	return str[:maxLen] + "..."
}

func (s *Service) countBySeverity(findings []models.Finding, cves []models.CVEFinding, severity string) int {
	count := 0
	for _, f := range findings {
		if string(f.Severity) == severity {
			count++
		}
	}
	for _, c := range cves {
		if string(c.SeverityLevel) == severity {
			count++
		}
	}
	return count
}

func (s *Service) mapJSONToFinding(jsonFinding map[string]interface{}) models.Finding {
	finding := models.Finding{
		Type:            models.FindingType("security_issue"),
		Severity:        models.RiskLevel("low"),
		FindingMetadata: map[string]interface{}{"category": "emba_json"},
	}

	if title, ok := jsonFinding["title"].(string); ok {
		finding.Title = title
	}
	if desc, ok := jsonFinding["description"].(string); ok {
		finding.Description = desc
	}
	if severity, ok := jsonFinding["severity"].(string); ok {
		finding.Severity = models.RiskLevel(severity)
	}
	if filePath, ok := jsonFinding["file_path"].(string); ok {
		finding.FilePath = filePath
	}
	if content, ok := jsonFinding["content"].(string); ok {
		finding.Content = content
	}

	return finding
}

// Helper functions for parsing EMBA output

// extractTitle extracts a meaningful title from a log line
func (s *Service) extractTitle(line string) string {
	// Remove common prefixes and extract the main content
	line = strings.TrimSpace(line)
	
	// Remove timestamps and log levels
	if idx := strings.Index(line, "]"); idx > 0 && idx < 30 {
		line = line[idx+1:]
	}
	
	// Truncate if too long
	if len(line) > 100 {
		line = line[:97] + "..."
	}
	
	return strings.TrimSpace(line)
}

// extractLocation extracts file location from log line
func (s *Service) extractLocation(line string) string {
	// Look for file paths in the line
	words := strings.Fields(line)
	for _, word := range words {
		if strings.Contains(word, "/") && (strings.Contains(word, ".") || strings.HasPrefix(word, "/")) {
			return word
		}
	}
	return ""
}

// parseCVELine parses a single CVE from a text line
func (s *Service) parseCVELine(line string) models.CVEFinding {
	// Extract CVE ID using regex
	cvePattern := `CVE-\d{4}-\d+`
	re := regexp.MustCompile(cvePattern)
	matches := re.FindStringSubmatch(line)
	
	if len(matches) == 0 {
		return models.CVEFinding{}
	}
	
	return models.CVEFinding{
		CVEID:           matches[0],
		Description:     line,
		SeverityLevel:   models.RiskLevel(s.determineSeverity(line)),
		SeverityScore:   0.0,
		SoftwareName:    "",
		SoftwareVersion: "",
	}
}

// cleanCSVField removes quotes and trims whitespace from CSV field
func (s *Service) cleanCSVField(field string) string {
	field = strings.TrimSpace(field)
	if len(field) >= 2 && field[0] == '"' && field[len(field)-1] == '"' {
		field = field[1 : len(field)-1]
	}
	return field
}

// normalizeSeverity normalizes severity values to standard levels
func (s *Service) normalizeSeverity(severity string) string {
	lower := strings.ToLower(strings.TrimSpace(severity))
	
	switch lower {
	case "critical", "crit", "9", "10":
		return "critical"
	case "high", "h", "7", "8":
		return "high"
	case "medium", "med", "m", "5", "6":
		return "medium"
	case "low", "l", "1", "2", "3", "4":
		return "low"
	default:
		return "medium"
	}
}

// parseScore parses CVSS score from string
func (s *Service) parseScore(scoreStr string) float64 {
	scoreStr = strings.TrimSpace(scoreStr)
	if score, err := strconv.ParseFloat(scoreStr, 64); err == nil {
		return score
	}
	return 0.0
}

// parseEmulationResults parses S115 user-mode emulation results
func (s *Service) parseEmulationResults(logDir string, results *ParsedResults) error {
	// Look for S115 emulation log files
	emulationLogPattern := filepath.Join(logDir, "S115_*")
	emulationFiles, err := filepath.Glob(emulationLogPattern)
	if err != nil {
		return err
	}

	for _, emulationFile := range emulationFiles {
		content, err := os.ReadFile(emulationFile)
		if err != nil {
			log.Printf("Error reading emulation file %s: %v", emulationFile, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse version information from emulation output
			if strings.Contains(line, "version") || strings.Contains(line, "Version") {
				finding := models.Finding{
					Type:            models.FindingType("version_detection"),
					Title:           "Version detected via emulation",
					Description:     line,
					Severity:        models.RiskLevel("low"),
					FilePath:        emulationFile,
					FindingMetadata: map[string]interface{}{
						"source": "emulation",
						"module": "S115",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseCWECheckerResults parses S120 CWE-checker results
func (s *Service) parseCWECheckerResults(logDir string, results *ParsedResults) error {
	// Look for CWE-checker output files
	cweLogPattern := filepath.Join(logDir, "S120_*")
	cweFiles, err := filepath.Glob(cweLogPattern)
	if err != nil {
		return err
	}

	for _, cweFile := range cweFiles {
		content, err := os.ReadFile(cweFile)
		if err != nil {
			log.Printf("Error reading CWE-checker file %s: %v", cweFile, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse CWE findings
			if strings.Contains(line, "CWE-") {
				severity := "medium"
				if strings.Contains(strings.ToLower(line), "high") {
					severity = "high"
				} else if strings.Contains(strings.ToLower(line), "critical") {
					severity = "critical"
				}

				finding := models.Finding{
					Type:            models.FindingType("cwe_finding"),
					Title:           s.extractCWETitle(line),
					Description:     line,
					Severity:        models.RiskLevel(severity),
					FilePath:        cweFile,
					FindingMetadata: map[string]interface{}{
						"source": "cwe_checker",
						"module": "S120",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseLiveTestingResults parses L module live testing results
func (s *Service) parseLiveTestingResults(logDir string, results *ParsedResults) error {
	// Parse different L module types
	s.parseSystemEmulationResults(logDir, results)    // L10 - System emulation
	s.parseNetworkScanResults(logDir, results)        // L15 - Nmap scanning
	s.parseSNMPCheckResults(logDir, results)          // L20 - SNMP checks
	s.parseUPnPHNAPResults(logDir, results)           // L22 - UPnP/HNAP checks
	s.parseVNCCheckResults(logDir, results)           // L23 - VNC checks
	s.parseWebCheckResults(logDir, results)           // L25 - Web application checks
	
	return nil
}

// parseSystemEmulationResults parses L10 system emulation results
func (s *Service) parseSystemEmulationResults(logDir string, results *ParsedResults) error {
	l10Pattern := filepath.Join(logDir, "L10_*")
	l10Files, err := filepath.Glob(l10Pattern)
	if err != nil {
		return err
	}

	for _, l10File := range l10Files {
		content, err := os.ReadFile(l10File)
		if err != nil {
			log.Printf("Error reading L10 file %s: %v", l10File, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		emulationData := map[string]interface{}{
			"architecture": "",
			"kernel":       "",
			"init_process": "",
			"network_ip":   "",
			"services":     []string{},
		}

		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse emulation setup information
			if strings.Contains(strings.ToLower(line), "architecture") {
				emulationData["architecture"] = s.extractValue(line, "architecture")
			}
			if strings.Contains(strings.ToLower(line), "kernel") && strings.Contains(line, "version") {
				emulationData["kernel"] = s.extractValue(line, "kernel")
			}
			if strings.Contains(strings.ToLower(line), "init") && strings.Contains(line, "process") {
				emulationData["init_process"] = s.extractValue(line, "init")
			}
			if strings.Contains(line, "IP:") || strings.Contains(line, "ip:") {
				emulationData["network_ip"] = s.extractIPAddress(line)
			}

			// Parse emulation status and results
			if strings.Contains(strings.ToLower(line), "emulation") && 
			   (strings.Contains(strings.ToLower(line), "successful") || 
			    strings.Contains(strings.ToLower(line), "started") ||
			    strings.Contains(strings.ToLower(line), "running")) {
				
				finding := models.Finding{
					Type:        models.FindingType("system_emulation"),
					Title:       "System Emulation Status",
					Description: line,
					Severity:    models.RiskLevel("info"),
					FilePath:    l10File,
					FindingMetadata: map[string]interface{}{
						"source":          "system_emulation",
						"module":          "L10",
						"emulation_data":  emulationData,
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse service detection
			if strings.Contains(strings.ToLower(line), "service") && 
			   (strings.Contains(strings.ToLower(line), "detected") ||
			    strings.Contains(strings.ToLower(line), "running")) {
				
				serviceName := s.extractServiceName(line)
				if serviceName != "" {
					if services, ok := emulationData["services"].([]string); ok {
						emulationData["services"] = append(services, serviceName)
					}
				}

				finding := models.Finding{
					Type:        models.FindingType("service_detection"),
					Title:       fmt.Sprintf("Service Detected: %s", serviceName),
					Description: line,
					Severity:    models.RiskLevel("low"),
					FilePath:    l10File,
					FindingMetadata: map[string]interface{}{
						"source":       "system_emulation",
						"module":       "L10",
						"service_name": serviceName,
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}

		// Store emulation summary
		results.Summary["system_emulation"] = emulationData
	}

	return nil
}

// parseNetworkScanResults parses L15 Nmap scanning results
func (s *Service) parseNetworkScanResults(logDir string, results *ParsedResults) error {
	l15Pattern := filepath.Join(logDir, "L15_*")
	l15Files, err := filepath.Glob(l15Pattern)
	if err != nil {
		return err
	}

	for _, l15File := range l15Files {
		content, err := os.ReadFile(l15File)
		if err != nil {
			log.Printf("Error reading L15 file %s: %v", l15File, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		openPorts := []map[string]interface{}{}

		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse Nmap port scan results
			if strings.Contains(line, "/tcp") || strings.Contains(line, "/udp") {
				port, protocol := s.parsePortInfo(line)
				if port != "" {
					portInfo := map[string]interface{}{
						"port":     port,
						"protocol": protocol,
						"service":  s.extractServiceName(line),
					}
					openPorts = append(openPorts, portInfo)

					severity := "low"
					if s.isHighRiskPort(port) {
						severity = "medium"
					}

					finding := models.Finding{
						Type:        models.FindingType("open_port"),
						Title:       fmt.Sprintf("Open Port: %s", portInfo["port"]),
						Description: line,
						Severity:    models.RiskLevel(severity),
						FilePath:    l15File,
						FindingMetadata: map[string]interface{}{
							"source":    "network_scan",
							"module":    "L15",
							"port_info": portInfo,
						},
					}
					results.Findings = append(results.Findings, finding)
				}
			}

			// Parse service version detection
			if strings.Contains(strings.ToLower(line), "version") && 
			   (strings.Contains(line, ":") || strings.Contains(line, "detected")) {
				
				finding := models.Finding{
					Type:        models.FindingType("service_version"),
					Title:       "Service Version Detected",
					Description: line,
					Severity:    models.RiskLevel("info"),
					FilePath:    l15File,
					FindingMetadata: map[string]interface{}{
						"source": "network_scan",
						"module": "L15",
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse OS detection
			if strings.Contains(strings.ToLower(line), "os") && 
			   strings.Contains(strings.ToLower(line), "detection") {
				
				finding := models.Finding{
					Type:        models.FindingType("os_detection"),
					Title:       "Operating System Detection",
					Description: line,
					Severity:    models.RiskLevel("info"),
					FilePath:    l15File,
					FindingMetadata: map[string]interface{}{
						"source": "network_scan",
						"module": "L15",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}

		// Store network scan summary
		results.Summary["network_scan"] = map[string]interface{}{
			"open_ports":    openPorts,
			"total_ports":   len(openPorts),
		}
	}

	return nil
}

// parseSNMPCheckResults parses L20 SNMP check results
func (s *Service) parseSNMPCheckResults(logDir string, results *ParsedResults) error {
	l20Pattern := filepath.Join(logDir, "L20_*")
	l20Files, err := filepath.Glob(l20Pattern)
	if err != nil {
		return err
	}

	for _, l20File := range l20Files {
		content, err := os.ReadFile(l20File)
		if err != nil {
			log.Printf("Error reading L20 file %s: %v", l20File, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse SNMP community strings
			if strings.Contains(strings.ToLower(line), "community") && 
			   (strings.Contains(strings.ToLower(line), "public") ||
			    strings.Contains(strings.ToLower(line), "private") ||
			    strings.Contains(strings.ToLower(line), "default")) {
				
				severity := "medium"
				if strings.Contains(strings.ToLower(line), "public") {
					severity = "high"
				}

				finding := models.Finding{
					Type:        models.FindingType("snmp_community"),
					Title:       "SNMP Community String Found",
					Description: line,
					Severity:    models.RiskLevel(severity),
					FilePath:    l20File,
					FindingMetadata: map[string]interface{}{
						"source": "snmp_check",
						"module": "L20",
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse SNMP system information
			if strings.Contains(strings.ToLower(line), "snmp") && 
			   (strings.Contains(strings.ToLower(line), "system") ||
			    strings.Contains(strings.ToLower(line), "info")) {
				
				finding := models.Finding{
					Type:        models.FindingType("snmp_info"),
					Title:       "SNMP System Information",
					Description: line,
					Severity:    models.RiskLevel("info"),
					FilePath:    l20File,
					FindingMetadata: map[string]interface{}{
						"source": "snmp_check",
						"module": "L20",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseUPnPHNAPResults parses L22 UPnP/HNAP check results
func (s *Service) parseUPnPHNAPResults(logDir string, results *ParsedResults) error {
	l22Pattern := filepath.Join(logDir, "L22_*")
	l22Files, err := filepath.Glob(l22Pattern)
	if err != nil {
		return err
	}

	for _, l22File := range l22Files {
		content, err := os.ReadFile(l22File)
		if err != nil {
			log.Printf("Error reading L22 file %s: %v", l22File, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse UPnP device discovery
			if strings.Contains(strings.ToLower(line), "upnp") && 
			   strings.Contains(strings.ToLower(line), "device") {
				
				finding := models.Finding{
					Type:        models.FindingType("upnp_device"),
					Title:       "UPnP Device Discovered",
					Description: line,
					Severity:    models.RiskLevel("medium"),
					FilePath:    l22File,
					FindingMetadata: map[string]interface{}{
						"source": "upnp_check",
						"module": "L22",
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse HNAP vulnerabilities
			if strings.Contains(strings.ToLower(line), "hnap") && 
			   (strings.Contains(strings.ToLower(line), "vulnerable") ||
			    strings.Contains(strings.ToLower(line), "exploit")) {
				
				finding := models.Finding{
					Type:        models.FindingType("hnap_vulnerability"),
					Title:       "HNAP Vulnerability Found",
					Description: line,
					Severity:    models.RiskLevel("high"),
					FilePath:    l22File,
					FindingMetadata: map[string]interface{}{
						"source": "upnp_check",
						"module": "L22",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseVNCCheckResults parses L23 VNC check results
func (s *Service) parseVNCCheckResults(logDir string, results *ParsedResults) error {
	l23Pattern := filepath.Join(logDir, "L23_*")
	l23Files, err := filepath.Glob(l23Pattern)
	if err != nil {
		return err
	}

	for _, l23File := range l23Files {
		content, err := os.ReadFile(l23File)
		if err != nil {
			log.Printf("Error reading L23 file %s: %v", l23File, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse VNC authentication bypass
			if strings.Contains(strings.ToLower(line), "vnc") && 
			   (strings.Contains(strings.ToLower(line), "no auth") ||
			    strings.Contains(strings.ToLower(line), "authentication") ||
			    strings.Contains(strings.ToLower(line), "bypass")) {
				
				severity := "high"
				if strings.Contains(strings.ToLower(line), "no auth") {
					severity = "critical"
				}

				finding := models.Finding{
					Type:        models.FindingType("vnc_vulnerability"),
					Title:       "VNC Authentication Issue",
					Description: line,
					Severity:    models.RiskLevel(severity),
					FilePath:    l23File,
					FindingMetadata: map[string]interface{}{
						"source": "vnc_check",
						"module": "L23",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseWebCheckResults parses L25 web application check results
func (s *Service) parseWebCheckResults(logDir string, results *ParsedResults) error {
	l25Pattern := filepath.Join(logDir, "L25_*")
	l25Files, err := filepath.Glob(l25Pattern)
	if err != nil {
		return err
	}

	for _, l25File := range l25Files {
		content, err := os.ReadFile(l25File)
		if err != nil {
			log.Printf("Error reading L25 file %s: %v", l25File, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse Nikto web vulnerabilities
			if strings.Contains(strings.ToLower(line), "nikto") && 
			   (strings.Contains(strings.ToLower(line), "vulnerability") ||
			    strings.Contains(strings.ToLower(line), "issue") ||
			    strings.Contains(strings.ToLower(line), "warning")) {
				
				finding := models.Finding{
					Type:        models.FindingType("web_vulnerability"),
					Title:       "Web Application Vulnerability",
					Description: line,
					Severity:    models.RiskLevel(s.determineSeverity(line)),
					FilePath:    l25File,
					FindingMetadata: map[string]interface{}{
						"source": "web_check",
						"module": "L25",
						"tool":   "nikto",
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse testssl.sh results
			if strings.Contains(strings.ToLower(line), "ssl") && 
			   (strings.Contains(strings.ToLower(line), "vulnerable") ||
			    strings.Contains(strings.ToLower(line), "weak") ||
			    strings.Contains(strings.ToLower(line), "insecure")) {
				
				finding := models.Finding{
					Type:        models.FindingType("ssl_vulnerability"),
					Title:       "SSL/TLS Vulnerability",
					Description: line,
					Severity:    models.RiskLevel(s.determineSeverity(line)),
					FilePath:    l25File,
					FindingMetadata: map[string]interface{}{
						"source": "web_check",
						"module": "L25",
						"tool":   "testssl",
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse Arachni web scanner results
			if strings.Contains(strings.ToLower(line), "arachni") && 
			   (strings.Contains(strings.ToLower(line), "found") ||
			    strings.Contains(strings.ToLower(line), "detected")) {
				
				finding := models.Finding{
					Type:        models.FindingType("web_vulnerability"),
					Title:       "Web Application Security Issue",
					Description: line,
					Severity:    models.RiskLevel(s.determineSeverity(line)),
					FilePath:    l25File,
					FindingMetadata: map[string]interface{}{
						"source": "web_check",
						"module": "L25",
						"tool":   "arachni",
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseSBOMData parses F15 SBOM (Software Bill of Materials) data
func (s *Service) parseSBOMData(logDir string, results *ParsedResults) error {
	// Look for SBOM JSON files generated by F15
	sbomFiles := []string{
		filepath.Join(logDir, "sbom.json"),
		filepath.Join(logDir, "f15_sbom.json"),
		filepath.Join(logDir, "cyclonedx_sbom.json"),
	}

	for _, sbomFile := range sbomFiles {
		if _, err := os.Stat(sbomFile); err != nil {
			continue // File doesn't exist, skip
		}

		content, err := os.ReadFile(sbomFile)
		if err != nil {
			log.Printf("Error reading SBOM file %s: %v", sbomFile, err)
			continue
		}

		var sbomData map[string]interface{}
		if err := json.Unmarshal(content, &sbomData); err != nil {
			log.Printf("Error parsing SBOM JSON %s: %v", sbomFile, err)
			continue
		}

		// Extract components from SBOM
		if components, ok := sbomData["components"].([]interface{}); ok {
			for _, comp := range components {
				if component, ok := comp.(map[string]interface{}); ok {
					// Create findings for each software component
					name := ""
					version := ""
					if n, ok := component["name"].(string); ok {
						name = n
					}
					if v, ok := component["version"].(string); ok {
						version = v
					}

					if name != "" {
						finding := models.Finding{
							Type:        models.FindingType("software_component"),
							Title:       fmt.Sprintf("Software Component: %s", name),
							Description: fmt.Sprintf("Component: %s, Version: %s", name, version),
							Severity:    models.RiskLevel("low"),
							FilePath:    sbomFile,
							FindingMetadata: map[string]interface{}{
								"source":    "sbom",
								"module":    "F15",
								"component": name,
								"version":   version,
							},
						}
						results.Findings = append(results.Findings, finding)
					}
				}
			}
		}

		// Store SBOM data in summary
		results.Summary["sbom_data"] = sbomData
		break // Only process the first SBOM file found
	}

	return nil
}

// extractCWETitle extracts a meaningful title from CWE-checker output
func (s *Service) extractCWETitle(line string) string {
	// Extract CWE ID and description
	cwePattern := `CWE-\d+`
	re := regexp.MustCompile(cwePattern)
	matches := re.FindStringSubmatch(line)
	
	if len(matches) > 0 {
		return fmt.Sprintf("CWE Finding: %s", matches[0])
	}
	
	return "CWE Finding"
}

// parseAdvancedExtractionModules parses results from advanced extraction modules
func (s *Service) parseAdvancedExtractionModules(logDir string, results *ParsedResults) error {
	// Parse P modules (pre-modules for advanced extraction)
	s.parsePreModules(logDir, results)
	
	// Parse S modules (static analysis modules)
	s.parseStaticAnalysisModules(logDir, results)
	
	// Parse F modules (finishing modules)
	s.parseFinishingModules(logDir, results)
	
	return nil
}

// parsePreModules parses P module results (pre-analysis modules)
func (s *Service) parsePreModules(logDir string, results *ParsedResults) error {
	preModulePattern := filepath.Join(logDir, "P*")
	preModuleFiles, err := filepath.Glob(preModulePattern)
	if err != nil {
		return err
	}

	for _, preModuleFile := range preModuleFiles {
		content, err := os.ReadFile(preModuleFile)
		if err != nil {
			log.Printf("Error reading pre-module file %s: %v", preModuleFile, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse firmware information from pre-modules
			if strings.Contains(strings.ToLower(line), "firmware") ||
			   strings.Contains(strings.ToLower(line), "bootloader") ||
			   strings.Contains(strings.ToLower(line), "kernel") {
				
				finding := models.Finding{
					Type:        models.FindingType("firmware_info"),
					Title:       "Firmware Information",
					Description: line,
					Severity:    models.RiskLevel("info"),
					FilePath:    preModuleFile,
					FindingMetadata: map[string]interface{}{
						"source": "pre_analysis",
						"module": filepath.Base(preModuleFile),
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseStaticAnalysisModules parses additional S module results
func (s *Service) parseStaticAnalysisModules(logDir string, results *ParsedResults) error {
	staticModulePattern := filepath.Join(logDir, "S*")
	staticModuleFiles, err := filepath.Glob(staticModulePattern)
	if err != nil {
		return err
	}

	for _, staticModuleFile := range staticModuleFiles {
		// Skip already processed modules
		if strings.Contains(staticModuleFile, "S115") || strings.Contains(staticModuleFile, "S120") {
			continue
		}

		content, err := os.ReadFile(staticModuleFile)
		if err != nil {
			log.Printf("Error reading static analysis file %s: %v", staticModuleFile, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse various security findings from static analysis
			if strings.Contains(strings.ToLower(line), "password") ||
			   strings.Contains(strings.ToLower(line), "key") ||
			   strings.Contains(strings.ToLower(line), "secret") ||
			   strings.Contains(strings.ToLower(line), "credential") {
				
				finding := models.Finding{
					Type:        models.FindingType("credential_finding"),
					Title:       "Potential Credential Found",
					Description: line,
					Severity:    models.RiskLevel("medium"),
					FilePath:    staticModuleFile,
					FindingMetadata: map[string]interface{}{
						"source": "static_analysis",
						"module": filepath.Base(staticModuleFile),
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse binary analysis results
			if strings.Contains(strings.ToLower(line), "binary") ||
			   strings.Contains(strings.ToLower(line), "executable") ||
			   strings.Contains(strings.ToLower(line), "library") {
				
				finding := models.Finding{
					Type:        models.FindingType("binary_analysis"),
					Title:       "Binary Analysis Result",
					Description: line,
					Severity:    models.RiskLevel("low"),
					FilePath:    staticModuleFile,
					FindingMetadata: map[string]interface{}{
						"source": "static_analysis",
						"module": filepath.Base(staticModuleFile),
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}

// parseFinishingModules parses F module results (finishing modules)
func (s *Service) parseFinishingModules(logDir string, results *ParsedResults) error {
	finishingModulePattern := filepath.Join(logDir, "F*")
	finishingModuleFiles, err := filepath.Glob(finishingModulePattern)
	if err != nil {
		return err
	}

	for _, finishingModuleFile := range finishingModuleFiles {
		// Skip already processed F15 SBOM module
		if strings.Contains(finishingModuleFile, "F15") {
			continue
		}

		content, err := os.ReadFile(finishingModuleFile)
		if err != nil {
			log.Printf("Error reading finishing module file %s: %v", finishingModuleFile, err)
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			// Parse summary and aggregation results
			if strings.Contains(strings.ToLower(line), "summary") ||
			   strings.Contains(strings.ToLower(line), "total") ||
			   strings.Contains(strings.ToLower(line), "count") {
				
				finding := models.Finding{
					Type:        models.FindingType("analysis_summary"),
					Title:       "Analysis Summary",
					Description: line,
					Severity:    models.RiskLevel("info"),
					FilePath:    finishingModuleFile,
					FindingMetadata: map[string]interface{}{
						"source": "finishing_analysis",
						"module": filepath.Base(finishingModuleFile),
					},
				}
				results.Findings = append(results.Findings, finding)
			}

			// Parse aggregated risk assessments
			if strings.Contains(strings.ToLower(line), "risk") ||
			   strings.Contains(strings.ToLower(line), "score") ||
			   strings.Contains(strings.ToLower(line), "rating") {
				
				severity := s.determineSeverity(line)
				finding := models.Finding{
					Type:        models.FindingType("risk_assessment"),
					Title:       "Risk Assessment",
					Description: line,
					Severity:    models.RiskLevel(severity),
					FilePath:    finishingModuleFile,
					FindingMetadata: map[string]interface{}{
						"source": "finishing_analysis",
						"module": filepath.Base(finishingModuleFile),
					},
				}
				results.Findings = append(results.Findings, finding)
			}
		}
	}

	return nil
}
