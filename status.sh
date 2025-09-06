#!/bin/bash

# ODIN Project - Service Status Check Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8080
FRONTEND_PORT=3000

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

# Check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is available
    fi
}

# Health check for services
health_check() {
    local service=$1
    local url=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Unhealthy${NC}"
    fi
}

echo "=========================================="
echo "        ODIN SERVICE STATUS CHECK"
echo "=========================================="
echo ""

# Application Services Status
echo -e "${CYAN}📱 Application Services:${NC}"
echo "----------------------------------------"

# Backend Status
echo -n "Backend API:        "
if is_service_running "$BACKEND_PID_FILE"; then
    echo -e "${GREEN}Running${NC} (PID: $(cat $BACKEND_PID_FILE))"
    echo -n "  Health Check:     "
    health_check "Backend" "http://localhost:$BACKEND_PORT/health"
    echo -n "  Port $BACKEND_PORT:        "
    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}Listening${NC}"
    else
        echo -e "${RED}Not Listening${NC}"
    fi
else
    echo -e "${RED}Stopped${NC}"
fi

# Frontend Status
echo -n "Frontend:           "
if is_service_running "$FRONTEND_PID_FILE"; then
    echo -e "${GREEN}Running${NC} (PID: $(cat $FRONTEND_PID_FILE))"
    echo -n "  Health Check:     "
    health_check "Frontend" "http://localhost:$FRONTEND_PORT"
    echo -n "  Port $FRONTEND_PORT:        "
    if check_port $FRONTEND_PORT; then
        echo -e "${GREEN}Listening${NC}"
    else
        echo -e "${RED}Not Listening${NC}"
    fi
else
    echo -e "${RED}Stopped${NC}"
fi

echo ""

# Database Status
echo -e "${CYAN}🗄️  Database:${NC}"
echo "----------------------------------------"

# SQLite Status
echo -n "SQLite Database:    "
if [[ -f "go-backend/odin.db" ]]; then
    echo -e "${GREEN}Available${NC}"
    # Check database size
    db_size=$(du -h "go-backend/odin.db" 2>/dev/null | cut -f1)
    echo "  Database Size:    ${BLUE}${db_size:-"Unknown"}${NC}"
else
    echo -e "${YELLOW}Not Created Yet${NC}"
    echo "  Status:           ${BLUE}Will be created on first backend start${NC}"
fi

echo ""

# Access Points
echo -e "${CYAN}🌐 Access Points:${NC}"
echo "----------------------------------------"
echo -e "Frontend Dashboard:  ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "Backend API:         ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "API Documentation:   ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "EMBA Demo:           ${BLUE}http://localhost:$FRONTEND_PORT/emba-demo${NC}"

echo ""

# Log Files
echo -e "${CYAN}📋 Log Files:${NC}"
echo "----------------------------------------"
if [[ -f "/tmp/odin_backend.log" ]]; then
    echo -e "Backend Logs:        ${BLUE}/tmp/odin_backend.log${NC}"
else
    echo -e "Backend Logs:        ${YELLOW}Not Available${NC}"
fi

if [[ -f "/tmp/odin_frontend.log" ]]; then
    echo -e "Frontend Logs:       ${BLUE}/tmp/odin_frontend.log${NC}"
else
    echo -e "Frontend Logs:       ${YELLOW}Not Available${NC}"
fi

echo ""

# Control Commands
echo -e "${CYAN}🎮 Control Commands:${NC}"
echo "----------------------------------------"
echo -e "Start Services:      ${BLUE}./run.sh${NC}"
echo -e "Stop Services:       ${BLUE}./stop.sh${NC}"
echo -e "View Backend Logs:   ${BLUE}tail -f /tmp/odin_backend.log${NC}"
echo -e "View Frontend Logs:  ${BLUE}tail -f /tmp/odin_frontend.log${NC}"

echo ""
