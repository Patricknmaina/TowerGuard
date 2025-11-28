# Towerguard start-up script

#!/bin/bash

set -euo pipefail

# colors & formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="${SCRIPT_DIR}"
readonly BACKEND_DIR="${PROJECT_ROOT}/backend"
readonly FRONTEND_DIR="${PROJECT_ROOT}/frontend"
readonly VENV_DIR="${PROJECT_ROOT}/venv"
readonly LOG_DIR="${PROJECT_ROOT}/logs"
readonly PID_FILE="${LOG_DIR}/towerguard.pid"

# default configuration
MODE="dev"
START_BACKEND=true
START_FRONTEND=true
RUN_SETUP=true
START_MONGODB=true
MONGODB_PORT="27017"
BACKEND_PORT="8000"
FRONTEND_PORT="5173"
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB="towerguard"

# utility functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*"
}

log_error() {
    echo -e "${RED}✗${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

log_section() {
    echo -e "\n${CYAN}▶ $*${NC}"
}

log_subsection() {
    echo -e "${CYAN}  └─ $*${NC}"
}

die() {
    log_error "$*"
    exit 1
}

print_help() {
    head -30 "$0" | tail -n +2 | sed 's/^# //'
}

# system checks
check_command() {
    local cmd="$1"
    local display_name="${2:-$cmd}"
    
    if ! command -v "$cmd" &> /dev/null; then
        die "$display_name is not installed or not in PATH"
    fi
    log_subsection "$display_name: $(command -v "$cmd")"
}

check_file() {
    local file="$1"
    local description="${2:-$file}"
    
    if [[ ! -f "$file" ]]; then
        die "$description not found at: $file"
    fi
}

check_directory() {
    local dir="$1"
    local description="${2:-$dir}"
    
    if [[ ! -d "$dir" ]]; then
        die "$description directory not found at: $dir"
    fi
}

check_python_version() {
    local python_exe="${1:-python3}"
    local version_string
    
    version_string=$("$python_exe" --version 2>&1 | awk '{print $2}')
    local major_version=$(echo "$version_string" | cut -d. -f1)
    local minor_version=$(echo "$version_string" | cut -d. -f2)
    
    if [[ $major_version -lt 3 ]] || ([[ $major_version -eq 3 ]] && [[ $minor_version -lt 11 ]]); then
        die "Python 3.11+ required, found $python_exe $version_string"
    fi
    
    log_subsection "Python: $python_exe ($version_string)"
}

check_node_version() {
    local node_version
    node_version=$(node --version | sed 's/v//')
    local major_version=$(echo "$node_version" | cut -d. -f1)
    
    if [[ $major_version -lt 18 ]]; then
        die "Node.js 18+ required, found $node_version"
    fi
    
    log_subsection "Node.js: $node_version"
}

perform_system_checks() {
    log_section "Performing System Checks"
    
    check_command "git" "Git"
    check_command "node" "Node.js"
    check_command "npm" "npm"
    check_command "python3" "Python"
    
    check_node_version
    check_python_version "python3"
    
    check_directory "$BACKEND_DIR" "Backend"
    check_directory "$FRONTEND_DIR" "Frontend"
    check_file "$BACKEND_DIR/requirements.txt" "Backend requirements.txt"
    check_file "$FRONTEND_DIR/package.json" "Frontend package.json"
    
    log_success "All system checks passed"
}

# MongoDB setup
check_mongodb_running() {
    if mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        return 0
    fi
    return 1
}

start_mongodb_local() {
    log_subsection "Starting local MongoDB..."
    
    if check_mongodb_running; then
        log_warning "MongoDB is already running"
        return 0
    fi
    
    if ! command -v mongod &> /dev/null; then
        log_error "MongoDB not installed locally. Attempting to start via Docker..."
        start_mongodb_docker
        return $?
    fi
    
    # Start MongoDB in the background
    mongod --dbpath "${BACKEND_DIR}/../mongodb_data" --logpath "${LOG_DIR}/mongodb.log" \
           --port "$MONGODB_PORT" --fork 2>/dev/null || {
        log_warning "Failed to start MongoDB with fork flag. Using background process..."
        mongod --dbpath "${BACKEND_DIR}/../mongodb_data" --logpath "${LOG_DIR}/mongodb.log" \
               --port "$MONGODB_PORT" > /dev/null 2>&1 &
    }
    
    # Wait for MongoDB to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if check_mongodb_running; then
            log_success "MongoDB started successfully"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    die "MongoDB failed to start after $max_attempts seconds"
}

start_mongodb_docker() {
    log_subsection "Starting MongoDB via Docker..."
    
    if ! command -v docker &> /dev/null; then
        die "Docker is not installed. Please install MongoDB or Docker."
    fi
    
    if docker ps | grep -q "towerguard-mongodb"; then
        log_warning "MongoDB container already running"
        return 0
    fi
    
    docker run -d \
        --name towerguard-mongodb \
        -p "$MONGODB_PORT:27017" \
        -v towerguard_mongodb_data:/data/db \
        mongo:6.0 > /dev/null 2>&1 || {
        die "Failed to start MongoDB Docker container"
    }
    
    # Wait for MongoDB to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker exec towerguard-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            log_success "MongoDB Docker container started successfully"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    die "MongoDB Docker container failed to start"
}

initialize_mongodb() {
    log_subsection "Initializing MongoDB database..."
    
    # Create directories if they don't exist
    mkdir -p "${LOG_DIR}" "${BACKEND_DIR}/../mongodb_data"
    
    # Check if MongoDB is running
    if ! check_mongodb_running; then
        log_warning "MongoDB is not running. Attempting to start..."
        start_mongodb_local || start_mongodb_docker
    fi
    
    log_success "MongoDB is ready"
}

# backend setup
setup_python_venv() {
    log_subsection "Activating Python virtual environment..."
    
    if [[ ! -d "$VENV_DIR" ]]; then
        die "Virtual environment not found at $VENV_DIR. Please create it first with: python3 -m venv backend/venv && source backend/venv/bin/activate && pip install -r backend/requirements.txt"
    fi
    
    log_subsection "Virtual environment found at $VENV_DIR"
    
    # Activate virtual environment
    # shellcheck source=/dev/null
    source "${VENV_DIR}/bin/activate"
    
    log_success "Python environment activated"
}

install_backend_dependencies() {
    log_subsection "Verifying backend dependencies..."
    
    if [[ ! -f "$BACKEND_DIR/requirements.txt" ]]; then
        die "requirements.txt not found in $BACKEND_DIR"
    fi
    
    # Activate virtual environment if not already active
    if [[ -z "${VIRTUAL_ENV:-}" ]]; then
        # shellcheck source=/dev/null
        source "${VENV_DIR}/bin/activate"
    fi
    
    # Verify pip can list packages (venv is working)
    if ! pip list > /dev/null 2>&1; then
        die "Python virtual environment is not functioning properly"
    fi
    
    log_subsection "Dependencies are already installed and verified"
    log_success "Backend dependencies verified"
}

create_backend_env_file() {
    log_subsection "Creating backend .env file..."
    
    local env_file="${BACKEND_DIR}/.env"
    
    if [[ -f "$env_file" ]]; then
        log_warning ".env file already exists"
        return 0
    fi
    
    cat > "$env_file" << EOF
# MongoDB Configuration
MONGODB_URI=$MONGODB_URI
MONGODB_DB=$MONGODB_DB

# Environment
ENVIRONMENT=$MODE
LOG_LEVEL=INFO

# API Configuration
API_PREFIX=/api

# CORS Settings
CORS_ORIGINS=["*"]

# Cache & Request Settings
CACHE_ENABLED=true
CACHE_TTL_HOURS=24
REQUEST_TIMEOUT_SECONDS=30
REQUEST_RETRY_ATTEMPTS=3

# External API Keys (Optional)
# NASA_POWER_API_KEY=
# EE_SERVICE_ACCOUNT_EMAIL=
# EE_SERVICE_ACCOUNT_JSON=backend/credentials/ee_service_account.json
EOF
    
    log_success ".env file created"
}

initialize_backend_database() {
    log_subsection "Initializing backend database..."
    
    # Activate the virtual environment first
    if [[ -z "${VIRTUAL_ENV:-}" ]]; then
        # shellcheck source=/dev/null
        source "${VENV_DIR}/bin/activate"
    fi
    
    # Use the venv python to run the script
    "${VENV_DIR}/bin/python3" << 'PYTHON_EOF'
import sys
import os

try:
    # Test MongoDB connection
    from pymongo import MongoClient
    
    client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    
    print("✓ Database connection verified")
    sys.exit(0)
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("  Ensure pymongo is installed in your virtual environment")
    sys.exit(1)
    
except Exception as e:
    print(f"✗ Database initialization error: {e}")
    sys.exit(1)
PYTHON_EOF
    
    if [[ $? -ne 0 ]]; then
        die "Database initialization failed"
    fi
    
    log_success "Backend database verified"
}

# frontend setup
create_frontend_env_file() {
    log_subsection "Creating frontend .env file..."
    
    local env_file="${FRONTEND_DIR}/.env.local"
    
    if [[ -f "$env_file" ]]; then
        log_warning ".env.local file already exists"
        return 0
    fi
    
    cat > "$env_file" << EOF
VITE_API_BASE_URL=http://localhost:${BACKEND_PORT}/api
EOF
    
    log_success ".env.local file created"
}

install_frontend_dependencies() {
    log_subsection "Installing frontend dependencies..."
    
    if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
        die "package.json not found in $FRONTEND_DIR"
    fi
    
    cd "$FRONTEND_DIR"
    npm install > /dev/null 2>&1
    cd "$PROJECT_ROOT"
    
    log_success "Frontend dependencies installed"
}

# server startup
start_backend_server() {
    log_subsection "Starting FastAPI backend server..."
    
    local reload_flag=""
    if [[ "$MODE" == "dev" ]]; then
        reload_flag="--reload"
    fi
    
    # Start backend with venv activation in the background
    (
        cd "$BACKEND_DIR"
        source "${VENV_DIR}/bin/activate"
        "${VENV_DIR}/bin/uvicorn" app.main:app \
            --host 0.0.0.0 \
            --port "$BACKEND_PORT" \
            --log-level info \
            $reload_flag
    ) &
    
    local backend_pid=$!
    echo $backend_pid > "${PID_FILE}.backend"
    
    # Wait for backend to start
    log_subsection "Waiting for backend to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:${BACKEND_PORT}/api/health" > /dev/null 2>&1; then
            log_success "Backend server started (PID: $backend_pid)"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_warning "Backend server started but health check failed (it may still be initializing)"
}

start_frontend_server() {
    log_subsection "Starting Vite frontend dev server..."
    
    # Fix vite permissions
    if [[ -f "$FRONTEND_DIR/node_modules/.bin/vite" ]]; then
        chmod +x "$FRONTEND_DIR/node_modules/.bin/vite"
    fi
    
    # Start frontend in the background
    (
        cd "$FRONTEND_DIR"
        npm run dev
    ) &
    
    local frontend_pid=$!
    echo $frontend_pid > "${PID_FILE}.frontend"
    
    # Wait for frontend to start
    log_subsection "Waiting for frontend to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
            log_success "Frontend server started (PID: $frontend_pid)"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_warning "Frontend server started but accessibility check failed (it may still be initializing)"
}

# cleanup and signal handling
cleanup() {
    log_section "Shutting down TowerGuard..."
    
    # Kill backend process
    if [[ -f "${PID_FILE}.backend" ]]; then
        local backend_pid
        backend_pid=$(cat "${PID_FILE}.backend")
        if kill -0 "$backend_pid" 2>/dev/null; then
            log_subsection "Stopping backend server (PID: $backend_pid)..."
            kill "$backend_pid" 2>/dev/null || true
            rm "${PID_FILE}.backend"
        fi
    fi
    
    # Kill frontend process
    if [[ -f "${PID_FILE}.frontend" ]]; then
        local frontend_pid
        frontend_pid=$(cat "${PID_FILE}.frontend")
        if kill -0 "$frontend_pid" 2>/dev/null; then
            log_subsection "Stopping frontend server (PID: $frontend_pid)..."
            kill "$frontend_pid" 2>/dev/null || true
            rm "${PID_FILE}.frontend"
        fi
    fi
    
    log_success "TowerGuard shut down gracefully"
}

trap cleanup EXIT INT TERM

# main implementation
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help)
                print_help
                exit 0
                ;;
            --dev)
                MODE="dev"
                shift
                ;;
            --prod)
                MODE="prod"
                shift
                ;;
            --backend-only)
                START_FRONTEND=false
                shift
                ;;
            --frontend-only)
                START_BACKEND=false
                shift
                ;;
            --setup-only)
                RUN_SETUP=true
                START_BACKEND=false
                START_FRONTEND=false
                shift
                ;;
            --skip-setup)
                RUN_SETUP=false
                shift
                ;;
            --mongodb-only)
                START_BACKEND=false
                START_FRONTEND=false
                shift
                ;;
            --no-mongodb)
                START_MONGODB=false
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done
}

display_banner() {
    cat << 'EOF'

  ████████╗ ██████╗ ██╗    ██╗███████╗██████╗  █████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
  ╚══██╔══╝██╔═══██╗██║    ██║██╔════╝██╔══██╗██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔══██╗
     ██║   ██║   ██║██║ █╗ ██║█████╗  ██████╔╝███████║██║   ██║███████║██████╔╝██║  ██║
     ██║   ██║   ██║██║███╗██║██╔══╝  ██╔══██╗██╔══██║██║   ██║██╔══██║██╔══██╗██║  ██║
     ██║   ╚██████╔╝╚███╝███╔╝███████╗██║  ██║██║  ██║╚██████╔╝██║  ██║██║  ██║██████╔╝
     ╚═╝    ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 

  Kenya Water Towers Environmental Monitoring Platform
  
EOF
}

display_startup_info() {
    log_section "Startup Configuration"
    log_subsection "Mode: $MODE"
    log_subsection "Backend: $([ $START_BACKEND = true ] && echo 'Enabled' || echo 'Disabled')"
    log_subsection "Frontend: $([ $START_FRONTEND = true ] && echo 'Enabled' || echo 'Disabled')"
    log_subsection "MongoDB: $([ $START_MONGODB = true ] && echo 'Enabled' || echo 'Disabled')"
    
    if [[ $START_BACKEND = true ]]; then
        log_subsection "Backend URL: http://localhost:${BACKEND_PORT}"
        log_subsection "API Docs: http://localhost:${BACKEND_PORT}/docs"
    fi
    
    if [[ $START_FRONTEND = true ]]; then
        log_subsection "Frontend URL: http://localhost:${FRONTEND_PORT}"
    fi
}

display_completion_info() {
    echo ""
    log_section "TowerGuard Started Successfully"
    
    if [[ $START_BACKEND = true ]]; then
        log_success "Backend API: http://localhost:${BACKEND_PORT}"
        log_success "Swagger Docs: http://localhost:${BACKEND_PORT}/docs"
        log_success "ReDoc Docs: http://localhost:${BACKEND_PORT}/redoc"
    fi
    
    if [[ $START_FRONTEND = true ]]; then
        log_success "Frontend: http://localhost:${FRONTEND_PORT}"
    fi
    
    echo ""
    log_section "Next Steps"
    log_subsection "1. Open http://localhost:${FRONTEND_PORT} in your browser"
    log_subsection "2. Use the dashboard to explore water towers"
    log_subsection "3. View API documentation at http://localhost:${BACKEND_PORT}/docs"
    log_subsection "4. Press Ctrl+C to stop all services"
    echo ""
}

main() {
    parse_arguments "$@"
    
    display_banner
    
    if [[ $RUN_SETUP = true ]]; then
        perform_system_checks
        
        if [[ $START_MONGODB = true ]]; then
            log_section "Setting Up MongoDB"
            initialize_mongodb
        fi
        
        log_section "Setting Up Backend"
        setup_python_venv
        install_backend_dependencies
        create_backend_env_file
        
        log_section "Setting Up Frontend"
        create_frontend_env_file
        install_frontend_dependencies
        
        # Initialize database only if backend is starting
        if [[ $START_BACKEND = true ]]; then
            initialize_backend_database
        fi
    else
        log_warning "Skipping setup phase"
    fi
    
    display_startup_info
    
    # Start servers
    if [[ $START_BACKEND = true ]] || [[ $START_FRONTEND = true ]]; then
        log_section "Starting Services"
        
        if [[ $START_BACKEND = true ]]; then
            start_backend_server
        fi
        
        if [[ $START_FRONTEND = true ]]; then
            start_frontend_server
        fi
        
        display_completion_info
        
        # Keep script running
        wait
    else
        log_success "Setup completed successfully"
    fi
}

# script entry point
main "$@"
