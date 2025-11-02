import type { NextApiRequest, NextApiResponse } from 'next';
import { getTotalSportekScheduleService } from '../../../src/services/totalsportek/scheduleService';
import { filterMatches } from '../../../src/data/filter';
import { FilteredMatch } from '../../../src/types';
import logger from '../../../src/utils/logger';

/**
 * TotalSportek Matches API
 * Fallback source when DaddyLive is unavailable
 *
 * Usage: GET /api/totalsportek/matches
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilteredMatch[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('Fetching matches from TotalSportek');

    const scheduleService = getTotalSportekScheduleService();
    const matches = await scheduleService.fetchMatches();

    logger.info(`TotalSportek: Retrieved ${matches.length} matches`);

    // Filter for target clubs
    const filteredMatches = filterMatches(matches);
    logger.info(`After filtering: ${filteredMatches.length} matches`);

    // Set cache headers (longer cache due to scraping cost)
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Source', 'TotalSportek');

    res.status(200).json(filteredMatches);

  } catch (error) {
    logger.error(`Error fetching TotalSportek matches: ${error}`);
    res.status(500).json({ error: 'Failed to fetch matches from TotalSportek' });
  }
}
