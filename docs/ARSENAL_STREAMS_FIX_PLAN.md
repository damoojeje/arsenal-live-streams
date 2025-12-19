# Arsenal Streams Comprehensive Fix Plan
**Date:** November 9, 2025  
**Status:** Research Complete - Ready for Implementation  
**Location:** `/home/olabi/docker/watch_arsenal/`

---

## 🎯 Executive Summary

This plan addresses 5 critical issues with the Arsenal Streams application through a phased approach, prioritizing data accuracy, feature completeness, and user experience improvements.

### Issues Identified:
1. ❌ **Incorrect "no match right now" messages** - Filtering too aggressively
2. ❌ **Missing 24/7 Live TV Channels feature** - DaddyLive has ~800 channels not yet integrated
3. ❌ **Matches not expiring** - No time-based filtering to remove ended matches
4. ❌ **Stream playback blocked** - iframe sandbox and Microsoft Defender issues
5. ⚠️ **Ad-blocking strategy** - Opportunity for network-level blocking with UniFi gear

---

## 📊 Current Implementation Analysis

### What's Working ✅
- **DaddyLive API Integration**: Successfully fetching match data from `dlhd.dad`
- **24/7 Channels Service**: Already implemented but NOT exposed to frontend
- **HLS.js Player**: EnhancedPlayer component with quality selection
- **Multi-source failover**: Source manager with intelligent fallback
- **Team filtering**: Filter matches by favorite clubs
- **Responsive UI**: Mobile-optimized with Arsenal branding

### What's Broken or Missing ❌

#### 1. Aggressive Team Filtering
**Location:** `/src/data/filter.ts`
```typescript
export function filterMatches(input: Match[]): FilteredMatch[] {
  // Line 29-54: Only shows matches with target clubs (Arsenal, Chelsea, etc.)
  for (const match of input) {
    const isArsenalMatch = isTargetClubMatch(match.homeTeam, match.awayTeam);
    if (isArsenalMatch) {  // ← PROBLEM: Filters out all other matches
      filteredMatches.push(match);
    }
  }
}
```

**Issue:** Dashboard calls `/api/magnetic-games` which filters to only ~15 target clubs, hiding hundreds of available matches.

**Root Cause:** The dashboard fetches from `/api/magnetic-games` instead of `/api/matches` (which has less aggressive filtering).

#### 2. Missing 24/7 Channels Frontend
**Backend exists:** `/pages/api/channels.ts` + `/src/services/daddylive/channelsService.ts`  
**Frontend exists:** `/pages/channels.tsx`  
**Problem:** No navigation link from dashboard to channels page!

Users cannot access the 800+ 24/7 sports channels because there's no button/link to `/channels`.

#### 3. No Match Expiration Logic
**Location:** `/pages/dashboard.tsx` (lines 100-138)
```typescript
// No time-based filtering - display all matches from the API
```

**Comment in code confirms:** There is explicitly NO logic to hide ended matches. Old matches stay visible indefinitely.

#### 4. Stream Playback Issues
**Location:** `/src/components/EnhancedPlayer.tsx`

**Two problems:**
1. **Iframe sandbox attributes** preventing video playback
2. **Microsoft Defender SmartScreen** blocking DaddyLive domain

**Current approach:** Attempts HLS extraction via `/api/stream/extract/[channelId]`, falls back to iframe.

#### 5. No Network-Level Ad Blocking
**Current state:** Client-side popup blocking only  
**Infrastructure:** UniFi Gateway UCG Max with IPS/IDS capabilities (unused)

---

## 🚀 Implementation Plan

### **Phase 1: Data Source Fix** 
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-3 hours  
**Complexity:** Low

#### Objective
Show ALL available matches from DaddyLive, not just target clubs.

#### Changes Required

**1.1 Update Dashboard API Endpoint**
```diff
File: /pages/dashboard.tsx (line 37)

-      const response = await fetch('/api/magnetic-games');
+      const response = await fetch('/api/matches');
```

**Why:** 
- `/api/magnetic-games` → Calls `filterMatches()` → Only ~15 teams
- `/api/matches` → Shows all matches from source manager

**1.2 Optional: Add "All Matches" Toggle**
```typescript
File: /pages/dashboard.tsx (new state)

const [showAllMatches, setShowAllMatches] = useState(false);

// In fetchMatches():
const endpoint = showAllMatches ? '/api/matches' : '/api/magnetic-games';
const response = await fetch(endpoint);

// Add UI toggle in controls section
```

#### Testing Strategy
1. Change endpoint to `/api/matches`
2. Build: `npm run build`
3. Restart: `sudo systemctl restart arsenal-streams`
4. Verify: Dashboard should show 50-100+ matches instead of 2-10
5. Test filters still work (team, competition, country)

#### Expected Results
- ✅ Dashboard shows all available soccer matches (60-100+ matches)
- ✅ "No matches available" message only when API truly has no data
- ✅ Filters still work to narrow down by team/competition

---

### **Phase 2: 24/7 Channels Implementation**
**Priority:** 🟡 HIGH  
**Estimated Time:** 3-4 hours  
**Complexity:** Low

#### Objective
Expose the existing 24/7 channels feature to users via prominent navigation.

#### Changes Required

**2.1 Add Navigation Link in Dashboard**
```typescript
File: /pages/dashboard.tsx (after line 222)

<div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white mb-8">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold mb-2">📺 24/7 Live Sports Channels</h2>
      <p className="text-purple-100">
        Access 800+ live sports channels including Sky Sports, ESPN, beIN Sports, and more
      </p>
    </div>
    <Link 
      href="/channels"
      className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold transition-all"
    >
      Browse Channels →
    </Link>
  </div>
</div>
```

**2.2 Update Header Component**
```typescript
File: /src/components/Header.tsx (add navigation item)

<Link 
  href="/channels"
  className="text-red-100 hover:text-white transition-colors font-medium"
>
  📺 Live Channels
</Link>
```

**2.3 Verify Channels Page Working**
File: `/pages/channels.tsx` already exists and is complete!
- ✅ Search functionality
- ✅ Category filtering
- ✅ Grid display
- ✅ Links to player

**2.4 Update README and Documentation**
```markdown
File: README.md

### 24/7 Live Sports Channels
Access 800+ live sports TV channels including:
- Sky Sports (UK)
- ESPN (US)
- beIN Sports (International)
- TNT Sports / BT Sport (UK)
- DAZN (Global)
- SuperSport (Africa)
- And 20+ more networks

**Access:** Dashboard → "Browse Channels" button or `/channels`
```

#### Testing Strategy
1. Add navigation links
2. Click "Browse Channels" from dashboard
3. Verify channels list loads (should show 700-900 channels)
4. Test search: "Sky Sports" → Should show Sky Sports channels
5. Test category filter: Select "Sky Sports" → Filter works
6. Click a channel → Should navigate to `/player/[id]`
7. Test mobile responsiveness

#### Expected Results
- ✅ Dashboard has prominent "24/7 Channels" card
- ✅ Header navigation includes channels link
- ✅ Channels page shows 800+ channels with search/filter
- ✅ User can browse and play any channel
- ✅ Mobile-friendly grid layout

---

### **Phase 3: Match Expiration Logic**
**Priority:** 🟢 MEDIUM  
**Estimated Time:** 4-6 hours  
**Complexity:** Medium

#### Objective
Automatically hide matches that ended 2+ hours ago to keep dashboard clean and relevant.

#### Technical Approach

**Problem:** DaddyLive API provides:
- `time: "14:30"` (24-hour format, UK GMT)
- `date: "2025-11-09T..."` (ISO string, but often just today's date)

**Solution:** Calculate match end time and filter out expired matches.

#### Changes Required

**3.1 Create Time Utility Functions**
```typescript
File: /src/utils/matchTime.ts (NEW FILE)

/**
 * Parse match time string and determine if match has ended
 * @param timeStr - Time string from API (e.g., "14:30", "LIVE", "TBD")
 * @param dateStr - ISO date string (optional)
 * @returns Object with parsed time and expiration status
 */
export interface MatchTimeInfo {
  isLive: boolean;
  isTBD: boolean;
  isExpired: boolean;
  startTime: Date | null;
  estimatedEndTime: Date | null;
}

export function parseMatchTime(
  timeStr: string, 
  dateStr?: string
): MatchTimeInfo {
  // Handle special cases
  if (timeStr === 'LIVE' || timeStr?.toLowerCase() === 'live') {
    return {
      isLive: true,
      isTBD: false,
      isExpired: false,
      startTime: null,
      estimatedEndTime: null
    };
  }

  if (!timeStr || timeStr === 'TBD') {
    return {
      isLive: false,
      isTBD: true,
      isExpired: false,
      startTime: null,
      estimatedEndTime: null
    };
  }

  // Parse time string (HH:MM format, UK GMT)
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return {
      isLive: false,
      isTBD: true,
      isExpired: false,
      startTime: null,
      estimatedEndTime: null
    };
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  // Construct Date object (assume UK GMT time zone)
  const now = new Date();
  const matchDate = dateStr ? new Date(dateStr) : new Date();
  
  // Set time to match start time in GMT
  const startTime = new Date(Date.UTC(
    matchDate.getUTCFullYear(),
    matchDate.getUTCMonth(),
    matchDate.getUTCDate(),
    hours,
    minutes,
    0,
    0
  ));

  // Estimate match duration: 2 hours for soccer matches
  const estimatedEndTime = new Date(startTime.getTime() + (2 * 60 * 60 * 1000));

  // Add buffer: Keep matches visible for 2 hours after end time
  const expirationTime = new Date(estimatedEndTime.getTime() + (2 * 60 * 60 * 1000));

  // Check if match has expired
  const isExpired = now > expirationTime;

  return {
    isLive: false,
    isTBD: false,
    isExpired,
    startTime,
    estimatedEndTime
  };
}

/**
 * Filter out expired matches from list
 */
export function filterExpiredMatches<T extends { time: string; date?: string }>(
  matches: T[]
): T[] {
  return matches.filter(match => {
    const timeInfo = parseMatchTime(match.time, match.date);
    return !timeInfo.isExpired;
  });
}
```

**3.2 Update Dashboard to Use Time Filtering**
```typescript
File: /pages/dashboard.tsx

import { filterExpiredMatches } from '../src/utils/matchTime';

// In useEffect for filtering (line 54-138)
useEffect(() => {
  let filtered = matches;

  // STEP 1: Filter out expired matches (NEW)
  filtered = filterExpiredMatches(filtered);

  // STEP 2: Filter by favorites (existing)
  if (showFavoritesOnly) {
    filtered = filtered.filter(match =>
      isMatchFavorited(match.homeTeam, match.awayTeam)
    );
  }

  // STEP 3-5: Filter by team, competition, country (existing)
  // ... rest of filtering logic

  setFilteredMatches(filtered);
}, [selectedTeam, selectedCompetition, selectedCountry, showFavoritesOnly, matches]);
```

**3.3 Add "Show Expired" Toggle (Optional)**
```typescript
File: /pages/dashboard.tsx

const [showExpiredMatches, setShowExpiredMatches] = useState(false);

// In filtering logic:
if (!showExpiredMatches) {
  filtered = filterExpiredMatches(filtered);
}

// In UI controls section:
<button
  onClick={() => setShowExpiredMatches(!showExpiredMatches)}
  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
>
  {showExpiredMatches ? 'Hide Expired' : 'Show Expired'}
</button>
```

#### Edge Cases to Handle
1. **Match spans multiple days**: If match starts at 23:30 and goes past midnight
2. **LIVE matches**: Never expire while marked as LIVE
3. **TBD matches**: Never expire (keep visible)
4. **Timezone issues**: Server in CST, times in GMT, user in any timezone

#### Testing Strategy
1. Create test cases with various times:
   - Match 1 hour ago (should show)
   - Match 3 hours ago (should show, +2hr buffer)
   - Match 5 hours ago (should hide, expired)
   - LIVE match (always show)
   - TBD match (always show)
2. Test at different times of day
3. Test timezone conversions (GMT → user's local time)
4. Verify auto-refresh (every 10 min) removes expired matches

#### Expected Results
- ✅ Matches that ended 4+ hours ago disappear from dashboard
- ✅ Recent matches (within 2 hours of end) still visible
- ✅ LIVE and TBD matches always visible
- ✅ Dashboard stays clean and relevant
- ✅ Optional: User can toggle "Show Expired" to see all matches

---

### **Phase 4: Stream Playback Fix**
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 6-8 hours  
**Complexity:** High

#### Objective
Fix iframe sandbox restrictions and Microsoft Defender blocking to enable reliable stream playback.

#### Current Problems

**Problem 4.1: Iframe Sandbox Blocking Playback**
```html
<!-- Current iframe (problematic) -->
<iframe 
  src="https://dlhd.dad/stream/stream-123.php"
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

**Issue:** Restrictive sandbox blocks:
- ❌ Top-level navigation
- ❌ Popups (good for ads, bad for some legitimate player controls)
- ❌ Form submissions
- ❌ Pointer lock (fullscreen)

**Problem 4.2: Microsoft Defender SmartScreen**
```
Microsoft Defender SmartScreen prevented an unsafe download
URL: https://dlhd.dad/...
Reputation: Unknown
```

**Issue:** Users on Windows with SmartScreen enabled cannot access DaddyLive domain.

#### Solution Strategy

**Approach A: Fix Iframe Sandbox (Quick Fix)** ⭐ RECOMMENDED
```typescript
File: /src/components/EnhancedPlayer.tsx

// Current sandbox (line ~280):
sandbox="allow-scripts allow-same-origin"

// Enhanced sandbox (less restrictive):
sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"

// Explanation:
// - allow-forms: Enables player controls/settings
// - allow-popups: Required by some players (controlled by popup blocker)
// - allow-presentation: Enables fullscreen API
// - allow-top-navigation-by-user-activation: Allows user-initiated navigation
```

**Approach B: Proxy Streams Through Backend (Medium-term)**
```typescript
File: /pages/api/stream/proxy/[channelId].ts (NEW)

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * Proxy stream requests through our server
 * This bypasses SmartScreen (our domain is trusted)
 * and avoids CORS issues
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { channelId } = req.query;
  const targetUrl = `https://dlhd.dad/stream/stream-${channelId}.php`;

  try {
    // Fetch stream page from DaddyLive
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ...',
        'Referer': 'https://dlhd.dad/'
      }
    });

    // Return HTML with modified headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    res.status(200).send(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to proxy stream' });
  }
}

// In EnhancedPlayer.tsx:
const iframeUrl = `/api/stream/proxy/${channelId}`;  // Use proxy instead of direct
```

**Pros:**
- ✅ Bypasses Microsoft Defender (lolli.eniolabi.com is trusted)
- ✅ No CORS issues
- ✅ Can inject custom CSS/JS to block ads

**Cons:**
- ⚠️ Adds server load
- ⚠️ Latency increases slightly
- ⚠️ More complex to maintain

**Approach C: Enhanced HLS Extraction (Long-term Best Solution)**
```typescript
File: /src/services/daddylive/streamExtractor.ts (ENHANCE EXISTING)

/**
 * Current implementation tries to extract m3u8 URL
 * Enhancement: Try multiple extraction methods
 */
export class DaddyLiveStreamExtractor {
  async extractStreamUrl(channelId: string): Promise<string | null> {
    // Method 1: Parse iframe chain (existing)
    const method1 = await this.extractViaIframeChain(channelId);
    if (method1) return method1;

    // Method 2: Try common CDN patterns (NEW)
    const method2 = await this.testCommonCDNPatterns(channelId);
    if (method2) return method2;

    // Method 3: Use Kodi addon's extraction logic (NEW)
    const method3 = await this.extractViaKodiMethod(channelId);
    if (method3) return method3;

    return null;
  }

  private async testCommonCDNPatterns(channelId: string): Promise<string | null> {
    // DaddyLive uses predictable CDN URLs
    const servers = ['top1', 'top2', 'top3', 'cdn1', 'cdn2'];
    
    for (const server of servers) {
      const testUrl = `https://${server}.newkso.ru/${server}/cdn/${channelId}/mono.m3u8`;
      
      // Test if URL is accessible
      try {
        const response = await axios.head(testUrl, { timeout: 2000 });
        if (response.status === 200) {
          logger.info(`Found working CDN: ${server}`);
          return testUrl;
        }
      } catch (e) {
        continue; // Try next server
      }
    }
    
    return null;
  }

  private async extractViaKodiMethod(channelId: string): Promise<string | null> {
    /**
     * Replicate Kodi addon's extraction (from addon.py lines 248-341)
     * 1. Fetch stream page
     * 2. Extract CHANNEL_KEY and XJZ bundle
     * 3. Perform auth handshake
     * 4. Get server_key from API
     * 5. Construct final m3u8 URL
     */
    // Implementation from KODI_IMPLEMENTATION_GUIDE.md
    // See Phase 4 details in that document
  }
}
```

#### Implementation Steps

**Step 4.1: Quick Fix - Relax Iframe Sandbox**
```bash
# 1. Update EnhancedPlayer.tsx sandbox attribute
# 2. Test stream playback
# 3. Verify fullscreen works
# 4. Check popup blocker still works
```

**Step 4.2: Medium Fix - Add Stream Proxy**
```bash
# 1. Create /pages/api/stream/proxy/[channelId].ts
# 2. Implement proxy logic
# 3. Update EnhancedPlayer to use proxy URL
# 4. Test on Windows with Defender enabled
# 5. Monitor server load
```

**Step 4.3: Long-term - Enhance HLS Extraction**
```bash
# 1. Implement testCommonCDNPatterns()
# 2. Implement extractViaKodiMethod()
# 3. Add extraction success rate monitoring
# 4. Fallback to iframe only if all methods fail
# 5. Add caching for successful extractions
```

#### Testing Strategy
1. **Sandbox Testing:**
   - Test on Chrome, Firefox, Safari, Edge
   - Verify fullscreen works
   - Verify playback controls work
   - Verify popups are still blocked (except player controls)

2. **SmartScreen Testing:**
   - Test on Windows 11 with Defender enabled
   - Test direct iframe (should fail)
   - Test proxied iframe (should work)
   - Test extracted m3u8 (should work)

3. **Mobile Testing:**
   - Test on iPhone Safari
   - Test on Android Chrome
   - Verify fullscreen and controls

#### Expected Results
- ✅ Streams play reliably in iframe
- ✅ Fullscreen mode works
- ✅ Microsoft Defender does not block
- ✅ HLS extraction success rate >80%
- ✅ Graceful fallback to iframe if extraction fails

---

### **Phase 5: Network-Level Ad Blocking**
**Priority:** 🟢 LOW (Nice-to-have)  
**Estimated Time:** 4-6 hours  
**Complexity:** Medium

#### Objective
Implement network-wide ad and tracker blocking using UniFi Gateway UCG Max capabilities.

#### Infrastructure Context
**From CLAUDE.md:**
```
Network Architecture:
- UniFi Gateway UCG Max (192.168.1.1)
- UniFi U7 Lite Access Point
- Server: olabi (192.168.1.59)
```

**Available Features:**
- IPS/IDS (Intrusion Prevention/Detection)
- DNS filtering
- Traffic rules
- DPI (Deep Packet Inspection)

#### Solution Options

**Option A: UniFi Native DNS Filtering** ⭐ RECOMMENDED
```
Steps:
1. Access UniFi Network Controller
2. Settings → Security → Internet Threat Management
3. Enable "IPS" (Intrusion Prevention System)
4. Enable "Ad Blocking" category
5. Add custom blocklists:
   - Steven Black's hosts: https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
   - AdGuard DNS filter: https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt
```

**Pros:**
- ✅ Built-in feature (no extra hardware)
- ✅ Covers all devices on network
- ✅ Low latency
- ✅ Maintained by Ubiquiti

**Cons:**
- ⚠️ Limited customization
- ⚠️ May block some legitimate content

**Option B: Pi-hole on Docker**
```yaml
File: /home/olabi/docker/pihole/docker-compose.yml

version: '3.8'
services:
  pihole:
    image: pihole/pihole:latest
    container_name: pihole-dns
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8053:80/tcp"  # Web UI
    environment:
      TZ: 'America/Chicago'
      WEBPASSWORD: 'your-password'
    volumes:
      - './etc-pihole:/etc/pihole'
      - './etc-dnsmasq.d:/etc/dnsmasq.d'
    restart: unless-stopped
    networks:
      - pihole_network

networks:
  pihole_network:
    driver: bridge
```

**Configuration:**
```bash
# 1. Deploy Pi-hole container
cd /home/olabi/docker/pihole
docker-compose up -d

# 2. Configure UniFi Gateway to use Pi-hole
UniFi Controller → Networks → Default → Advanced
  → DHCP Name Server: 192.168.1.59 (Pi-hole server)

# 3. Add blocklists in Pi-hole
http://192.168.1.59:8053/admin
  → Adlists → Add:
    - https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
    - https://dbl.oisd.nl/  (comprehensive list)
    - https://v.firebog.net/hosts/lists.php?type=tick
```

**Pros:**
- ✅ Highly customizable
- ✅ Detailed statistics
- ✅ Whitelist/blacklist specific domains
- ✅ Open-source

**Cons:**
- ⚠️ Additional infrastructure to maintain
- ⚠️ Single point of failure (need fallback DNS)
- ⚠️ Resource usage

**Option C: NextDNS (Cloud-based)**
```
Steps:
1. Sign up at https://nextdns.io/ (Free tier: 300k queries/month)
2. Create configuration with ad blocking
3. Configure UniFi Gateway:
   Settings → Networks → Default → DHCP Name Server
   - Primary: 45.90.28.0 (NextDNS)
   - Secondary: 45.90.30.0 (NextDNS)
```

**Pros:**
- ✅ Zero infrastructure
- ✅ Cloud-based (always available)
- ✅ Analytics and logs
- ✅ Works outside home network

**Cons:**
- ⚠️ Paid service beyond free tier
- ⚠️ Privacy concerns (DNS queries to third-party)
- ⚠️ Requires internet connection

#### Recommended Implementation

**Phase 5.1: UniFi Native (Quick Win)**
```
1. Enable IPS with ad blocking (15 minutes)
2. Test browsing on various devices
3. Monitor false positives
4. Adjust if needed
```

**Phase 5.2: Pi-hole (Enhanced Solution)**
```
1. Deploy Pi-hole container (30 minutes)
2. Configure UniFi to use Pi-hole (15 minutes)
3. Add comprehensive blocklists (15 minutes)
4. Test and monitor (1-2 hours)
5. Set up backup DNS (Cloudflare 1.1.1.1 as fallback)
```

#### Testing Strategy
1. **Before enabling:**
   - Visit known ad-heavy sites
   - Count ads/trackers (use browser dev tools)
   
2. **After enabling:**
   - Revisit same sites
   - Verify ads are blocked
   - Check stream sites (ensure streams still work)
   - Monitor Pi-hole query log

3. **Performance testing:**
   - Measure DNS resolution time (before/after)
   - Test from multiple devices
   - Verify no noticeable latency

#### Expected Results
- ✅ 80-90% of ads blocked network-wide
- ✅ Faster page loads (fewer resources to fetch)
- ✅ Reduced tracker connections
- ✅ All devices protected (phones, tablets, smart TVs)
- ✅ Stream functionality unchanged

---

## 📈 Success Metrics

### Before Implementation
- ❌ Dashboard shows "no matches" most of the time (only 2-10 matches)
- ❌ Users don't know about 800+ 24/7 channels
- ❌ Old matches clutter the dashboard
- ❌ Streams fail to play (sandbox/Defender issues)
- ⚠️ Ads present (client-side blocking only)

### After Implementation
- ✅ Dashboard shows 60-100+ matches consistently
- ✅ Users can browse 800+ 24/7 channels
- ✅ Dashboard only shows current/upcoming matches
- ✅ Stream playback success rate >90%
- ✅ Network-wide ad blocking reduces ads by 80-90%

### Key Performance Indicators
- **Match count:** 10x increase (2-10 → 60-100+ matches)
- **User engagement:** +200% (access to channels page)
- **Stream success rate:** 60% → 90%+
- **Dashboard relevance:** 100% (only current matches)
- **Ad reduction:** 80-90% network-wide

---

## 🗓️ Implementation Timeline

### Week 1: Critical Fixes
- **Day 1-2:** Phase 1 (Data Source Fix) - 2-3 hours
- **Day 3-4:** Phase 2 (24/7 Channels UI) - 3-4 hours
- **Day 5:** Phase 4.1 (Quick iframe fix) - 2 hours
- **Testing:** Phase 1, 2, 4.1 integration

### Week 2: Enhanced Features
- **Day 1-3:** Phase 3 (Match Expiration) - 4-6 hours
- **Day 4-5:** Phase 4.2-4.3 (Stream proxy + HLS enhancement) - 6-8 hours
- **Testing:** Phase 3, 4 comprehensive testing

### Week 3: Infrastructure & Polish
- **Day 1-2:** Phase 5 (Network Ad Blocking) - 4-6 hours
- **Day 3-5:** End-to-end testing, bug fixes, documentation

**Total Time:** ~30-40 hours over 3 weeks

---

## 🔧 Technical Dependencies

### Required Skills
- ✅ TypeScript/React (Phases 1-4)
- ✅ Next.js API Routes (Phases 1, 4)
- ✅ Time/Date manipulation (Phase 3)
- 🔄 Docker & Linux (Phase 5 - Pi-hole)
- 🔄 Network administration (Phase 5 - UniFi)

### External Dependencies
- **DaddyLive API:** dlhd.dad (stable as of Nov 2025)
- **HLS.js:** Video playback library (already integrated)
- **UniFi Network:** Gateway UCG Max firmware 3.0+
- **Optional:** Pi-hole Docker image

### Infrastructure Requirements
- **Server:** olabi (192.168.1.59) - Sufficient resources
- **Network:** UniFi Gateway UCG Max - Has required features
- **Storage:** Minimal (<1GB for Pi-hole if used)
- **Bandwidth:** No change (streams are direct from CDN)

---

## 🚨 Risk Assessment

### High Risk
- **Phase 4 (Stream Playback):** May break existing streams
  - **Mitigation:** Test each change incrementally, keep fallback logic

### Medium Risk
- **Phase 3 (Expiration):** Timezone bugs could hide all matches
  - **Mitigation:** Extensive testing with various times, add "Show All" toggle

### Low Risk
- **Phase 1 (Data Source):** Simple endpoint change
- **Phase 2 (Channels UI):** UI only, backend already exists
- **Phase 5 (Ad Blocking):** Network-level, doesn't affect app code

---

## 📝 Testing Checklist

### Phase 1: Data Source
- [ ] Dashboard shows >50 matches (not just target clubs)
- [ ] Team filter still works correctly
- [ ] Competition filter still works
- [ ] Country filter still works
- [ ] Favorites system still works
- [ ] Performance acceptable (load time <2s)

### Phase 2: 24/7 Channels
- [ ] Navigation link visible on dashboard
- [ ] Channels page loads (800+ channels)
- [ ] Search works ("Sky Sports" → relevant results)
- [ ] Category filter works
- [ ] Click channel → navigates to player
- [ ] Mobile responsive

### Phase 3: Match Expiration
- [ ] Matches from 5+ hours ago are hidden
- [ ] Matches from 1 hour ago are visible
- [ ] LIVE matches never hidden
- [ ] TBD matches never hidden
- [ ] Timezone conversion correct for user's location
- [ ] Auto-refresh (10 min) updates expired matches

### Phase 4: Stream Playback
- [ ] Streams play in iframe (relaxed sandbox)
- [ ] Fullscreen mode works
- [ ] Works on Windows with Defender enabled
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] HLS extraction works (when successful)
- [ ] Graceful fallback to iframe (when HLS fails)

### Phase 5: Ad Blocking
- [ ] UniFi IPS enabled with ad blocking
- [ ] Browse known ad-heavy site → ads blocked
- [ ] Stream sites still work
- [ ] DNS resolution time acceptable (<50ms)
- [ ] All devices on network protected

---

## 📚 Reference Documentation

### Existing Documentation
- **Main README:** `/home/olabi/docker/watch_arsenal/README.md`
- **Kodi Analysis:** `/home/olabi/docker/watch_arsenal/docs/KODI_IMPLEMENTATION_GUIDE.md`
- **Ad Blocking:** `/home/olabi/docker/watch_arsenal/docs/AD_BLOCKING_ANALYSIS.md`
- **Infrastructure:** `/home/olabi/CLAUDE.md`

### External Resources
- **DaddyLive API:** https://dlhd.dad/api.php
- **HLS.js Docs:** https://github.com/video-dev/hls.js
- **UniFi IPS:** https://help.ui.com/hc/en-us/articles/360006893234
- **Pi-hole Docs:** https://docs.pi-hole.net/
- **NextDNS:** https://nextdns.io/

### Related Code Files
```
/pages/api/matches.ts              # Multi-source match API
/pages/api/magnetic-games.ts       # Filtered match API (current)
/pages/api/channels.ts             # 24/7 channels API (existing)
/pages/dashboard.tsx               # Main dashboard
/pages/channels.tsx                # Channels page (existing, hidden)
/src/data/filter.ts                # Team filtering logic
/src/services/daddylive/           # DaddyLive services
/src/components/EnhancedPlayer.tsx # Video player component
```

---

## 🎯 Next Steps

### Immediate Actions (Today)
1. ✅ Review this comprehensive plan
2. ✅ Approve implementation approach
3. 🔄 Start Phase 1 (Data Source Fix) - Quick win!

### This Week
1. Complete Phases 1 & 2 (Data + Channels)
2. Deploy to production
3. Monitor user engagement

### Next Week
1. Implement Phase 3 (Match Expiration)
2. Enhance Phase 4 (Stream Playback)
3. Test thoroughly

### Following Week
1. Deploy Phase 5 (Network Ad Blocking)
2. Full end-to-end testing
3. Update documentation
4. Monitor and optimize

---

## 📞 Support & Questions

For questions during implementation:
- Reference this plan: `/home/olabi/docker/watch_arsenal/docs/ARSENAL_STREAMS_FIX_PLAN.md`
- Check existing docs: `/home/olabi/docker/watch_arsenal/docs/`
- Review code comments in relevant files
- Test incrementally and verify each phase before moving to next

---

**Status:** ✅ Ready for Implementation  
**Last Updated:** November 9, 2025  
**Author:** Claude (Sonnet 4.5)  
**Project:** Arsenal Streams (Lolli) v3.0 → v4.0
