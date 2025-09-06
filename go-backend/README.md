# ODIN Go Backend - Production API Server

Production-ready Go backend API and analysis engine for the ODIN Firmware Intelligence Platform. Features EMBA integration, real-time firmware analysis, and comprehensive security assessment capabilities.

## 🏗️ Architecture

```
go-backend/
├── cmd/
│   ├── server/                 # API Server entry point
│   └── worker/                 # Background worker entry point
├── internal/
│   ├── config/                 # Configuration management
│   ├── database/               # SQLite database layer
│   ├── handlers/               # REST API handlers
│   ├── emba/                   # EMBA integration service
│   └── models/                 # Database models
├── go.mod                      # Go module definition
├── go.sum                      # Go module checksums
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Multi-service setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Go 1.21+
- EMBA installation with sudo permissions
- SQLite (included with Go)
- Linux environment (for EMBA)

### Installation

1. **Clone and setup:**
```bash
cd go-backend
cp .env.example .env
# Edit .env with your configuration
```

2. **Build and run:**
```bash
# Install dependencies
go mod download

# Build applications
go build -o bin/server ./cmd/server
go build -o bin/worker ./cmd/worker

# Start API server
./bin/server

# Start worker (in separate terminal)
./bin/worker
```

3. **Or use provided scripts:**
```bash
# Start server
./scripts/start-server.sh

# Start worker
./scripts/start-worker.sh
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Health status

### Firmware Analysis
- `POST /api/firmware/upload` - Upload firmware and start analysis
- `GET /api/analysis/{job_id}/status` - Real-time analysis status
- `GET /api/analysis/{job_id}/results` - Complete analysis results
- `DELETE /api/analysis/{job_id}` - Delete analysis

### Projects
- `GET /api/projects/` - List all projects
- `GET /api/projects/{project_id}` - Project details
- `DELETE /api/projects/{project_id}` - Delete project

### EMBA Integration
- `GET /api/emba/{job_id}/results` - Structured EMBA analysis results
- `GET /api/emba/{job_id}/logs` - EMBA execution logs
- `GET /api/emba/config` - EMBA configuration
- `GET /api/emba/profiles` - Available EMBA profiles

### Vulnerabilities
- `GET /api/vulnerabilities/` - All vulnerability findings
- `GET /api/projects/{project_id}/vulnerabilities` - Project vulnerabilities

### OSINT
- `GET /api/osint/` - All OSINT results
- `GET /api/projects/{project_id}/osint` - Project OSINT data

### Reports
- `GET /api/reports/` - Available reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/{report_id}/download` - Download report

## 🔬 Analysis Pipeline

### 1. Upload & Validation
- Firmware file uploaded via REST API
- File type and size validation
- Project created in SQLite database

### 2. EMBA Processing
- EMBA executed via subprocess with sudo
- Real-time status updates to database
- Comprehensive logging and error handling

### 3. Result Processing
- EMBA output (CSV, TXT, JSON, HTML) parsed
- Structured data stored in SQLite
- Risk level calculated automatically
- Vulnerability and OSINT data extracted

### 4. API Response
- Frontend receives real-time status updates
- Complete results available after completion
- Structured JSON responses for all data

## 🗄️ Database Schema

### Projects
- Metadata proyek dan file firmware
- Status tracking dan timestamps
- Device information dan risk level

### Findings
- Hasil static analysis dari EMBA
- Severity levels dan kategorisasi
- File locations dan context

### CVE Findings
- Identified vulnerabilities
- Software versions dan CVSS scores
- Reference links

### OSINT Results
- External intelligence data
- Source attribution dan confidence scoring

## ⚙️ Configuration

### Environment Variables
```bash
# Database
DATABASE_PATH=./odin.db

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# File Storage
UPLOAD_DIR=./uploads
WORK_DIR=./work
MAX_FILE_SIZE=524288000

# EMBA
EMBA_PATH=../emba
EMBA_LOG_DIR=./logs
EMBA_SCAN_PROFILE=default-scan.emba
EMBA_THREADS=4
EMBA_ENABLE_EMULATION=true
EMBA_ENABLE_CWE_CHECK=true

# Supported Extensions
SUPPORTED_EXTENSIONS=.bin,.img,.hex,.rom,.fw
```

## 🔧 Development

### Adding New Features
1. Extend `emba.Service` in `internal/emba/`
2. Update parsing logic for new output formats
3. Add mapping to database models
4. Update API handlers in `internal/handlers/`

### Adding New API Endpoints
1. Add handler method in `internal/handlers/`
2. Register route in `cmd/server/main.go`
3. Update CORS settings if needed

### Database Schema
- GORM AutoMigrate runs automatically on startup
- SQLite database with optimized indexes
- Structured models for projects, findings, CVEs, OSINT

## 🐛 Troubleshooting

### Common Issues

**1. EMBA not found:**
- Check EMBA_PATH in environment variables
- Ensure EMBA executable is accessible
- Verify sudo permissions for EMBA execution

**2. Database issues:**
- Check SQLite file permissions
- Verify DATABASE_PATH setting
- Ensure disk space available

**3. File upload fails:**
- Check UPLOAD_DIR permissions
- Verify MAX_FILE_SIZE setting
- Check available disk space

**4. EMBA execution fails:**
- Check sudo permissions
- Verify EMBA installation
- Check log files for detailed errors

## 📊 Monitoring

### Health Checks
- `GET /api/health` - Basic health check
- Database connectivity check
- EMBA availability check
- File system permissions check

### Logging
- Structured logging with Go log package
- Request/response logging via Gin middleware
- Error tracking and stack traces
- EMBA execution logging

## 🔒 Security

1. **File Upload Security**:
   - File type validation
   - Size limits enforcement
   - Sandboxed processing

2. **API Security**:
   - CORS middleware
   - Input validation
   - Error handling

3. **EMBA Execution**:
   - Subprocess isolation
   - Sudo permission control
   - Resource limits

## 🚀 Production Deployment

### Production Deployment
```bash
# Build production binaries
go build -o bin/server ./cmd/server
go build -o bin/worker ./cmd/worker

# Set production environment
export GIN_MODE=release

# Start services
./bin/server &
./bin/worker &
```

### Production Setup
1. Build Go binaries for target platform
2. Configure SQLite database path
3. Setup reverse proxy (nginx)
4. Configure monitoring and logging
5. Set up EMBA with proper permissions

## 📈 Performance

### Go Routines
- Concurrent processing for multiple analyses
- Memory-efficient goroutine management
- Proper error handling and recovery

### Database
- SQLite with optimized indexes
- Connection pooling with GORM
- Query performance monitoring

### File Storage
- Use SSD for work directories
- Automated cleanup policies
- Disk usage monitoring

## 🚀 Production Features

This Go backend provides:
- **High Performance**: Native Go concurrency and efficiency
- **SQLite Database**: Lightweight, embedded database
- **EMBA Integration**: Complete firmware analysis capabilities
- **RESTful APIs**: Comprehensive endpoint coverage
- **Real-time Processing**: Concurrent analysis handling
- **Production Ready**: Comprehensive error handling and logging

API endpoints are fully compatible with the React frontend.

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add tests untuk new features
4. Submit pull request

## 📄 License

MIT License - Lihat file LICENSE untuk detail lengkap.
