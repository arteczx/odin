# Odin Firmware Intelligence

Platform web terintegrasi untuk mengotomatisasi proses reconnaissance dan analisis permukaan serangan (attack surface) pada firmware perangkat keras. Memberikan para peneliti keamanan, pengembang, dan penggemar hardware hacking sebuah alat yang cepat dan efisien untuk melakukan penilaian awal terhadap keamanan firmware.

## 🎯 Tujuan Platform

Odin dirancang untuk mengotomatisasi proses analisis firmware yang kompleks menjadi workflow yang sederhana dan efisien. Platform ini menerima file firmware, membongkarnya, dan secara otomatis melakukan serangkaian analisis statis serta pengumpulan informasi dari sumber terbuka (OSINT) untuk mengidentifikasi:

- 🔍 **Potensi kerentanan dan CVE**
- 🔐 **Informasi sensitif yang tertanam** (credentials, private keys, API keys)
- 🌐 **Vektor serangan yang mungkin ada**
- 📊 **Attack surface mapping**
- 🛡️ **Penilaian risiko keamanan**

## 🏗️ Arsitektur Platform

```
odin/
├── frontend/                    # Web Dashboard (React/Vue.js)
│   ├── components/             # UI Components
│   ├── pages/                  # Dashboard pages
│   └── services/               # API integration
├── server/                     # Backend API & Analysis Engine
│   ├── app/
│   │   ├── routers/           # FastAPI endpoints
│   │   ├── models/            # Database models
│   │   ├── services/          # Analysis pipeline
│   │   │   ├── extractors/    # Binwalk extraction
│   │   │   └── analyzers/     # Static, CVE, OSINT
│   │   └── utils/             # Error handling, logging
│   ├── docker-compose.yml     # Infrastructure
│   └── requirements.txt       # Dependencies
└── README.md
```

## ✨ Fitur Utama

### 🔧 Analysis Engine
- **Firmware Extraction**: Binwalk untuk ekstraksi filesystem otomatis
- **Static Analysis**: Pencarian secrets, credentials, misconfigurations
- **CVE Matching**: Integrasi dengan NIST NVD untuk vulnerability assessment
- **OSINT Intelligence**: Google search, Shodan, FCC database, credential databases
- **Risk Assessment**: Kalkulasi tingkat risiko berdasarkan temuan

### 🖥️ Web Interface
- **Dashboard Interaktif**: Visualisasi hasil analisis real-time
- **Project Management**: Riwayat dan manajemen proyek analisis
- **Real-time Updates**: WebSocket untuk status tracking
- **Export Reports**: Laporan komprehensif untuk dokumentasi

### ⚡ Performance & Scalability
- **Async Processing**: Celery job queue untuk multiple firmware
- **Modular Architecture**: Extensible analyzer system
- **Docker Support**: Container-based deployment
- **Production Ready**: Comprehensive logging dan error handling

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (untuk development)
- binwalk (firmware analysis tool)

### Installation

1. **Clone repository:**
```bash
git clone <repository-url>
cd odin
```

2. **Start server backend:**
```bash
cd server
docker-compose up -d
```

3. **Access API documentation:**
```
http://localhost:8000/docs
```

4. **Start frontend (coming soon):**
```bash
cd frontend
npm install && npm start
```

## 📋 Analysis Workflow

### 1. 📤 Upload & Configuration
- Drag-and-drop firmware file (.bin, .img, .hex, .rom, .fw)
- Input metadata: device name, model, manufacturer
- Configure analysis options

### 2. 🔍 Automated Analysis Pipeline
```
Upload → Binwalk Extraction → Static Analysis → CVE Matching → OSINT → Report
```

**Extraction Phase:**
- Binwalk signature analysis
- Filesystem extraction
- Architecture detection

**Static Analysis:**
- Sensitive information detection (passwords, keys, tokens)
- Binary security analysis (NX, PIE, ASLR)
- Configuration file analysis
- Service identification

**CVE Analysis:**
- Software component identification
- Version extraction
- NIST NVD vulnerability matching
- CVSS scoring

**OSINT Intelligence:**
- Device documentation search
- Default credential lookup
- Security advisory search
- Shodan device discovery

### 3. 📊 Interactive Results Dashboard
- **Summary**: Risk score, critical findings overview
- **Attack Surface**: Services, ports, endpoints
- **Sensitive Data**: Credentials, keys, internal IPs
- **Vulnerabilities**: CVE list dengan severity scoring
- **File Explorer**: Browse extracted filesystem
- **OSINT Report**: External intelligence findings

## 🛠️ Development Status

### ✅ Completed Components

**Server Backend (100% Complete):**
- ✅ FastAPI REST API dengan async support
- ✅ PostgreSQL database dengan SQLAlchemy models
- ✅ Redis + Celery job queuing system
- ✅ Binwalk firmware extraction module
- ✅ Static analysis pipeline (secrets, binaries, configs)
- ✅ CVE analyzer dengan NIST NVD integration
- ✅ OSINT analyzer (Google, Shodan, FCC, credentials)
- ✅ WebSocket real-time status updates
- ✅ Comprehensive error handling dan logging
- ✅ Docker deployment configuration
- ✅ Production-ready dengan monitoring

**Frontend Dashboard (Pending):**
- 🔄 React/Vue.js web interface
- 🔄 Interactive dashboard components
- 🔄 Real-time analysis tracking
- 🔄 Results visualization
- 🔄 Project management UI

## 🔧 Technical Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL dengan SQLAlchemy ORM
- **Queue**: Redis + Celery untuk async processing
- **Analysis Tools**: binwalk, strings, readelf
- **APIs**: NIST NVD, Shodan (optional)

### Frontend (Planned)
- **Framework**: React.js atau Vue.js
- **UI Library**: Material-UI atau Tailwind CSS
- **State Management**: Redux/Vuex
- **Real-time**: WebSocket integration

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx (production)

## 📖 Documentation

- **Server Backend**: [server/README.md](server/README.md)
- **API Documentation**: http://localhost:8000/docs (when running)
- **Frontend Guide**: Coming soon

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License

Copyright (c) 2024 Odin Firmware Intelligence

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 Acknowledgments

- **binwalk** - Firmware analysis tool
- **NIST NVD** - Vulnerability database
- **Shodan** - Internet-connected device search engine
- **FastAPI** - Modern Python web framework
