# Arsenal Streams Fix Plan - Executive Summary

**Full Plan:** `/home/olabi/docker/watch_arsenal/docs/ARSENAL_STREAMS_FIX_PLAN.md`  
**Date:** November 9, 2025

---

## Problems Identified

1. **"No matches" messages** - Dashboard only shows 2-10 matches instead of 60-100+
2. **Missing 24/7 channels** - Backend exists but no UI link (800+ channels hidden)
3. **Old matches never expire** - Matches from hours/days ago still visible
4. **Streams don't play** - Iframe sandbox blocking + Microsoft Defender SmartScreen
5. **Ad blocking** - Only client-side, UniFi network gear unused

---

## Quick Fixes (Priority Order)

### 1. Data Source Fix (2-3 hours) 🔴 CRITICAL
**Change 1 line:**
```diff
File: /pages/dashboard.tsx (line 37)
- const response = await fetch('/api/magnetic-games');
+ const response = await fetch('/api/matches');
```
**Result:** Shows all 60-100+ matches instead of just Arsenal/Chelsea/etc.

### 2. Add 24/7 Channels Link (3-4 hours) 🟡 HIGH  
**Add navigation card to dashboard:**
```typescript
<div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6">
  <h2>📺 24/7 Live Sports Channels</h2>
  <Link href="/channels">Browse 800+ Channels →</Link>
</div>
```
**Result:** Users can access Sky Sports, ESPN, beIN Sports, etc.

### 3. Stream Playback Fix (2 hours quick fix) 🔴 CRITICAL
**Change sandbox attribute:**
```diff
- sandbox="allow-scripts allow-same-origin"
+ sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
```
**Result:** Fullscreen works, streams play reliably

---

## Medium-term Enhancements

### 4. Match Expiration (4-6 hours) 🟢 MEDIUM
**Create time filter utility:**
- Hide matches that ended 4+ hours ago
- Keep LIVE and TBD matches always visible
- Calculate based on GMT times from API

**Result:** Dashboard stays clean and relevant

---

## Infrastructure Improvements

### 5. Network Ad Blocking (4-6 hours) 🟢 LOW
**Option A (Quick):** Enable UniFi IPS ad blocking  
**Option B (Best):** Deploy Pi-hole Docker container

**Result:** 80-90% ad reduction network-wide

---

## Implementation Timeline

**Week 1:** Phases 1, 2, 3 (Quick fixes)  
**Week 2:** Phase 4 (Stream enhancements)  
**Week 3:** Phase 5 (Network ad blocking)

**Total:** 30-40 hours over 3 weeks

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Match count | 2-10 | 60-100+ |
| Available channels | 0 (hidden) | 800+ |
| Stream success | 60% | 90%+ |
| Ad blocking | Client only | Network-wide |

---

## Root Causes Discovered

### Issue #1: Wrong API endpoint
- Dashboard calls `/api/magnetic-games` (filtered)
- Should call `/api/matches` (all matches)

### Issue #2: Missing navigation
- `/pages/channels.tsx` already exists
- Just needs link from dashboard

### Issue #3: No expiration logic
- Code comment: "No time-based filtering - display all matches from the API"
- Need to implement time-based filter

### Issue #4: Restrictive iframe sandbox
- Current: `allow-scripts allow-same-origin`
- Need: `+ allow-forms allow-popups allow-presentation`

### Issue #5: UniFi capabilities unused
- IPS/IDS available but not enabled
- DNS filtering available but not configured

---

## Key Files to Modify

```
Priority 1 (Critical):
├── /pages/dashboard.tsx          # Line 37: Change API endpoint
└── /src/components/EnhancedPlayer.tsx  # Sandbox attribute

Priority 2 (High):
├── /pages/dashboard.tsx          # Add channels navigation card
└── /src/components/Header.tsx    # Add channels link

Priority 3 (Medium):
├── /src/utils/matchTime.ts       # NEW: Time parsing utilities
└── /pages/dashboard.tsx          # Apply expiration filter

Priority 4 (Low):
└── UniFi Network Controller      # Enable IPS + Pi-hole deployment
```

---

## Testing Checklist

**Phase 1 (Data Fix):**
- [ ] Dashboard shows 50-100+ matches
- [ ] Filters still work (team, competition, country)

**Phase 2 (Channels):**
- [ ] "Browse Channels" card visible
- [ ] Channels page shows 800+ channels
- [ ] Search and filters work

**Phase 3 (Quick Stream Fix):**
- [ ] Streams play in iframe
- [ ] Fullscreen works
- [ ] Works on Windows (Defender enabled)

---

**For full technical details, see:** `/home/olabi/docker/watch_arsenal/docs/ARSENAL_STREAMS_FIX_PLAN.md`
