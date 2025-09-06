#!/bin/bash

# ODIN Project - Stop All Services Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID file locations
BACKEND_PID_FILE="/tmp/odin_backend.pid"
FRONTEND_PID_FILE="/tmp/odin_frontend.pid"

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

# Check if service is running
is_service_running() {
    local pid_file=$1
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Service is running
        else
            rm -f "$pid_file"  # Clean up stale PID file
            return 1  # Service is not running
        fi
    else
        return 1  # PID file doesn't exist
    fi
}

echo "=========================================="
echo "    ODIN Project - Stop All Services"
echo "=========================================="
echo ""

log_info "Stopping ODIN services..."

# Stop backend
if is_service_running "$BACKEND_PID_FILE"; then
    local backend_pid=$(cat "$BACKEND_PID_FILE")
    log_info "Stopping backend (PID: $backend_pid)..."
    kill "$backend_pid" 2>/dev/null || true
    rm -f "$BACKEND_PID_FILE"
    log_success "Backend stopped"
else
    log_info "Backend is not running"
fi

# Stop frontend
if is_service_running "$FRONTEND_PID_FILE"; then
    local frontend_pid=$(cat "$FRONTEND_PID_FILE")
    log_info "Stopping frontend (PID: $frontend_pid)..."
    kill "$frontend_pid" 2>/dev/null || true
    rm -f "$FRONTEND_PID_FILE"
    log_success "Frontend stopped"
else
    log_info "Frontend is not running"
fi

# Kill any remaining processes
log_info "Cleaning up remaining processes..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "./build/server" 2>/dev/null || true
pkill -f "go run.*server" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Clean up log files
rm -f /tmp/odin_backend.log /tmp/odin_frontend.log

log_success "All ODIN services stopped successfully!"
echo ""
