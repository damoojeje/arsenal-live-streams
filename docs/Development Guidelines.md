# 💻 Development Guidelines & Coding Standards

## Overview
Comprehensive coding standards and best practices for the Arsenal Streams project.

---

## 🎨 Code Style

### TypeScript Style Guide

#### Naming Conventions

```typescript
// ✅ CORRECT

// Interfaces - PascalCase, no "I" prefix
interface Match {
  id: string;
  homeTeam: string;
}

// Type aliases - PascalCase
type StreamQuality = 'sd' | 'hd' | 'fhd';

// Classes - PascalCase
class DaddyLiveService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
}

// Functions/Methods - camelCase
function fetchMatches(): Promise<Match[]> {
  // ...
}

// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Variables - camelCase
const matchCount = 10;
let isLoading = false;

// Private properties - camelCase with underscore prefix (optional)
class Service {
  private _cache: Map<string, any>;
  private apiKey: string;  // Both styles acceptable
}

// Enums - PascalCase for enum, UPPER_CASE for members
enum StreamStatus {
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
}

// ❌ WRONG
interface IMatch { }  // No "I" prefix
interface match { }   // Should be PascalCase
function FetchMatches() { }  // Should be camelCase
const max_retry = 3;  // Constants should be UPPER_SNAKE_CASE
```

#### File Naming

```
✅ CORRECT:
- daddyLiveService.ts
- matchCard.tsx
- streamValidator.ts
- types/match.ts
- utils/dateFormatter.ts

❌ WRONG:
- DaddyLiveService.ts
- match_card.tsx
- stream-validator.ts
- Types/Match.ts
```

#### Function Design

```typescript
// ✅ CORRECT - Pure, testable, single responsibility

// Small, focused functions
function calculateStreamScore(stream: Stream): number {
  return (
    stream.reliability * 0.4 +
    getQualityScore(stream.quality) * 0.3 +
    stream.provenance.trustScore * 0.3
  );
}

// Clear return types
function getMatchById(id: string): Promise<Match | null> {
  // Implementation
}

// Defensive programming
function validateMatchId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^match_[a-z0-9]+$/.test(id);
}

// Early returns for clarity
function processStream(stream: Stream): ProcessedStream | null {
  if (!stream.url) return null;
  if (!validateUrl(stream.url)) return null;
  if (stream.healthStatus === 'failed') return null;
  
  return {
    ...stream,
    processed: true,
  };
}

// ❌ WRONG - Complex, hard to test

function doEverything(data: any): any {
  // 200 lines of mixed concerns
  // Multiple responsibilities
  // Side effects everywhere
  // No clear return type
}
```

#### Type Safety

```typescript
// ✅ CORRECT - Strict typing

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: MatchStatus;
  score?: {
    home: number;
    away: number;
  };
}

type MatchStatus = 'live' | 'upcoming' | 'finished';

function getMatch(id: string): Promise<Match> {
  // Type-safe implementation
}

// Use discriminated unions for state
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'loading' };

// Use utility types
type PartialMatch = Partial<Match>;
type MatchKeys = keyof Match;
type RequiredMatch = Required<Match>;
type ReadonlyMatch = Readonly<Match>;

// ❌ WRONG - Loose typing

function getMatch(id: any): any {
  // No type safety
}

interface BadMatch {
  [key: string]: any;  // Avoid index signatures unless necessary
}
```

#### Error Handling

```typescript
// ✅ CORRECT - Comprehensive error handling

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchMatches(): Promise<Match[]> {
  try {
    const response = await fetch('/api/matches');
    
    if (!response.ok) {
      throw new ApiError(
        'Failed to fetch matches',
        response.status,
        'FETCH_ERROR'
      );
    }
    
    const data = await response.json();
    return MatchArraySchema.parse(data);
    
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message, error.code);
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      console.error('Validation Error:', error.errors);
      throw new ApiError('Invalid data format', 500, 'VALIDATION_ERROR');
    }
    
    console.error('Unexpected Error:', error);
    throw new ApiError('Internal error', 500, 'INTERNAL_ERROR');
  }
}

// ❌ WRONG - Poor error handling

async function badFetchMatches() {
  try {
    const response = await fetch('/api/matches');
    return await response.json();
  } catch (error) {
    console.log(error);  // Not helpful
    return null;  // Swallowing errors
  }
}
```

---

## ⚛️ React Best Practices

### Component Structure

```tsx
// ✅ CORRECT - Well-structured component

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

// Types/Interfaces at top
interface MatchCardProps {
  match: Match;
  onStreamClick: (streamId: string) => void;
  className?: string;
}

// Component
export function MatchCard({ match, onStreamClick, className }: MatchCardProps) {
  // Hooks at the top
  const [isExpanded, setIsExpanded] = useState(false);
  const [streams, setStreams] = useState<Stream[]>([]);
  
  // Effects
  useEffect(() => {
    if (isExpanded && streams.length === 0) {
      loadStreams();
    }
  }, [isExpanded]);
  
  // Callbacks
  const loadStreams = useCallback(async () => {
    try {
      const data = await fetchStreams(match.id);
      setStreams(data);
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  }, [match.id]);
  
  const handleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);
  
  // Early returns
  if (!match) return null;
  
  // Render
  return (
    <div className={`match-card ${className || ''}`}>
      <div className="match-header" onClick={handleExpand}>
        <span>{match.homeTeam}</span>
        <span>vs</span>
        <span>{match.awayTeam}</span>
      </div>
      
      {isExpanded && (
        <div className="streams-list">
          {streams.map((stream) => (
            <StreamItem
              key={stream.id}
              stream={stream}
              onClick={() => onStreamClick(stream.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Hooks Rules

```typescript
// ✅ CORRECT - Custom hooks

// Name starts with "use"
function useMatches(filters: MatchFilters) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function loadMatches() {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchMatches(filters);
        if (!cancelled) {
          setMatches(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    loadMatches();
    
    return () => {
      cancelled = true;
    };
  }, [filters]);
  
  return { matches, isLoading, error };
}

// Usage
function MatchList() {
  const { matches, isLoading, error } = useMatches({
    league: 'premier-league',
    status: 'live',
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

### Performance Optimization

```tsx
// ✅ CORRECT - Optimized rendering

import { memo, useMemo, useCallback } from 'react';

// Memoized component
export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  // Heavy computation memoized
  const streamQuality = useMemo(() => {
    return calculateAverageQuality(match.streams);
  }, [match.streams]);
  
  // Callback memoized
  const handleClick = useCallback(() => {
    analytics.track('match_clicked', { matchId: match.id });
  }, [match.id]);
  
  return (
    <div onClick={handleClick}>
      <h3>{match.homeTeam} vs {match.awayTeam}</h3>
      <QualityBadge score={streamQuality} />
    </div>
  );
});

// ❌ WRONG - Unnecessary re-renders

function BadMatchCard({ match }: MatchCardProps) {
  // Recalculates every render
  const streamQuality = calculateAverageQuality(match.streams);
  
  // Creates new function every render
  const handleClick = () => {
    analytics.track('match_clicked', { matchId: match.id });
  };
  
  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

---

## 🧪 Testing Standards

### Unit Tests

```typescript
// ✅ CORRECT - Comprehensive unit tests

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DaddyLiveService } from './daddyLiveService';

describe('DaddyLiveService', () => {
  let service: DaddyLiveService;
  
  beforeEach(() => {
    service = new DaddyLiveService({
      apiKey: 'test-key',
      baseUrl: 'https://test.api',
    });
  });
  
  describe('getMatches', () => {
    it('should fetch and return matches', async () => {
      // Arrange
      const mockMatches = [
        {
          id: 'match_1',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
        },
      ];
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMatches,
      });
      
      // Act
      const result = await service.getMatches();
      
      // Assert
      expect(result).toEqual(mockMatches);
      expect(fetch).toHaveBeenCalledWith(
        'https://test.api/matches',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );
    });
    
    it('should handle API errors gracefully', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      // Act & Assert
      await expect(service.getMatches()).rejects.toThrow('API Error');
    });
