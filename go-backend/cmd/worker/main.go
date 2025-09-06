package main

import (
	"log"
	"odin-backend/internal/config"
	"odin-backend/internal/database"
	"odin-backend/internal/queue"
	"odin-backend/internal/worker"

	"github.com/hibiken/asynq"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize worker
	w := worker.New(db, cfg)

	// Setup Asynq server
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: cfg.RedisURL},
		asynq.Config{
			Concurrency: 2, // Number of concurrent workers
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)

	// Register task handlers
	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TypeAnalyzeFirmware, w.HandleAnalyzeFirmware)

	log.Println("Starting Asynq worker...")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("Failed to start worker: %v", err)
	}
}
