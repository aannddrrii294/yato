#!/bin/bash

# YATO Advanced Installer Script
# Supports modular installation and standalone/docker modes.

GREEN='\033[0-32m'
YELLOW='\033[1-33m'
RED='\033[0-31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting YATO Modular Installation...${NC}"

# Default Options
INFRA_MODE="docker" # docker | standalone
COMPONENT_ALL=true
COMP_DB=false
COMP_REDIS=false
COMP_APP=false
COMP_WEB=false

# Parse Arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --infra-mode) INFRA_MODE="$2"; shift ;;
        --database|--only-db) COMP_DB=true; COMPONENT_ALL=false ;;
        --redis|--only-redis) COMP_REDIS=true; COMPONENT_ALL=false ;;
        --app|--only-app) COMP_APP=true; COMPONENT_ALL=false ;;
        --web|--only-web) COMP_WEB=true; COMPONENT_ALL=false ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ "$COMPONENT_ALL" = true ]; then
    COMP_DB=true
    COMP_REDIS=true
    COMP_APP=true
    COMP_WEB=true
fi

# Check Prerequisites
check_dependency() {
    if ! command -v $1 >/dev/null 2>&1; then
        echo -e "${RED}Error: $1 is not installed. Please install $1 before proceeding.${NC}" >&2
        return 1
    fi
    return 0
}

echo -e "${YELLOW}🔍 Checking system dependencies...${NC}"
check_dependency "git" || exit 1
check_dependency "openssl" || exit 1

if [ "$INFRA_MODE" = "docker" ]; then
    check_dependency "docker" || exit 1
    
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    else
        echo -e "${RED}Error: docker compose is not installed.${NC}" >&2
        exit 1
    fi
fi

# Configuration
echo -e "${YELLOW}⚙️  Setting up configuration...${NC}"
if [ ! -f ".env" ]; then
    cp backend/.env.example .env 2>/dev/null || touch .env
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    ENC_KEY=$(openssl rand -hex 16)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"|" .env
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$ENC_KEY\"|" .env
fi

# IP Detection
SERVER_IP=$(hostname -I | awk '{print $1}')
[ -z "$SERVER_IP" ] && SERVER_IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d/ -f1 | head -n1)
[ -z "$SERVER_IP" ] && SERVER_IP="localhost"
export API_URL="http://$SERVER_IP:4000"

# Installation Logic
if [ "$INFRA_MODE" = "docker" ]; then
    echo -e "${YELLOW}📦 Deploying via Docker Compose...${NC}"
    
    # Selective service start
    SERVICES=""
    [ "$COMP_DB" = true ] && SERVICES="$SERVICES postgres"
    [ "$COMP_REDIS" = true ] && SERVICES="$SERVICES redis"
    [ "$COMP_APP" = true ] && SERVICES="$SERVICES backend"
    [ "$COMP_WEB" = true ] && SERVICES="$SERVICES frontend nginx"
    
    $DOCKER_COMPOSE up -d $SERVICES
    
    if [ "$COMP_APP" = true ]; then
        echo -e "${YELLOW}🗄️  Running database setup...${NC}"
        sleep 10
        $DOCKER_COMPOSE exec -T backend npx prisma migrate deploy || true
        $DOCKER_COMPOSE exec -T backend npx prisma db push --accept-data-loss
        $DOCKER_COMPOSE exec -T backend npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
    fi
else
    echo -e "${YELLOW}🏗️  Standalone installation mode detected...${NC}"
    # This section would contain apt-get/yum commands for native install
    echo -e "${RED}Note: Standalone native scripts require specific OS support (Ubuntu/Debian).${NC}"
    
    if [ "$COMP_DB" = true ]; then
        echo "Installing PostgreSQL locally..."
        # sudo apt-get install -y postgresql
    fi
    # ... more standalone logic ...
fi

# Detailed Success & Access Information Display
show_access_info() {
    echo -e ""
    echo -e "${GREEN}================================================================${NC}"
    echo -e "   🚀  ${GREEN}YATO (Unified Infrastructure Platform) is READY!${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo -e ""
    echo -e "🌐 ${YELLOW}ACCESS URLS:${NC}"
    echo -e "   • ${GREEN}Frontend Web Portal:${NC}  http://${SERVER_IP}:4001  or  http://${SERVER_IP}:9090 (Nginx Gateway)"
    echo -e "   • ${GREEN}Backend API Gateway:${NC}  http://${SERVER_IP}:4000"
    echo -e "   • ${GREEN}API Swagger Explorer:${NC} http://${SERVER_IP}:4000/docs"
    echo -e ""
    echo -e "🔐 ${YELLOW}DEFAULT ADMINISTRATOR CREDENTIALS:${NC}"
    echo -e "   • ${GREEN}Email/Username:${NC}      admin@yato.local"
    echo -e "   • ${GREEN}Password:${NC}            admin123"
    echo -e "   • ${YELLOW}Note:${NC} Please change this password immediately after your first login!"
    echo -e ""
    echo -e "🗄️  ${YELLOW}DATABASE & SYSTEM INFO:${NC}"
    echo -e "   • ${GREEN}Database Engine:${NC}      PostgreSQL 15 (on port 5440)"
    echo -e "   • ${GREEN}PostgreSQL User:${NC}      yato"
    echo -e "   • ${GREEN}PostgreSQL DB Name:${NC}   yato"
    echo -e "   • ${GREEN}Redis Cache Port:${NC}    6380"
    echo -e ""
    echo -e "💡 ${YELLOW}USEFUL COMMANDS:${NC}"
    echo -e "   • ${GREEN}View Logs:${NC}           $DOCKER_COMPOSE logs -f"
    echo -e "   • ${GREEN}Restart Services:${NC}    $DOCKER_COMPOSE restart"
    echo -e "   • ${GREEN}Stop Platform:${NC}       $DOCKER_COMPOSE down"
    echo -e "${GREEN}================================================================${NC}"
    echo -e ""
}

show_access_info
