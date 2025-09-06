#!/bin/bash

# ODIN Project - All-in-One Installation Script
# This script installs and configures everything needed for the ODIN firmware analysis platform
# Supports Ubuntu/Debian systems

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root. Please run as a regular user."
        log_info "The script will use sudo when needed."
        exit 1
    fi
}

# Check OS compatibility
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine OS. This script supports Ubuntu/Debian systems."
        exit 1
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        log_warning "This script is designed for Ubuntu/Debian. Your OS: $ID"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "OS compatibility check passed: $PRETTY_NAME"
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    log_success "System packages updated"
}

# Install system dependencies
install_system_deps() {
    log_info "Installing system dependencies..."
    
    # Essential build tools and libraries
    sudo apt install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        unzip \
        zip \
        tree \
        htop \
        vim \
        nano \
        jq \
        python3 \
        python3-pip \
        python3-venv \
        sqlite3 \
        postgresql-client \
        redis-tools
    
    log_success "System dependencies installed"
}

# Install Docker
install_docker() {
    log_info "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        log_warning "Docker already installed, skipping..."
        return
    fi
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    log_success "Docker installed successfully"
    log_warning "Please log out and back in for Docker group changes to take effect"
}

# Install Node.js and npm
install_nodejs() {
    log_info "Installing Node.js and npm..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_warning "Node.js already installed: $NODE_VERSION"
        if [[ "$NODE_VERSION" < "v18" ]]; then
            log_info "Upgrading Node.js to latest LTS..."
        else
            log_info "Node.js version is sufficient, skipping..."
            return
        fi
    fi
    
    # Install Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_success "Node.js installed: $NODE_VERSION"
    log_success "npm installed: $NPM_VERSION"
}

# Install Go
install_go() {
    log_info "Installing Go..."
    
    if command -v go &> /dev/null; then
        GO_VERSION=$(go version | awk '{print $3}')
        log_warning "Go already installed: $GO_VERSION"
        if [[ "$GO_VERSION" < "go1.21" ]]; then
            log_info "Upgrading Go to latest version..."
        else
            log_info "Go version is sufficient, skipping..."
            return
        fi
    fi
    
    # Download and install Go 1.21
    GO_VERSION="1.21.5"
    wget -q https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz
    
    # Remove old Go installation if exists
    sudo rm -rf /usr/local/go
    
    # Extract new Go
    sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
    rm go${GO_VERSION}.linux-amd64.tar.gz
    
    # Add Go to PATH if not already there
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export GOPATH=$HOME/go' >> ~/.bashrc
        echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
    fi
    
    # Source bashrc for current session
    export PATH=$PATH:/usr/local/go/bin
    export GOPATH=$HOME/go
    export PATH=$PATH:$GOPATH/bin
    
    # Verify installation
    GO_VERSION_INSTALLED=$(/usr/local/go/bin/go version | awk '{print $3}')
    log_success "Go installed: $GO_VERSION_INSTALLED"
}

# Install minimal EMBA dependencies (EMBA installer will handle the rest)
install_emba_deps() {
    log_info "Installing minimal EMBA dependencies..."
    
    # Only install essential system dependencies that EMBA installer requires
    sudo apt install -y \
        docker.io \
        docker-compose \
        python3 \
        python3-pip \
        git \
        curl \
        wget
    
    log_success "Minimal EMBA dependencies installed"
    log_info "EMBA installer will handle additional dependencies automatically"
}

# Setup EMBA
setup_emba() {
    log_info "Setting up EMBA..."
    
    cd "$(dirname "$0")"
    
    if [[ ! -d "emba" ]]; then
        log_error "EMBA directory not found. Please ensure you're running this script from the ODIN project root."
        exit 1
    fi
    
    cd emba
    
    # Make EMBA executable
    chmod +x emba
    
    # Check if installer exists and run it with Docker mode
    if [[ -f "installer.sh" ]]; then
        log_info "Running EMBA installer with Docker mode (-d flag)..."
        log_warning "This will download ~6GB Docker image and requires ~14GB disk space"
        sudo ./installer.sh -d
    else
        log_error "EMBA installer.sh not found in ./emba/ directory"
        log_info "Please ensure EMBA is properly cloned with: git clone https://github.com/e-m-b-a/emba.git"
        exit 1
    fi
    
    # Create EMBA logs directory
    sudo mkdir -p /tmp/emba_logs
    sudo chmod 777 /tmp/emba_logs
    
    cd ..
    log_success "EMBA setup completed with Docker environment"
}

# Setup Go backend
setup_go_backend() {
    log_info "Setting up Go backend..."
    
    cd go-backend
    
    # Download Go dependencies
    go mod download
    go mod tidy
    
    # Build the applications
    log_info "Building Go applications..."
    make build
    
    # Copy environment file
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        log_info "Created .env file from template"
        log_warning "Please review and update .env file with your configuration"
    fi
    
    cd ..
    log_success "Go backend setup completed"
}

# Setup React frontend
setup_frontend() {
    log_info "Setting up React frontend..."
    
    cd frontend
    
    # Install npm dependencies
    log_info "Installing npm packages..."
    npm install
    
    # Copy environment file
    if [[ ! -f ".env" ]]; then
        echo "REACT_APP_API_URL=http://localhost:8080" > .env
        log_info "Created frontend .env file"
    fi
    
    cd ..
    log_success "React frontend setup completed"
}

# Setup databases
setup_databases() {
    log_info "Setting up databases..."
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Start and enable Redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    # Create PostgreSQL database and user for ODIN
    sudo -u postgres psql -c "CREATE DATABASE odin;" 2>/dev/null || log_warning "Database 'odin' may already exist"
    sudo -u postgres psql -c "CREATE USER odin WITH PASSWORD 'odin123';" 2>/dev/null || log_warning "User 'odin' may already exist"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE odin TO odin;" 2>/dev/null || true
    
    log_success "Databases setup completed"
}

# Create startup scripts
create_startup_scripts() {
    log_info "Creating startup scripts..."
    
    # Create start-all script
    cat > start-all.sh << 'EOF'
#!/bin/bash

# ODIN Project - Start All Services

echo "Starting ODIN services..."

# Start databases
sudo systemctl start postgresql redis-server

# Start Go backend
cd go-backend
echo "Starting Go backend..."
./bin/server &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start React frontend
cd ../frontend
echo "Starting React frontend..."
npm start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "ODIN services started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo ""
echo "To stop services:"
echo "kill $BACKEND_PID $FRONTEND_PID"

cd ..
EOF

    # Create stop-all script
    cat > stop-all.sh << 'EOF'
#!/bin/bash

# ODIN Project - Stop All Services

echo "Stopping ODIN services..."

# Stop Node.js processes (React frontend)
pkill -f "react-scripts start" || true
pkill -f "npm start" || true

# Stop Go backend
pkill -f "./bin/server" || true
pkill -f "go run" || true

echo "ODIN services stopped."
EOF

    # Make scripts executable
    chmod +x start-all.sh stop-all.sh
    
    log_success "Startup scripts created"
}

# Create development environment info
create_dev_info() {
    log_info "Creating development environment information..."
    
    cat > DEV_SETUP.md << 'EOF'
# ODIN Development Environment

## Services Overview

### Frontend (React + TypeScript)
- **URL:** http://localhost:3000
- **Location:** `./frontend/`
- **Start:** `cd frontend && npm start`
- **Build:** `cd frontend && npm run build`

### Backend (Go)
- **URL:** http://localhost:8080
- **Location:** `./go-backend/`
- **Start:** `cd go-backend && ./bin/server`
- **Build:** `cd go-backend && make build`

### EMBA (Firmware Analyzer)
- **Location:** `./emba/`
- **Usage:** `sudo ./emba/emba -l /tmp/emba_logs -f /path/to/firmware`

### Databases
- **PostgreSQL:** localhost:5432 (database: odin, user: odin, password: odin123)
- **Redis:** localhost:6379

## Quick Start Commands

```bash
# Start all services
./start-all.sh

# Stop all services
./stop-all.sh

# Manual start (development)
cd go-backend && ./bin/server &
cd frontend && npm start &

# Run EMBA analysis
sudo ./emba/emba -l /tmp/emba_logs -f /path/to/firmware.bin -p ./emba/scan-profiles/default-scan.emba
```

## Environment Files

- `./go-backend/.env` - Backend configuration
- `./frontend/.env` - Frontend configuration

## Development Workflow

1. **Backend Development:**
   ```bash
   cd go-backend
   go run cmd/server/main.go  # Development mode
   make build                 # Production build
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm start                  # Development server
   npm run build             # Production build
   ```

3. **EMBA Integration:**
   - Upload firmware via frontend
   - Backend triggers EMBA analysis
   - Results displayed in comprehensive visualization

## Troubleshooting

- **Port conflicts:** Check if ports 3000, 8080 are available
- **Database issues:** Ensure PostgreSQL and Redis are running
- **EMBA permissions:** EMBA requires sudo for some operations
- **Go modules:** Run `go mod tidy` if dependency issues occur
- **Node modules:** Delete `node_modules` and run `npm install` if issues occur

## Project Structure

```
odin/
├── emba/                 # EMBA firmware analyzer
├── frontend/             # React TypeScript frontend
├── go-backend/           # Go backend API
├── install.sh           # This installation script
├── start-all.sh         # Start all services
├── stop-all.sh          # Stop all services
└── DEV_SETUP.md         # This file
```
EOF

    log_success "Development environment documentation created"
}

# Main installation function
main() {
    echo "=========================================="
    echo "  ODIN Project - All-in-One Installer"
    echo "=========================================="
    echo ""
    
    log_info "Starting ODIN installation..."
    
    # Pre-installation checks
    check_root
    check_os
    
    # System setup
    update_system
    install_system_deps
    install_docker
    
    # Development tools
    install_nodejs
    install_go
    
    # EMBA setup (minimal deps + official installer)
    install_emba_deps
    setup_emba
    
    # Project setup
    setup_go_backend
    setup_frontend
    setup_databases
    
    # Create helper scripts
    create_startup_scripts
    create_dev_info
    
    echo ""
    echo "=========================================="
    log_success "ODIN installation completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Log out and back in (for Docker group changes)"
    echo "2. Review and update configuration files:"
    echo "   - ./go-backend/.env"
    echo "   - ./frontend/.env"
    echo "3. Start the services:"
    echo "   ./start-all.sh"
    echo ""
    echo "Access points:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend API: http://localhost:8080"
    echo ""
    echo "Documentation: ./DEV_SETUP.md"
    echo ""
    log_warning "Please reboot your system or log out/in for all changes to take effect."
}

# Run main function
main "$@"
