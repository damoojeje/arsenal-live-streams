# Ad Blocking Analysis & Docker Deployment Strategy

**Date**: September 30, 2025
**Project**: Arsenal Streams (lolli)
**Status**: Production Analysis

---

## 📋 **Question 1: Time-Based Sorting**

### ✅ **IMPLEMENTED - Match Cards Sorted by Time**

**Sorting Order:**
1. **LIVE matches first** - Always at the top
2. **Scheduled matches** - Ordered by time (earliest to latest)
3. **TBD matches** - At the bottom

**Implementation**: `pages/dashboard.tsx`
```typescript
// Sort matches by time
filtered = filtered.sort((a, b) => {
  // Live matches always come first
  const aIsLive = a.time?.toLowerCase() === 'live' || a.isLive;
  const bIsLive = b.time?.toLowerCase() === 'live' || b.isLive;

  if (aIsLive && !bIsLive) return -1;
  if (!aIsLive && bIsLive) return 1;

  // TBD matches go to the end
  const aIsTBD = !a.time || a.time.toLowerCase() === 'tbd';
  const bIsTBD = !b.time || b.time.toLowerCase() === 'tbd';

  if (aIsTBD && !bIsTBD) return 1;
  if (!aIsTBD && bIsTBD) return -1;

  // Parse and compare times
  return parseTime(a.time) - parseTime(b.time);
});
```

**Result**: Matches are now displayed in chronological order with live matches prominently at the top.

---

## 🎯 **Question 2: How Kodi Addons Avoid Ads**

### **Research Findings:**

#### **Why Kodi DaddyLive Addon Has No Ads:**

1. **Direct Stream Extraction**
   - Kodi addons bypass the web interface entirely
   - They extract **direct m3u8/HLS URLs** from DaddyLive's backend
   - The addon uses Python to parse HTML and JavaScript to find stream URLs
   - No browser = No ad scripts can execute

2. **Native Video Player**
   - Kodi uses its own video player (VideoPlayer/Kodi Player)
   - This player only renders video streams, not web content
   - Ad scripts, popups, and overlays cannot run in native players

3. **Technical Approach (plugin.video.daddylive v4.04)**
   ```
   User selects match in Kodi
   ↓
   Addon fetches DaddyLive stream page HTML (server-side)
   ↓
   Parses HTML to extract:
   - CHANNEL_KEY
   - XJZ authentication bundle
   - Iframe host
   ↓
   Performs authentication handshake
   ↓
   Constructs direct m3u8 URL:
   https://[server].newkso.ru/[server]/cdn/[channelId]/mono.m3u8
   ↓
   Passes URL directly to Kodi's native player
   ↓
   Video plays - NO ADS!
   ```

4. **Key Differences from Web Apps:**
   - **Kodi**: Python server-side processing → Direct stream to native player
   - **Web App**: Browser-based → Must use iframe or video player → Subject to web security

#### **Why Our Web App Still Has Ads:**

| Aspect | Kodi Addon | Our Web App |
|--------|-----------|-------------|
| **Environment** | Python app (no browser) | JavaScript in browser |
| **Stream Extraction** | Server-side HTML parsing | Client-side or API calls |
| **Video Player** | Native Kodi player | HTML5 `<video>` or `<iframe>` |
| **Ad Scripts** | Cannot execute (no browser) | Can execute in iframe |
| **Popup Blocking** | N/A (no popup capability) | Browser-dependent |
| **Cross-Origin** | Not applicable | Subject to CORS restrictions |

**The Core Issue**:
- When we embed DaddyLive's iframe, we're loading their **entire web page** inside our page
- That web page includes all their ad scripts, popup triggers, and countdown timers
- Browser security (Same-Origin Policy) prevents us from accessing/modifying iframe content from a different domain

---

## 🐳 **Question 3: Docker Deployment Analysis**

### **Current Deployment:**
- **Method**: Systemd service on bare metal
- **Service**: `arsenal-streams.service`
- **Port**: 3002
- **Reverse Proxy**: nginx → SSL → External access

### **Docker Deployment Benefits:**

#### ✅ **Advantages:**

1. **Portability**
   - Deploy anywhere (local server, cloud, VPS)
   - Environment consistency (dev = prod)
   - Easy migration between servers

2. **Isolation**
   - App dependencies isolated from host system
   - Easy rollback to previous versions
   - Multiple instances on different ports

3. **Resource Management**
   - CPU/memory limits
   - Restart policies
   - Health checks

4. **Scalability**
   - Load balancing with multiple containers
   - Horizontal scaling for high traffic
   - Docker Compose orchestration

5. **Development Workflow**
   - Consistent dev environment
   - Easy onboarding for new developers
   - CI/CD integration

#### ⚠️ **Considerations:**

1. **Performance Impact**
   - Docker adds ~5-10MB memory overhead per container
   - Negligible CPU overhead (<1%)
   - Network bridge adds ~1ms latency (not noticeable)

2. **Complexity**
   - Need Docker knowledge
   - docker-compose.yml configuration
   - Volume management for logs/data

3. **Current Setup Already Works**
   - Systemd service is reliable
   - nginx already handles SSL/reverse proxy
   - Docker doesn't add significant value for single-instance deployment

### **Docker Ad Blocking Capabilities:**

#### ❌ **Docker DOES NOT Help with Iframe Ads**

**Why Docker Can't Block DaddyLive Ads:**
- Docker is a **containerization platform**, not an ad blocker
- Our app runs in a container, but **browser still loads iframe content**
- Ad scripts execute in the **user's browser**, not in our container
- Docker has **no control over client-side JavaScript**

**What Docker Could Enable:**

1. **Server-Side Proxy Container**
   ```
   Browser → nginx → Docker: Arsenal App → Docker: Stream Proxy → DaddyLive
                                              ↑
                                   Filters ad requests here
   ```
   - Proxy container intercepts DaddyLive requests
   - Strips ad URLs, scripts, tracking
   - Returns cleaned HTML/video streams
   - **Downsides**:
     - High bandwidth usage
     - Legal/ethical concerns
     - Requires maintaining proxy rules
     - DaddyLive may detect and block

2. **Ad-Blocking Sidecar Container**
   ```yaml
   services:
     arsenal-app:
       image: arsenal-streams
       ports:
         - "3002:3002"

     ad-blocker:
       image: pihole/pihole  # DNS-level ad blocking
       ports:
         - "53:53"
   ```
   - Pi-hole or AdGuard DNS container
   - Blocks ad domains at DNS level
   - **Limitation**: Only blocks external ad domains, not embedded ads in iframe

---

## 🛡️ **Question 4: Server-Side Ad Blocking Options**

### **Option 1: DNS-Based Blocking (Easiest)**

**Deploy Pi-hole or AdGuard in Docker:**
```yaml
# docker-compose.yml
services:
  arsenal-streams:
    build: .
    ports:
      - "3002:3002"
    dns:
      - 172.20.0.3  # Points to Pi-hole

  pihole:
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"  # Admin interface
    environment:
      - TZ=America/Chicago
      - WEBPASSWORD=admin
    volumes:
      - ./pihole/etc:/etc/pihole
      - ./pihole/dnsmasq:/etc/dnsmasq.d
    networks:
      app_net:
        ipv4_address: 172.20.0.3
```

**How It Works:**
- Pi-hole intercepts DNS queries for ad domains
- Blocks known ad servers (millions of domains in blocklist)
- Returns null response for blocked domains

**Effectiveness Against DaddyLive Ads:**
- ⚠️ **Limited** - May block some external ad scripts
- ❌ **Won't block embedded ads** in DaddyLive's iframe
- ✅ **Blocks tracking/analytics**

**Verdict**: Helps but doesn't solve the iframe ad problem.

---

### **Option 2: Reverse Proxy with Content Filtering (Medium)**

**Deploy nginx with ModSecurity + filtering:**
```nginx
# nginx.conf with content filtering
location /player/ {
    proxy_pass http://arsenal-streams:3002;

    # Sub-filter to modify iframe content
    sub_filter_types text/html;
    sub_filter_once off;

    # Attempt to strip ad scripts (LIMITED EFFECTIVENESS)
    sub_filter '<script src="ad-script.js">' '';
    sub_filter 'onclick="openPopup()"' '';
}
```

**How It Works:**
- nginx intercepts all traffic
- `sub_filter` modifies HTML content
- Strips known ad scripts/attributes

**Effectiveness:**
- ⚠️ **Limited** - Only works for proxied content
- ❌ **Can't modify cross-origin iframe content**
- ⚠️ **May break legitimate functionality**

**Verdict**: Not effective for our use case due to Same-Origin Policy.

---

### **Option 3: Stream Proxy Server (Most Effective, Complex)**

**Build a dedicated stream proxy service:**
```typescript
// stream-proxy/index.ts
import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';

const app = express();

app.get('/proxy/stream/:channelId', async (req, res) => {
  const { channelId } = req.params;

  // 1. Fetch DaddyLive stream page
  const streamPage = await axios.get(
    `https://dlhd.dad/stream/stream-${channelId}.php`
  );

  // 2. Parse HTML
  const dom = new JSDOM(streamPage.data);
  const doc = dom.window.document;

  // 3. Remove all ad elements
  doc.querySelectorAll('script[src*="ads"]').forEach(el => el.remove());
  doc.querySelectorAll('div[class*="ad"]').forEach(el => el.remove());
  doc.querySelectorAll('iframe[src*="doubleclick"]').forEach(el => el.remove());

  // 4. Extract only video player
  const videoElement = doc.querySelector('video');
  const streamUrl = videoElement?.src;

  // 5. Return cleaned HTML or direct stream
  if (streamUrl) {
    res.json({ streamUrl }); // Direct HLS URL
  } else {
    res.send(doc.documentElement.outerHTML); // Cleaned HTML
  }
});
```

**Docker Compose:**
```yaml
services:
  arsenal-streams:
    build: .
    ports:
      - "3002:3002"
    environment:
      - STREAM_PROXY_URL=http://stream-proxy:4000

  stream-proxy:
    build: ./stream-proxy
    ports:
      - "4000:4000"
```

**How It Works:**
1. User requests stream
2. Arsenal app calls stream-proxy service
3. Proxy fetches DaddyLive page server-side
4. Strips all ad elements
5. Extracts direct video URL or returns cleaned HTML
6. Browser receives clean stream

**Effectiveness:**
- ✅ **Highly effective** - Full control over content
- ✅ **Blocks all iframe ads**
- ✅ **Extracts direct HLS URLs**

**Downsides:**
- ⚠️ High bandwidth usage (proxy handles all streams)
- ⚠️ Legal concerns (redistributing content)
- ⚠️ DaddyLive may detect and block proxy IPs
- ⚠️ Maintenance burden (update if DaddyLive changes structure)

**Cost Estimate:**
- **Server bandwidth**: 5-10 GB per hour per concurrent stream
- **VPS required**: $20-50/month for 10-20 concurrent users
- **CDN costs**: $0.05-0.10 per GB if using CDN

**Verdict**: Most effective but expensive and legally gray.

---

### **Option 4: Browser Extension Integration (User-Side)**

**Provide instructions for users:**
```markdown
## How to Block Ads in Arsenal Streams

1. Install uBlock Origin:
   - Chrome: [Extension Link]
   - Firefox: [Extension Link]
   - Safari: Use AdGuard

2. Add custom filters for DaddyLive:
   ```
   ||dlhd.dad/ads/*
   ||dlhd.dad/popups/*
   dlhd.dad##.ad-overlay
   dlhd.dad##.countdown-timer
   ```

3. Enable popup blocking in browser settings
```

**Effectiveness:**
- ✅ **Very effective** for users who install
- ✅ **Zero server cost**
- ❌ **Requires user action**
- ⚠️ **Not universal** (some users won't install)

**Verdict**: Best user-side solution, but not automatic.

---

## 🔄 **Question 5: Alternative Streaming Repos**

### **Ready to Evaluate!**

**Please provide:**
1. Repository URL or addon name
2. API documentation (if available)
3. Example stream URLs

**Evaluation Criteria:**
- ✅ API availability (vs web scraping)
- ✅ Stream quality and reliability
- ✅ Ad integration (minimal is best)
- ✅ Legal status
- ✅ Direct HLS/m3u8 access
- ✅ CORS-friendly
- ✅ Rate limiting policies

**Example evaluation process:**
```bash
# Test alternative repo
curl -s "https://alternative-repo.com/api/matches" | jq '.'

# Check stream URL format
curl -I "https://alternative-repo.com/stream/123.m3u8"

# Test CORS headers
curl -H "Origin: https://lolli.eniolabi.com" \
     -I "https://alternative-repo.com/stream/123.m3u8"
```

I'm ready to research and evaluate any alternative streaming source you provide!

---

## 📊 **Recommended Solution Path**

### **Immediate (Today):**
✅ **Time-based sorting** - DONE
✅ **Remove loading spinner on our page** - DONE

### **Short-Term (This Week):**
1. **Document user-side ad blocking** (browser extensions)
2. **Test stream proxy concept** with single stream
3. **Evaluate alternative repo** (when provided)

### **Medium-Term (This Month):**
1. **Docker deployment** (if scaling needed)
2. **Implement stream proxy** (if budget allows)
3. **Switch to alternative repo** (if better option found)

### **Long-Term:**
1. **Partner with stream provider** for official API
2. **Build robust proxy infrastructure** with CDN
3. **Consider premium tier** (ad-free subscription)

---

## 🎯 **Summary & Next Steps**

| Question | Answer | Status |
|----------|--------|--------|
| **1. Sort by time?** | Yes, possible and implemented | ✅ DONE |
| **2. How does Kodi work?** | Direct stream extraction + native player | ✅ RESEARCHED |
| **3. Docker deployment?** | Possible, minimal performance impact | ✅ ANALYZED |
| **4. Docker block ads?** | Not directly, need proxy architecture | ✅ ANALYZED |
| **5. Server-side ad blocking?** | 4 options documented, proxy most effective | ✅ ANALYZED |
| **6. Alternative repo?** | Ready to evaluate when provided | ⏳ WAITING |

---

**Current Status**: Matches are now sorted by time (LIVE → Scheduled → TBD). Stream plays correctly but still has DaddyLive's embedded ads.

**Best Next Action**: Provide alternative streaming repo for evaluation, or budget approval for stream proxy server implementation.

**Created**: September 30, 2025
**Author**: Claude (Arsenal Streams Development)