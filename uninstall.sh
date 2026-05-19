#!/bin/bash

# YATO Ultra-Clean Uninstaller Script
# This script completely and cleanly removes all trace of YATO services, volumes, networks, and configuration files.

RED='\033[0-31m'
GREEN='\033[0-32m'
YELLOW='\033[1-33m'
BLUE='\033[0-34m'
NC='\033[0m'

echo -e "${RED}========================================= ${NC}"
echo -e "${RED}⚠️  YATO COMPLETE UNINSTALLATION SYSTEM  ${NC}"
echo -e "${RED}========================================= ${NC}"
echo -e "${YELLOW}This script will guide you through a deep and clean uninstallation of YATO.${NC}\n"

# Check for Docker Compose (V2 plugin or V1 standalone)
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo -e "${RED}Error: docker compose is not installed. Manual clean up might be required.${NC}"
  DOCKER_COMPOSE=""
fi

# Step 1: Core Confirmation
read -p "Are you sure you want to completely uninstall YATO? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Uninstall cancelled.${NC}"
    exit 0
fi

# Step 2: Stop and remove containers and networks
if [ -n "$DOCKER_COMPOSE" ]; then
    echo -e "\n${YELLOW}🛑 1. Stopping and removing YATO containers and networks...${NC}"
    $DOCKER_COMPOSE down --remove-orphans
    echo -e "${GREEN}✅ YATO services stopped and networks removed.${NC}"

    # Step 3: Optional Deep Database and Volume Removal
    echo -e "\n${YELLOW}🧹 2. Persistent Storage (Volumes) Clean Up...${NC}"
    read -p "Do you want to completely delete YATO database and cache volumes? (ALL DATA WILL BE LOST PERMANENTLY!) (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  Purging database persistent volumes...${NC}"
        $DOCKER_COMPOSE down -v --remove-orphans
        # Force remove local unnamed volumes if any remaining
        docker volume prune -f --filter "label=com.docker.compose.project=yato" >/dev/null 2>&1 || true
        echo -e "${GREEN}✅ Database and persistent volumes purged.${NC}"
    else
        echo -e "${BLUE}• Keeping database persistent volumes.${NC}"
    fi

    # Step 4: Optional Built Images Removal to reclaim disk space
    echo -e "\n${YELLOW}📦 3. Reclaiming Disk Space (Docker Images)...${NC}"
    read -p "Do you want to remove all YATO built Docker images? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  Removing frontend and backend built images...${NC}"
        $DOCKER_COMPOSE down --rmi all --remove-orphans
        echo -e "${GREEN}✅ Built images removed.${NC}"
    else
        echo -e "${BLUE}• Keeping Docker images.${NC}"
    fi
else
    echo -e "${YELLOW}• Docker Compose not found, skipping container removal.${NC}"
fi

# Step 5: Optional Configuration (.env) and local logs removal
echo -e "\n${YELLOW}⚙️  4. Configuration and Log Clean Up...${NC}"
read -p "Do you want to delete the local '.env' file and temporary logs? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}🗑️  Deleting configuration files and logs...${NC}"
    rm -f .env
    rm -f backend/.env
    rm -f backend_logs.txt
    rm -f docker_status.txt
    echo -e "${GREEN}✅ Configuration files and logs removed.${NC}"
else
    echo -e "${BLUE}• Keeping configuration files.${NC}"
fi

# Step 6: Docker System Prune suggestion (optional)
echo -e "\n${YELLOW}🧼 5. Final Docker Prune...${NC}"
read -p "Do you want to run a general Docker system prune to reclaim unused cache? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Pruning unused build cache and dangling networks...${NC}"
    docker system prune -f --volumes
    echo -e "${GREEN}✅ Docker system pruned.${NC}"
fi

echo -e "\n${GREEN}🎉 YATO has been completely and cleanly uninstalled!${NC}"
echo -e "Thank you for using YATO. Have a wonderful day!"
