# 🔍 DaddyLive Repository Breakdown - How It Really Works

**Date**: October 1, 2025
**Source**: plugin.video.daddylive/addon.py (Kodi Addon)
**Purpose**: Understanding data fetching and stream resolution

---

## 📊 **Part 1: How DaddyLive Gets Match Data**

### **Step 1: Domain Resolution**
```python
# Lines 43, 73-82
SEED_BASEURL = 'https://daddylive.sx/'

def resolve_active_baseurl(seed):
    # Follow redirects to get actual working domain
    resp = requests.get(seed, headers={'User-Agent': UA}, allow_redirects=True)
    final_url = resp.url  # Returns: https://daddylivestream.com/
    return final_url
```

**What happens:**
- `daddylive.sx` → redirects → `thedaddy.top` → redirects → `daddylivestream.com`
- The addon follows all redirects and saves the final working domain
- This domain is cached in settings to avoid repeated lookups

### **Step 2: Fetch Schedule Data**
```python
# Lines 162-175
def getCategTrans():
    schedule_url = 'https://daddylivestream.com/schedule/schedule-generated.php'
    headers = {
        'User-Agent': 'Mozilla/5.0...',
        'Referer': 'https://daddylivestream.com/',
        'Origin': 'https://daddylivestream.com/'
    }

    schedule = requests.get(schedule_url, headers=headers).json()

    # Returns structure like:
    # {
    #   "Tuesday 30th Sep 2025 - Schedule Time UK GMT": {
    #     "Soccer": [...],
    #     "England - Championship/EFL Trophy/League One": [...]
    #   },
    #   "Wednesday 01st Oct 2025 - Schedule Time UK GMT": {
    #     "Soccer": [...]
    #   }
    # }
```

### **Step 3: Parse Match Data**
```python
# Lines 191-210
def getTransData(categ):
    for item in events_list:
        event = item.get('event')           # "England - Championship : Norwich vs West Brom"
        time_str = item.get('time')         # "18:45"
        channels = item.get('channels')     # Array of channel objects

        # Each channel has:
        # {
        #   "channel_name": "Sky Sports+",
        #   "channel_id": "36"
        # }
```

**What We Get:**
- ✅ Match name (event)
- ✅ Match time (UTC format)
- ✅ Array of available channels with IDs
- ✅ Channel names (broadcaster info)

**What We're Currently Doing:** ✅ CORRECT
```typescript
// Our implementation in pages/api/magnetic-games.ts
const response = await fetch('https://daddylivestream.com/schedule/schedule-generated.php', {
  headers: {
    'User-Agent': 'Mozilla/5.0...',
    'Referer': 'https://daddylivestream.com/',
    'Origin': 'https://daddylivestream.com'
  }
});

// We parse and return:
streamLinks: [
  {
    source: "Sky Sports+",
    url: "https://dlhd.dad/stream/stream-36.php",
    channelId: "36",
    quality: "HD"
  }
]
```

---

## 🎬 **Part 2: How DaddyLive Gets Actual Stream Links**

This is where it gets complex! The Kodi addon does **NOT** just embed an iframe. It extracts the actual HLS/m3u8 stream URL.

### **The Stream Resolution Process**

#### **Step 1: User Clicks on Channel**
```python
# Line 223
url_stream = f'https://daddylivestream.com/stream/stream-{channel_id}.php'
# Example: https://daddylivestream.com/stream/stream-36.php
```

#### **Step 2: Fetch Stream Page (PlayStream function - Lines 248-344)**
```python
def PlayStream(link):
    # Step 2A: Get the stream page
    response = requests.get(link, headers=headers).text
    # This returns HTML page with embedded JavaScript
```

#### **Step 3: Follow Iframe Chain**
The page has multiple levels of iframes to obfuscate the stream:

```python
# Lines 254-278
if 'wikisport.best' in response:
    # Path A: Wikisport streams (3 levels deep)
    for _ in range(3):
        iframes = re.findall(r'iframe src="([^"]*)', response)
        url2 = iframes[0]
        response = requests.get(url2, headers=headers).text
else:
    # Path B: Standard DaddyLive (default)

    # Level 1: Find PLAYER 2 iframe
    iframes = re.findall(r'data-url="([^"]+)"\s+title="PLAYER 2"', response)
    url2 = iframes[0]  # Example: /cast/168-xyz.php
    response = requests.get(url2, headers=headers).text

    # Level 2: Find nested iframe inside Player 2
    iframe_match = re.search(r'iframe src="([^"]*)', response)
    url2 = iframe_match.group(1)
    response = requests.get(url2, headers=headers).text
```

**What's Happening:**
```
Initial Page: stream-36.php
    ↓ (contains data-url)
Player 2 Page: /cast/168-xyz.php
    ↓ (contains iframe src)
Final Embed: https://some-cdn-domain.com/embed.php?id=xyz
    ↓ (contains JavaScript with stream config)
JavaScript Variables: CHANNEL_KEY, XJZ bundle, host array
```

#### **Step 4: Extract Obfuscated JavaScript Variables**
```python
# Lines 280-298
# Extract CHANNEL_KEY (unique stream identifier)
ck_match = re.search(r'const\s+CHANNEL_KEY\s*=\s*"([^"]+)"', response)
channel_key = ck_match.group(1)  # Example: "36abc123"

# Extract XJZ bundle (base64 encoded parameters)
bundle_match = re.search(r'const\s+XJZ\s*=\s*"([^"]+)"', response)
bundle = bundle_match.group(1)

# Decode the bundle (nested base64)
parts = json.loads(base64.b64decode(bundle).decode("utf-8"))
for k, v in parts.items():
    parts[k] = base64.b64decode(v).decode("utf-8")

# Now we have:
# parts = {
#   "b_ts": "timestamp",
#   "b_rnd": "random_value",
#   "b_sig": "signature"
# }

# Extract host array (CDN domain in pieces)
host_array_match = re.search(r"host\s*=\s*\[([^\]]+)\]", response)
host_parts = [part.strip().strip("'\"") for part in host_array_match.group(1).split(',')]
host = ''.join(host_parts)  # Example: "https://auth.newkso.ru"
```

**Why So Complex?**
This obfuscation prevents:
- Easy scraping/extraction
- Hotlinking abuse
- Automated bots
- Rate limiting evasion

#### **Step 5: Generate Auth URL**
```python
# Lines 300-308
# XOR decode to get secret path
bx = [40, 60, 61, 33, 103, 57, 33, 57]
sc = ''.join(chr(b ^ 73) for b in bx)  # Results in: "1828g091" or similar

# Build authentication URL
auth_url = (
    f'{host}{sc}?channel_id={channel_key}&'
    f'ts={parts["b_ts"]}&'
    f'rnd={parts["b_rnd"]}&'
    f'sig={parts["b_sig"]}'
)
# Example: https://auth.newkso.ru/1828g091?channel_id=36abc123&ts=1696...&rnd=xyz&sig=abc
```

#### **Step 6: Authenticate & Get Server**
```python
# Lines 310-324
# Find server lookup endpoint from JavaScript
server_lookup_match = re.findall(r'fetchWithRetry\(\s*\'([^\']*)', response)
server_lookup = server_lookup_match[0]  # Example: "/api/stream/"

# Call auth URL (establishes session/token)
requests.get(auth_url, headers=headers)

# Get server assignment
server_lookup_url = f"{host_raw}{server_lookup}{channel_key}"
response = requests.get(server_lookup_url, headers=headers).json()
server_key = response.get('server_key')  # Example: "server2/edge" or "top1/cdn"
```

**What This Does:**
- Validates the timestamp/signature
- Assigns you to a specific CDN server
- Returns server routing information

#### **Step 7: Build Final M3U8 URL**
```python
# Lines 326-331
if server_key == "top1/cdn":
    m3u8 = f"https://top1.newkso.ru/top1/cdn/{channel_key}/mono.m3u8"
else:
    m3u8 = f"https://{server_key}new.newkso.ru/{server_key}/{channel_key}/mono.m3u8"

# Add required headers as URL parameters
m3u8 += f'|Referer={host_raw}/&Origin={host_raw}&Connection=Keep-Alive&User-Agent={UA}'

# Final URL example:
# https://server2new.newkso.ru/server2/edge/36abc123/mono.m3u8|Referer=...&Origin=...
```

**This is the ACTUAL STREAM URL!** ✅

#### **Step 8: Play in Kodi**
```python
# Lines 333-340
liz = xbmcgui.ListItem('Daddylive', path=m3u8)
liz.setProperty('inputstream', 'inputstream.ffmpegdirect')
liz.setMimeType('application/x-mpegURL')
liz.setProperty('inputstream.ffmpegdirect.is_realtime_stream', 'true')
liz.setProperty('inputstream.ffmpegdirect.manifest_type', 'hls')

xbmcplugin.setResolvedUrl(addon_handle, True, liz)
```

Kodi then plays the HLS stream directly - **NO ADS** because:
- ✅ No webpage loaded (no HTML/JS)
- ✅ No ad scripts executed
- ✅ Direct m3u8 streaming
- ✅ Native video player

---

## 🔄 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Get Schedule Data                                            │
│    GET: schedule/schedule-generated.php                         │
│    Returns: { matches, channels }                               │
│    ✅ We do this correctly!                                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. User Selects Match + Channel                                 │
│    We have: channel_id = "36"                                   │
│    ✅ We do this correctly!                                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Construct Stream Page URL                                    │
│    URL: stream/stream-36.php                                    │
│    ✅ We do this correctly!                                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. OUR CURRENT APPROACH (Iframe Embed)                          │
│    ❌ Load full webpage in iframe                               │
│    ❌ HTML + CSS + JavaScript all load                          │
│    ❌ Ad scripts execute                                        │
│    ❌ Countdown timers, popups, etc.                            │
│    Result: Ads everywhere 😡                                    │
└─────────────────────────────────────────────────────────────────┘

                    VS

┌─────────────────────────────────────────────────────────────────┐
│ 4. KODI APPROACH (Server-side Extraction)                       │
│    ✅ Fetch stream-36.php HTML (server-side)                    │
│    ✅ Parse PLAYER 2 iframe URL                                 │
│    ✅ Fetch iframe page HTML                                    │
│    ✅ Parse nested iframe URL                                   │
│    ✅ Fetch final embed page HTML                               │
│    ✅ Extract JavaScript variables (CHANNEL_KEY, XJZ, host)     │
│    ✅ Decode base64 bundles                                     │
│    ✅ Call auth endpoint                                        │
│    ✅ Get server assignment                                     │
│    ✅ Build m3u8 URL                                            │
│    ✅ Play direct HLS stream                                    │
│    Result: No ads! 😊                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 **What We're Currently Doing vs What Kodi Does**

### **Our Current Implementation** ✅ CORRECT for Steps 1-3

```typescript
// Step 1: Get schedule data ✅
const response = await fetch('https://daddylivestream.com/schedule/schedule-generated.php');
const schedule = await response.json();

// Step 2: Parse matches ✅
for (const event of schedule[date]["Soccer"]) {
  const competition = event.event.split(':')[0];
  const [homeTeam, awayTeam] = event.event.split(':')[1].match(/vs\.?/);
  const channels = event.channels;
}

// Step 3: Build stream URLs ✅
const streamLinks = channels.map(channel => ({
  source: channel.channel_name,
  url: `https://dlhd.dad/stream/stream-${channel.channel_id}.php`,
  channelId: channel.channel_id
}));
```

### **What We're Missing** ❌ Step 4: Stream Extraction

We return the **stream page URL** but NOT the **actual m3u8 stream URL**.

**Current:**
```
streamLinks: [{
  url: "https://dlhd.dad/stream/stream-36.php"  // ← Webpage with ads
}]
```

**What Kodi Gets:**
```
m3u8_url: "https://server2new.newkso.ru/server2/edge/36abc123/mono.m3u8|Referer=..."
// ← Direct HLS stream, no ads!
```

---

## 🎯 **Why We Have Ads (and Kodi Doesn't)**

| Aspect | Our Approach | Kodi Approach |
|--------|-------------|---------------|
| **What we load** | Full HTML webpage in iframe | Direct m3u8 stream URL |
| **JavaScript execution** | ✅ Yes (in iframe) | ❌ No (Python extracts data) |
| **Ad scripts run?** | ✅ Yes | ❌ No |
| **Video player** | Browser (in iframe) | Kodi native player |
| **Network requests** | Many (HTML, CSS, JS, ads) | One (just m3u8) |
| **User experience** | Countdown, unmute, popups | Clean, instant playback |

---

## 🛠️ **How to Implement Kodi's Approach**

To get ad-free streaming like Kodi, we need to implement Steps 4-7 (stream extraction):

### **Option A: Python Microservice** (Recommended by context docs)
```
Next.js → API Route → Python Script → Extract m3u8 → Return URL → HLS.js Player
```

### **Option B: Node.js Implementation** (More integrated)
```
Next.js → API Route (Node.js) → Puppeteer/Cheerio → Extract m3u8 → HLS.js Player
```

### **Option C: Hybrid** (Best of both)
```
Next.js → Check Cache → If miss: Python extraction → Cache result → HLS.js Player
```

---

## 📊 **Summary: Data vs Links**

### **MATCH DATA** ✅ We get this correctly!
```
Source: schedule/schedule-generated.php
Method: Direct API call
Data: {
  event: "Competition : Team vs Team",
  time: "18:00",
  channels: [
    { channel_name: "Sky Sports+", channel_id: "36" }
  ]
}
```

### **STREAM LINKS** ⚠️ We only get the webpage URL
```
What we have:
url: "https://dlhd.dad/stream/stream-36.php"  // ← HTML page

What we need:
url: "https://server2new.newkso.ru/server2/edge/36abc123/mono.m3u8"  // ← Direct HLS
```

### **THE MISSING PIECE**
We need to implement the `PlayStream()` function logic (lines 248-344) in Node.js/Python to:
1. Fetch stream page HTML
2. Follow iframe chain
3. Extract JavaScript variables
4. Decode obfuscation
5. Call auth endpoints
6. Get m3u8 URL

Then we can play streams directly without ads!

---

## 🎬 **Next Steps**

Based on this breakdown, here's what needs to happen:

1. **Immediate**: Keep using iframe embed (ads present but functional)
2. **Short-term**: Implement stream extraction in Python microservice
3. **Long-term**: Build HLS.js player for direct playback

**Current Status**: ✅ Steps 1-3 complete, ❌ Step 4 missing

---

*This document explains the complete DaddyLive architecture and how we're currently using it.*
*Last updated: October 1, 2025*
