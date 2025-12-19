import { NextApiRequest, NextApiResponse } from 'next';
import { getDaddyLiveScheduleService } from '../../src/services/daddylive/scheduleService';
import { getTotalSportekScraperService } from '../../src/services/totalsportek/scraperService';
import { Match } from '../../src/types';
import logger from '../../src/utils/logger';

/**
 * All Matches API
 * 
 * Returns ALL football matches with automatic fallback:
 * 1. Try DaddyLive first (primary source - has its own 60s cache)
 * 2. If DaddyLive fails or has no data, fall back to TotalSportek
 * 
 * Note: Individual services handle their own caching, so we don't need API-level cache
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Match[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('Fetching matches from available sources...');
    
    const allMatches: Match[] = [];
    let primarySource = 'none';

    // Try DaddyLive first (primary source)
    try {
      const scheduleService = getDaddyLiveScheduleService();
      const daddyMatches = await scheduleService.fetchMatches();
      
      if (daddyMatches.length > 0) {
        logger.info(`DaddyLive: Retrieved ${daddyMatches.length} matches`);
        allMatches.push(...daddyMatches);
        primarySource = 'DaddyLive';
      } else {
        logger.warn('DaddyLive returned no matches');
      }
    } catch (error) {
      logger.warn(`DaddyLive fetch failed: ${error}`);
    }

    // Try TotalSportek as fallback only if DaddyLive failed
    if (allMatches.length === 0) {
      try {
        const totalSportekService = getTotalSportekScraperService();
        const tsMatches = await totalSportekService.fetchMatches();
        
        if (tsMatches.length > 0) {
          logger.info(`TotalSportek (fallback): Retrieved ${tsMatches.length} matches`);
          allMatches.push(...tsMatches);
          primarySource = 'TotalSportek';
        }
      } catch (error) {
        logger.warn(`TotalSportek fetch failed: ${error}`);
      }
    }

    // Deduplicate matches
    const uniqueMatches = deduplicateMatches(allMatches);
    logger.info(`Returning ${uniqueMatches.length} unique matches (source: ${primarySource})`);

    // Set response headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Match-Count', uniqueMatches.length.toString());
    res.setHeader('X-Primary-Source', primarySource);

    if (uniqueMatches.length > 0) {
      return res.status(200).json(uniqueMatches);
    }

    // No data available from any source
    logger.error('No matches available from any source');
    return res.status(503).json({ error: 'No matches available. Please try again later.' });

  } catch (error) {
    logger.error(`API error: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Deduplicate matches based on team names
 */
function deduplicateMatches(matches: Match[]): Match[] {
  const seen = new Set<string>();
  const unique: Match[] = [];

  for (const match of matches) {
    // Create a unique key from normalized team names
    const key = `${match.homeTeam.toLowerCase().trim()}-vs-${match.awayTeam.toLowerCase().trim()}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(match);
    }
  }

  return unique;
}
