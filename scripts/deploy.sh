#!/usr/bin/env bash
#
# deploy.sh - Deploy WSC Scholar Games frontend and backend to server
#
# Usage: ./scripts/deploy.sh [IP_ADDRESS]
#   IP_ADDRESS: Server IP (default: 88.80.188.224)
#
# Deploys to:
#   Frontend: ~/src/games/frontend
#   Backend:  ~/src/games/backend
#
# NOTE: Builds locally, uses rsync - NEVER builds on server
#

set -euo pipefail

# Configuration
DEFAULT_IP="20.63.27.56"
SERVER_IP="${1:-$DEFAULT_IP}"
SERVER_USER="azureuser"
REMOTE_BASE="src/games"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
RSYNC_OPTS="-avz --delete --progress"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory (works even when called from different location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we can connect to server
check_connection() {
    log_info "Checking connection to ${SERVER_USER}@${SERVER_IP}..."
    if ! ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_IP}" "echo 'Connected'" &>/dev/null; then
        log_error "Cannot connect to server. Check SSH access."
        exit 1
    fi
    log_success "Connection verified"
}

# Build frontend locally
build_frontend() {
    log_info "Building frontend locally..."
    cd "${PROJECT_ROOT}/frontend"

    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi

    # Build production bundle
    npm run build

    log_success "Frontend build complete"
}

# Deploy frontend via rsync
deploy_frontend() {
    log_info "Deploying frontend to ${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/frontend..."

    # Create remote directory
    ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_IP}" "mkdir -p ~/${REMOTE_BASE}/frontend"

    # Rsync the built frontend (including node_modules for production)
    rsync ${RSYNC_OPTS} \
        -e "ssh ${SSH_OPTS}" \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude '.env.local' \
        --exclude '.env.development' \
        "${PROJECT_ROOT}/frontend/.next" \
        "${PROJECT_ROOT}/frontend/public" \
        "${PROJECT_ROOT}/frontend/package.json" \
        "${PROJECT_ROOT}/frontend/next.config.ts" \
        "${PROJECT_ROOT}/frontend/node_modules" \
        "${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/frontend/"

    # Sync additional config files
    rsync ${RSYNC_OPTS} \
        -e "ssh ${SSH_OPTS}" \
        "${PROJECT_ROOT}/frontend/tsconfig.json" \
        "${PROJECT_ROOT}/frontend/tailwind.config.js" \
        "${PROJECT_ROOT}/frontend/postcss.config.js" \
        "${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/frontend/" 2>/dev/null || true

    # Create/update .env with correct server IP
    # Note: NEXT_PUBLIC_API_URL is client-side, so it needs the actual server IP, not localhost
    ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_IP}" bash -s "${SERVER_IP}" << 'REMOTE_SCRIPT'
SERVER_IP="$1"
FRONTEND_DIR="${HOME}/src/games/frontend"
echo "Creating/updating frontend .env..."
cat > "${FRONTEND_DIR}/.env" << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:8000/api
EOF
REMOTE_SCRIPT

    log_success "Frontend deployed"
}

# Deploy backend via rsync
deploy_backend() {
    log_info "Deploying backend to ${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/backend..."

    # Create remote directories
    ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_IP}" "mkdir -p ~/${REMOTE_BASE}/backend/src ~/${REMOTE_BASE}/backend/data"

    # Rsync backend source
    rsync ${RSYNC_OPTS} \
        -e "ssh ${SSH_OPTS}" \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.pytest_cache' \
        --exclude '.git' \
        "${PROJECT_ROOT}/src/games" \
        "${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/backend/src/"

    # Rsync project files
    rsync ${RSYNC_OPTS} \
        -e "ssh ${SSH_OPTS}" \
        "${PROJECT_ROOT}/pyproject.toml" \
        "${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/backend/"

    # Rsync config if exists
    if [ -d "${PROJECT_ROOT}/config" ]; then
        rsync ${RSYNC_OPTS} \
            -e "ssh ${SSH_OPTS}" \
            "${PROJECT_ROOT}/config" \
            "${SERVER_USER}@${SERVER_IP}:~/${REMOTE_BASE}/backend/"
    fi

    # Create .env if it doesn't exist and install dependencies
    ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_IP}" bash -s << 'REMOTE_SCRIPT'
BACKEND_DIR="${HOME}/src/games/backend"

# Create .env if needed
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo "Creating backend .env..."
    cat > "${BACKEND_DIR}/.env" << 'EOF'
DATABASE_URL=sqlite:///./data/games.db
JWT_SECRET=change-this-in-production
CORS_ORIGINS=http://localhost:3000
EOF
fi

# Install Python dependencies
cd "${BACKEND_DIR}"
if command -v uv &> /dev/null; then
    echo "Installing backend dependencies with uv..."
    uv sync --no-dev 2>/dev/null || uv pip install -e . 2>/dev/null || pip install -e .
elif command -v pip &> /dev/null; then
    echo "Installing backend dependencies with pip..."
    pip install -e .
fi
REMOTE_SCRIPT

    log_success "Backend deployed"
}

# Restart services on server
restart_services() {
    log_info "Restarting services..."

    ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_IP}" bash -s << 'REMOTE_SCRIPT'
set -euo pipefail

REMOTE_FRONTEND="${HOME}/src/games/frontend"
REMOTE_BACKEND="${HOME}/src/games/backend"

# Check if systemd services exist
if systemctl --user is-enabled games-backend &>/dev/null 2>&1; then
    echo "Restarting backend service (systemd)..."
    systemctl --user restart games-backend
fi

if systemctl --user is-enabled games-frontend &>/dev/null 2>&1; then
    echo "Restarting frontend service (systemd)..."
    systemctl --user restart games-frontend
else
    # If no systemd, try PM2
    if command -v pm2 &> /dev/null; then
        echo "Restarting with PM2..."

        # Frontend
        cd "${REMOTE_FRONTEND}"
        if pm2 describe games-frontend &>/dev/null 2>&1; then
            pm2 restart games-frontend
        else
            pm2 start npm --name "games-frontend" -- start
        fi

        # Backend
        cd "${REMOTE_BACKEND}"
        if pm2 describe games-backend &>/dev/null 2>&1; then
            pm2 restart games-backend
        else
            pm2 start "uv run python -m games.api" --name "games-backend" 2>/dev/null || \
            pm2 start "python -m games.api" --name "games-backend"
        fi

        pm2 save
    else
        echo ""
        echo "NOTICE: No service manager found. Start services manually:"
        echo "  Frontend: cd ${REMOTE_FRONTEND} && npm start"
        echo "  Backend:  cd ${REMOTE_BACKEND} && uv run python -m games.api"
        echo ""
    fi
fi

echo "Services restart complete"
REMOTE_SCRIPT

    log_success "Services restarted"
}

# Health check
health_check() {
    log_info "Running health checks..."

    # Wait for services to start
    sleep 3

    # Check frontend
    if curl -sf "http://${SERVER_IP}:3000" > /dev/null 2>&1; then
        log_success "Frontend is running on port 3000"
    else
        log_warn "Frontend health check failed (may still be starting)"
    fi

    # Check backend
    if curl -sf "http://${SERVER_IP}:8000/api/health" > /dev/null 2>&1; then
        log_success "Backend is running on port 8000"
    elif curl -sf "http://${SERVER_IP}:8000/health" > /dev/null 2>&1; then
        log_success "Backend is running on port 8000"
    else
        log_warn "Backend health check failed (may still be starting)"
    fi
}

# Print deployment info
print_summary() {
    echo ""
    echo "========================================"
    log_success "Deployment complete!"
    echo "========================================"
    echo ""
    echo "Server: ${SERVER_USER}@${SERVER_IP}"
    echo ""
    echo "Directories:"
    echo "  Frontend: ~/src/games/frontend"
    echo "  Backend:  ~/src/games/backend"
    echo ""
    echo "URLs:"
    echo "  Frontend: http://${SERVER_IP}:3000"
    echo "  Backend:  http://${SERVER_IP}:8000"
    echo "  API Docs: http://${SERVER_IP}:8000/docs"
    echo ""
    echo "Logs:"
    echo "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs'"
    echo "  ssh ${SERVER_USER}@${SERVER_IP} 'journalctl --user -u games-backend -f'"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  WSC Scholar Games - Deployment Script"
    echo "=========================================="
    echo ""
    echo "Target: ${SERVER_USER}@${SERVER_IP}"
    echo "Frontend: ~/src/games/frontend"
    echo "Backend:  ~/src/games/backend"
    echo ""

    check_connection
    build_frontend
    deploy_frontend
    deploy_backend
    restart_services
    health_check
    print_summary
}

# Handle arguments
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [IP_ADDRESS]"
        echo ""
        echo "Deploy WSC Scholar Games to a remote server."
        echo "Builds locally and uses rsync - NEVER builds on server."
        echo ""
        echo "Arguments:"
        echo "  IP_ADDRESS  Server IP address (default: ${DEFAULT_IP})"
        echo ""
        echo "Deployment paths on server:"
        echo "  Frontend: ~/src/games/frontend"
        echo "  Backend:  ~/src/games/backend"
        echo ""
        echo "Example:"
        echo "  $0                    # Deploy to default server (${DEFAULT_IP})"
        echo "  $0 192.168.1.100      # Deploy to specific IP"
        exit 0
        ;;
    *)
        main
        ;;
esac
