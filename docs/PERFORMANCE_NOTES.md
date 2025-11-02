# ⚡ Performance Notes - Arsenal Streams

**Date:** September 29, 2025
**Status:** Development Mode

---

## 🐌 Known Performance Characteristics

### Development Mode (Current)

**Initial Request Delay:**
- First request after startup: **30-120 seconds**
- Next.js compiling pages on-demand
- Puppeteer/Chrome scraping initialization
- Multiple external site requests

**Why It's Slow:**
1. **Next.js Development Server** - Compiles pages on first request
2. **Web Scraping** - Puppeteer launches Chrome instances to scrape:
   - TotalSportek
   - Sportsurge
   - Streamed.pk
3. **No Caching** - Development mode doesn't cache compiled pages
4. **Debug Logging** - Verbose logging slows things down

### Nginx Configuration

**Current Timeouts:**
```nginx
proxy_connect_timeout 180s;
proxy_send_timeout 180s;
proxy_read_timeout 180s;
```

**Why 180 seconds?**
- Allows web scraping to complete
- Prevents 504 Gateway Timeout errors
- Development mode compilation time

---

## ✅ Expected Behavior

### First Visit After Restart
1. User visits https://lolli.eniolabi.com
2. Next.js starts compiling the page (5-10s)
3. Dashboard loads match data via API
4. API triggers web scrapers (Puppeteer)
5. Chrome instances launch and visit source sites (30-60s per site)
6. Results returned and displayed
7. **Total time: 30-120 seconds**

### Subsequent Visits
1. Next.js pages already compiled
2. Scraping results may be cached
3. **Total time: 5-15 seconds**

---

## 🚀 Production Mode Improvements

When running in production mode (`npm run build && npm start`):

**Expected Performance:**
- Initial request: **2-5 seconds**
- API response: **2-5 seconds**
- Page load: **<3 seconds**

**Improvements:**
- Pre-compiled pages (no on-demand compilation)
- Production build optimizations
- Better caching strategies
- Minified JavaScript bundles

---

## 🎯 DaddyLive Integration Benefits

Once DaddyLive integration is complete (see COMPREHENSIVE_STRATEGY.md):

**Expected Performance:**
- API response: **<2 seconds** (p95)
- No web scraping delays
- Direct API calls instead of Puppeteer
- 95%+ reliability

**Why Faster?**
- Direct API endpoints (no browser automation)
- Stable JSON responses
- No external site dependencies
- Better caching opportunities

---

## 📊 Current Monitoring

### Check Application Logs
```bash
# Real-time logs
sudo journalctl -u arsenal-streams -f

# Recent activity
sudo journalctl -u arsenal-streams -n 50
```

### Check Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/lolli.eniolabi.com.access.log

# Error logs (timeouts visible here)
tail -f /var/log/nginx/lolli.eniolabi.com.error.log
```

### Check Service Status
```bash
sudo systemctl status arsenal-streams
```

---

## ⚠️ Timeout Errors

### 504 Gateway Timeout
**Cause:** Request took longer than nginx timeout (was 60s, now 180s)

**When It Happens:**
- First request after service restart
- Heavy scraping load
- External sites slow to respond

**Solution:**
- ✅ Nginx timeouts increased to 180s
- Wait for initial compilation to complete
- Refresh page if timeout occurs

### 499 Client Closed Request
**Cause:** User's browser gave up waiting before server responded

**When It Happens:**
- User closes tab/browser
- User clicks stop/refresh
- Browser timeout (usually 60-90s)

**Solution:**
- Be patient on first load
- Don't refresh during initial load
- Consider building for production

---

## 🔧 Optimization Recommendations

### Short-Term (Current Setup)
1. ✅ Increased nginx timeouts to 180s
2. ⏳ Let Next.js warm up after restart (first request takes longest)
3. ⏳ Monitor logs to see when scraping completes

### Medium-Term (Production Build)
1. Build for production: `npm run build`
2. Update systemd to use: `npm start` instead of `npm run dev`
3. Enable proper caching headers
4. Implement Redis caching for API responses

### Long-Term (DaddyLive Integration)
1. Replace web scraping with DaddyLive API
2. Response time: 30-120s → 2-5s
3. Reliability: 60-70% → 95%+
4. See: COMPREHENSIVE_STRATEGY.md

---

## 📈 Performance Comparison

| Metric | Current (Dev + Scraping) | Production Build | DaddyLive API |
|--------|--------------------------|------------------|---------------|
| First Load | 30-120s | 5-15s | 2-5s |
| API Response | 30-90s | 10-30s | 2-5s |
| Page Compile | 5-10s | Pre-compiled | Pre-compiled |
| Reliability | 60-70% | 60-70% | 95%+ |
| Caching | None | Good | Excellent |

---

## 🎓 What Users Should Know

### Current Experience
**"Why is the site slow on first visit?"**

The site is currently in development mode with web scraping:
- First visit after restart takes 30-120 seconds
- Next.js compiles pages on-demand
- Multiple external sites are scraped for links
- Subsequent visits are much faster (5-15s)

**This is temporary.** Once the DaddyLive API integration is complete, the site will respond in 2-5 seconds consistently.

### What's Normal
- ✅ Long first load (30-120s)
- ✅ "Compiling" messages in logs
- ✅ Multiple Chrome processes (Puppeteer)
- ✅ Faster subsequent loads

### What's Not Normal
- ❌ Every request taking 60s+
- ❌ Persistent 504 errors
- ❌ Service crashes
- ❌ Zero responses

---

## 🛠️ Troubleshooting Slow Performance

### Step 1: Check Service
```bash
sudo systemctl status arsenal-streams
# Should show: Active (running)
```

### Step 2: Check Logs
```bash
sudo journalctl -u arsenal-streams -n 100
# Look for: "Ready on http://0.0.0.0:3002"
# Look for: "Compiled in XXXms"
```

### Step 3: Test Locally
```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3002
# Should eventually return HTML
```

### Step 4: Check Nginx
```bash
sudo nginx -t
# Should show: test is successful
```

### Step 5: Restart Service
```bash
sudo systemctl restart arsenal-streams
# Wait 30-60s for startup
```

---

## 📝 Summary

**Current State:**
- Development mode with web scraping
- Slow but functional (30-120s first load)
- Nginx timeouts increased to 180s
- Normal for this configuration

**Future State:**
- Production build or DaddyLive integration
- Fast and reliable (2-5s response time)
- Better user experience
- See COMPREHENSIVE_STRATEGY.md for roadmap

---

**Document Created:** September 29, 2025
**Last Updated:** September 29, 2025
**Status:** Development Mode - Performance Expected