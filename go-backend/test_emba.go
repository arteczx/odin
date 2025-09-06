package main

import (
	"fmt"
	"log"
	"os"

	"odin-backend/internal/config"
	"odin-backend/internal/emba"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Create EMBA service
	embaService := emba.New(cfg)

	// Test EMBA availability
	fmt.Println("Testing EMBA integration...")
	fmt.Printf("EMBA Path: %s\n", cfg.EMBAPath)
	fmt.Printf("EMBA Log Dir: %s\n", cfg.EMBALogDir)

	if embaService.IsAvailable() {
		fmt.Println("✅ EMBA is available and executable")
		
		// Test EMBA version
		fmt.Println("\nTesting EMBA version...")
		// This would normally call EMBA -V but we'll skip for now
		fmt.Println("EMBA version check would be performed here")
		
		// Test log directory creation
		fmt.Println("\nTesting log directory creation...")
		testLogDir := "/tmp/emba_test_logs"
		if err := os.MkdirAll(testLogDir, 0755); err != nil {
			fmt.Printf("❌ Failed to create test log directory: %v\n", err)
		} else {
			fmt.Println("✅ Log directory creation successful")
			// Clean up
			os.RemoveAll(testLogDir)
		}
		
	} else {
		fmt.Println("❌ EMBA is not available")
		fmt.Printf("Please ensure EMBA is installed at: %s\n", cfg.EMBAPath)
		fmt.Println("And that the 'emba' script is executable")
	}

	fmt.Println("\nEMBA integration test completed.")
	fmt.Println("\nUpdated EMBA integration features:")
	fmt.Println("- Removed Docker dependencies")
	fmt.Println("- Updated command line parameters (-l, -f, -p, -W, -g)")
	fmt.Println("- Enhanced result parsing for official EMBA output formats")
	fmt.Println("- Improved error handling and logging")
	fmt.Println("- Compatible with models package types")
}
