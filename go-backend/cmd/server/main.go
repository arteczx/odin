package main

import (
	"log"
	"odin-backend/internal/config"
	"odin-backend/internal/database"
	"odin-backend/internal/handlers"
	"odin-backend/internal/middleware"

	"github.com/gin-gonic/gin"
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

	// Initialize handlers
	h := handlers.New(db, cfg)

	// Setup Gin router
	r := gin.Default()

	// Add middleware
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.ErrorHandler())

	// API routes
	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", h.HealthCheck)

		// Firmware upload and analysis
		firmware := api.Group("/firmware")
		{
			firmware.POST("/upload", h.UploadFirmware)
		}

		// Analysis endpoints
		analysis := api.Group("/analysis")
		{
			analysis.GET("/:job_id/status", h.GetAnalysisStatus)
			analysis.GET("/:job_id/results", h.GetAnalysisResults)
			analysis.DELETE("/:job_id", h.DeleteAnalysis)
		}

		// Projects endpoint for compatibility
		projects := api.Group("/projects")
		{
			projects.GET("/", h.ListProjects)
			projects.GET("/:project_id", h.GetProject)
			projects.DELETE("/:project_id", h.DeleteProject)
		}

		// EMBA specific endpoints
		emba := api.Group("/emba")
		{
			emba.GET("/:job_id/results", h.GetEMBAReport)
			emba.GET("/:job_id/report", h.GetEMBAReport)
			emba.GET("/:job_id/logs", h.GetEMBALogs)
			emba.GET("/config", h.GetEMBAConfig)
			emba.POST("/config", h.UpdateEMBAConfig)
			emba.GET("/profiles", h.GetEMBAProfiles)
		}
	}

	// Start server
	log.Printf("Starting server on %s:%s", cfg.ServerHost, cfg.ServerPort)
	if err := r.Run(cfg.ServerHost + ":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
