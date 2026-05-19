#!/bin/bash

# YATO Uninstaller Script
RED='\033[0-31m'
NC='\033[0m'
YELLOW='\033[1-33m'

# Check for Docker Compose (V2 plugin or V1 standalone)
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker-compose" # Fallback
fi

echo -e "${RED}⚠️  Uninstalling YATO...${NC}"

# Confirm before proceeding
read -p "Are you sure you want to remove all containers and data? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Uninstall cancelled."
    exit 1
fi

# Stop and remove containers
echo "🛑 Stopping services..."
$DOCKER_COMPOSE down

# Optional: Remove volumes
read -p "Do you want to remove database volumes as well? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🧹 Removing volumes..."
    $DOCKER_COMPOSE down -v
fi

# Optional: Remove images
read -p "Do you want to remove YATO images? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🗑️  Removing images..."
    $DOCKER_COMPOSE down --rmi all
fi

echo -e "${RED}✅ YATO has been uninstalled.${NC}"
