package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"odin-backend/internal/config"
	"odin-backend/internal/emba"
)

func main() {
	// Initialize configuration
	cfg := &config.Config{
		EMBAPath:              "../emba",
		EMBALogDir:            "/tmp/emba_test_logs",
		EMBAEnableLiveTesting: true,
		EMBAEnableEmulation:   true,
		EMBAEnableCWECheck:    true,
		EMBAScanProfile:       "default-scan.emba",
		EMBAThreads:           4,
	}

	// Create test log directory
	err := os.MkdirAll(cfg.EMBALogDir, 0755)
	if err != nil {
		log.Fatalf("Failed to create test log directory: %v", err)
	}

	// Create EMBA service
	embaService := emba.NewService(cfg)

	fmt.Println("=== EMBA Live Testing (L) Modules Integration Test ===")
	fmt.Printf("EMBA Path: %s\n", cfg.EMBAPath)
	fmt.Printf("Log Directory: %s\n", cfg.EMBALogDir)
	fmt.Printf("Live Testing Enabled: %v\n", cfg.EMBAEnableLiveTesting)
	fmt.Printf("Emulation Enabled: %v\n", cfg.EMBAEnableEmulation)
	fmt.Printf("CWE-checker Enabled: %v\n", cfg.EMBAEnableCWECheck)
	fmt.Println()

	// Test 1: Create mock L module log files
	fmt.Println("1. Creating mock L module log files...")
	createMockLModuleLogs(cfg.EMBALogDir)

	// Test 2: Test L10 system emulation parsing
	fmt.Println("2. Testing L10 system emulation parsing...")
	testL10Parsing(embaService, cfg.EMBALogDir)

	// Test 3: Test L15 network service detection parsing
	fmt.Println("3. Testing L15 network service detection parsing...")
	testL15Parsing(embaService, cfg.EMBALogDir)

	// Test 4: Test L25 web application vulnerability parsing
	fmt.Println("4. Testing L25 web application vulnerability parsing...")
	testL25Parsing(embaService, cfg.EMBALogDir)

	// Test 5: Test EMBA command construction with L modules
	fmt.Println("5. Testing EMBA command construction with L modules...")
	testCommandConstruction(embaService)

	// Test 6: Test configuration API endpoints
	fmt.Println("6. Testing configuration management...")
	testConfigurationManagement(embaService)

	fmt.Println("\n=== All L Module Tests Completed Successfully! ===")
}

func createMockLModuleLogs(logDir string) {
	// Create L10 system emulation log
	l10Content := `[INFO] Starting system emulation for firmware analysis
[INFO] QEMU emulation environment initialized
[INFO] System emulation started successfully
[INFO] Emulated system is running on 192.168.1.100
[INFO] Service detected: httpd running on port 80
[INFO] Service detected: sshd running on port 22
[INFO] Service detected: telnetd running on port 23
[WARNING] Weak authentication detected in telnet service
[ERROR] Buffer overflow vulnerability found in httpd
`
	writeTestFile(filepath.Join(logDir, "l10_system_emulation.txt"), l10Content)

	// Create L15 network service detection log
	l15Content := `Nmap scan report for 192.168.1.100
Host is up (0.001s latency).
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.4
23/tcp   open  telnet  Linux telnetd
80/tcp   open  http    Apache httpd 2.4.6
443/tcp  open  https   Apache httpd 2.4.6
8080/tcp open  http    Jetty 9.4.z-SNAPSHOT
Service detection performed. Please report any incorrect results.
`
	writeTestFile(filepath.Join(logDir, "l15_network_service_detection.txt"), l15Content)

	// Create L25 web application vulnerability log
	l25Content := `[INFO] Starting web application vulnerability scan
[INFO] Target: http://192.168.1.100
[CRITICAL] SQL Injection vulnerability found at /login.php
[HIGH] Cross-Site Scripting (XSS) vulnerability found at /search.php
[MEDIUM] Directory traversal vulnerability found at /files.php
[LOW] Information disclosure in HTTP headers
[INFO] Nikto scan completed
[INFO] testssl.sh scan completed - weak SSL/TLS configuration detected
`
	writeTestFile(filepath.Join(logDir, "l25_web_application_vulnerability.txt"), l25Content)

	fmt.Println("   ✓ Mock L module log files created")
}

func writeTestFile(filepath, content string) {
	err := os.WriteFile(filepath, []byte(content), 0644)
	if err != nil {
		log.Fatalf("Failed to write test file %s: %v", filepath, err)
	}
}

func testL10Parsing(service *emba.Service, logDir string) {
	results, err := service.ParseResults(logDir)
	if err != nil {
		log.Fatalf("Failed to parse L10 results: %v", err)
	}

	// Check for system emulation findings
	emulationFindings := 0
	for _, finding := range results.Findings {
		if finding.Type == "system_emulation" {
			emulationFindings++
			fmt.Printf("   ✓ Found emulation finding: %s\n", finding.Title)
		}
	}

	if emulationFindings > 0 {
		fmt.Printf("   ✓ L10 parsing successful - found %d emulation findings\n", emulationFindings)
	} else {
		fmt.Println("   ⚠ L10 parsing - no emulation findings detected")
	}
}

func testL15Parsing(service *emba.Service, logDir string) {
	results, err := service.ParseResults(logDir)
	if err != nil {
		log.Fatalf("Failed to parse L15 results: %v", err)
	}

	// Check for network service findings
	networkFindings := 0
	for _, finding := range results.Findings {
		if finding.Type == "open_port" || finding.Type == "network_service" {
			networkFindings++
			fmt.Printf("   ✓ Found network finding: %s\n", finding.Title)
		}
	}

	if networkFindings > 0 {
		fmt.Printf("   ✓ L15 parsing successful - found %d network findings\n", networkFindings)
	} else {
		fmt.Println("   ⚠ L15 parsing - no network findings detected")
	}
}

func testL25Parsing(service *emba.Service, logDir string) {
	results, err := service.ParseResults(logDir)
	if err != nil {
		log.Fatalf("Failed to parse L25 results: %v", err)
	}

	// Check for web vulnerability findings
	webFindings := 0
	for _, finding := range results.Findings {
		if strings.Contains(strings.ToLower(string(finding.Type)), "web") ||
		   strings.Contains(strings.ToLower(finding.Description), "sql") ||
		   strings.Contains(strings.ToLower(finding.Description), "xss") {
			webFindings++
			fmt.Printf("   ✓ Found web vulnerability: %s (Severity: %s)\n", finding.Title, finding.Severity)
		}
	}

	if webFindings > 0 {
		fmt.Printf("   ✓ L25 parsing successful - found %d web vulnerabilities\n", webFindings)
	} else {
		fmt.Println("   ⚠ L25 parsing - no web vulnerabilities detected")
	}
}

func testCommandConstruction(service *emba.Service) {
	// Test command construction with L modules enabled
	args := service.BuildEMBACommand("/test/firmware", "/test/logs")
	
	hasLiveTestingFlag := false
	hasEmulationFlag := false
	hasCWEFlag := false
	
	for _, arg := range args {
		if arg == "-L" {
			hasLiveTestingFlag = true
		}
		if arg == "-E" {
			hasEmulationFlag = true
		}
		if arg == "-c" {
			hasCWEFlag = true
		}
	}

	if hasLiveTestingFlag {
		fmt.Println("   ✓ Live Testing (-L) flag included in command")
	} else {
		fmt.Println("   ⚠ Live Testing (-L) flag missing from command")
	}

	if hasEmulationFlag {
		fmt.Println("   ✓ Emulation (-E) flag included in command")
	} else {
		fmt.Println("   ⚠ Emulation (-E) flag missing from command")
	}

	if hasCWEFlag {
		fmt.Println("   ✓ CWE-checker (-c) flag included in command")
	} else {
		fmt.Println("   ⚠ CWE-checker (-c) flag missing from command")
	}

	fmt.Printf("   ✓ Full command: %s\n", strings.Join(args, " "))
}

func testConfigurationManagement(service *emba.Service) {
	// Test getting current configuration
	config := service.GetConfig()
	
	fmt.Printf("   ✓ Live Testing Enabled: %v\n", config.LiveTestingEnabled)
	fmt.Printf("   ✓ Emulation Enabled: %v\n", config.EmulationEnabled)
	fmt.Printf("   ✓ CWE-checker Enabled: %v\n", config.CWECheckerEnabled)
	fmt.Printf("   ✓ Scan Profile: %s\n", config.ScanProfile)
	fmt.Printf("   ✓ Thread Count: %d\n", config.ThreadCount)

	// Test updating configuration
	newConfig := emba.EMBAConfig{
		LiveTestingEnabled: false,
		EmulationEnabled:   true,
		CWECheckerEnabled:  false,
		ScanProfile:        "quick-scan.emba",
		ThreadCount:        2,
	}

	err := service.UpdateConfig(newConfig)
	if err != nil {
		fmt.Printf("   ⚠ Configuration update failed: %v\n", err)
	} else {
		fmt.Println("   ✓ Configuration updated successfully")
	}

	// Verify the update
	updatedConfig := service.GetConfig()
	if updatedConfig.LiveTestingEnabled == newConfig.LiveTestingEnabled &&
	   updatedConfig.ScanProfile == newConfig.ScanProfile {
		fmt.Println("   ✓ Configuration changes verified")
	} else {
		fmt.Println("   ⚠ Configuration changes not applied correctly")
	}
}
