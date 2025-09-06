# ODIN Development Setup Guide

This guide provides detailed instructions for manually setting up the ODIN Firmware Intelligence Platform for development purposes. If you prefer automated installation, use `./install.sh` instead.

## 🎯 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ free space
- **Network**: Internet connection for dependencies

### Required Software
- **Go**: 1.21 or higher
- **Node.js**: 20.x LTS
- **npm**: Latest version
- **Git**: For version control
- **sudo**: Access for EMBA installation

## 🔧 Step 1: System Dependencies

### Ubuntu/Debian
```bash
# Update package lists
sudo apt update

# Install build essentials
sudo apt install -y build-essential curl wget git

# Install additional tools
sudo apt install -y unzip tree htop
```

### CentOS/RHEL/Fedora
```bash
# Update package manager
sudo yum update -y  # or dnf update -y for Fedora

# Install development tools
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl wget git unzip
```

## 🐹 Step 2: Go Installation

### Download and Install Go
```bash
# Download Go 1.21+ (check for latest version)
cd /tmp
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# Remove old Go installation (if exists)
sudo rm -rf /usr/local/go

# Extract new Go
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# Add Go to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc

# Reload shell configuration
source ~/.bashrc

# Verify installation
go version
```

## 📦 Step 3: Node.js Installation

### Using NodeSource Repository (Recommended)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Alternative: Using Node Version Manager (nvm)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

## 🔬 Step 4: EMBA Installation

### Clone EMBA Repository
```bash
# Navigate to project directory
cd /path/to/odin

# Clone EMBA as submodule (if not already present)
git submodule update --init --recursive

# Or clone manually
git clone https://github.com/e-m-b-a/emba.git
```

### Install EMBA Dependencies
```bash
cd emba

# Run EMBA installer (requires sudo)
sudo ./installer.sh -d

# This will install:
# - Analysis tools (binwalk, strings, readelf, etc.)
# - CVE databases
# - OSINT tools
# - Additional dependencies
```

### Verify EMBA Installation
```bash
# Test EMBA
sudo ./emba -l ./logs -f /path/to/test/firmware.bin -p ./scan-profiles/default-scan.emba

# Check if EMBA executable is accessible
which emba || echo "EMBA not in PATH, will use relative path"
```

## 🗄️ Step 5: Database Setup

ODIN uses SQLite by default, which requires no additional setup. The database file will be created automatically when the Go backend starts.

### Optional: Database Location
```bash
# Create data directory (optional)
mkdir -p ./data

# The SQLite database will be created at:
# ./data/odin.db (if DATA_DIR is set)
# or ./odin.db (default)
```

## 🚀 Step 6: Backend Setup

### Navigate to Backend Directory
```bash
cd go-backend
```

### Install Go Dependencies
```bash
# Download and install Go modules
go mod download

# Verify dependencies
go mod verify
```

### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### Environment Configuration (.env)
```bash
# Database
DATABASE_PATH=./odin.db

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
GIN_MODE=debug

# File Storage
UPLOAD_DIR=./uploads
WORK_DIR=./work
MAX_FILE_SIZE=524288000

# EMBA Configuration
EMBA_PATH=../emba
EMBA_LOG_DIR=./logs
EMBA_SCAN_PROFILE=default-scan.emba
EMBA_THREADS=4
EMBA_ENABLE_EMULATION=true
EMBA_ENABLE_CWE_CHECK=true

# Supported File Extensions
SUPPORTED_EXTENSIONS=.bin,.img,.hex,.rom,.fw

# Logging
LOG_LEVEL=debug
LOG_FORMAT=text
```

### Build Backend Applications
```bash
# Create bin directory
mkdir -p bin

# Build server
go build -o bin/server ./cmd/server

# Build worker
go build -o bin/worker ./cmd/worker

# Verify builds
ls -la bin/
```

### Test Backend
```bash
# Start server (in one terminal)
./bin/server

# Start worker (in another terminal)
./bin/worker

# Test health endpoint
curl http://localhost:8080/api/health
```

## 🎨 Step 7: Frontend Setup

### Navigate to Frontend Directory
```bash
cd ../frontend
```

### Install Node Dependencies
```bash
# Install packages
npm install

# Verify installation
npm list --depth=0
```

### Configure Environment
```bash
# Create environment file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8080
GENERATE_SOURCEMAP=false
EOF
```

### Build and Test Frontend
```bash
# Start development server
npm start

# Or build for production
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3000
```

## 🔧 Step 8: Development Tools

### Install Additional Development Tools
```bash
# Go tools
go install golang.org/x/tools/cmd/goimports@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Frontend tools (optional)
npm install -g typescript
npm install -g @typescript-eslint/parser
```

### IDE Setup (VS Code)
```bash
# Install VS Code extensions (if using VS Code)
code --install-extension golang.go
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
```

## 🚀 Step 9: Running the Complete System

### Start All Services
```bash
# Terminal 1: Backend Server
cd go-backend
./bin/server

# Terminal 2: Backend Worker
cd go-backend
./bin/worker

# Terminal 3: Frontend
cd frontend
npm start
```

### Access Points
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/api/health

## 🧪 Step 10: Testing the Setup

### Test Firmware Upload
```bash
# Create test firmware file
dd if=/dev/urandom of=test_firmware.bin bs=1024 count=1024

# Upload via API
curl -X POST \
  -F "firmware_file=@test_firmware.bin" \
  -F "project_name=Test Project" \
  -F "description=Test firmware analysis" \
  http://localhost:8080/api/firmware/upload
```

### Verify Analysis Pipeline
1. Upload firmware via frontend dashboard
2. Monitor analysis progress in real-time
3. Check EMBA logs for detailed analysis output
4. Verify results in vulnerabilities and OSINT pages

## 🐛 Troubleshooting

### Common Issues

#### Go Build Errors
```bash
# Clear module cache
go clean -modcache

# Re-download dependencies
go mod download
```

#### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### EMBA Permission Issues
```bash
# Ensure EMBA has proper permissions
sudo chown -R $(whoami):$(whoami) emba/
sudo chmod +x emba/emba

# Test sudo access
sudo -v
```

#### Database Issues
```bash
# Check database file permissions
ls -la odin.db

# Remove and recreate database (development only)
rm odin.db
# Restart backend to recreate
```

### Port Conflicts
```bash
# Check if ports are in use
sudo netstat -tlnp | grep :8080
sudo netstat -tlnp | grep :3000

# Kill processes using ports
sudo kill -9 $(lsof -t -i:8080)
sudo kill -9 $(lsof -t -i:3000)
```

## 📁 Project Structure After Setup

```
odin/
├── emba/                       # EMBA analyzer
├── frontend/                   # React frontend
│   ├── node_modules/          # Node dependencies
│   ├── build/                 # Production build
│   └── .env                   # Frontend config
├── go-backend/                 # Go backend
│   ├── bin/                   # Compiled binaries
│   │   ├── server            # API server
│   │   └── worker            # Background worker
│   ├── uploads/              # Uploaded files
│   ├── work/                 # Analysis workspace
│   ├── logs/                 # EMBA logs
│   ├── odin.db              # SQLite database
│   └── .env                  # Backend config
├── .gitignore                 # Git ignore rules
├── README.md                  # Main documentation
├── DEV_SETUP.md              # This file
├── install.sh                # Automated installer
├── run.sh                    # Start all services
├── stop.sh                   # Stop all services
└── status.sh                 # Check system status
```

## 🔄 Development Workflow

### Making Changes

#### Backend Development
```bash
cd go-backend

# Make changes to Go code
# Rebuild and restart
go build -o bin/server ./cmd/server
./bin/server
```

#### Frontend Development
```bash
cd frontend

# Make changes to React code
# Development server auto-reloads
npm start
```

### Testing Changes
```bash
# Run backend tests
cd go-backend
go test ./...

# Run frontend tests
cd frontend
npm test
```

## 🚀 Production Deployment

For production deployment, see the main README.md file for Docker and manual deployment instructions.

## 📚 Additional Resources

- [Go Documentation](https://golang.org/doc/)
- [React Documentation](https://reactjs.org/docs/)
- [EMBA Documentation](https://github.com/e-m-b-a/emba)
- [Material-UI Documentation](https://mui.com/)
- [Gin Web Framework](https://gin-gonic.com/)

## 🤝 Contributing

After setting up your development environment:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

For more details, see the Contributing section in README.md.
