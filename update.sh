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

# Proactively restart Nginx to flush DNS resolver cache for internal container IPs
echo -e "${YELLOW}⚡ Flushing Nginx DNS resolver cache...${NC}"
$DOCKER_COMPOSE restart nginx || echo -e "${RED}Warning: Failed to restart Nginx, continuing...${NC}"

# Step 3: Run migrations and sync schema
echo -e "${YELLOW}🗄️  Synchronizing database schema...${NC}"
$DOCKER_COMPOSE exec -T backend npx prisma migrate deploy || true
$DOCKER_COMPOSE exec -T backend npx prisma db push --accept-data-loss
$DOCKER_COMPOSE exec -T backend npx prisma db seed
echo -e "${GREEN}✅ Database synchronized and seeded successfully.${NC}"

# Detailed Update Success Information Display
show_update_success() {
    echo -e ""
    echo -e "${GREEN}================================================================${NC}"
    echo -e "   🚀  ${GREEN}YATO Platform Successfully Updated!${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo -e ""
    
    if command -v git >/dev/null 2>&1 && [ -d ".git" ]; then
        echo -e "📄 ${YELLOW}RECENT CHANGES:${NC}"
        git log -n 3 --pretty=format:"   • %h - %s (%cr)" | cat
        echo -e "\n"
    fi

    echo -e "💡 ${YELLOW}USEFUL COMMANDS:${NC}"
    echo -e "   • ${GREEN}View Logs:${NC}           $DOCKER_COMPOSE logs -f"
    echo -e "   • ${GREEN}Restart Services:${NC}    $DOCKER_COMPOSE restart"
    echo -e "${GREEN}================================================================${NC}"
    echo -e ""
}

show_update_success
