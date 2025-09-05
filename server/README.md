# Odin Firmware Intelligence - Server Backend

Backend API dan analysis engine untuk platform Odin Firmware Intelligence.

## 🏗️ Arsitektur

```
server/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py              # Configuration settings
│   ├── database.py            # Database connection
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── routers/               # API route handlers
│   ├── services/              # Business logic
│   │   ├── celery_app.py      # Celery configuration
│   │   ├── analysis_service.py # Analysis orchestration
│   │   ├── analysis_tasks.py   # Celery tasks
│   │   ├── extractors/        # Firmware extraction modules
│   │   └── analyzers/         # Analysis modules
│   └── utils/                 # Utilities and helpers
├── requirements.txt           # Python dependencies
├── docker-compose.yml         # Docker services
├── Dockerfile                # Container definition
├── start_server.sh           # Server startup script
└── start_worker.sh           # Worker startup script
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- binwalk (untuk ekstraksi firmware)
- PostgreSQL (atau gunakan Docker)
- Redis (atau gunakan Docker)

### Installation

1. **Clone dan setup environment:**
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Setup configuration:**
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

3. **Start dengan Docker Compose (Recommended):**
```bash
docker-compose up -d
```

4. **Atau start manual:**
```bash
# Terminal 1: Start database dan Redis
docker-compose up -d postgres redis

# Terminal 2: Start API server
./start_server.sh

# Terminal 3: Start Celery worker
./start_worker.sh
```

## 📡 API Endpoints

### Projects
- `GET /api/v1/projects/` - List semua proyek
- `GET /api/v1/projects/{id}` - Detail proyek
- `DELETE /api/v1/projects/{id}` - Hapus proyek

### Analysis
- `POST /api/v1/analysis/upload` - Upload firmware dan mulai analisis
- `GET /api/v1/analysis/{id}/results` - Hasil analisis lengkap
- `GET /api/v1/analysis/{id}/status` - Status analisis real-time

### WebSocket
- `WS /ws/project/{id}` - Real-time status updates

## 🔬 Analysis Pipeline

### 1. Firmware Extraction
- **Tool**: binwalk
- **Output**: Extracted filesystem
- **Features**:
  - Signature analysis
  - Automatic extraction
  - Filesystem detection

### 2. Static Analysis
- **Sensitive Information Detection**:
  - Passwords, API keys, private keys
  - IP addresses, URLs, email addresses
  - Hardcoded credentials
- **Binary Analysis**:
  - Security features (NX, PIE, ASLR)
  - Interesting strings extraction
  - ELF analysis
- **Configuration Analysis**:
  - /etc/passwd, /etc/shadow analysis
  - Web server misconfigurations
  - Service identification

### 3. CVE Analysis
- **Software Identification**:
  - BusyBox, Dropbear, OpenSSL, etc.
  - Version extraction dari binaries
- **Vulnerability Matching**:
  - NIST NVD API integration
  - Version range checking
  - CVSS scoring

### 4. OSINT Analysis
- **Device Intelligence**:
  - Google search untuk dokumentasi
  - FCC database lookup
  - Default credential databases
- **Security Intelligence**:
  - Shodan integration (opsional)
  - Security advisory search
  - Exploit database queries

## 🗄️ Database Schema

### Projects
- Metadata proyek dan file firmware
- Status tracking dan timestamps
- Device information

### Findings
- Hasil static analysis
- Severity levels dan kategorisasi
- File locations dan context

### CVE Findings
- Identified vulnerabilities
- Software versions dan CVSS scores
- Reference links

### OSINT Results
- External intelligence data
- Source attribution dan confidence scoring
- Structured result data

## ⚙️ Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/odin_db

# Redis/Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# File Storage
UPLOAD_DIR=/tmp/odin/uploads
WORK_DIR=/tmp/odin/work

# External APIs (Optional)
SHODAN_API_KEY=your-api-key
VIRUSTOTAL_API_KEY=your-api-key

# Analysis Settings
MAX_FILE_SIZE=524288000  # 500MB
SUPPORTED_EXTENSIONS=.bin,.img,.hex,.rom,.fw
```

### Logging
- **Console**: INFO level untuk development
- **File**: DEBUG level dengan rotation
- **Error File**: ERROR level untuk troubleshooting
- **Analysis File**: Dedicated log untuk analysis pipeline

## 🔧 Development

### Adding New Analyzers
1. Create analyzer class di `app/services/analyzers/`
2. Implement `analyze()` method
3. Add ke analysis pipeline di `analysis_tasks.py`

### Adding New Extractors
1. Create extractor class di `app/services/extractors/`
2. Implement `extract()` method
3. Update extraction logic di analysis pipeline

### API Development
1. Add routes di `app/routers/`
2. Define schemas di `app/schemas/`
3. Update models jika diperlukan

## 🐛 Troubleshooting

### Common Issues

**1. Binwalk not found:**
```bash
# Ubuntu/Debian
sudo apt-get install binwalk

# macOS
brew install binwalk
```

**2. Database connection error:**
- Check PostgreSQL service status
- Verify DATABASE_URL di .env
- Ensure database exists

**3. Celery worker not processing:**
- Check Redis connection
- Verify CELERY_BROKER_URL
- Check worker logs

**4. File upload fails:**
- Check UPLOAD_DIR permissions
- Verify MAX_FILE_SIZE setting
- Check disk space

### Logs Location
- Application: `logs/odin.log`
- Errors: `logs/odin_errors.log`
- Analysis: `logs/analysis.log`

## 📊 Monitoring

### Health Checks
- `GET /health` - Basic health check
- Database connectivity
- Redis connectivity
- File system permissions

### Metrics
- Analysis completion rates
- Processing times
- Error rates
- Queue lengths

## 🔒 Security Considerations

1. **File Upload Security**:
   - File type validation
   - Size limits
   - Sandboxed processing

2. **API Security**:
   - Input validation
   - Rate limiting (TODO)
   - Authentication (TODO)

3. **Analysis Security**:
   - Isolated execution environment
   - Resource limits
   - Timeout protection

## 🚀 Production Deployment

### Docker Production
```bash
# Build production image
docker build -t odin-server .

# Run with production settings
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production
1. Use production database (PostgreSQL)
2. Configure Redis cluster
3. Setup reverse proxy (nginx)
4. Enable SSL/TLS
5. Configure monitoring
6. Setup log aggregation

## 📈 Performance Tuning

### Celery Workers
- Adjust concurrency based on CPU cores
- Monitor memory usage
- Configure task time limits

### Database
- Add indexes untuk frequent queries
- Configure connection pooling
- Monitor query performance

### File Storage
- Use SSD untuk work directories
- Configure cleanup policies
- Monitor disk usage

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add tests untuk new features
4. Submit pull request

## 📄 License

[Add your license information here]
