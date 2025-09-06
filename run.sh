#!/bin/bash

# ODIN Project - Auto Run Script
# Automatically starts all ODIN services with health checks and monitoring

set -e  # Exit on any error

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
POSTGRES_PORT=5432
REDIS_PORT=6379
MAX_WAIT_TIME=60
HEALTH_CHECK_INTERVAL=5

# PID file locations
BACKEND_PID_FILE="/tmp/odin_backend.pid"
FRONTEND_PID_FILE="/tmp/odin_frontend.pid"

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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=${3:-$MAX_WAIT_TIME}
    
    log_info "Waiting for $service_name to be ready on port $port..."
    
    local count=0
    while [ $count -lt $max_wait ]; do
        if check_port $port; then
            sleep $HEALTH_CHECK_INTERVAL
            count=$((count + HEALTH_CHECK_INTERVAL))
        else
            log_success "$service_name is ready!"
            return 0
        fi
    done
    
    log_error "$service_name failed to start within $max_wait seconds"
    return 1
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

# Stop existing services
stop_services() {
    log_step "Stopping existing ODIN services..."
    
    # Stop backend
    if is_service_running "$BACKEND_PID_FILE"; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        log_info "Stopping backend (PID: $backend_pid)..."
        kill "$backend_pid" 2>/dev/null || true
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Stop frontend
    if is_service_running "$FRONTEND_PID_FILE"; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        log_info "Stopping frontend (PID: $frontend_pid)..."
        kill "$frontend_pid" 2>/dev/null || true
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Kill any remaining processes
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "./bin/server" 2>/dev/null || true
    pkill -f "go run.*server" 2>/dev/null || true
    
    sleep 2
    log_success "Existing services stopped"
}

# Start system services
start_system_services() {
    log_step "Starting system services..."
    
    # Start PostgreSQL
    if ! systemctl is-active --quiet postgresql; then
        log_info "Starting PostgreSQL..."
        sudo systemctl start postgresql
        if ! wait_for_service "PostgreSQL" $POSTGRES_PORT 30; then
            log_error "Failed to start PostgreSQL"
            exit 1
        fi
    else
        log_info "PostgreSQL is already running"
    fi
    
    # Start Redis
    if ! systemctl is-active --quiet redis-server; then
        log_info "Starting Redis..."
        sudo systemctl start redis-server
        if ! wait_for_service "Redis" $REDIS_PORT 30; then
            log_error "Failed to start Redis"
            exit 1
        fi
    else
        log_info "Redis is already running"
    fi
    
    log_success "System services are ready"
}

# Start Go backend
start_backend() {
    log_step "Starting Go backend..."
    
    cd go-backend
    
    # Check if binary exists
    if [[ ! -f "bin/server" ]]; then
        log_info "Backend binary not found, building..."
        make build
    fi
    
    # Check if port is available
    if ! check_port $BACKEND_PORT; then
        log_error "Port $BACKEND_PORT is already in use"
        exit 1
    fi
    
    # Start backend
    log_info "Starting backend server on port $BACKEND_PORT..."
    nohup ./bin/server > /tmp/odin_backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    # Wait for backend to be ready
    if wait_for_service "Backend API" $BACKEND_PORT; then
        log_success "Backend started successfully (PID: $backend_pid)"
        log_info "Backend logs: tail -f /tmp/odin_backend.log"
    else
        log_error "Backend failed to start"
        cat /tmp/odin_backend.log
        exit 1
    fi
    
    cd ..
}

# Start React frontend
start_frontend() {
    log_step "Starting React frontend..."
    
    cd frontend
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_info "Node modules not found, installing..."
        npm install
    fi
    
    # Check if port is available
    if ! check_port $FRONTEND_PORT; then
        log_error "Port $FRONTEND_PORT is already in use"
        exit 1
    fi
    
    # Start frontend
    log_info "Starting frontend development server on port $FRONTEND_PORT..."
    nohup npm start > /tmp/odin_frontend.log 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # Wait for frontend to be ready
    if wait_for_service "Frontend" $FRONTEND_PORT; then
        log_success "Frontend started successfully (PID: $frontend_pid)"
        log_info "Frontend logs: tail -f /tmp/odin_frontend.log"
    else
        log_error "Frontend failed to start"
        cat /tmp/odin_frontend.log
        exit 1
    fi
    
    cd ..
}

# Health check for all services
health_check() {
    log_step "Performing health checks..."
    
    local all_healthy=true
    
    # Check backend
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        log_success "✅ Backend API is healthy"
    else
        log_warning "⚠️  Backend API health check failed"
        all_healthy=false
    fi
    
    # Check frontend
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        log_success "✅ Frontend is healthy"
    else
        log_warning "⚠️  Frontend health check failed"
        all_healthy=false
    fi
    
    # Check PostgreSQL
    if pg_isready -p $POSTGRES_PORT > /dev/null 2>&1; then
        log_success "✅ PostgreSQL is healthy"
    else
        log_warning "⚠️  PostgreSQL health check failed"
        all_healthy=false
    fi
    
    # Check Redis
    if redis-cli -p $REDIS_PORT ping > /dev/null 2>&1; then
        log_success "✅ Redis is healthy"
    else
        log_warning "⚠️  Redis health check failed"
        all_healthy=false
    fi
    
    return $all_healthy
}

# Display service status
show_status() {
    echo ""
    echo "=========================================="
    echo "           ODIN SERVICE STATUS"
    echo "=========================================="
    echo ""
    
    # Service URLs
    echo -e "${GREEN}🌐 Access Points:${NC}"
    echo -e "   Frontend Dashboard: ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   Backend API:        ${CYAN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "   API Documentation:  ${CYAN}http://localhost:$BACKEND_PORT/docs${NC}"
    echo -e "   EMBA Demo:          ${CYAN}http://localhost:$FRONTEND_PORT/emba-demo${NC}"
    echo ""
    
    # Service PIDs
    echo -e "${GREEN}🔧 Running Services:${NC}"
    if is_service_running "$BACKEND_PID_FILE"; then
        echo -e "   Backend:  ${GREEN}Running${NC} (PID: $(cat $BACKEND_PID_FILE))"
    else
        echo -e "   Backend:  ${RED}Stopped${NC}"
    fi
    
    if is_service_running "$FRONTEND_PID_FILE"; then
        echo -e "   Frontend: ${GREEN}Running${NC} (PID: $(cat $FRONTEND_PID_FILE))"
    else
        echo -e "   Frontend: ${RED}Stopped${NC}"
    fi
    echo ""
    
    # Control commands
    echo -e "${GREEN}🎮 Control Commands:${NC}"
    echo -e "   Stop services:      ${CYAN}./stop.sh${NC}"
    echo -e "   View backend logs:  ${CYAN}tail -f /tmp/odin_backend.log${NC}"
    echo -e "   View frontend logs: ${CYAN}tail -f /tmp/odin_frontend.log${NC}"
    echo -e "   Service status:     ${CYAN}./status.sh${NC}"
    echo ""
}

# Cleanup on exit
cleanup() {
    if [[ "$1" == "SIGINT" ]] || [[ "$1" == "SIGTERM" ]]; then
        echo ""
        log_info "Received signal $1, cleaning up..."
        stop_services
        exit 0
    fi
}

# Set up signal handlers
trap 'cleanup SIGINT' SIGINT
trap 'cleanup SIGTERM' SIGTERM

# Main execution
main() {
    echo "=========================================="
    echo "      ODIN Project - Auto Run Script"
    echo "=========================================="
    echo ""
    
    # Check if we're in the right directory
    if [[ ! -f "go-backend/go.mod" ]] || [[ ! -f "frontend/package.json" ]]; then
        log_error "Please run this script from the ODIN project root directory"
        exit 1
    fi
    
    # Stop any existing services
    stop_services
    
    # Start system services
    start_system_services
    
    # Start application services
    start_backend
    start_frontend
    
    # Perform health checks
    sleep 5
    if health_check; then
        log_success "All services are healthy!"
    else
        log_warning "Some services may have issues, check logs for details"
    fi
    
    # Show status
    show_status
    
    log_success "ODIN platform is now running!"
    log_info "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 30
        if ! health_check; then
            log_warning "Health check failed, some services may need attention"
        fi
    done
}

# Run main function
main "$@"
