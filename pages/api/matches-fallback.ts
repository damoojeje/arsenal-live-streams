import type { NextApiRequest, NextApiResponse } from 'next';
import { FilteredMatch } from '../../src/types';
import logger from '../../src/utils/logger';

/**
 * Fallback API for when DaddyLive is down
 * Provides sample matches to keep the dashboard functional
 */

const SAMPLE_MATCHES: FilteredMatch[] = [
  {
    id: 'sample-1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    time: '15:00',
    date: new Date().toISOString(),
    competition: 'England - Premier League',
    links: [
      {
        url: 'sample-channel-1',
        quality: 'HD',
        type: 'stream',
        language: 'English',
        channelName: 'Sky Sports Main Event'
      }
    ],
    source: 'sample',
    isArsenalMatch: true,
    streamLinks: [
      {
        source: 'Sample',
        url: 'sample-channel-1',
        quality: 'HD'
      }
    ]
  },
  {
    id: 'sample-2',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    time: '17:30',
    date: new Date().toISOString(),
    competition: 'England - Premier League',
    links: [
      {
        url: 'sample-channel-2',
        quality: 'HD',
        type: 'stream',
        language: 'English',
        channelName: 'BT Sport 1'
      }
    ],
    source: 'sample',
    isArsenalMatch: false,
    streamLinks: [
      {
        source: 'Sample',
        url: 'sample-channel-2',
        quality: 'HD'
      }
    ]
  },
  {
    id: 'sample-3',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    time: '20:00',
    date: new Date().toISOString(),
    competition: 'Spain - La Liga',
    links: [
      {
        url: 'sample-channel-3',
        quality: 'HD',
        type: 'stream',
        language: 'Spanish',
        channelName: 'LaLiga TV'
      }
    ],
    source: 'sample',
    isArsenalMatch: false,
    streamLinks: [
      {
        source: 'Sample',
        url: 'sample-channel-3',
        quality: 'HD'
      }
    ]
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilteredMatch[] | { error: string }>
) {
  // Set cache-control headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    logger.info('Using fallback matches - DaddyLive API unavailable');
    
    // Return sample matches with a note that this is fallback data
    res.status(200).json(SAMPLE_MATCHES);
    
  } catch (error) {
    logger.error(`Error in fallback API: ${error}`);
    res.status(500).json({ error: 'Failed to fetch fallback matches' });
  }
}
