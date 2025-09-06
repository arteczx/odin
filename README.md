# ODIN - Firmware Intelligence Platform

**ODIN** is a production-ready integrated web platform for automating reconnaissance and attack surface analysis on hardware firmware. It provides security researchers, developers, and hardware hacking enthusiasts with a comprehensive tool for firmware security assessment using EMBA (Embedded Analyzer) and advanced OSINT capabilities.

> **🚀 PRODUCTION READY: Fully Integrated Frontend & Backend**  
> Complete platform with React frontend, Go backend, and EMBA integration.

## 🎯 Platform Objectives

ODIN automates complex firmware analysis processes into a simple and efficient workflow. The platform accepts firmware files, extracts them, and automatically performs comprehensive static analysis and Open Source Intelligence (OSINT) gathering to identify:

- 🔍 **Potential vulnerabilities and CVEs**
- 🔐 **Embedded sensitive information** (credentials, private keys, API keys)
- 🌐 **Possible attack vectors**
- 📊 **Attack surface mapping**
- 🛡️ **Security risk assessment**
- 🔬 **EMBA-powered deep analysis**

## 🏗️ Platform Architecture

```
odin/
├── emba/                       # EMBA Firmware Analyzer (Integrated)
├── frontend/                   # React TypeScript Dashboard (Production Ready)
│   ├── src/
│   │   ├── components/        # UI Components & Real-time Visualization
│   │   ├── pages/             # Dashboard, Projects, Vulnerabilities, OSINT, Reports
│   │   ├── services/          # Complete API integration
│   │   └── types/             # TypeScript definitions
│   └── package.json
├── go-backend/                 # Go Backend API & Analysis Engine (Production Ready)
│   ├── cmd/                   # Server & Worker applications
│   ├── internal/              # Internal packages
│   │   ├── handlers/          # REST API handlers
│   │   ├── database/          # Database layer
│   │   ├── emba/              # EMBA integration service
│   │   └── config/            # Configuration management
│   ├── scripts/               # Deployment scripts
│   └── go.mod
├── install.sh                  # Automated installer
├── run.sh                     # Start all services
├── stop.sh                    # Stop all services
└── status.sh                  # Check system status
```

## ✨ Key Features

### 🔧 Analysis Engine
- **EMBA Integration**: Complete EMBA firmware analyzer integration with advanced profiling
- **Firmware Extraction**: Automated filesystem extraction and analysis
- **Static Analysis**: Comprehensive secrets, credentials, and misconfiguration detection
- **CVE Matching**: Real-time vulnerability assessment with severity scoring
- **OSINT Intelligence**: Multi-source intelligence gathering and correlation
- **Risk Assessment**: Advanced risk calculation based on findings

### 🖥️ Web Interface
- **Interactive Dashboard**: Real-time analysis visualization with cyberpunk UI
- **Project Management**: Complete project lifecycle management
- **Live Updates**: Real-time status tracking and progress monitoring
- **Comprehensive Reports**: Multi-format report generation (PDF, HTML, JSON)
- **Vulnerability Tracking**: Detailed CVE analysis and remediation guidance
- **OSINT Results**: Structured intelligence presentation

### ⚡ Performance & Scalability
- **Async Processing**: Go-based concurrent processing for multiple firmware
- **Modular Architecture**: Extensible and maintainable codebase
- **Production Ready**: Comprehensive logging, error handling, and monitoring
- **RESTful APIs**: Complete API coverage for all functionality

## 🚀 Quick Start

### 🎯 One-Click Installation (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd odin

# Run the automated installer
chmod +x install.sh
./install.sh
```

The installer automatically sets up:
- ✅ **System dependencies** (build tools, libraries)
- ✅ **Node.js 20.x LTS & npm**
- ✅ **Go 1.21+ & build tools**
- ✅ **EMBA firmware analyzer** (complete installation)
- ✅ **SQLite database** (production-ready)
- ✅ **Go backend compilation** (server & worker)
- ✅ **React frontend build** (production optimized)
- ✅ **Environment configuration** (automated)
- ✅ **Service management scripts**

### 🎮 Start Services

After installation:
```bash
# Start all services
./run.sh

# Check system status
./status.sh

# Stop all services
./stop.sh
```

### 🌐 Access Points
- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **Health Check:** http://localhost:8080/health

### 📋 Manual Installation (Advanced)

If you prefer manual setup, see [DEV_SETUP.md](DEV_SETUP.md) for detailed instructions.

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

## 🛠️ Production Status

### ✅ Completed Components

**Go Backend (100% Complete):**
- ✅ RESTful API with comprehensive endpoints
- ✅ SQLite database with optimized models
- ✅ EMBA integration service with advanced profiling
- ✅ Firmware upload and analysis pipeline
- ✅ CVE vulnerability analysis with real-time data
- ✅ OSINT intelligence gathering and correlation
- ✅ Project lifecycle management
- ✅ Report generation (multiple formats)
- ✅ Comprehensive error handling and logging
- ✅ Production-ready deployment

**React Frontend (100% Complete):**
- ✅ Modern React TypeScript interface
- ✅ Interactive dashboard with real-time updates
- ✅ Complete project management UI
- ✅ Vulnerability analysis visualization
- ✅ OSINT results presentation
- ✅ Report generation and download
- ✅ Cyberpunk-themed responsive design
- ✅ Full API integration (no placeholder data)
- ✅ Error handling and user feedback

## 🔧 Technical Stack

### Backend
- **Framework**: Go 1.21+ with Gin web framework
- **Database**: SQLite with GORM ORM
- **Analysis Engine**: EMBA (Embedded Analyzer) integration
- **Analysis Tools**: EMBA suite, binwalk, strings, readelf
- **APIs**: Real-time vulnerability and OSINT data

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI with custom cyberpunk theme
- **State Management**: React hooks and context
- **HTTP Client**: Axios with comprehensive error handling
- **Build Tool**: Create React App with optimizations

### Infrastructure
- **Database**: SQLite (production-ready)
- **File Storage**: Local filesystem with organized structure
- **Process Management**: Go routines for concurrent processing
- **Deployment**: Native binaries with service scripts

## 📖 Documentation

- **Go Backend**: [go-backend/README.md](go-backend/README.md)
- **React Frontend**: [frontend/README.md](frontend/README.md)
- **EMBA Integration**: Comprehensive EMBA analyzer integration
- **API Endpoints**: RESTful API with full CRUD operations

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License

Copyright (c) 2025 Odin Firmware Intelligence

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

- **EMBA** - Embedded Analyzer firmware analysis framework
- **binwalk** - Firmware extraction and analysis tool
- **Go** - High-performance backend development
- **React** - Modern frontend framework
- **Material-UI** - Comprehensive React component library
