#!/bin/bash

# BestCar - Initial Server Setup Script
# This script performs the initial setup of the BestCar application on a production server
# Run this script ONCE during initial deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="bestcar"
INSTALL_DIR="/var/www/$PROJECT_NAME"
REPO_URL="git@github.com:Deyine/bestcar.git"
SERVICE_NAME="bestcar"
NGINX_DOMAIN="api.bestcar-mr.com"  # Backend API domain
FRONTEND_DOMAIN="bestcar-mr.com"    # Frontend domain

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  BestCar - Initial Server Setup${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Step 1: Check if running as root or with sudo
echo -e "${YELLOW}[1/10] Checking permissions...${NC}"
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}✗ Please run as root or with sudo${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Running with sufficient permissions${NC}"
echo ""

# Step 2: Check prerequisites
echo -e "${YELLOW}[2/10] Checking prerequisites...${NC}"
MISSING_DEPS=()

# Check for Git
if ! command -v git &> /dev/null; then
  MISSING_DEPS+=("git")
fi

# Check for Ruby/rbenv
if ! command -v rbenv &> /dev/null; then
  MISSING_DEPS+=("rbenv")
fi

# Check for Node/npm
if ! command -v node &> /dev/null; then
  MISSING_DEPS+=("node")
fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
  MISSING_DEPS+=("postgresql")
fi

# Check for Nginx
if ! command -v nginx &> /dev/null; then
  MISSING_DEPS+=("nginx")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
  echo -e "${RED}✗ Missing dependencies: ${MISSING_DEPS[*]}${NC}"
  echo "Please install the missing dependencies and run this script again."
  exit 1
fi

echo -e "${GREEN}✓ All prerequisites found${NC}"
echo ""

# Step 3: Clone repository
echo -e "${YELLOW}[3/10] Cloning repository...${NC}"
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}⚠ Directory $INSTALL_DIR already exists${NC}"
  read -p "Remove and re-clone? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
    echo -e "${GREEN}✓ Repository cloned${NC}"
  else
    echo -e "${YELLOW}⚠ Skipping clone, using existing directory${NC}"
  fi
else
  git clone "$REPO_URL" "$INSTALL_DIR"
  echo -e "${GREEN}✓ Repository cloned to $INSTALL_DIR${NC}"
fi
echo ""

# Step 4: Setup backend environment
echo -e "${YELLOW}[4/10] Setting up backend environment...${NC}"
cd "$INSTALL_DIR/backend"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  cat > .env <<EOF
RAILS_ENV=production
RAILS_LOG_TO_STDOUT=true
SECRET_KEY_BASE=$(openssl rand -hex 64)
DATABASE_URL=postgresql://bestcar:bestcar_password@localhost/bestcar_production
RAILS_SERVE_STATIC_FILES=true
RAILS_MAX_THREADS=5
WEB_CONCURRENCY=2
EOF
  echo -e "${GREEN}✓ .env file created${NC}"
  echo -e "${YELLOW}⚠ IMPORTANT: Edit $INSTALL_DIR/backend/.env and update database credentials${NC}"
else
  echo -e "${YELLOW}⚠ .env file already exists, skipping${NC}"
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend gems...${NC}"
bundle install --deployment --without development test
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Step 5: Setup database
echo -e "${YELLOW}[5/10] Setting up database...${NC}"
read -p "Create and setup database now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Create PostgreSQL user and database
  echo -e "${YELLOW}Creating PostgreSQL database and user...${NC}"
  sudo -u postgres psql -c "CREATE USER bestcar WITH PASSWORD 'bestcar_password';" || true
  sudo -u postgres psql -c "CREATE DATABASE bestcar_production OWNER bestcar;" || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bestcar_production TO bestcar;" || true

  # Run migrations
  RAILS_ENV=production bundle exec rails db:migrate

  # Run seeds (optional)
  read -p "Load seed data? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    RAILS_ENV=production bundle exec rails db:seed
    echo -e "${GREEN}✓ Seed data loaded${NC}"
  fi

  echo -e "${GREEN}✓ Database setup complete${NC}"
else
  echo -e "${YELLOW}⚠ Skipping database setup${NC}"
  echo -e "${YELLOW}  Run manually: RAILS_ENV=production bundle exec rails db:create db:migrate${NC}"
fi
echo ""

# Step 6: Setup frontend
echo -e "${YELLOW}[6/10] Setting up frontend...${NC}"
cd "$INSTALL_DIR/client"

# Create .env.production file
if [ ! -f .env.production ]; then
  echo -e "${YELLOW}Creating .env.production file...${NC}"
  cat > .env.production <<EOF
VITE_API_URL=https://$NGINX_DOMAIN/api
EOF
  echo -e "${GREEN}✓ .env.production file created${NC}"
else
  echo -e "${YELLOW}⚠ .env.production already exists, skipping${NC}"
fi

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install --production=false

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 7: Create systemd service
echo -e "${YELLOW}[7/10] Creating systemd service...${NC}"
cat > /etc/systemd/system/$SERVICE_NAME.service <<EOF
[Unit]
Description=BestCar Rails Application
After=network.target

[Service]
Type=notify
WatchdogSec=10

User=root
WorkingDirectory=$INSTALL_DIR/backend
EnvironmentFile=$INSTALL_DIR/backend/.env

ExecStart=/root/.rbenv/bin/rbenv exec bundle exec puma -C config/puma.rb
StandardOutput=append:$INSTALL_DIR/backend/log/puma.stdout.log
StandardError=append:$INSTALL_DIR/backend/log/puma.stderr.log

Restart=always

[Install]
WantedBy=multi-user.target
EOF

chmod 644 /etc/systemd/system/$SERVICE_NAME.service
echo -e "${GREEN}✓ Systemd service created at /etc/systemd/system/$SERVICE_NAME.service${NC}"
echo ""

# Step 8: Create nginx configuration
echo -e "${YELLOW}[8/10] Creating nginx configuration...${NC}"
cat > /etc/nginx/conf.d/$SERVICE_NAME.conf <<EOF
upstream bestcar {
  server 127.0.0.1:3000 fail_timeout=0;
}

# Backend API Server
server {
  listen 80;
  server_name $NGINX_DOMAIN;
  root $INSTALL_DIR/backend/public;

  try_files \$uri/index.html \$uri @bestcar;

  access_log /var/log/nginx/bestcar-api.access.log;
  error_log /var/log/nginx/bestcar-api.error.log;

  location @bestcar {
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header Host \$host;
    proxy_redirect off;
    proxy_set_header Connection '';
    proxy_pass http://bestcar;
  }

  location ~ ^/(assets|fonts|system|packs)/|favicon.ico|robots.txt {
    gzip_static on;
    expires max;
    add_header Cache-Control public;
  }

  error_page 500 502 503 504 /500.html;
  client_max_body_size 50M;
  keepalive_timeout 10;
}

# Frontend Server
server {
  listen 80;
  server_name $FRONTEND_DOMAIN;

  root $INSTALL_DIR/client/dist;

  location / {
    index index.html index.htm;
    try_files \$uri \$uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://$NGINX_DOMAIN/api/;
    proxy_redirect default;
  }

  # Compression
  gzip on;

  location ~* \.(?:css|js) {
    gzip_static on;
    expires max;
    add_header Cache-Control public;
  }

  location ~* \.(?:jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|woff|ttf|otf|woff2|eot)$ {
    gzip_static on;
    access_log off;
    expires max;
    add_header Cache-Control public;
  }

  error_page 500 502 503 504 /500.html;
  client_max_body_size 50M;
  keepalive_timeout 10;
}
EOF

chmod 644 /etc/nginx/conf.d/$SERVICE_NAME.conf
echo -e "${GREEN}✓ Nginx configuration created at /etc/nginx/conf.d/$SERVICE_NAME.conf${NC}"
echo ""

# Step 9: Enable and start services
echo -e "${YELLOW}[9/10] Enabling and starting services...${NC}"

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable $SERVICE_NAME

# Start service
systemctl start $SERVICE_NAME

# Check service status
if systemctl is-active --quiet $SERVICE_NAME; then
  echo -e "${GREEN}✓ BestCar service started successfully${NC}"
else
  echo -e "${RED}✗ BestCar service failed to start${NC}"
  echo -e "${YELLOW}Check logs: journalctl -u $SERVICE_NAME -n 50${NC}"
fi

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}✓ Services configured${NC}"
echo ""

# Step 10: Final instructions
echo -e "${YELLOW}[10/10] Setup complete!${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  BestCar Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Configure SSL certificates with certbot:"
echo "   ${BLUE}sudo certbot --nginx -d $NGINX_DOMAIN -d $FRONTEND_DOMAIN${NC}"
echo ""
echo "2. Update database credentials in:"
echo "   ${BLUE}$INSTALL_DIR/backend/.env${NC}"
echo ""
echo "3. Check service status:"
echo "   ${BLUE}sudo systemctl status $SERVICE_NAME${NC}"
echo ""
echo "4. View application logs:"
echo "   ${BLUE}sudo journalctl -u $SERVICE_NAME -f${NC}"
echo ""
echo "5. Check nginx status:"
echo "   ${BLUE}sudo systemctl status nginx${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  - Restart app: ${BLUE}sudo systemctl restart $SERVICE_NAME${NC}"
echo "  - Reload nginx: ${BLUE}sudo systemctl reload nginx${NC}"
echo "  - Deploy updates: ${BLUE}cd $INSTALL_DIR && ./deploy.sh${NC}"
echo ""
echo -e "${GREEN}Application URLs (after SSL setup):${NC}"
echo "  - API: ${BLUE}https://$NGINX_DOMAIN${NC}"
echo "  - Frontend: ${BLUE}https://$FRONTEND_DOMAIN${NC}"
echo ""
