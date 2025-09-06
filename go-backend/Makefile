# Odin Go Backend Makefile

.PHONY: build run-server run-worker test clean docker-build docker-up docker-down deps

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Binary names
SERVER_BINARY=server
WORKER_BINARY=worker

# Build directory
BUILD_DIR=build

all: build

# Install dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Build both server and worker
build: deps
	mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BUILD_DIR)/$(SERVER_BINARY) ./cmd/server
	$(GOBUILD) -o $(BUILD_DIR)/$(WORKER_BINARY) ./cmd/worker

# Build server only
build-server: deps
	mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BUILD_DIR)/$(SERVER_BINARY) ./cmd/server

# Build worker only
build-worker: deps
	mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BUILD_DIR)/$(WORKER_BINARY) ./cmd/worker

# Run server
run-server: build-server
	./$(BUILD_DIR)/$(SERVER_BINARY)

# Run worker
run-worker: build-worker
	./$(BUILD_DIR)/$(WORKER_BINARY)

# Run tests
test:
	$(GOTEST) -v ./...

# Clean build artifacts
clean:
	$(GOCLEAN)
	rm -rf $(BUILD_DIR)

# Docker Compose for dependencies only (PostgreSQL, Redis)
deps-up:
	docker-compose up -d

deps-down:
	docker-compose down

deps-logs:
	docker-compose logs -f

deps-clean:
	docker-compose down -v
	docker system prune -f

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Development helpers
dev-server: setup-dirs
	@echo "Starting ODIN server..."
	@echo "Config: Loading from .env file"
	@echo "Database: SQLite (./odin.db)"
	@echo "Server will be available at: http://localhost:8080"
	$(GOCMD) run ./cmd/server

dev-worker: setup-dirs
	@echo "Starting ODIN worker..."
	@echo "Config: Loading from .env file"
	@echo "Database: SQLite (./odin.db)"
	@echo "Worker will poll for pending analysis jobs every 10 seconds"
	$(GOCMD) run ./cmd/worker

# Setup required directories
setup-dirs:
	@mkdir -p uploads work logs /tmp/odin/uploads /tmp/odin/work /tmp/emba_logs
	@echo "Created required directories"

# Database helpers
db-reset:
	docker-compose down postgres
	docker volume rm go-backend_postgres_data || true
	docker-compose up -d postgres

# Format code
fmt:
	$(GOCMD) fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Install development tools
install-tools:
	$(GOGET) github.com/golangci/golangci-lint/cmd/golangci-lint@latest
