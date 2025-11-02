import type { NextApiRequest, NextApiResponse } from 'next';
import { getDaddyLiveChannelsService, Channel } from '../../src/services/daddylive/channelsService';
import logger from '../../src/utils/logger';

/**
 * API endpoint for 24/7 live sports channels
 * GET /api/channels - Returns all channels
 * GET /api/channels?search=sky - Search channels
 * GET /api/channels?category=Sky%20Sports - Filter by category
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Channel[] | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const channelsService = getDaddyLiveChannelsService();
    const { search, category } = req.query;

    let channels: Channel[];

    if (search && typeof search === 'string') {
      // Search channels
      logger.info(`Searching channels for: ${search}`);
      channels = await channelsService.searchChannels(search);
    } else if (category && typeof category === 'string') {
      // Filter by category
      logger.info(`Filtering channels by category: ${category}`);
      channels = await channelsService.getChannelsByCategory(category);
    } else {
      // Get all channels
      logger.info('Fetching all channels');
      channels = await channelsService.fetchChannels();
    }

    // Set cache headers (1 hour)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return res.status(200).json(channels);
  } catch (error) {
    logger.error(`Error in channels API: ${error}`);
    return res.status(500).json({ error: 'Failed to fetch channels' });
  }
}
