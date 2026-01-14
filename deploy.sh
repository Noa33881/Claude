#!/bin/bash

# FiveM IP Finder - Otomatik Kurulum Scripti
# Sunucunuzda root olarak çalıştırın: bash deploy.sh

set -e

echo "================================================"
echo "  FiveM IP Finder - Otomatik Kurulum"
echo "================================================"
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Nginx kontrol ve kurulum
echo -e "${YELLOW}[1/6] Web sunucu kontrol ediliyor...${NC}"
if ! command -v nginx &> /dev/null; then
    echo "Nginx bulunamadı. Kuruluyor..."
    apt-get update
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓ Nginx kuruldu${NC}"
else
    echo -e "${GREEN}✓ Nginx zaten kurulu${NC}"
fi

# Gerekli araçları kur
echo -e "${YELLOW}[2/6] Gerekli araçlar kuruluyor...${NC}"
apt-get install -y wget unzip
echo -e "${GREEN}✓ Araçlar kuruldu${NC}"

# Web dizinini hazırla
WEB_DIR="/var/www/fivem-ip-finder"
echo -e "${YELLOW}[3/6] Web dizini hazırlanıyor...${NC}"
mkdir -p $WEB_DIR
echo -e "${GREEN}✓ Dizin oluşturuldu: $WEB_DIR${NC}"

# GitHub'dan dosyaları indir
echo -e "${YELLOW}[4/6] Dosyalar GitHub'dan indiriliyor...${NC}"
cd $WEB_DIR

# index.html
wget -O index.html "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/index.html"

# style.css
wget -O style.css "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/style.css"

# script.js
wget -O script.js "https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/script.js"

echo -e "${GREEN}✓ Dosyalar indirildi${NC}"

# İzinleri ayarla
echo -e "${YELLOW}[5/6] İzinler ayarlanıyor...${NC}"
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR
echo -e "${GREEN}✓ İzinler ayarlandı${NC}"

# Nginx konfigürasyonu
echo -e "${YELLOW}[6/6] Nginx yapılandırması oluşturuluyor...${NC}"
cat > /etc/nginx/sites-available/fivem-ip-finder <<'EOF'
server {
    listen 80;
    listen [::]:80;

    server_name _;

    root /var/www/fivem-ip-finder;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static files
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Site'ı aktif et
ln -sf /etc/nginx/sites-available/fivem-ip-finder /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx'i test et ve yeniden yükle
nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ Nginx yapılandırması tamamlandı${NC}"

# Sunucu IP'sini al
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "================================================"
echo -e "${GREEN}  ✓ Kurulum Başarıyla Tamamlandı!${NC}"
echo "================================================"
echo ""
echo "Web siteniz şu adreslerde yayında:"
echo ""
echo "  → http://$SERVER_IP"
echo "  → http://5.175.246.136"
echo ""
echo "Dosyalar: $WEB_DIR"
echo ""
echo "================================================"
