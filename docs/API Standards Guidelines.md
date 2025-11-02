# 🌐 API Standards & Guidelines

## Overview
This document defines the API design standards, conventions, and best practices for the Arsenal Streams platform.

---

## 📐 RESTful API Principles

### URL Structure
```
https://api.arsenalstreams.com/v1/{resource}/{id}/{sub-resource}
```

**Rules:**
- Use plural nouns for resources (`/matches`, `/streams`, `/leagues`)
- Use kebab-case for multi-word resources (`/user-preferences`)
- Version API in URL (`/v1/`, `/v2/`)
- Use nested resources sparingly (max 2 levels)
- Avoid verbs in URLs (use HTTP methods instead)

**Examples:**
```
✅ GET    /v1/matches
✅ GET    /v1/matches/123
✅ GET    /v1/matches/123/streams
✅ POST   /v1/matches/123/streams/validate
✅ GET    /v1/search?q=arsenal

❌ GET    /v1/getMatches
❌ POST   /v1/matches/create
❌ GET    /v1/match  (should be plural)
❌ GET    /v1/matches/123/streams/456/health/check (too nested)
```

---

## 🔤 HTTP Methods

### GET - Retrieve Resources
```typescript
// List all matches
GET /v1/matches

// Get specific match
GET /v1/matches/{matchId}

// Query parameters for filtering
GET /v1/matches?league=premier-league&status=live&page=1&limit=20
```

**Response:** 200 OK
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### POST - Create Resources
```typescript
// Create new user preference (Phase 2)
POST /v1/user-preferences

Request Body:
{
  "favoriteTeams": ["Arsenal", "Barcelona"],
  "preferredQuality": "hd",
  "theme": "dark"
}
```

**Response:** 201 Created
```json
{
  "data": {
    "id": "pref_123",
    "favoriteTeams": ["Arsenal", "Barcelona"],
    "preferredQuality": "hd",
    "theme": "dark",
    "createdAt": "2025-09-29T10:00:00Z"
  }
}
```

### PATCH - Partial Update
```typescript
// Update specific fields
PATCH /v1/user-preferences/{id}

Request Body:
{
  "theme": "light"
}
```

**Response:** 200 OK

### PUT - Full Replacement
```typescript
// Replace entire resource
PUT /v1/user-preferences/{id}

Request Body:
{
  "favoriteTeams": ["Arsenal"],
  "preferredQuality": "fhd",
  "preferredLanguage": "en",
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

**Response:** 200 OK

### DELETE - Remove Resource
```typescript
// Delete user preference
DELETE /v1/user-preferences/{id}
```

**Response:** 204 No Content

---

## 📦 Request/Response Format

### Standard Response Envelope
```typescript
interface APIResponse<T> {
  data: T | T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
  links?: {
    self: string;
    next?: string;
    previous?: string;
    first?: string;
    last?: string;
  };
}
```

### Success Response
```json
{
  "data": {
    "id": "match_123",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "league": "Premier League",
    "startTime": "2025-09-29T15:00:00Z",
    "status": "live"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-09-29T10:00:00Z"
  }
}
```

### Error Response
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    requestId?: string;
    timestamp?: string;
  };
}
```

**Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "league": "Must be one of: premier-league, champions-league, la-liga",
      "page": "Must be a positive integer"
    },
    "requestId": "req_abc123",
    "timestamp": "2025-09-29T10:00:00Z"
  }
}
```

---

## 🎯 Endpoint Specifications

### GET /v1/matches
**Description:** Retrieve list of football matches

**Query Parameters:**
```typescript
interface MatchesQuery {
  // Filtering
  league?: string;           // premier-league, champions-league, etc.
  status?: 'live' | 'upcoming' | 'finished';
  team?: string;             // Team name (home or away)
  date?: string;             // ISO 8601 date (YYYY-MM-DD)
  dateFrom?: string;         // Start date range
  dateTo?: string;           // End date range
  
  // Pagination
  page?: number;             // Default: 1
  limit?: number;            // Default: 20, Max: 100
  
  // Sorting
  sort?: string;             // startTime, league, -startTime (desc)
  
  // Search
  q?: string;                // Search query
}
```

**Response Schema:**
```typescript
interface MatchesResponse {
  data: Match[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  links: {
    self: string;
    next?: string;
    previous?: string;
  };
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  competition: string;
  startTime: string;          // ISO 8601
  status: 'live' | 'upcoming' | 'finished';
  score?: {
    home: number;
    away: number;
  };
  streamCount: number;
  metadata?: {
    venue?: string;
    referee?: string;
  };
}
```

**Example Request:**
```bash
GET /v1/matches?league=premier-league&status=live&page=1&limit=10
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "match_abc123",
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea",
      "league": "Premier League",
      "competition": "EPL",
      "startTime": "2025-09-29T15:00:00Z",
      "status": "live",
      "score": {
        "home": 2,
        "away": 1
      },
      "streamCount": 5
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "links": {
    "self": "/v1/matches?league=premier-league&status=live&page=1&limit=10"
  }
}
```

---

### GET /v1/matches/{matchId}
**Description:** Retrieve specific match details

**Path Parameters:**
- `matchId` (string, required): Match identifier

**Response Schema:**
```typescript
interface MatchDetailResponse {
  data: MatchDetail;
}

interface MatchDetail extends Match {
  streams: StreamPreview[];
  analytics: {
    viewCount: number;
    popularityScore: number;
  };
}

interface StreamPreview {
  id: string;
  quality: 'sd' | 'hd' | 'fhd' | 'uhd';
  language: string;
  reliability: number;        // 0-100
  healthStatus: 'healthy' | 'degraded' | 'failed';
}
```

**Example Response:**
```json
{
  "data": {
    "id": "match_abc123",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "league": "Premier League",
    "competition": "EPL",
    "startTime": "2025-09-29T15:00:00Z",
    "status": "live",
    "score": {
      "home": 2,
      "away": 1
    },
    "streamCount": 5,
    "streams": [
      {
        "id": "stream_xyz789",
        "quality": "fhd",
        "language": "en",
        "reliability": 95,
        "healthStatus": "healthy"
      }
    ],
    "analytics": {
      "viewCount": 1523,
      "popularityScore": 87
    }
  }
}
```

---

### GET /v1/matches/{matchId}/streams
**Description:** Retrieve all stream links for a specific match

**Path Parameters:**
- `matchId` (string, required): Match identifier

**Query Parameters:**
```typescript
interface StreamsQuery {
  quality?: 'sd' | 'hd' | 'fhd' | 'uhd';
  language?: string;          // ISO 639-1 code
  minReliability?: number;    // 0-100
  sort?: string;              // reliability, quality, -reliability (desc)
}
```

**Response Schema:**
```typescript
interface StreamsResponse {
  data: Stream[];
  meta: {
    total: number;
    matchId: string;
    matchStatus: string;
  };
}

interface Stream {
  id: string;
  url: string;
  type: 'hls' | 'dash' | 'rtmp';
  quality: 'sd' | 'hd' | 'fhd' | 'uhd';
  language: string;
  provider: string;
  reliability: number;
  healthStatus: 'healthy' | 'degraded' | 'failed';
  metadata: {
    bitrate?: number;
    resolution?: string;
    latency: 'low' | 'medium' | 'high';
  };
  provenance: {
    source: string;
    lastChecked: string;
    trustScore: number;
  };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "stream_xyz789",
      "url": "https://stream.example.com/match123.m3u8",
      "type": "hls",
      "quality": "fhd",
      "language": "en",
      "provider": "DaddyLive",
      "reliability": 95,
      "healthStatus": "healthy",
      "metadata": {
        "bitrate": 5000,
        "resolution": "1920x1080",
        "latency": "low"
      },
      "provenance": {
        "source": "channels.xml:142",
        "lastChecked": "2025-09-29T10:00:00Z",
        "trustScore": 92
      }
    }
  ],
  "meta": {
    "total": 5,
    "matchId": "match_abc123",
    "matchStatus": "live"
  }
}
```

---

### POST /v1/matches/{matchId}/streams/{streamId}/validate
**Description:** Validate stream health and availability

**Path Parameters:**
- `matchId` (string, required)
- `streamId` (string, required)

**Response Schema:**
```typescript
interface ValidationResponse {
  data: {
    streamId: string;
    isValid: boolean;
    healthStatus: 'healthy' | 'degraded' | 'failed';
    checks: {
      connectivity: boolean;
      manifestValid: boolean;
      playbackTest: boolean;
      latency: number;
    };
    timestamp: string;
  };
}
```

---

### GET /v1/search
**Description:** Search matches by team name, league, or competition

**Query Parameters:**
```typescript
interface SearchQuery {
  q: string;                  // Required, min 2 chars
  type?: 'match' | 'team' | 'league';
  limit?: number;             // Default: 20, Max: 50
}
```

**Response Schema:**
```typescript
interface SearchResponse {
  data: SearchResult[];
  meta: {
    query: string;
    total: number;
    took: number;             // Milliseconds
  };
}

interface SearchResult {
  type: 'match' | 'team' | 'league';
  id: string;
  title: string;
  subtitle?: string;
  relevance: number;          // 0-100
  highlight?: string;
}
```

---

### GET /v1/leagues
**Description:** Retrieve available leagues/competitions

**Response Schema:**
```typescript
interface LeaguesResponse {
  data: League[];
}

interface League {
  id: string;
  name: string;
  country: string;
  logo?: string;
  matchCount: number;
  liveMatchCount: number;
}
```

---

### GET /v1/health
**Description:** Health check endpoint for monitoring

**Response Schema:**
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    daddylive: {
      status: 'up' | 'down';
      latency: number;
    };
    database: {
      status: 'up' | 'down';
      latency: number;
    };
    cache: {
      status: 'up' | 'down';
      latency: number;
    };
  };
  version: string;
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-29T10:00:00Z",
  "services": {
    "daddylive": {
      "status": "up",
      "latency": 245
    },
    "database": {
      "status": "up",
      "latency": 12
    },
    "cache": {
      "status": "up",
      "latency": 3
    }
  },
  "version": "1.0.0"
}
```

---

## 📊 HTTP Status Codes

### Success Codes (2xx)
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, PUT |
| 201 | Created | Successful POST (resource created) |
| 202 | Accepted | Request accepted, processing async |
| 204 | No Content | Successful DELETE |

### Client Error Codes (4xx)
| Code | Meaning | Usage |
|------|---------|-------|
| 400 | Bad Request | Invalid request format, validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | HTTP method not supported |
| 409 | Conflict | Resource state conflict |
| 422 | Unprocessable Entity | Semantic validation error |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)
| Code | Meaning | Usage |
|------|---------|-------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily down |
| 504 | Gateway Timeout | Upstream timeout |

---

## 🔒 Authentication & Authorization

### API Key Authentication (Internal Services)
```http
GET /v1/matches
Authorization: Bearer sk_live_abc123xyz789
X-API-Version: 1.0
```

### JWT Authentication (Phase 2 - User Accounts)
```http
GET /v1/user-preferences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Request-ID: req_abc123
```

**JWT Token Structure:**
```typescript
interface JWTPayload {
  sub: string;                // User ID
  email: string;
  role: 'user' | 'admin';
  iat: number;                // Issued at
  exp: number;                // Expires at
  iss: string;                // Issuer
  aud: string;                // Audience
}
```

---

## 🚦 Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1696003200
```

### Rate Limit Tiers
| Tier | Limit | Window |
|------|-------|--------|
| Anonymous | 100 req/min | Per IP |
| Authenticated | 300 req/min | Per user |
| Premium | 1000 req/min | Per user |
| Internal | Unlimited | N/A |

### Rate Limit Exceeded Response
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1696003200
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 📄 Pagination

### Offset-Based Pagination
```http
GET /v1/matches?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  },
  "links": {
    "self": "/v1/matches?page=2&limit=20",
    "first": "/v1/matches?page=1&limit=20",
    "previous": "/v1/matches?page=1&limit=20",
    "next": "/v1/matches?page=3&limit=20",
    "last": "/v1/matches?page=8&limit=20"
  }
}
```

### Cursor-Based Pagination (Future)
```http
GET /v1/matches?cursor=eyJpZCI6MTIzfQ&limit=20
```

---

## 🔍 Filtering & Sorting

### Filtering
```http
# Single filter
GET /v1/matches?league=premier-league

# Multiple filters (AND)
GET /v1/matches?league=premier-league&status=live

# Range filters
GET /v1/matches?dateFrom=2025-09-01&dateTo=2025-09-30

# Array filters (OR)
GET /v1/matches?league=premier-league,champions-league
```

### Sorting
```http
# Ascending
GET /v1/matches?sort=startTime

# Descending
GET /v1/matches?sort=-startTime

# Multiple fields
GET /v1/matches?sort=-status,startTime
```

### Field Selection (Sparse Fieldsets)
```http
# Select specific fields
GET /v1/matches?fields=id,homeTeam,awayTeam,startTime

# Exclude fields
GET /v1/matches?fields=-metadata,-analytics
```

---

## 🎨 Versioning Strategy

### URL Versioning (Current)
```http
GET /v1/matches
GET /v2/matches
```

**Version Support Policy:**
- Major version supported for 12 months after new version release
- Deprecation warnings 6 months before sunset
- Breaking changes require new major version

### Version Header (Alternative)
```http
GET /matches
Accept: application/vnd.arsenalstreams.v1+json
```

---

## 🛠️ Error Codes & Messages

### Standard Error Codes
```typescript
enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  
  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not Found Errors (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  STREAM_NOT_FOUND = 'STREAM_NOT_FOUND',
  
  // Conflict Errors (409)
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Rate Limit (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  TIMEOUT = 'TIMEOUT',
}
```

### Error Response Examples

**Validation Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "league": "Must be one of: premier-league, champions-league, la-liga",
      "page": "Must be a positive integer between 1 and 1000"
    },
    "requestId": "req_abc123",
    "timestamp": "2025-09-29T10:00:00Z"
  }
}
```

**Not Found Error (404):**
```json
{
  "error": {
    "code": "MATCH_NOT_FOUND",
    "message": "Match with ID 'match_123' not found",
    "requestId": "req_abc123",
    "timestamp": "2025-09-29T10:00:00Z"
  }
}
```

**Service Unavailable (503):**
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "DaddyLive service temporarily unavailable. Using fallback sources.",
    "retryAfter": 300,
    "requestId": "req_abc123",
    "timestamp": "2025-09-29T10:00:00Z"
  }
}
```

---

## 📝 Request/Response Headers

### Required Request Headers
```http
Content-Type: application/json
Accept: application/json
User-Agent: ArsenalStreams/1.0
```

### Optional Request Headers
```http
X-Request-ID: req_abc123           # Client-generated request ID
X-Client-Version: 1.2.3            # Client app version
Accept-Language: en-US,en;q=0.9    # Preferred language
If-None-Match: "etag-value"        # Conditional request
```

### Standard Response Headers
```http
Content-Type: application/json; charset=utf-8
X-Request-ID: req_abc123
X-Response-Time: 245ms
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1696003200
Cache-Control: public, max-age=60
ETag: "33a64df551425fcc55e4d42a148795d9"
```

---

## 🔄 Webhooks (Future - Phase 3)

### Webhook Events
```typescript
enum WebhookEvent {
  MATCH_STARTED = 'match.started',
  MATCH_ENDED = 'match.ended',
  STREAM_ADDED = 'stream.added',
  STREAM_FAILED = 'stream.failed',
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}
```

### Webhook Delivery
```http
POST https://client-webhook-url.com/webhooks
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...

{
  "event": "match.started",
  "timestamp": "2025-09-29T15:00:00Z",
  "data": {
    "matchId": "match_abc123",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea"
  }
}
```

---

## 📚 API Documentation

### OpenAPI/Swagger Specification
```yaml
openapi: 3.0.0
info:
  title: Arsenal Streams API
  version: 1.0.0
  description: API for accessing live football match streams
  contact:
    email: api@arsenalstreams.com
  license:
    name: Proprietary

servers:
  - url: https://api.arsenalstreams.com/v1
    description: Production
  - url: https://staging-api.arsenalstreams.com/v1
    description: Staging

paths:
  /matches:
    get:
      summary: List all matches
      operationId: listMatches
      tags:
        - Matches
      parameters:
        - name: league
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [live, upcoming, finished]
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MatchesResponse'
```

---

## ✅ API Design Checklist

### Before Implementing an Endpoint
- [ ] Follows RESTful conventions
- [ ] Uses appropriate HTTP method
- [ ] URL structure is clear and consistent
- [ ] Request/response schemas defined
- [ ] Input validation with Zod schemas
- [ ] Error responses documented
- [ ] Rate limiting configured
- [ ] Authentication/authorization checked
- [ ] Caching strategy defined
- [ ] Logging and monitoring setup
- [ ] Tests written (unit + integration)
- [ ] API documentation updated

### Before Releasing API Changes
- [ ] Backward compatibility verified
- [ ] Version incremented if breaking
- [ ] Deprecation warnings added
- [ ] Migration guide written
- [ ] Clients notified of changes
- [ ] Staging tested thoroughly
- [ ] Rollback plan documented

---

## 🔗 References

- [REST API Tutorial](https://restfulapi.net/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [JSON:API](https://jsonapi.org/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [RFC 7231 - HTTP/1.1 Semantics](https://tools.ietf.org/html/rfc7231)

---

**Document Version:** 1.0  
**Last Updated:** 2025-09-29  
**Next Review:** 2025-10-29
