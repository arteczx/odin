package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// Server
	ServerHost string
	ServerPort string

	// File Upload
	UploadDir            string
	WorkDir              string
	MaxFileSize          int64
	SupportedExtensions  []string

	// EMBA
	EMBAPath            string
	EMBALogDir          string
	EMBAEnableEmulation bool
	EMBAEnableCWECheck  bool
	EMBAEnableLiveTesting bool
	EMBAScanProfile     string
	EMBAThreads         int

	// External APIs
	ShodanAPIKey     string
	VirusTotalAPIKey string
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://user:password@localhost:5432/odin_db?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379/0"),
		ServerHost:         getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		UploadDir:          getEnv("UPLOAD_DIR", "/tmp/odin/uploads"),
		WorkDir:            getEnv("WORK_DIR", "/tmp/odin/work"),
		MaxFileSize:        getEnvAsInt64("MAX_FILE_SIZE", 524288000), // 500MB
		SupportedExtensions:   strings.Split(getEnv("SUPPORTED_EXTENSIONS", ".bin,.img,.hex,.rom,.fw"), ","),
		EMBAPath:             getEnv("EMBA_PATH", "../emba"),
		EMBALogDir:           getEnv("EMBA_LOG_DIR", "/tmp/emba_logs"),
		EMBAEnableEmulation:  getEnvAsBool("EMBA_ENABLE_EMULATION", false),
		EMBAEnableCWECheck:   getEnvAsBool("EMBA_ENABLE_CWE_CHECK", false),
		EMBAEnableLiveTesting: getEnvAsBool("EMBA_ENABLE_LIVE_TESTING", false),
		EMBAScanProfile:      getEnv("EMBA_SCAN_PROFILE", "default-scan.emba"),
		EMBAThreads:          getEnvAsInt("EMBA_THREADS", 2),
		ShodanAPIKey:       getEnv("SHODAN_API_KEY", ""),
		VirusTotalAPIKey:   getEnv("VIRUSTOTAL_API_KEY", ""),
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
