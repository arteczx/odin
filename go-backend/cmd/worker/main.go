package main

import (
	"log"
	"odin-backend/internal/config"
	"odin-backend/internal/database"
	"odin-backend/internal/worker"
	"time"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.Initialize(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize worker
	w := worker.New(db, cfg)

	log.Println("Starting ODIN worker...")
	log.Println("Worker will poll for pending analysis jobs every 10 seconds")

	// Start worker polling loop
	for {
		if err := w.ProcessPendingJobs(); err != nil {
			log.Printf("Error processing jobs: %v", err)
		}
		time.Sleep(10 * time.Second)
	}
}
