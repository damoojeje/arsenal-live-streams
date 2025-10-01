import { NextApiRequest, NextApiResponse } from 'next';
import { getDaddyLiveStreamResolver } from '../../../src/services/daddylive/streamResolver';
import logger from '../../../src/utils/logger';

/**
 * Get embedded stream URL for a channel
 * This bypasses the ad-filled stream page and returns the direct embed URL
 *
 * GET /api/embed/:channelId
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channelId } = req.query;

  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }

  try {
    logger.info(`API: Fetching embed URL for channel ${channelId}`);

    const resolver = getDaddyLiveStreamResolver();
    const embedUrl = await resolver.extractEmbedUrl(channelId);

    if (!embedUrl) {
      logger.warn(`No embed URL found for channel ${channelId}`);
      return res.status(404).json({
        error: 'No embed URL found',
        fallback: `https://daddylivestream.com/stream/stream-${channelId}.php`
      });
    }

    logger.info(`Successfully extracted embed URL for channel ${channelId}`);

    return res.status(200).json({
      channelId,
      embedUrl,
      success: true
    });

  } catch (error) {
    logger.error(`Error getting embed URL: ${error}`);
    return res.status(500).json({
      error: 'Internal server error',
      fallback: `https://daddylivestream.com/stream/stream-${channelId}.php`
    });
  }
}