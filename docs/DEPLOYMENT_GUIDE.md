# Deployment Guide: Lolli Live Streams v3.0

**Last Updated:** November 2, 2025
**Environment:** Production (olabi server)
**Status:** ✅ DEPLOYED

---

## 1. System Requirements

### 1.1 Server Specifications
- **OS:** Linux (Ubuntu/Debian recommended)
- **Node.js:** v18.x or higher
- **RAM:** Minimum 512MB (1GB+ recommended)
- **Disk:** 500MB for application + logs
- **Network:** Stable internet connection

### 1.2 Required Software
```bash
# Node.js and npm
node --version  # v18.x+
npm --version   # 9.x+

# systemd (for service management)
systemctl --version

# nginx (for reverse proxy)
nginx -v

# Git (for version control)
git --version
```

---

## 2. Installation Steps

### 2.1 Clone Repository
```bash
cd /home/olabi/docker
git clone https://github.com/damoojeje/arsenal-live-streams.git watch_arsenal
cd watch_arsenal
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Build Production Bundle
```bash
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
Route (pages)                             Size     First Load JS
┌ ○ /                                     6.04 kB        86.8 kB
├ ○ /admin                                3.09 kB        86.3 kB
├ ○ /dashboard                            9.05 kB        89.8 kB
└ ... (additional routes)
```

### 2.4 Test Build Locally
```bash
npm start
# Should start on http://localhost:3002
```

---

## 3. systemd Service Setup

### 3.1 Create Service File
**Location:** `/etc/systemd/system/arsenal-streams.service`

```ini
[Unit]
Description=Arsenal Streams - Live Football Streaming Application
Documentation=https://github.com/arsenal-streams
After=network.target

[Service]
Type=simple
User=olabi
Group=olabi
WorkingDirectory=/home/olabi/docker/watch_arsenal
Environment="NODE_ENV=production"
Environment="PORT=3002"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=arsenal-streams

# Resource limits
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

### 3.2 Enable and Start Service
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable arsenal-streams.service

# Start service
sudo systemctl start arsenal-streams.service

# Check status
systemctl status arsenal-streams.service
```

**Expected Output:**
```
● arsenal-streams.service - Arsenal Streams - Live Football Streaming Application
     Loaded: loaded (/etc/systemd/system/arsenal-streams.service; enabled)
     Active: active (running) since [DATE]
   Main PID: [PID] (npm start)
      Tasks: 23
     Memory: 65.5M
        CPU: 4.026s

[DATE] arsenal-streams[PID]:   ▲ Next.js 14.2.33
[DATE] arsenal-streams[PID]:   - Local:        http://localhost:3002
[DATE] arsenal-streams[PID]:  ✓ Ready in 954ms
```

### 3.3 Service Management Commands
```bash
# Start service
sudo systemctl start arsenal-streams

# Stop service
sudo systemctl stop arsenal-streams

# Restart service
sudo systemctl restart arsenal-streams

# View logs
journalctl -u arsenal-streams.service -f

# View recent logs
journalctl -u arsenal-streams.service -n 100

# Check service status
systemctl status arsenal-streams
```

---

## 4. nginx Reverse Proxy Configuration

### 4.1 Create nginx Configuration
**Location:** `/etc/nginx/sites-available/lolli.eniolabi.com`

```nginx
server {
    listen 80;
    server_name lolli.eniolabi.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lolli.eniolabi.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/lolli.eniolabi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lolli.eniolabi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/lolli.eniolabi.com.access.log;
    error_log /var/log/nginx/lolli.eniolabi.com.error.log;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints (no caching)
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass 1;
        proxy_no_cache 1;
    }

    # Static assets (aggressive caching)
    location /_next/static/ {
        proxy_pass http://localhost:3002;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4.2 Enable Site and Restart nginx
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/lolli.eniolabi.com /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4.3 SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d lolli.eniolabi.com

# Auto-renewal is handled by certbot timer
sudo systemctl status certbot.timer
```

---

## 5. Cloudflare Configuration

### 5.1 DNS Setup
**DNS Records:**
```
Type: A
Name: lolli
Content: [Your Server IP]
Proxy: Enabled (Orange cloud)
TTL: Auto
```

### 5.2 SSL/TLS Settings
- **SSL/TLS encryption mode:** Full (strict)
- **Always Use HTTPS:** On
- **Minimum TLS Version:** 1.2

### 5.3 Firewall Rules (Optional)
```
Rule: Allow
When incoming requests match: lolli.eniolabi.com
Action: Allow
```

---

## 6. Application Configuration

### 6.1 Environment Variables
No `.env` file required - all configuration is in code.

**Key Settings:**
- **Port:** 3002 (hardcoded in package.json)
- **Cache Duration:** 60 seconds (matches API)
- **Admin Password:** [set in .env.local] (in pages/admin.tsx)

### 6.2 Modifying Configuration
To change settings, edit these files:

**Port Number:**
```json
// package.json
"scripts": {
  "start": "next start -p 3002"  // Change 3002 to desired port
}
```

**Cache Duration:**
```typescript
// pages/api/matches.ts
const CACHE_DURATION = 60 * 1000; // Change to desired duration
```

**Admin Password:**
```typescript
// pages/admin.tsx
const ADMIN_PASSWORD = '[set in .env.local]'; // Change to secure password
```

---

## 7. Deployment Workflow

### 7.1 Update Production
```bash
# Navigate to application directory
cd /home/olabi/docker/watch_arsenal

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Build production bundle
npm run build

# Restart service
sudo systemctl restart arsenal-streams

# Verify deployment
systemctl status arsenal-streams
curl http://localhost:3002
```

### 7.2 Rollback Procedure
```bash
# View recent commits
git log --oneline -10

# Rollback to specific commit
git checkout [commit-hash]

# Rebuild and restart
npm install
npm run build
sudo systemctl restart arsenal-streams

# Or return to main
git checkout main
```

### 7.3 Zero-Downtime Deployment
```bash
# Build first (while old version runs)
npm run build

# Quick restart
sudo systemctl restart arsenal-streams

# Service restarts in <5 seconds
```

---

## 8. Monitoring and Maintenance

### 8.1 Log Monitoring
```bash
# Real-time logs
journalctl -u arsenal-streams.service -f

# Last 100 lines
journalctl -u arsenal-streams.service -n 100

# Filter by date
journalctl -u arsenal-streams.service --since "2025-11-02"

# Search for errors
journalctl -u arsenal-streams.service | grep -i error
```

### 8.2 Health Checks
```bash
# Application health
curl http://localhost:3002

# API health
curl http://localhost:3002/api/matches

# Admin dashboard
curl http://localhost:3002/admin

# Service status
systemctl status arsenal-streams

# Resource usage
systemctl status arsenal-streams | grep Memory
```

### 8.3 Performance Monitoring
**Admin Dashboard:** https://lolli.eniolabi.com/admin
- Password: `[set in .env.local]`
- Source health monitoring
- Response time tracking
- System status

**Features:**
- Real-time source health checks
- Average response time metrics
- Active sources counter
- Last update timestamp

---

## 9. Troubleshooting

### 9.1 Service Won't Start
```bash
# Check logs for errors
journalctl -u arsenal-streams.service -n 50

# Common issues:
# 1. Port already in use
sudo lsof -i :3002

# 2. Build directory missing
npm run build

# 3. Permission issues
sudo chown -R olabi:olabi /home/olabi/docker/watch_arsenal
```

### 9.2 Application Errors
```bash
# View detailed error logs
journalctl -u arsenal-streams.service | grep -A 10 "Error"

# Test build locally
npm run dev

# Verify dependencies
npm install

# Check Node.js version
node --version  # Should be v18+
```

### 9.3 nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# View nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### 9.4 API Not Responding
```bash
# Test API locally
curl http://localhost:3002/api/matches

# Check if DaddyLive is accessible
curl https://daddylivestream.com/api/matches

# Test TotalSportek fallback
curl http://localhost:3002/api/totalsportek/matches
```

---

## 10. Security Best Practices

### 10.1 Application Security
- ✅ Admin dashboard password protected
- ✅ No sensitive data in environment variables
- ✅ Client-side popup blocking implemented
- ✅ HTTPS enforced via nginx
- ✅ Security headers configured in nginx

### 10.2 Server Security
```bash
# Keep system updated
sudo apt update && sudo apt upgrade

# Enable firewall
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Disable unused services
sudo systemctl disable [unused-service]
```

### 10.3 Backup Strategy
```bash
# Backup application
tar -czf arsenal-streams-backup-$(date +%Y%m%d).tar.gz \
    /home/olabi/docker/watch_arsenal

# Backup systemd service
sudo cp /etc/systemd/system/arsenal-streams.service \
    /home/olabi/backups/

# Backup nginx configuration
sudo cp /etc/nginx/sites-available/lolli.eniolabi.com \
    /home/olabi/backups/
```

---

## 11. Production Verification Checklist

### 11.1 Pre-Deployment
- [ ] Code built successfully (`npm run build`)
- [ ] Type checking passed (`npm run type`)
- [ ] No ESLint errors
- [ ] Dependencies up to date

### 11.2 Deployment
- [ ] systemd service running
- [ ] nginx configured and reloaded
- [ ] SSL certificate valid
- [ ] Cloudflare DNS configured

### 11.3 Post-Deployment
- [ ] Home page loads (https://lolli.eniolabi.com)
- [ ] Dashboard accessible (https://lolli.eniolabi.com/dashboard)
- [ ] API returns data (/api/matches)
- [ ] Admin dashboard works (/admin)
- [ ] Player loads streams
- [ ] Team logos display
- [ ] Favorites persist

### 11.4 Performance
- [ ] Response time < 2 seconds
- [ ] Memory usage < 256MB
- [ ] No memory leaks
- [ ] Logs clean (no errors)

---

## 12. Quick Reference

### 12.1 Key URLs
- **Production:** https://lolli.eniolabi.com
- **Dashboard:** https://lolli.eniolabi.com/dashboard
- **Admin:** https://lolli.eniolabi.com/admin
- **API:** https://lolli.eniolabi.com/api/matches

### 12.2 Important Paths
```
Application: /home/olabi/docker/watch_arsenal
Service: /etc/systemd/system/arsenal-streams.service
nginx: /etc/nginx/sites-available/lolli.eniolabi.com
Logs: journalctl -u arsenal-streams.service
SSL: /etc/letsencrypt/live/lolli.eniolabi.com
```

### 12.3 Common Commands
```bash
# Restart application
sudo systemctl restart arsenal-streams

# View logs
journalctl -u arsenal-streams -f

# Test API
curl http://localhost:3002/api/matches

# Update from git
cd /home/olabi/docker/watch_arsenal && git pull

# Full redeployment
git pull && npm install && npm run build && sudo systemctl restart arsenal-streams
```

---

## Appendix A: systemd Service Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| active (running) | Service is working | None needed |
| inactive (dead) | Service stopped | Start with `systemctl start` |
| failed | Service crashed | Check logs, fix issue, restart |
| activating | Service starting | Wait or check logs |

---

## Appendix B: nginx Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Successful request |
| 404 | Not Found | Route doesn't exist |
| 500 | Internal Server Error | Application crash |
| 502 | Bad Gateway | Application not running |
| 503 | Service Unavailable | Application overloaded |

---

## Appendix C: Performance Benchmarks

**Typical Performance Metrics:**
```
Home page load: ~500ms
API response: ~200-500ms
Match listing: ~1-2s (with external API)
Stream start: ~2-3s (HLS buffering)
Memory usage: ~60-80MB
CPU usage: <10% average
```

---

**Deployment Guide Version:** 1.0
**Last Verified:** November 2, 2025
**Status:** ✅ Production Ready
**Service Status:** Running (http://localhost:3002)
