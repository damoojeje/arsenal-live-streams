import { NextApiRequest, NextApiResponse } from 'next';
import { fetchStreamed } from '../../src/data/streamed';
import { fetchSportsurge } from '../../src/data/sportsurge';
import { fetchTotalSportek } from '../../src/data/totalsportek';
import { filterMatches } from '../../src/data/filter';
import { FilteredMatch } from '../../src/types';
import logger from '../../src/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilteredMatch[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('Starting match aggregation process');
    
    // Fetch from all sources in parallel
    const [streamedMatches, sportsurgeMatches, totalsportekMatches] = await Promise.allSettled([
      fetchStreamed(),
      fetchSportsurge(),
      fetchTotalSportek()
    ]);

    // Process results and handle failures gracefully
    const allMatches: any[] = [];
    
    if (streamedMatches.status === 'fulfilled') {
      allMatches.push(...streamedMatches.value);
      logger.info(`Streamed: ${streamedMatches.value.length} matches`);
    } else {
      logger.error(`Streamed failed: ${streamedMatches.reason}`);
    }
    
    if (sportsurgeMatches.status === 'fulfilled') {
      allMatches.push(...sportsurgeMatches.value);
      logger.info(`Sportsurge: ${sportsurgeMatches.value.length} matches`);
    } else {
      logger.error(`Sportsurge failed: ${sportsurgeMatches.reason}`);
    }
    
    if (totalsportekMatches.status === 'fulfilled') {
      allMatches.push(...totalsportekMatches.value);
      logger.info(`TotalSportek: ${totalsportekMatches.value.length} matches`);
    } else {
      logger.error(`TotalSportek failed: ${totalsportekMatches.reason}`);
    }

    logger.info(`Total matches collected: ${allMatches.length}`);

    // Deduplicate matches based on team names and time
    const deduplicatedMatches = deduplicateMatches(allMatches);
    logger.info(`After deduplication: ${deduplicatedMatches.length} matches`);

    // Filter for target clubs
    const filteredMatches = filterMatches(deduplicatedMatches);
    logger.info(`After filtering: ${filteredMatches.length} matches`);

    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json(filteredMatches);

  } catch (error) {
    logger.error(`API error: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function deduplicateMatches(matches: any[]): any[] {
  const seen = new Set<string>();
  const deduplicated: any[] = [];

  for (const match of matches) {
    // Create a unique key based on team names and time
    const key = `${match.homeTeam.toLowerCase()}-${match.awayTeam.toLowerCase()}-${match.time}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(match);
    }
  }

  return deduplicated;
}
