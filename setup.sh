#!/bin/bash

# FiveM IP Finder - Modern Node.js Setup Script
# Run with: bash setup.sh

# Don't exit on errors - we'll handle them gracefully
set +e

echo "================================================"
echo "  FiveM IP Finder - Modern Setup"
echo "  Node.js + Express + PM2"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Install Node.js if not installed
echo -e "${YELLOW}[1/6] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed ($(node -v))${NC}"
fi

# Install PM2 globally
echo -e "${YELLOW}[2/6] Installing PM2 process manager...${NC}"
npm install -g pm2
echo -e "${GREEN}✓ PM2 installed${NC}"

# Create application directory
APP_DIR="/opt/fivem-ip-finder"
echo -e "${YELLOW}[3/6] Setting up application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Download files from GitHub
echo -e "${YELLOW}[4/6] Downloading application files...${NC}"

# Download server.js
wget -O server.js "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/server.js"

# Download package.json
wget -O package.json "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/package.json"

# Create public directory and download frontend files
mkdir -p public
wget -O public/index.html "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/index.html"
wget -O public/style.css "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/style.css"
wget -O public/script.js "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/public/script.js"

echo -e "${GREEN}✓ Files downloaded${NC}"

# Install dependencies
echo -e "${YELLOW}[5/6] Installing Node.js dependencies...${NC}"
npm install --production || npm install || echo -e "${RED}✗ Warning: npm install failed${NC}"
echo -e "${GREEN}✓ Dependencies installation attempted${NC}"

# Setup Nginx reverse proxy
echo -e "${YELLOW}[6/6] Setting up Nginx reverse proxy...${NC}"

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/fivem-ip-finder <<'EOF'
server {
    listen 80;
    listen [::]:80;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/fivem-ip-finder /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t || echo -e "${YELLOW}⚠ Nginx config warning (continuing anyway)${NC}"

# Start/Restart nginx (use restart instead of reload to handle inactive state)
systemctl restart nginx || systemctl start nginx || echo -e "${YELLOW}⚠ Nginx start warning (continuing anyway)${NC}"
systemctl enable nginx 2>/dev/null || true

echo -e "${GREEN}✓ Nginx configured and started${NC}"

# Stop any existing PM2 process
pm2 stop fivem-ip-finder 2>/dev/null || true
pm2 delete fivem-ip-finder 2>/dev/null || true

# Start application with PM2
echo ""
echo -e "${YELLOW}Starting application...${NC}"
cd $APP_DIR
pm2 start server.js --name fivem-ip-finder || echo -e "${YELLOW}⚠ PM2 start warning${NC}"
pm2 save || true
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "================================================"
echo -e "${GREEN}  ✓ Installation Complete!${NC}"
echo "================================================"
echo ""

# Check if PM2 process is running
if pm2 list | grep -q "fivem-ip-finder"; then
    echo -e "${GREEN}✓ Application is running!${NC}"
else
    echo -e "${YELLOW}⚠ Application might not be running. Check with: pm2 status${NC}"
fi

echo ""
echo "Access your site at:"
echo "  → http://$(hostname -I | awk '{print $1}')"
echo "  → http://5.175.246.136"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs fivem-ip-finder - View logs (check for errors)"
echo "  pm2 restart fivem-ip-finder - Restart application"
echo "  pm2 stop fivem-ip-finder - Stop application"
echo ""
echo "If there are issues, check logs with: pm2 logs fivem-ip-finder"
echo ""
echo "================================================"
