# Arsenal Streams (lolli) - Claude Context

**Project**: Live Sports Streaming Web Application
**Framework**: Next.js 14 (TypeScript)
**Primary Source**: DaddyLive API (multi-source planned)
**Domain**: lolli.eniolabi.com (via nginx reverse proxy)
**Last Updated**: November 1, 2025
**Status**: v3.0 Development - Multi-Source Ad-Free Implementation IN PROGRESS

**Current Phase**: Phase 1 - Project Audit & Cleanup
**Project Plan**: See `docs/PROJECT_PLAN.md`
**Progress Log**: See `docs/PROGRESS_LOG.md`

---

## 🎯 **Project Overview**

### **Application Purpose**
Live sports streaming aggregator focusing on football/soccer matches with multi-league support.

### **Core Features**
- ✅ Real-time match listings from DaddyLive API
- ✅ Multi-criteria filtering (Team, Competition, Country)
- ✅ Time-based sorting (LIVE matches first, then chronological)
- ✅ Automatic old match removal (>2.5 hours)
- ✅ Timezone-aware 12-hour time display
- ✅ Stream player with fullscreen support
- ⚠️ **Current Issue**: Embedded ads in DaddyLive iframe streams

---

## 📁 **Project Structure**

```
/home/olabi/docker/watch_arsenal/
├── pages/
│   ├── dashboard.tsx              # Main match listing page
│   ├── player/
│   │   └── [channelId].tsx        # Stream player page (iframe embed)
│   └── api/
│       └── stream/
│           └── [channelId].ts     # Stream resolution API (experimental)
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Filters + Legal disclaimer
│   │   └── MatchCard.tsx          # Individual match display
│   ├── services/
│   │   └── daddylive/
│   │       ├── api.ts             # DaddyLive API client
│   │       ├── streamResolver.ts  # Multi-method stream extraction (WIP)
│   │       └── matchService.ts    # Match data service
│   └── types/
│       └── match.ts               # TypeScript interfaces
├── research/
│   └── mad-titan/
│       └── plugin.video.madtitansports/  # Kodi addon source code
├── documentation/
│   ├── KODI_IMPLEMENTATION_GUIDE.md      # ⭐ Complete implementation guide
│   ├── MAD_TITAN_SPORTS_ANALYSIS.md      # ⭐ Research findings
│   ├── AD_BLOCKING_ANALYSIS.md           # Ad-blocking options analysis
│   └── IMPROVEMENTS_COMPLETE.md          # Feature changelog
└── claude-context.md              # This file
```

---

## 🔄 **Recent Development Timeline**

### **September 30, 2025 - Ad-Free Research Phase**

#### **Morning: Feature Enhancements**
1. ✅ Added Competition filter (UEFA CL, La Liga, Serie A, etc.)
2. ✅ Added Country/Region filter (England, Spain, Italy, etc.)
3. ✅ Implemented timezone-aware 12-hour time format
4. ✅ Time-based sorting (LIVE → scheduled → TBD)
5. ✅ Automatic old match removal (>2.5 hours old)

#### **Midday: Ad Removal Attempts**
1. ❌ Tried direct iframe with sandbox attributes (broke video playback)
2. ❌ Attempted HLS.js player with stream extraction (streams not accessible)
3. ✅ Reverted to simple iframe embed (functional but has ads)
4. ✅ Added legal disclaimers and ad blocker recommendations

#### **Afternoon: Mad Titan Sports Research** ⭐
1. ✅ Downloaded Mad Titan Sports Kodi addon (3.1MB source code)
2. ✅ Analyzed architecture and stream resolution mechanism
3. ✅ Identified key libraries: **JetExtractors** & **ResolveURL**
4. ✅ Created comprehensive implementation guide
5. ✅ Documented complete Kodi approach

---

## 🔬 **Key Research Findings**

### **How Kodi Achieves Ad-Free Streaming**

**Secret Sauce**: Server-side stream extraction + Native video player

```
Traditional Web App (Arsenal Streams - Current):
┌─────────────────────────────────────────────────┐
│ Browser                                          │
│  └─> Iframe: https://dlhd.dad/stream/468.php   │
│       └─> Loads entire web page (HTML + JS)    │
│            └─> Ad scripts execute               │
│                 └─> Countdown, popups, unmute   │
│                      └─> 😡 Bad UX              │
└─────────────────────────────────────────────────┘

Kodi Approach (Mad Titan Sports):
┌─────────────────────────────────────────────────┐
│ Python (Server-side)                            │
│  └─> JetExtractors Library                     │
│       └─> Fetch: https://dlhd.dad/stream/...   │
│            └─> Extract: https://cdn.../hls.m3u8│
│                 └─> Return direct URL           │
│                                                  │
│ Kodi Player                                     │
│  └─> Play m3u8 directly                        │
│       └─> No web page = No ads                 │
│            └─> 😊 Ad-free                       │
└─────────────────────────────────────────────────┘
```

### **Critical Libraries Identified**

1. **JetExtractors** (⭐ PRIMARY SOLUTION)
   - GitHub: https://github.com/cwunder87/jetextractors
   - Sports-focused stream extractor
   - Supports 50+ streaming sites
   - Actively maintained (2023)
   - Open-source Python library

2. **ResolveURL**
   - GitHub: https://github.com/Gujal00/ResolveURL
   - Generic URL resolver (500+ sites)
   - Extracts direct m3u8/mp4 URLs
   - Used by Mad Titan Sports for playback

3. **Airtable Backend**
   - Mad Titan uses Airtable as database
   - Stores match schedules and stream sources
   - API key protected (we can't access theirs)
   - We can use our own database instead

---

## 🚀 **Recommended Implementation Path**

### **Option A: JetExtractors Integration** ⭐ RECOMMENDED

**Architecture:**
```
┌─────────────────────────────────────────────────┐
│ Browser (Client)                                │
│  └─> React Player Page                         │
│       └─> Fetch /api/stream/resolve?id=468     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Next.js API Route (Node.js)                     │
│  └─> /pages/api/stream/resolve/[id].ts         │
│       └─> Execute Python bridge script         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Python Bridge Script                            │
│  └─> Import jetextractors                      │
│       └─> extractor.resolve(channelId)         │
│            └─> Return {                          │
│                  url: 'https://.../hls.m3u8',   │
│                  headers: {...},                 │
│                  quality: 'HD'                   │
│                }                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Browser (HLS.js Player)                         │
│  └─> Load direct m3u8 URL                      │
│       └─> Play video (NO ADS!)                 │
└─────────────────────────────────────────────────┘
```

**Development Phases:**
- **Phase 1** (POC): 3-5 days - Test JetExtractors with one source
- **Phase 2** (Multi-source): 5-7 days - Add multiple sources + fallbacks
- **Phase 3** (Production): 3-5 days - Caching, monitoring, optimization
- **Total**: 11-17 days

**Pros:**
- ✅ True ad-free streaming
- ✅ Open-source solution
- ✅ Multiple source options
- ✅ Proven by Mad Titan Sports

**Cons:**
- ⚠️ Requires Python environment (Docker)
- ⚠️ Moderate complexity
- ⚠️ Sources may change over time

---

## 📊 **Current Implementation Status**

### **✅ Completed Features**

1. **DaddyLive Integration**
   - Match listings API
   - Channel mapping
   - Real-time updates

2. **Enhanced Filtering**
   - Team filter (All Clubs, Arsenal, Chelsea, etc.)
   - Competition filter (UCL, EPL, La Liga, etc.)
   - Country filter (England, Spain, Italy, etc.)

3. **Time Management**
   - 12-hour format with timezone
   - Live match detection
   - Old match removal (>2.5 hours)
   - Chronological sorting

4. **User Interface**
   - Match cards with team logos
   - Competition badges
   - Live indicators
   - Responsive design

5. **Legal Compliance**
   - DaddyLive attribution
   - Third-party disclaimer
   - Ad blocker recommendations

### **⚠️ Current Issues**

1. **Embedded Ads** (PRIMARY ISSUE)
   - DaddyLive iframe contains:
     - Countdown timers
     - Unmute ads
     - Popup attempts
   - Cross-Origin restrictions prevent ad blocking
   - **Solution**: JetExtractors implementation

2. **Stream Quality Control**
   - No quality selection available
   - Single stream source (DaddyLive only)
   - No multi-source fallback
   - **Solution**: Multi-source JetExtractors integration

---

## 🛠️ **Technical Stack**

### **Frontend**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React 18

### **Backend (Current)**
- Next.js API Routes
- Axios for HTTP requests
- Server-side data fetching

### **Backend (Proposed - JetExtractors)**
- Python 3.8+ (in Docker container)
- JetExtractors library
- ResolveURL library
- HLS.js (client-side player)

### **Infrastructure**
- Docker container deployment
- nginx reverse proxy
- SSL/TLS (Let's Encrypt)
- Domain: lolli.eniolabi.com

---

## 📚 **Documentation Files**

### **Implementation Guides**
1. **KODI_IMPLEMENTATION_GUIDE.md** ⭐
   - Complete step-by-step implementation
   - Code examples for all phases
   - Multiple implementation options
   - Legal & ethical considerations

2. **MAD_TITAN_SPORTS_ANALYSIS.md** ⭐
   - Source code analysis findings
   - Architecture breakdown
   - Airtable backend explanation
   - ResolveURL/JetExtractors details

### **Technical Analysis**
3. **AD_BLOCKING_ANALYSIS.md**
   - 4 ad-blocking approaches compared
   - DNS blocking, nginx filtering, stream proxy, extensions
   - Docker deployment considerations
   - Cost analysis

4. **IMPROVEMENTS_COMPLETE.md**
   - Feature changelog
   - Previous session work
   - Migration from web scraping to DaddyLive API

---

## 🎓 **Key Code Locations**

### **Filter Logic** (Header.tsx:20-68)
```typescript
const teams = ['All Clubs', 'Arsenal', 'Chelsea', ...];
const competitions = ['All Competitions', 'UEFA Champions League', ...];
const countries = ['All Countries', 'England', 'Spain', ...];
```

### **Time-Based Sorting** (dashboard.tsx:~100-180)
```typescript
// Remove old matches (>2.5 hours)
const twoAndHalfHoursAgo = new Date(now.getTime() - (2.5 * 60 * 60 * 1000));
filtered = filtered.filter(match => {
  // Keep LIVE, TBD, and recent matches
});

// Sort: LIVE first, then chronological, TBD last
filtered = filtered.sort((a, b) => {
  if (aIsLive && !bIsLive) return -1;
  // ... sorting logic
});
```

### **Player Page** (player/[channelId].tsx:16)
```typescript
// Current implementation (iframe with ads)
const iframeUrl = channelId ? `https://dlhd.dad/stream/stream-${channelId}.php` : '';

// Proposed implementation (direct HLS)
const { data: streamData } = await fetch(`/api/stream/resolve?id=${channelId}`);
const hls = new Hls();
hls.loadSource(streamData.url);
```

### **Stream Resolver (WIP)** (services/daddylive/streamResolver.ts)
```typescript
// Multi-method extraction (not working yet)
async resolveStream(channelId: string): Promise<ResolvedStream | null> {
  // Method 1: Try direct m3u8 URLs
  // Method 2: Extract from page HTML
  // Method 3: Complex authentication
  // Currently all methods fail - DaddyLive obfuscates URLs
}
```

---

## ⚠️ **Legal & Ethical Notes**

### **Disclaimers (Current)**
```
⚠️ Disclaimer: Streams are not hosted on our servers.
This is a fork of DaddyLive streaming service.
All content is provided by third-party sources.

💡 For Best Experience: We recommend using an ad blocker
such as uBlock Origin or AdGuard to block embedded advertisements.
```

### **Compliance Considerations**
1. **Third-party Content**: We aggregate, not host
2. **User Responsibility**: Users comply with local laws
3. **Attribution**: Clear source attribution (DaddyLive, etc.)
4. **Educational Purpose**: Research and development

---

## 🎯 **Next Steps**

### **Immediate Decision Required**
**Question**: Proceed with JetExtractors implementation?

**If YES:**
1. Set up Python environment in Docker
2. Install JetExtractors library
3. Create Python bridge script (Phase 1 POC)
4. Test with single stream source
5. Iterate based on results

**If NO:**
- Continue with current iframe implementation
- Focus on improving other features
- Accept ad presence as trade-off for simplicity

---

## 📊 **Project Metrics**

### **Current Status**
- **Functionality**: ✅ Fully working (with ads)
- **User Experience**: ⚠️ Good but ads impact quality
- **Code Quality**: ✅ Clean, maintainable TypeScript
- **Documentation**: ✅ Comprehensive
- **Performance**: ✅ Fast (SSR + API caching)

### **Post-JetExtractors (Projected)**
- **Functionality**: ✅ Fully working (ad-free)
- **User Experience**: ✅ Excellent
- **Code Quality**: ⚠️ More complex (Node + Python)
- **Maintenance**: ⚠️ Higher (stream sources change)
- **Performance**: ⚠️ Slightly slower (URL extraction overhead)

---

## 🔗 **Important Links**

### **External Resources**
- JetExtractors: https://github.com/cwunder87/jetextractors
- ResolveURL: https://github.com/Gujal00/ResolveURL
- HLS.js: https://github.com/video-dev/hls.js
- Mad Titan Sports: https://magnetic.website/repo

### **Internal Resources**
- Live Site: https://lolli.eniolabi.com
- Project Directory: `/home/olabi/docker/watch_arsenal/`
- Research Files: `/home/olabi/docker/watch_arsenal/research/mad-titan/`

---

**Status**: ✅ Research complete - Awaiting implementation decision
**Recommendation**: Proceed with JetExtractors integration (Phase 1 POC)
**Estimated Timeline**: 11-17 days for complete ad-free solution

**Last Updated**: September 30, 2025 - 4:20 PM
**Author**: Claude (Arsenal Streams Development)
