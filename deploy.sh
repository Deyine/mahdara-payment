#!/bin/bash

# Bestcar Dealership Management Deployment Script
# This script handles deployment updates for production environment
# Prerequisites: Initial server configuration must be complete (nginx, systemd, postgresql)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
CLIENT_DIR="$PROJECT_DIR/client"
SERVICE_NAME="bestcar"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Bestcar Dealership Management Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Setup SSH keys
echo -e "${YELLOW}[1/7] Setting up SSH keys...${NC}"
ssh-add -D
ssh-add ~/.ssh/id_rsa_all
echo -e "${GREEN}✓ SSH keys configured${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}[2/7] Pulling latest code from repository...${NC}"
cd "$PROJECT_DIR"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 3: Install backend dependencies
echo -e "${YELLOW}[3/7] Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
bundle install --deployment --without development test
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Step 4: Install frontend dependencies
echo -e "${YELLOW}[4/7] Installing frontend dependencies...${NC}"
cd "$CLIENT_DIR"
npm install --production=false
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Step 5: Build frontend
echo -e "${YELLOW}[5/7] Building frontend...${NC}"
cd "$CLIENT_DIR"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 6: Run database migrations
echo -e "${YELLOW}[6/7] Running database migrations...${NC}"
cd "$BACKEND_DIR"
RAILS_ENV=production bundle exec rails db:migrate
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Step 7: Restart Rails server
echo -e "${YELLOW}[7/7] Restarting application server...${NC}"
if systemctl is-active --quiet "$SERVICE_NAME"; then
    sudo systemctl restart "$SERVICE_NAME"
    echo -e "${GREEN}✓ Service restarted: $SERVICE_NAME${NC}"
else
    echo -e "${RED}⚠ Warning: Service $SERVICE_NAME is not running${NC}"
    echo -e "${YELLOW}Starting service...${NC}"
    sudo systemctl start "$SERVICE_NAME"
    echo -e "${GREEN}✓ Service started: $SERVICE_NAME${NC}"
fi

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✓ Service is running${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo -e "${YELLOW}Checking service logs:${NC}"
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Deployed at: $(date)"
echo "Git commit: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  - Check service status: sudo systemctl status $SERVICE_NAME"
echo "  - View logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  - Check nginx: sudo systemctl status nginx"
