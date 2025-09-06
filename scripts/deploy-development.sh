#!/bin/bash

# ODIN Development Deployment Script
# This script configures the environment for local development

set -e

# Load configuration
if [ -f "config.env" ]; then
    source config.env
else
    echo "Error: config.env not found. Please create it from config.env.example"
    exit 1
fi

echo "🔧 Configuring ODIN for development..."
echo "Backend Port: $SERVER_PORT"
echo "Frontend Port: $FRONTEND_PORT"

# Update frontend .env for development
echo "📝 Updating frontend configuration..."
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:${SERVER_PORT}
REACT_APP_WS_URL=ws://localhost:${SERVER_PORT}/ws
EOF

# Update backend .env for development
echo "📝 Updating backend configuration..."
cat > go-backend/.env << EOF
SERVER_HOST=0.0.0.0
SERVER_PORT=${SERVER_PORT}
DATABASE_PATH=${DATABASE_PATH}
UPLOAD_DIR=${UPLOAD_DIR}
WORK_DIR=${WORK_DIR}
MAX_FILE_SIZE=${MAX_FILE_SIZE}
EMBA_PATH=${EMBA_PATH}
EMBA_LOG_DIR=${EMBA_LOG_DIR}
EMBA_PROFILES_DIR=${EMBA_PROFILES_DIR}
EOF

echo "✅ Development configuration complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./run.sh"
echo "2. Access frontend at: http://localhost:${FRONTEND_PORT}"
echo "3. Backend API at: http://localhost:${SERVER_PORT}/api"
