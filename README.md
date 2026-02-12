# FiveM IP Finder

Modern Node.js backend ile CFX.re sunucu URL'lerinden IP adreslerini bulan web uygulaması.

## 🚀 Özellikler

- 🔍 CFX.re URL'lerinden IP adresi bulma
- 📋 Tek tıkla kopyalama
- 🎮 Sunucu bilgilerini görüntüleme (oyuncu sayısı, port, vb.)
- 📱 Responsive tasarım
- ⚡ Hızlı ve güvenilir
- 🛡️ CORS sorunları çözüldü
- 🔄 Production-ready PM2 ile süreç yönetimi

## 🛠️ Teknolojiler

### Backend
- Node.js v20+
- Express.js (modern web framework)
- Axios (HTTP client)
- CORS middleware
- PM2 (process manager)

### Frontend
- HTML5
- CSS3 (Modern gradients & animations)
- Vanilla JavaScript (ES6+)
- Fetch API

## 📦 Kurulum

### Otomatik Kurulum (Önerilen)

Sunucunuzda root olarak:

```bash
# Setup scriptini indirin
wget https://raw.githubusercontent.com/Noa33881/Claude/claude/fivem-ip-finder-KSNpR/setup.sh

# Çalıştırın
bash setup.sh
```

Script otomatik olarak:
- ✅ Node.js v20 kurar
- ✅ PM2 process manager'ı kurar
- ✅ Uygulama dosyalarını indirir
- ✅ Dependencies'leri yükler
- ✅ Nginx reverse proxy kurar
- ✅ Uygulamayı başlatır

### Manuel Kurulum

```bash
# Node.js kurun (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PM2 kurun
npm install -g pm2

# Projeyi klonlayın
git clone <repo-url>
cd fivem-ip-finder

# Dependencies'leri yükleyin
npm install

# Uygulamayı başlatın
npm start

# Veya PM2 ile production mode:
pm2 start server.js --name fivem-ip-finder
pm2 save
pm2 startup
```

## 🎯 Kullanım

1. Tarayıcınızda `http://your-server-ip` adresini açın
2. CFX.re URL'sini veya Server ID'sini girin
   - Örnek: `cfx.re/join/zem7ky`
   - Veya sadece: `zem7ky`
3. "IP Bul" butonuna tıklayın
4. Sunucu bilgilerini görüntüleyin ve kopyalayın

## 📋 API Endpoints

### GET /api/server/:serverId

Sunucu bilgilerini getirir.

**Response:**
```json
{
  "success": true,
  "server": {
    "id": "zem7ky",
    "name": "Server Name",
    "ip": "123.456.789.0",
    "port": "30120",
    "players": 10,
    "maxPlayers": 32,
    "connectCommand": "connect 123.456.789.0:30120",
    "endpoint": "123.456.789.0:30120"
  }
}
```

### GET /health

Health check endpoint.

## 🔧 PM2 Komutları

```bash
# Durum kontrolü
pm2 status

# Logları görüntüleme
pm2 logs fivem-ip-finder

# Yeniden başlatma
pm2 restart fivem-ip-finder

# Durdurma
pm2 stop fivem-ip-finder

# Monitoring
pm2 monit
```

## 🌐 Production Deployment

Uygulama `/opt/fivem-ip-finder` dizininde çalışır ve:
- Port 3000'de Node.js backend
- Port 80'de Nginx reverse proxy
- PM2 ile otomatik yeniden başlatma
- Sistem başlangıcında otomatik başlatma

## 📝 Lisans

MIT
