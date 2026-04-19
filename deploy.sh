#!/bin/bash

# Mahdara - Employee Payment Management Deployment Script
# This script handles deployment updates for production environment
# Prerequisites: Initial server configuration must be complete (nginx, systemd, postgresql)
#
# Usage:
#   ./deploy.sh  # Deploy the app

set -e  # Exit on any error

# Make script self-sufficient regardless of how it's invoked (SSH, cron, etc.)
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
# rbenv
if [ -d "$HOME/.rbenv" ]; then
  export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH"
  eval "$(rbenv init - bash)" 2>/dev/null || true
fi
# rvm
if [ -s "$HOME/.rvm/scripts/rvm" ]; then source "$HOME/.rvm/scripts/rvm"; fi
if [ -s "/etc/profile.d/rvm.sh" ]; then source "/etc/profile.d/rvm.sh"; fi
# asdf
if [ -s "$HOME/.asdf/asdf.sh" ]; then source "$HOME/.asdf/asdf.sh"; fi
# nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  nvm use default 2>/dev/null || nvm use --lts 2>/dev/null || true
fi

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
SERVICE_NAME="mahdara"
TOTAL_STEPS=6

# Load environment variables from .env file (needed for Rails commands)
if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  source "$BACKEND_DIR/.env"
  set +a
  echo -e "${GREEN}✓ Environment variables loaded from .env${NC}"
else
  echo -e "${YELLOW}⚠ Warning: .env file not found at $BACKEND_DIR/.env${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mahdara - إدارة مدفوعات الموظفين${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Setup SSH keys
echo -e "${YELLOW}[1/$TOTAL_STEPS] Setting up SSH keys...${NC}"
ssh-add -D
ssh-add ~/.ssh/id_rsa_all
echo -e "${GREEN}✓ SSH keys configured${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}[2/$TOTAL_STEPS] Pulling latest code from repository...${NC}"
cd "$PROJECT_DIR"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 3: Install backend dependencies
echo -e "${YELLOW}[3/$TOTAL_STEPS] Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
bundle install --deployment --without development test
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Step 4: Install and build frontend
echo -e "${YELLOW}[4/$TOTAL_STEPS] Installing frontend dependencies...${NC}"
cd "$CLIENT_DIR"
npm install --production=false
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}[5/$TOTAL_STEPS] Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 5: Run database migrations
echo -e "${YELLOW}[6/$TOTAL_STEPS] Running database migrations...${NC}"
cd "$BACKEND_DIR"
RAILS_ENV=production bundle exec rails db:migrate
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Step 6: Restart Rails server
echo -e "${YELLOW}[$TOTAL_STEPS/$TOTAL_STEPS] Restarting application server...${NC}"
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
echo ""
