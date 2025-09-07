#!/bin/bash

# ODIN Production Deployment Script
# This script configures the environment for production deployment

set -e

# Load configuration
if [ -f "../config.env" ]; then
    source ../config.env
else
    echo "Error: config.env not found. Please create it from config.env.example"
    exit 1
fi

# Validate required variables
if [ -z "$VPS_IP" ]; then
    echo "Error: VPS_IP not set in config.env"
    exit 1
fi

echo "🚀 Configuring ODIN for production deployment..."
echo "VPS IP: $VPS_IP"
echo "Backend Port: $SERVER_PORT"
echo "Frontend Port: $FRONTEND_PORT"

# Update frontend .env for production
echo "📝 Updating frontend configuration..."
cat > ../frontend/.env << EOF
REACT_APP_API_URL=http://${VPS_IP}:${SERVER_PORT}
REACT_APP_WS_URL=ws://${VPS_IP}:${SERVER_PORT}/ws
EOF

# Update backend .env for production
echo "📝 Updating backend configuration..."
cat > ../go-backend/.env << EOF
# Database Configuration (SQLite)
DATABASE_PATH=${DATABASE_PATH}

# Server Configuration
SERVER_PORT=${SERVER_PORT}
SERVER_HOST=${SERVER_HOST}

# File Upload Configuration
UPLOAD_DIR=${UPLOAD_DIR}
WORK_DIR=${WORK_DIR}
MAX_FILE_SIZE=${MAX_FILE_SIZE}

# EMBA Configuration
EMBA_PATH=${EMBA_PATH}
EMBA_LOG_DIR=${EMBA_LOG_DIR}
EMBA_ENABLE_EMULATION=false
EMBA_ENABLE_CWE_CHECK=false
EMBA_ENABLE_LIVE_TESTING=false
EMBA_SCAN_PROFILE=default-scan.emba
EMBA_THREADS=2

# Supported file extensions
SUPPORTED_EXTENSIONS=.bin,.img,.hex,.rom,.fw

# External APIs (Optional)
SHODAN_API_KEY=
VIRUSTOTAL_API_KEY=
EOF

echo "✅ Production configuration complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./run.sh"
echo "2. Access frontend at: http://${VPS_IP}:${FRONTEND_PORT}"
echo "3. Backend API at: http://${VPS_IP}:${SERVER_PORT}/api"
