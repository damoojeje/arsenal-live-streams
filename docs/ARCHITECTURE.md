# 🏗️ Lolli Live Streams - System Architecture

**Last Updated**: November 1, 2025
**Version**: 3.0 Development
**Status**: In Active Development

---

## 📊 **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Landing    │  │  Dashboard   │  │   Player Page        │  │
│  │    Page      │→│   (Matches)  │→│  (HLS.js/iframe)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION (Port 3002)               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API ROUTES                            │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │   │
│  │  │ /api/matches   │  │ /api/magnetic  │  │ /api/     │ │   │
│  │  │ (main endpoint)│  │ -games         │  │ stream/*  │ │   │
│  │  └────────────────┘  └────────────────┘  └───────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SERVICE LAYER                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │        DaddyLive Service                          │   │   │
│  │  │  ┌────────────┐  ┌──────────────┐  ┌──────────┐ │   │   │
│  │  │  │ baseService│  │ scheduleService│  │ filter   │ │   │   │
│  │  │  └────────────┘  └──────────────┘  └──────────┘ │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                          │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  DaddyLive API       │  │  DaddyLive CDN              │    │
│  │  (Schedule Data)     │  │  (Video Streams - m3u8)     │    │
│  │  • team-crew.github  │  │  • dlhd.dad/*                │    │
│  │  • fubuz.github      │  │  • Direct m3u8 URLs          │    │
│  │  • cmanbuilds.com    │  │                              │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔀 **Data Flow Diagram**

### **Match Listing Flow**

```
User visits /dashboard
       ↓
Frontend calls /api/matches
       ↓
API Handler (matches.ts)
       ↓
┌──────────────────────────────┐
│ Check cache (60s TTL)         │
├──────────────────────────────┤
│ IF cache valid:               │
│   → Return cached data         │
│                                │
│ IF cache stale:                │
│   → Return cache + refresh bg  │
│                                │
│ IF no cache:                   │
│   → Fetch fresh data           │
└──────────────────────────────┘
       ↓
getDaddyLiveScheduleService()
       ↓
Try Repos in Order:
  1. team-crew.github.io
  2. fubuz.github.io
  3. cmanbuilds.com/repo
       ↓
Fetch schedule-generated.php
       ↓
Parse Schedule Data:
  - Extract soccer categories
  - Parse event strings
  - Map to Match objects
       ↓
filterMatches()
  - Apply team filters
  - Mark Arsenal matches
  - Add isArsenalMatch flag
       ↓
Return FilteredMatch[]
       ↓
Frontend displays matches
```

### **Stream Playback Flow**

```
User clicks "Watch" on a match
       ↓
Navigate to /player/[channelId]
       ↓
Player Page loads
       ↓
┌───────────────────────────┐
│  Current Implementation    │
│  (iframe embed with ads)   │
├───────────────────────────┤
│  URL: dlhd.dad/stream/    │
│       stream-{id}.php      │
│                            │
│  Loads full webpage:       │
│  • HTML + JavaScript        │
│  • Ad scripts               │
│  • Video player             │
└───────────────────────────┘
       ↓
Video plays (with ads)

┌───────────────────────────┐
│  Planned Implementation    │
│  (Phase 2 - Ad-free)       │
├───────────────────────────┤
│  1. Call /api/stream/      │
│     extract/[channelId]    │
│                            │
│  2. Server extracts m3u8   │
│     from DaddyLive HTML    │
│                            │
│  3. Return direct URL      │
│                            │
│  4. HLS.js plays m3u8      │
│     directly (NO ADS!)     │
└───────────────────────────┘
```

---

## 📁 **Directory Structure**

```
/home/olabi/docker/watch_arsenal/
│
├── pages/                          # Next.js pages & API routes
│   ├── index.tsx                   # Landing page with Arsenal verification
│   ├── dashboard.tsx               # Main match listing page
│   ├── player/
│   │   └── [channelId].tsx        # Stream player (iframe currently)
│   │
│   └── api/                        # Backend API endpoints
│       ├── matches.ts              # Main API: DaddyLive + caching + fallback
│       ├── magnetic-games.ts       # Alternative endpoint (simplified)
│       ├── matches-fallback.ts     # Fallback when DaddyLive down
│       └── stream/
│           └── [channelId].ts      # (Future) Stream URL extraction
│
├── src/
│   ├── components/                 # React components
│   │   ├── Header.tsx              # Navigation + filters
│   │   ├── MatchCard.tsx           # Individual match display
│   │   ├── MatchList.tsx           # Grid layout
│   │   ├── AdBlockedPlayer.tsx     # Enhanced iframe player
│   │   ├── HLSPlayer.tsx           # HLS.js video player
│   │   └── MultiSourcePlayer.tsx   # Multi-source failover player
│   │
│   ├── services/                   # Business logic layer
│   │   └── daddylive/
│   │       ├── baseService.ts      # HTTP client + domain resolution
│   │       └── scheduleService.ts  # Schedule parsing + caching
│   │
│   ├── data/
│   │   └── filter.ts               # Match filtering logic
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   │
│   ├── utils/
│   │   ├── logger.ts               # Winston logging
│   │   └── linkQuality.ts          # Stream quality scoring
│   │
│   └── styles/
│       └── globals.css             # TailwindCSS + Arsenal theme
│
├── docs/                           # Project documentation
│   ├── PROJECT_PLAN.md             # 7-phase implementation plan
│   ├── PROGRESS_LOG.md             # Session tracking
│   ├── ARCHITECTURE.md             # This file
│   ├── claude-context.md           # Claude AI context
│   └── [other docs]                # Historical documentation
│
├── test/                           # Test files
│   └── api/
│       └── matches.test.ts.old     # Archived tests (to be rewritten)
│
├── research/                       # Research artifacts
│   └── kodi-repo-thecrew/          # DaddyLive Kodi addon source
│
├── public/                         # Static assets
│   ├── assets/arsenal/             # Arsenal branding
│   └── icons/                      # PWA icons
│
├── .next/                          # Next.js build output
├── node_modules/                   # Dependencies
│
├── package.json                    # Project dependencies
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # TailwindCSS configuration
├── next.config.js                  # Next.js configuration
└── README.md                       # Project README
```

---

## 🔧 **Component Architecture**

### **Frontend Components**

```
┌──────────────────────────────────────────┐
│           _app.tsx (Root)                 │
│  - Global styles                          │
│  - Arsenal theme (#DB0007)                │
└──────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ↓             ↓             ↓
┌────────┐  ┌──────────┐  ┌──────────┐
│ index  │  │dashboard │  │ player/  │
│ .tsx   │  │  .tsx    │  │[id].tsx  │
└────────┘  └──────────┘  └──────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ↓             ↓             ↓
┌────────┐  ┌──────────┐  ┌──────────┐
│Header  │  │MatchList │  │MatchCard │
│.tsx    │  │  .tsx    │  │   .tsx   │
└────────┘  └──────────┘  └──────────┘
```

### **API Layer**

```
┌──────────────────────────────────────────┐
│          /api/matches.ts                  │
│  - Main endpoint                          │
│  - In-memory caching (60s)                │
│  - Background refresh                     │
│  - Fallback on failure                    │
└──────────────────────────────────────────┘
                  │
                  ↓
┌──────────────────────────────────────────┐
│     getDaddyLiveScheduleService()         │
│  - Singleton pattern                      │
│  - Multi-repo support                     │
│  - Automatic failover                     │
└──────────────────────────────────────────┘
        │                 │
        ↓                 ↓
┌──────────────┐  ┌──────────────────┐
│ baseService  │  │ scheduleService   │
│              │  │                   │
│ • HTTP       │  │ • Parse schedule  │
│   client     │  │ • Extract teams   │
│ • Domain     │  │ • Map to Match    │
│   resolution │  │ • Cache results   │
└──────────────┘  └──────────────────┘
```

### **Service Layer**

```
┌─────────────────────────────────────────────┐
│         DaddyLive Service Singleton          │
├─────────────────────────────────────────────┤
│                                              │
│  baseService:                                │
│  ┌────────────────────────────────────────┐ │
│  │ • HTTP client (axios)                   │ │
│  │ • Multi-repo URLs                       │ │
│  │ • Domain resolution with fallback       │ │
│  │ • Request headers configuration         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  scheduleService:                            │
│  ┌────────────────────────────────────────┐ │
│  │ • Fetch schedule from repos             │ │
│  │ • Parse date keys                       │ │
│  │ • Extract soccer categories             │ │
│  │ • Parse event strings                   │ │
│  │ • Map to Match interface                │ │
│  │ • 60-second caching                     │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 💾 **Data Models**

### **TypeScript Interfaces**

```typescript
// Core Match Interface
interface Match {
  id: string;                 // Unique identifier
  homeTeam: string;           // Home team name
  awayTeam: string;           // Away team name
  time: string;               // Kick-off time (UTC or "LIVE")
  date: string;               // ISO date string
  competition: string;        // League/tournament name
  links: StreamLink[];        // Available stream channels
  source: string;             // Data source ('daddylive', 'fallback')
}

// Stream Link
interface StreamLink {
  url: string;                // Channel ID or URL
  quality: string;            // 'HD', 'SD', etc.
  type: 'stream' | 'acestream' | 'sopcast' | 'hls';
  language?: string;          // Stream language
  channelName?: string;       // Channel name (e.g., 'Sky Sports')
}

// Filtered Match (extends Match)
interface FilteredMatch extends Match {
  isArsenalMatch: boolean;    // Arsenal playing flag
  streamLinks?: StreamLinkLegacy[];  // Legacy compatibility
}

// Legacy Stream Link (backwards compatibility)
interface StreamLinkLegacy {
  source: string;             // Source name
  url: string;                // Stream URL
  quality: string;            // Quality indicator
}
```

### **DaddyLive Schedule Format**

```typescript
// DaddyLive API Response
interface DaddyLiveSchedule {
  [dateKey: string]: {        // "Tuesday 30th Sep 2025 - Schedule Time UK GMT"
    [category: string]: DaddyLiveEvent[];  // "Soccer", "All Soccer Events", etc.
  };
}

interface DaddyLiveEvent {
  event: string;              // "Europe - UEFA Youth League : Team A vs Team B"
  time: string;               // "15:00" (UTC)
  channels: DaddyLiveChannel[];
}

interface DaddyLiveChannel {
  channel_name: string;       // "Sky Sports Main Event"
  channel_id: string;         // "468" (used in player URL)
}
```

---

## 🌐 **External Dependencies**

### **DaddyLive Repositories**

**Priority 1**: https://team-crew.github.io/
- Primary Kodi repository
- Most reliable
- Contains addon.xml and schedule API

**Priority 2**: https://fubuz.github.io/
- Alternative repository
- Fallback when primary fails

**Priority 3**: https://cmanbuilds.com/repo/
- DaddyLive V2 repository
- Last resort fallback

### **Schedule API Endpoint**

```
https://[repo-domain]/schedule/schedule-generated.php

Returns: JSON object with date-keyed schedule
Update Frequency: Real-time
Cache Duration: 60 seconds (client-side)
```

### **Stream Player URLs**

```
Current (iframe):
https://dlhd.dad/stream/stream-[channelId].php

Planned (direct m3u8):
https://[cdn-domain]/hls/stream-[channelId].m3u8
```

---

## 🔒 **Security & Performance**

### **Caching Strategy**

```typescript
// In-memory cache in /api/matches.ts
let cachedMatches: FilteredMatch[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

Cache Behavior:
- Age < 60s  → Return cache immediately (CACHE HIT)
- Age > 60s  → Return cache + refresh background (CACHE STALE)
- No cache   → Fetch fresh data (CACHE MISS)
```

### **Request Headers**

```typescript
const REQUIRED_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh...) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9...',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};
```

### **Error Handling**

```
Level 1: Try primary repo  → Success → Return data
           ↓ Fail
Level 2: Try fallback repos → Success → Return data
           ↓ Fail
Level 3: Try direct URL → Success → Return data
           ↓ Fail
Level 4: Return cached data (if available)
           ↓ No cache
Level 5: Return fallback sample data
```

---

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────┐
│                  CLOUDFLARE                          │
│  • DNS: lolli.eniolabi.com → 192.168.0.26          │
│  • Tunnel: 4e162c17-99a1-47ab-bd87-3ad4560b4451    │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│            NGINX REVERSE PROXY (Port 443/80)         │
│  • SSL/TLS termination (Let's Encrypt)               │
│  • Proxy to localhost:3002                           │
│  • WebSocket upgrade support                         │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│         SYSTEMD SERVICE: arsenal-streams.service     │
│  • Auto-start on boot                                │
│  • Auto-restart on failure (10s delay)               │
│  • User: olabi                                       │
│  • Working Dir: /home/olabi/docker/watch_arsenal     │
│  • Command: npm start                                │
│  • Environment: NODE_ENV=production, PORT=3002       │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│         NEXT.JS APPLICATION (Port 3002)              │
│  • Production build (.next/)                         │
│  • Node.js runtime                                   │
│  • Server-side rendering (SSR)                       │
│  • API routes                                        │
└─────────────────────────────────────────────────────┘
```

### **Server Configuration**

```ini
# /etc/systemd/system/arsenal-streams.service
[Unit]
Description=Arsenal Live Streams - lolli
After=network.target

[Service]
Type=simple
User=olabi
WorkingDirectory=/home/olabi/docker/watch_arsenal
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
```

```nginx
# /etc/nginx/sites-available/lolli.eniolabi.com
server {
    listen 443 ssl http2;
    server_name lolli.eniolabi.com;

    ssl_certificate /etc/letsencrypt/live/lolli.eniolabi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lolli.eniolabi.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📈 **Performance Characteristics**

### **Current Metrics**

| Metric | Value | Notes |
|--------|-------|-------|
| First Contentful Paint | ~1.5s | Next.js SSR |
| Time to Interactive | ~3s | Including HMR |
| API Response Time (cached) | <50ms | In-memory cache |
| API Response Time (fresh) | 2-5s | External API fetch |
| Bundle Size (First Load) | 87 kB | Shared bundles |
| Page Size (Dashboard) | 87.7 kB | Including JS |

### **Resource Usage**

| Resource | Usage | Limit |
|----------|-------|-------|
| RAM | ~150 MB | Node.js process |
| CPU | <5% idle, ~20% during requests | Multicore server |
| Network (per request) | ~10 KB | API responses |
| Disk | ~250 MB | node_modules + build |

---

## 🎯 **Future Architecture (v3.0)**

### **Planned Enhancements**

1. **Multi-Source Manager** (Phase 3.2)
   - DaddyLive (primary)
   - TotalSportek7 (fallback)
   - Cached data (emergency)

2. **Stream Extraction Service** (Phase 2.1)
   - Server-side URL extraction
   - Direct m3u8 playback
   - Ad-free experience

3. **Admin Dashboard** (Phase 4.3)
   - Source health monitoring
   - Error logging
   - Analytics

4. **Redis Caching** (Phase 6.2)
   - Persistent cache
   - Distributed architecture support
   - Better cache invalidation

---

**Last Updated**: November 1, 2025
**Next Update**: After Phase 2 completion
**Maintained By**: Claude (Arsenal Streams Development)
