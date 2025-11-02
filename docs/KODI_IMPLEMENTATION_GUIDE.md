# Kodi Implementation Guide: Ad-Free Streaming

**Date**: September 30, 2025
**Purpose**: Implement Kodi-style ad-free streaming in Arsenal Streams
**Based on**: Mad Titan Sports V2.0 addon analysis

---

## 🔍 **How Kodi Achieves Ad-Free Streaming**

### **Key Insight**
Kodi addons bypass ads because they:
1. **Extract direct stream URLs** - Resolve actual m3u8/mp4 URLs from streaming sites
2. **Use native video players** - Play streams directly without loading web pages
3. **Server-side resolution** - All URL extraction happens server-side (Python)
4. **No iframe embedding** - Never load third-party web pages with ads

---

## 📊 **Mad Titan Sports Analysis: Complete Architecture**

### **Addon Structure**
```
plugin.video.madtitansports/
├── default.py                    # Main entry point (uses DI pattern)
├── addon.xml                     # Dependencies & metadata
├── xml/FRONT/MAIN.json           # Content categories (Soccer-Footy, NBA, NFL, etc.)
└── resources/lib/
    ├── DI.py                     # Dependency injection framework
    ├── plugin.py                 # Plugin base class & hook system
    └── plugins/                  # Individual plugins for stream resolution
        ├── magnetic1.py          # Airtable backend integration (OBFUSCATED)
        ├── jetextractors.py      # JetExtractors integration (OBFUSCATED)
        ├── airtable.py           # Airtable API handler
        ├── default_play_video.py # Video playback via resolveurl
        └── [50+ other plugins]   # Various stream sources & extractors
```

### **Critical Dependencies (from addon.xml)**
```xml
<import addon="script.module.resolveurl"/>        <!-- URL resolver library -->
<import addon="script.module.microjenscrapers" /> <!-- Stream scrapers -->
<import addon="script.module.jetextractors" />    <!-- Sport stream extractors -->
<import addon="inputstream.adaptive" />           <!-- HLS/DASH player -->
<import addon="inputstream.ffmpegdirect" />       <!-- IPTV playback -->
```

---

## 🎯 **How Mad Titan Sports Works**

### **Step 1: Content Discovery (Airtable Backend)**
```python
# From airtable.py (lines 28-41)
at = Airtable(table_id, table_base, api_key=args_split[1])

# For Soccer-Footy section:
if table_type == "season":
    match = at.search('category', table_base + "_" + table_split[-1], view='Grid view')

# Returns JSON with match data:
{
    "name": "Arsenal vs Chelsea",
    "link": "https://source.com/match/12345",  # OR multiple links
    "thumbnail": "...",
    "fanart": "..."
}
```

**Translation**: Mad Titan uses **Airtable** (cloud database) to store:
- Match schedules
- Stream source URLs
- Metadata (thumbnails, descriptions)

### **Step 2: Stream Resolution (resolveurl Library)**
```python
# From default_play_video.py (lines 28-30)
if resolveurl.HostedMediaFile(link).valid_url():
    url = resolveurl.HostedMediaFile(link).resolve()
    return xbmc.Player().play(url, liz)
```

**What is resolveurl?**
- Python library that extracts direct playable URLs from 500+ hosting sites
- Examples: DailyMotion, Vimeo, Google Drive, file hosters, sport streaming sites
- Returns direct `.m3u8`, `.mp4`, `.mkv` URLs

**How it removes ads:**
```
INPUT:  https://streamsite.com/watch/12345 (page with ads)
OUTPUT: https://cdn.streamsite.com/hls/12345/index.m3u8 (direct HLS stream)
```

### **Step 3: Direct Playback (Native Kodi Player)**
```python
xbmc.Player().play(url, liz)  # Plays m3u8 directly, no web page = no ads
```

**Why this is ad-free:**
- Only loads the **video stream**, not the web page
- No JavaScript ad scripts execute
- No countdown timers, popups, or embedded ads

---

## 🚀 **Implementation Options for Arsenal Streams**

### **Option A: Use JetExtractors Library Directly** ⭐ **RECOMMENDED**

**What is JetExtractors?**
- Open-source Python library for sports stream extraction
- GitHub: https://github.com/cwunder87/jetextractors
- Supports 50+ sport streaming sites
- Actively maintained (updated 2023)

**How to implement:**

1. **Install JetExtractors in your Next.js backend**
```bash
# Install Python in your Docker container or as separate service
pip install git+https://github.com/cwunder87/jetextractors.git
```

2. **Create Python API bridge**
```python
# /api/python/resolve-stream.py
from jetextractors import get_extractor

def resolve_stream(source_name, match_id):
    """
    Resolve stream URL from source

    Args:
        source_name: 'SportHD', 'LiveSoccerTV', 'StreamEast', etc.
        match_id: Match identifier or URL

    Returns:
        {
            'url': 'https://cdn.server.com/hls/stream.m3u8',
            'headers': {'User-Agent': '...', 'Referer': '...'},
            'quality': 'HD'
        }
    """
    extractor = get_extractor(source_name)
    return extractor.resolve(match_id)
```

3. **Call from Next.js API route**
```typescript
// pages/api/stream/resolve.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  const { source, matchId } = req.query;

  try {
    const { stdout } = await execAsync(
      `python3 /api/python/resolve-stream.py ${source} ${matchId}`
    );

    const streamData = JSON.parse(stdout);
    res.status(200).json(streamData);
  } catch (error) {
    res.status(500).json({ error: 'Stream resolution failed' });
  }
}
```

4. **Use HLS.js player in frontend**
```typescript
// pages/player/[channelId].tsx
const { data: streamData } = await fetch(`/api/stream/resolve?source=SportHD&matchId=${channelId}`);

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(streamData.url);
  hls.attachMedia(videoElement);
  videoElement.play();
}
```

**Pros:**
- ✅ Direct stream URLs (no ads)
- ✅ Open-source, well-documented
- ✅ Multiple source options
- ✅ Active community

**Cons:**
- ⚠️ Requires Python environment
- ⚠️ Sources may change/break over time
- ⚠️ Need to maintain Python bridge

---

### **Option B: Use Magnetic API (Airtable Backend)** 🔒 **RESTRICTED**

**How Mad Titan does it:**
```json
{
    "type": "dir",
    "title": "[COLORred][B]Soccer-[/COLOR]Footy [/B]",
    "magnetic_tv": "season|SOCCER|appAixUSjENO2TX9W|SOCCER"
}
```

**Translation:**
- `appAixUSjENO2TX9W` = Airtable Base ID
- Airtable stores match schedules and stream links
- Links are updated manually by Magnetic repo maintainers

**Why this won't work for us:**
- ❌ Airtable API requires authentication key (we don't have it)
- ❌ Database is managed by Magnetic repo owners
- ❌ Would need permission to access their data

---

### **Option C: Replicate DaddyLive with ResolveURL** 💡 **HYBRID APPROACH**

**Concept**: Keep DaddyLive as source, but add `resolveurl`-style extraction

**Implementation:**
```typescript
// src/services/daddylive/resolveurl.ts
import axios from 'axios';

interface StreamSource {
  name: string;
  urlPattern: RegExp;
  extractM3U8: (html: string) => string | null;
}

const sources: StreamSource[] = [
  {
    name: 'DaddyLive',
    urlPattern: /dlhd\.dad|daddylive/i,
    extractM3U8: (html) => {
      // Method 1: Find .m3u8 URLs in page source
      const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
      if (m3u8Match) return m3u8Match[0];

      // Method 2: Find embedded player URLs
      const playerMatch = html.match(/player\.php\?([^"'\s]+)/);
      if (playerMatch) {
        // Recursively fetch player page and extract m3u8
        return fetchAndExtract(`https://dlhd.dad/player.php?${playerMatch[1]}`);
      }

      // Method 3: Test common CDN patterns
      const channelId = extractChannelId(html);
      const servers = ['top1', 'top2', 'top3', 'cdn1', 'cdn2'];

      for (const server of servers) {
        const testUrl = `https://${server}.newkso.ru/${server}/cdn/${channelId}/mono.m3u8`;
        if (await testStreamUrl(testUrl)) return testUrl;
      }

      return null;
    }
  },

  // Add more sources as needed
  {
    name: 'SportHD',
    urlPattern: /sportshd\.me/i,
    extractM3U8: (html) => {
      // Implement SportHD extraction
    }
  }
];

export async function resolveStreamUrl(pageUrl: string): Promise<string | null> {
  const response = await axios.get(pageUrl);

  for (const source of sources) {
    if (source.urlPattern.test(pageUrl)) {
      return source.extractM3U8(response.data);
    }
  }

  return null;
}
```

**Pros:**
- ✅ Keep existing DaddyLive integration
- ✅ No Python dependency
- ✅ Pure TypeScript solution

**Cons:**
- ⚠️ Manual extraction logic per source
- ⚠️ DaddyLive may obfuscate m3u8 URLs
- ⚠️ High maintenance burden

---

## 📋 **Step-by-Step Implementation Plan**

### **Phase 1: Proof of Concept (3-5 days)**

1. **Set up Python environment**
   ```dockerfile
   # Add to your Docker setup
   FROM node:18-alpine
   RUN apk add --no-cache python3 py3-pip
   RUN pip3 install git+https://github.com/cwunder87/jetextractors.git
   ```

2. **Create Python bridge script**
   - `/api/python/stream-resolver.py`
   - Test with one sport streaming site (e.g., SportHD.me)

3. **Build Next.js API endpoint**
   - `/pages/api/stream/resolve/[channelId].ts`
   - Call Python script, return JSON

4. **Test in player page**
   - Modify `/pages/player/[channelId].tsx`
   - Try direct HLS playback with extracted URL

### **Phase 2: Multi-Source Integration (5-7 days)**

1. **Add multiple extractors**
   - SportHD
   - LiveSoccerTV
   - StreamEast
   - Keep DaddyLive as fallback

2. **Implement source selector UI**
   ```tsx
   <select onChange={(e) => setStreamSource(e.target.value)}>
     <option value="daddylive">DaddyLive (iframe)</option>
     <option value="sporthd">SportHD (direct)</option>
     <option value="streameast">StreamEast (direct)</option>
   </select>
   ```

3. **Add error handling & fallback**
   - If JetExtractors fails → try DaddyLive iframe
   - If one source fails → automatically try next source

### **Phase 3: Production Optimization (3-5 days)**

1. **Caching layer**
   ```typescript
   // Cache resolved URLs for 5 minutes
   const cache = new Map<string, { url: string, expires: number }>();
   ```

2. **Health monitoring**
   - Track which sources work/fail
   - Automatic source prioritization

3. **Legal compliance**
   - Update disclaimers
   - Attribution to source providers

---

## 🎓 **Key Takeaways**

### **Why Kodi is Ad-Free**
1. **Server-side URL extraction** - Python resolves direct stream URLs
2. **Native video player** - No web page loading = no ad scripts
3. **Direct m3u8/mp4 playback** - Only video data, no HTML/JS

### **Why Web Apps Have Ads**
1. **Iframe embedding** - Loads entire third-party web page (with ads)
2. **Client-side rendering** - Ad scripts execute in browser
3. **Cross-Origin restrictions** - Cannot modify iframe content from different domain

### **Solution**
**Replicate Kodi's approach:**
- Use server-side stream extraction (Python JetExtractors)
- Serve direct m3u8 URLs to frontend
- Play with HLS.js (pure video player, no web page)

---

## 📚 **Resources**

### **Open-Source Libraries**
- **JetExtractors**: https://github.com/cwunder87/jetextractors
- **ResolveURL**: https://github.com/Gujal00/ResolveURL
- **HLS.js**: https://github.com/video-dev/hls.js

### **Documentation**
- HLS Streaming: https://developer.apple.com/streaming/
- Video.js HLS: https://videojs.com/
- Kodi Plugin Development: https://kodi.wiki/view/Add-on_development

### **Sport Streaming Sources** (Research Only)
- StreamEast, SportHD, LiveSoccerTV, Totalsportek
- **Note**: Research for educational purposes only

---

## ⚠️ **Legal & Ethical Considerations**

### **Important Notes**
1. **Third-party content**: All streams are from third-party sources (not our servers)
2. **Educational purpose**: This guide is for understanding Kodi architecture
3. **User responsibility**: End users responsible for compliance with local laws
4. **Disclaimers required**: Clear attribution and responsibility disclaimers

### **Recommended Disclaimers**
```markdown
⚠️ **Disclaimer**: Streams are not hosted on our servers. This application aggregates
publicly available streams from third-party sources. We do not control, upload, or
manage any stream content. Users are responsible for ensuring compliance with local
laws and copyright regulations.

💡 **For Best Experience**: Use an ad blocker such as uBlock Origin or AdGuard.
```

---

**Status**: Implementation guide complete - ready for development decision
**Next Step**: Choose Option A (JetExtractors) and begin Phase 1 POC
