import type { NextApiRequest, NextApiResponse } from 'next';
import { getDaddyLiveScheduleService } from '../../src/services/daddylive/scheduleService';
import { filterMatches } from '../../src/data/filter';
import { FilteredMatch } from '../../src/types';
import logger from '../../src/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilteredMatch[] | { error: string }>
) {
  // Set cache-control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    logger.info('Fetching matches from DaddyLive API');
    
    // Use the proper DaddyLive service instead of hardcoded domain
    const scheduleService = getDaddyLiveScheduleService();
    const daddyLiveMatches = await scheduleService.fetchMatches();
    
    logger.info(`DaddyLive: Retrieved ${daddyLiveMatches.length} matches`);

    // Filter for target clubs (Arsenal and other popular teams)
    const filteredMatches = filterMatches(daddyLiveMatches);
    logger.info(`After filtering: ${filteredMatches.length} matches`);

    res.status(200).json(filteredMatches);
  } catch (error) {
    logger.error(`Error fetching DaddyLive games: ${error}`);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}
