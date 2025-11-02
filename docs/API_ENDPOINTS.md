# 🌐 Lolli Live Streams - API Documentation

**Version**: 3.0 Development
**Base URL**: https://lolli.eniolabi.com
**Last Updated**: November 1, 2025

---

## 📋 **Table of Contents**

1. [Match APIs](#match-apis)
2. [Stream APIs](#stream-apis)
3. [Legacy APIs](#legacy-apis)
4. [Response Formats](#response-formats)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## 🎯 **Match APIs**

### **GET /api/matches**

**Primary endpoint** for fetching live match data with intelligent caching and fallback.

#### **Request**

```http
GET /api/matches HTTP/1.1
Host: lolli.eniolabi.com
```

#### **Response** (200 OK)

```json
[
  {
    "id": "daddylive-arsenal-vs-chelsea-15:00",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "time": "15:00",
    "date": "2025-11-01T12:00:00.000Z",
    "competition": "England - Premier League",
    "links": [
      {
        "url": "468",
        "quality": "HD",
        "type": "stream",
        "language": "Sky Sports Main Event",
        "channelName": "Sky Sports Main Event"
      }
    ],
    "source": "daddylive",
    "isArsenalMatch": true,
    "streamLinks": [
      {
        "source": "DaddyLive",
        "url": "468",
        "quality": "HD"
      }
    ]
  }
]
```

#### **Response Headers**

```http
Cache-Control: s-maxage=60, stale-while-revalidate=300
Content-Type: application/json
X-Cache: HIT | STALE | FRESH | MISS
X-Cache-Age: 45
X-Source: DaddyLive | Fallback | Fallback-Error
```

#### **Cache Behavior**

| Cache Age | Response Type | Behavior |
|-----------|---------------|----------|
| < 60s | HIT | Return cached data immediately |
| > 60s | STALE | Return cached data + refresh in background |
| No cache | FRESH | Fetch fresh data from DaddyLive |
| All fail | FALLBACK | Return sample fallback data |

#### **Error Response** (500 Internal Server Error)

```json
{
  "error": "Failed to fetch games"
}
```

---

### **GET /api/magnetic-games**

**Simplified endpoint** that returns matches without caching (always fresh).

#### **Request**

```http
GET /api/magnetic-games HTTP/1.1
Host: lolli.eniolabi.com
```

#### **Response** (200 OK)

Same format as `/api/matches`, but without caching headers.

```http
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

#### **Use Cases**

- Force fresh data fetch
- Debugging cache issues
- Admin/monitoring tools

---

### **GET /api/matches-fallback**

**Fallback endpoint** that returns sample match data when all sources are down.

#### **Request**

```http
GET /api/matches-fallback HTTP/1.1
Host: lolli.eniolabi.com
```

#### **Response** (200 OK)

```json
[
  {
    "id": "fallback-1",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "time": "15:00",
    "date": "2025-11-01T00:00:00.000Z",
    "competition": "England - Premier League",
    "links": [
      {
        "url": "fallback-channel-1",
        "quality": "HD",
        "type": "stream",
        "language": "English",
        "channelName": "Sky Sports Main Event"
      }
    ],
    "source": "fallback",
    "isArsenalMatch": true,
    "streamLinks": [
      {
        "source": "Fallback",
        "url": "fallback-channel-1",
        "quality": "HD"
      }
    ]
  }
]
```

#### **Use Cases**

- System testing
- UI development
- Emergency fallback when DaddyLive is down

---

## 📺 **Stream APIs**

### **GET /api/stream/[channelId]**

**Experimental endpoint** for stream metadata (currently not implemented).

#### **Planned Implementation (Phase 2)**

```http
GET /api/stream/468 HTTP/1.1
Host: lolli.eniolabi.com
```

#### **Planned Response**

```json
{
  "channelId": "468",
  "streamUrl": "https://cdn.daddylive.xyz/hls/stream-468.m3u8",
  "quality": "HD",
  "type": "hls",
  "headers": {
    "Referer": "https://dlhd.dad/",
    "Origin": "https://dlhd.dad"
  }
}
```

---

### **GET /api/stream/resolve**

**Planned endpoint** (Phase 2.1) for extracting direct stream URLs from DaddyLive pages.

#### **Planned Implementation**

```http
GET /api/stream/resolve?channelId=468 HTTP/1.1
Host: lolli.eniolabi.com
```

#### **Planned Response**

```json
{
  "success": true,
  "channelId": "468",
  "streamUrl": "https://cdn.daddylive.xyz/hls/stream-468.m3u8",
  "quality": "HD",
  "extractedAt": "2025-11-01T12:00:00.000Z",
  "expiresIn": 3600
}
```

#### **Error Response**

```json
{
  "success": false,
  "error": "Failed to extract stream URL",
  "fallbackUrl": "https://dlhd.dad/stream/stream-468.php"
}
```

---

## 📜 **Legacy APIs**

### **GET /api/direct/[channelId]**

**Legacy endpoint** - Redirects to player page.

### **GET /api/embed/[channelId]**

**Legacy endpoint** - Returns embed metadata.

### **GET /api/aggregated-sources**

**Legacy endpoint** - Previously used for multi-source aggregation.

**Status**: Deprecated, will be removed in v3.0

---

## 📊 **Response Formats**

### **Match Object**

```typescript
interface FilteredMatch {
  id: string;                    // Unique match identifier
  homeTeam: string;              // Home team name
  awayTeam: string;              // Away team name
  time: string;                  // Kick-off time ("15:00" UTC or "LIVE")
  date: string;                  // ISO 8601 date string
  competition: string;           // Competition name
  links: StreamLink[];           // Array of available streams
  source: string;                // Data source identifier
  isArsenalMatch: boolean;       // Arsenal playing flag
  streamLinks?: StreamLinkLegacy[];  // Legacy format (backwards compat)
}
```

### **Stream Link Object**

```typescript
interface StreamLink {
  url: string;                   // Channel ID or stream URL
  quality: string;               // "HD", "SD", "Mobile"
  type: 'stream' | 'acestream' | 'sopcast' | 'hls';
  language?: string;             // Stream language or channel name
  channelName?: string;          // Broadcast channel name
}
```

### **Legacy Stream Link**

```typescript
interface StreamLinkLegacy {
  source: string;                // Source name ("DaddyLive", etc.)
  url: string;                   // Stream URL or channel ID
  quality: string;               // Quality indicator
}
```

---

## ⚠️ **Error Handling**

### **Error Response Format**

```json
{
  "error": "Error message describing what went wrong"
}
```

### **HTTP Status Codes**

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | Success | Request completed successfully |
| 405 | Method Not Allowed | Non-GET request to GET-only endpoint |
| 500 | Internal Server Error | DaddyLive API failure (returns fallback data) |

### **Graceful Degradation**

All endpoints follow this error handling hierarchy:

```
1. Try primary source (DaddyLive repos)
       ↓ On Failure
2. Try fallback repos
       ↓ On Failure
3. Return cached data (if available)
       ↓ No Cache
4. Return fallback sample data
       ↓ Complete Failure
5. Return HTTP 500 with error message
```

**Important**: Even on complete failure, we still return HTTP 200 with fallback data to keep the UI functional.

---

## 🚦 **Rate Limiting**

### **Current Implementation**

**No rate limiting currently implemented.**

### **Cache-Based Load Reduction**

- In-memory cache (60s TTL) reduces backend calls by ~98%
- Background refresh prevents blocking requests
- Stale-while-revalidate pattern for optimal UX

### **Request Volume Estimates**

| Scenario | Requests/min | Backend Calls/min |
|----------|--------------|-------------------|
| Single user browsing | 2-5 | 1 (due to cache) |
| 10 concurrent users | 20-50 | 1 (shared cache) |
| 100 concurrent users | 200-500 | 1-2 (shared cache) |

### **Planned Rate Limiting (Phase 6)**

```
Per IP:
- 60 requests per minute
- 1000 requests per hour

Response:
- HTTP 429 Too Many Requests
- Retry-After header
```

---

## 🔐 **Authentication**

**Current Status**: No authentication required

**Planned (Phase 4.3 - Admin Dashboard)**:
- Basic auth for admin endpoints
- API key for programmatic access
- OAuth for user features (favorites, notifications)

---

## 📈 **Performance Considerations**

### **Response Times**

| Endpoint | Cache Hit | Cache Miss | Notes |
|----------|-----------|------------|-------|
| /api/matches | <50ms | 2-5s | DaddyLive API latency |
| /api/magnetic-games | N/A | 2-5s | No caching |
| /api/matches-fallback | <10ms | <10ms | Static data |

### **Payload Sizes**

| Endpoint | Typical Size | Max Size |
|----------|--------------|----------|
| /api/matches | 5-15 KB | 50 KB (100+ matches) |
| /api/magnetic-games | 5-15 KB | 50 KB |
| /api/matches-fallback | 1-2 KB | 2 KB |

### **Optimization Techniques**

1. **In-memory caching** - 60s TTL
2. **Stale-while-revalidate** - Return cache + refresh background
3. **Background refresh** - Non-blocking updates
4. **Gzip compression** - Automatic via Next.js
5. **JSON minification** - Automatic

---

## 🧪 **Testing Endpoints**

### **Health Check**

```bash
# Check if API is responding
curl https://lolli.eniolabi.com/api/matches

# Expected: 200 OK with match data
```

### **Cache Testing**

```bash
# First request (cache miss)
curl -i https://lolli.eniolabi.com/api/matches | grep X-Cache
# Expected: X-Cache: FRESH or X-Cache: MISS

# Second request within 60s (cache hit)
curl -i https://lolli.eniolabi.com/api/matches | grep X-Cache
# Expected: X-Cache: HIT

# Check cache age
curl -i https://lolli.eniolabi.com/api/matches | grep X-Cache-Age
# Expected: X-Cache-Age: [seconds since last refresh]
```

### **Source Testing**

```bash
# Check which source is being used
curl -i https://lolli.eniolabi.com/api/matches | grep X-Source

# Possible values:
# X-Source: DaddyLive          (normal operation)
# X-Source: Fallback           (DaddyLive down, using fallback)
# X-Source: Fallback-Error     (all sources failed)
```

---

## 📝 **Example Usage**

### **JavaScript/TypeScript**

```typescript
// Fetch matches
const response = await fetch('https://lolli.eniolabi.com/api/matches');
const matches = await response.json();

// Filter for Arsenal matches
const arsenalMatches = matches.filter(m => m.isArsenalMatch);

// Get live matches
const liveMatches = matches.filter(m => m.time === 'LIVE');

// Check cache status
const cacheStatus = response.headers.get('X-Cache');
console.log(`Cache: ${cacheStatus}`);
```

### **React Component**

```typescript
import { useEffect, useState } from 'react';

function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch matches:', error);
        setLoading(false);
      });

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetch('/api/matches')
        .then(res => res.json())
        .then(setMatches);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

### **cURL Examples**

```bash
# Basic request
curl https://lolli.eniolabi.com/api/matches

# Pretty-print JSON
curl https://lolli.eniolabi.com/api/matches | jq .

# Show headers
curl -i https://lolli.eniolabi.com/api/matches

# Measure response time
curl -w "@-" -o /dev/null -s https://lolli.eniolabi.com/api/matches <<'EOF'
    time_total:  %{time_total}s\n
EOF

# Filter Arsenal matches (using jq)
curl -s https://lolli.eniolabi.com/api/matches | \
  jq '[.[] | select(.isArsenalMatch == true)]'

# Get live matches only
curl -s https://lolli.eniolabi.com/api/matches | \
  jq '[.[] | select(.time == "LIVE")]'
```

---

## 🔄 **Changelog**

### **v3.0 (In Development)**
- Added `/api/matches` with intelligent caching
- Added `/api/matches-fallback` for reliability
- Simplified `/api/magnetic-games`
- Planned `/api/stream/extract/*` for ad-free playback

### **v2.0 (October 2025)**
- Switched from web scraping to DaddyLive API
- Removed provider selection UI
- Added fallback mechanism
- Improved error handling

### **v1.0 (September 2025)**
- Initial release
- Multi-provider architecture
- Web scraping implementation

---

**Last Updated**: November 1, 2025
**Next Update**: After Phase 2 implementation
**Maintained By**: Claude (Arsenal Streams Development)
