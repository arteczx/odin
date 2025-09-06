package database

import (
	"odin-backend/internal/models"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Initialize(databasePath string) (*gorm.DB, error) {
	// Ensure database directory exists
	dir := filepath.Dir(databasePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	// Open SQLite database
	db, err := gorm.Open(sqlite.Open(databasePath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	err = db.AutoMigrate(
		&models.Project{},
		&models.Finding{},
		&models.CVEFinding{},
		&models.OSINTResult{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}
