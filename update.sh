#!/bin/bash

# YATO Update Script
set -e

GREEN='\033[0-32m'
YELLOW='\033[1-33m'
NC='\033[0m'
RED='\033[0-31m'

# Check Prerequisites
check_dependency() {
    if ! command -v $1 >/dev/null 2>&1; then
        echo -e "${RED}Error: $1 is not installed.${NC}" >&2
        return 1
    fi
    return 0
}

echo -e "${YELLOW}🔍 Validating environment...${NC}"
check_dependency "git" || exit 1
check_dependency "docker" || exit 1

# Check for Docker Compose (V2 plugin or V1 standalone)
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo -e "${RED}Error: docker compose is not installed.${NC}" >&2
  exit 1
fi

echo -e "${GREEN}🔄 Updating YATO...${NC}"

# Step 1: Pull changes (if using Git)
if [ -d ".git" ]; then
  echo -e "${YELLOW}📥 Pulling latest changes from repository...${NC}"
  git pull || echo -e "${RED}Warning: git pull failed, continuing...${NC}"
else
  echo "   • Not a git repository, skipping pull."
fi

# Step 1.5: Inject Copyright Headers
if command -v node &> /dev/null; then
  echo -e "${YELLOW}⚖️  Injecting Apache 2.0 Copyright Headers...${NC}"
  node add-copyright-header.js || echo -e "${RED}Warning: copyright injection script failed, continuing...${NC}"
else
  echo "   • Node.js not available on host, skipping automated copyright injection."
fi


# Get Server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
  SERVER_IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d/ -f1 | head -n1)
fi
if [ -z "$SERVER_IP" ]; then
  SERVER_IP="localhost"
fi
export API_URL="http://$SERVER_IP:4000"

# Step 2: Rebuild and Restart
echo -e "${YELLOW}📦 Rebuilding and restarting containers...${NC}"
$DOCKER_COMPOSE up -d --build

# Step 3: Run migrations and sync schema
echo -e "${YELLOW}🗄️  Synchronizing database schema...${NC}"
$DOCKER_COMPOSE exec -T backend npx prisma migrate deploy || true
$DOCKER_COMPOSE exec -T backend npx prisma db push --accept-data-loss
$DOCKER_COMPOSE exec -T backend npx prisma db seed
echo -e "${GREEN}✅ Database synchronized and seeded successfully.${NC}"

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

