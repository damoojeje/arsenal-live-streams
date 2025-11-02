import { getDaddyLiveScheduleService } from './daddylive/scheduleService';
import { getTotalSportekScheduleService } from './totalsportek/scheduleService';
import { filterMatches } from '../data/filter';
import { Match, FilteredMatch } from '../types';
import logger from '../utils/logger';

/**
 * Unified Source Manager
 * Manages multiple match data sources with intelligent failover
 *
 * Priority Order:
 * 1. DaddyLive (fast, reliable, API-based)
 * 2. TotalSportek7 (fallback, web scraping)
 * 3. Cached data (emergency)
 */

export interface SourceResult {
  matches: FilteredMatch[];
  source: 'daddylive' | 'totalsportek' | 'cache' | 'none';
  timestamp: number;
  error?: string;
}

export class SourceManager {
  private cache: { matches: FilteredMatch[]; timestamp: number } | null = null;
  private cacheDuration = 300000; // 5 minutes

  /**
   * Fetch matches from all sources with intelligent failover
   */
  async fetchMatches(): Promise<SourceResult> {
    // Try DaddyLive first (primary source)
    try {
      logger.info('Attempting to fetch from DaddyLive (primary source)...');
      const daddyLiveService = getDaddyLiveScheduleService();
      const matches = await daddyLiveService.fetchMatches();

      if (matches.length > 0) {
        const filteredMatches = filterMatches(matches);
        logger.info(`✓ DaddyLive: ${filteredMatches.length} matches`);

        // Update cache
        this.updateCache(filteredMatches);

        return {
          matches: filteredMatches,
          source: 'daddylive',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      logger.warn(`DaddyLive failed: ${error}`);
    }

    // Try TotalSportek as fallback
    try {
      logger.info('Attempting to fetch from TotalSportek (fallback source)...');
      const totalSportekService = getTotalSportekScheduleService();
      const matches = await totalSportekService.fetchMatches();

      if (matches.length > 0) {
        const filteredMatches = filterMatches(matches);
        logger.info(`✓ TotalSportek: ${filteredMatches.length} matches`);

        // Update cache
        this.updateCache(filteredMatches);

        return {
          matches: filteredMatches,
          source: 'totalsportek',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      logger.warn(`TotalSportek failed: ${error}`);
    }

    // Return cached data if available
    if (this.cache) {
      const cacheAge = Date.now() - this.cache.timestamp;
      logger.warn(`All sources failed, using cached data (age: ${Math.floor(cacheAge / 1000)}s)`);

      return {
        matches: this.cache.matches,
        source: 'cache',
        timestamp: this.cache.timestamp,
        error: 'All sources unavailable, using cached data'
      };
    }

    // No data available
    logger.error('All sources failed and no cache available');

    return {
      matches: [],
      source: 'none',
      timestamp: Date.now(),
      error: 'All match sources are currently unavailable'
    };
  }

  /**
   * Fetch matches with deduplication from multiple sources
   */
  async fetchMatchesMultiSource(): Promise<SourceResult> {
    const allMatches: FilteredMatch[] = [];
    const sources: Array<'daddylive' | 'totalsportek'> = [];

    // Try both sources in parallel
    const [daddyLiveResult, totalSportekResult] = await Promise.allSettled([
      this.fetchFromDaddyLive(),
      this.fetchFromTotalSportek()
    ]);

    // Collect successful results
    if (daddyLiveResult.status === 'fulfilled' && daddyLiveResult.value.length > 0) {
      allMatches.push(...daddyLiveResult.value);
      sources.push('daddylive');
    }

    if (totalSportekResult.status === 'fulfilled' && totalSportekResult.value.length > 0) {
      allMatches.push(...totalSportekResult.value);
      sources.push('totalsportek');
    }

    if (allMatches.length === 0) {
      // Fall back to standard fetch with failover
      return this.fetchMatches();
    }

    // Deduplicate matches
    const deduplicatedMatches = this.deduplicateMatches(allMatches);

    logger.info(`Multi-source: ${deduplicatedMatches.length} unique matches from ${sources.join(', ')}`);

    // Update cache
    this.updateCache(deduplicatedMatches);

    return {
      matches: deduplicatedMatches,
      source: sources.length > 1 ? 'daddylive' : sources[0], // Primary source in label
      timestamp: Date.now()
    };
  }

  /**
   * Fetch from DaddyLive only
   */
  private async fetchFromDaddyLive(): Promise<FilteredMatch[]> {
    try {
      const service = getDaddyLiveScheduleService();
      const matches = await service.fetchMatches();
      return filterMatches(matches);
    } catch (error) {
      logger.warn(`DaddyLive fetch failed: ${error}`);
      return [];
    }
  }

  /**
   * Fetch from TotalSportek only
   */
  private async fetchFromTotalSportek(): Promise<FilteredMatch[]> {
    try {
      const service = getTotalSportekScheduleService();
      const matches = await service.fetchMatches();
      return filterMatches(matches);
    } catch (error) {
      logger.warn(`TotalSportek fetch failed: ${error}`);
      return [];
    }
  }

  /**
   * Deduplicate matches from multiple sources
   * Matches are considered duplicates if:
   * - Same teams (case-insensitive)
   * - Similar time (within 15 minutes)
   */
  private deduplicateMatches(matches: FilteredMatch[]): FilteredMatch[] {
    const uniqueMatches: FilteredMatch[] = [];

    for (const match of matches) {
      // Check if this match is similar to any existing match
      const isDuplicate = uniqueMatches.some(existing =>
        this.areMatchesSimilar(match, existing)
      );

      if (!isDuplicate) {
        uniqueMatches.push(match);
      } else {
        // If duplicate, merge links from both sources
        const existing = uniqueMatches.find(m => this.areMatchesSimilar(m, match));
        if (existing) {
          existing.links.push(...match.links);
        }
      }
    }

    return uniqueMatches;
  }

  /**
   * Check if two matches are similar (likely the same match)
   */
  private areMatchesSimilar(match1: FilteredMatch, match2: FilteredMatch): boolean {
    // Normalize team names
    const home1 = match1.homeTeam.toLowerCase().trim();
    const away1 = match1.awayTeam.toLowerCase().trim();
    const home2 = match2.homeTeam.toLowerCase().trim();
    const away2 = match2.awayTeam.toLowerCase().trim();

    // Check if teams match
    const teamsMatch = (home1 === home2 && away1 === away2) ||
                      (home1 === away2 && away1 === home2); // Reversed

    if (!teamsMatch) {
      return false;
    }

    // Check if times are similar (within 15 minutes)
    try {
      const time1 = new Date(match1.date).getTime();
      const time2 = new Date(match2.date).getTime();
      const timeDiff = Math.abs(time1 - time2);
      const fifteenMinutes = 15 * 60 * 1000;

      return timeDiff < fifteenMinutes;
    } catch {
      // If time parsing fails, consider them different
      return false;
    }
  }

  /**
   * Update cache with fresh data
   */
  private updateCache(matches: FilteredMatch[]): void {
    this.cache = {
      matches,
      timestamp: Date.now()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { cached: boolean; age?: number; count?: number } {
    if (!this.cache) {
      return { cached: false };
    }

    return {
      cached: true,
      age: Date.now() - this.cache.timestamp,
      count: this.cache.matches.length
    };
  }
}

// Singleton instance
let instance: SourceManager | null = null;

export function getSourceManager(): SourceManager {
  if (!instance) {
    instance = new SourceManager();
  }
  return instance;
}
