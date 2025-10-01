import { NextApiRequest, NextApiResponse } from 'next';
import { getDaddyLiveStreamResolver } from '../../../src/services/daddylive/streamResolver';
import logger from '../../../src/utils/logger';

/**
 * Get direct HLS stream URL for a channel (bypasses all ads!)
 *
 * GET /api/stream/:channelId
 *
 * Returns the direct m3u8 stream URL that can be played with HLS.js
 * This completely bypasses the DaddyLive iframe and all ads
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
    logger.info(`API: Resolving direct stream URL for channel ${channelId}`);

    const resolver = getDaddyLiveStreamResolver();
    const stream = await resolver.resolveStream(channelId);

    if (!stream) {
      logger.warn(`No stream URL found for channel ${channelId}`);
      return res.status(404).json({
        error: 'No stream URL found',
        fallback: `https://dlhd.dad/stream/stream-${channelId}.php`
      });
    }

    logger.info(`Successfully resolved stream URL for channel ${channelId}`);

    return res.status(200).json({
      channelId,
      streamUrl: stream.url,
      headers: stream.headers,
      quality: stream.quality,
      type: stream.type,
      success: true
    });

  } catch (error) {
    logger.error(`Error getting stream URL: ${error}`);
    return res.status(500).json({
      error: 'Internal server error',
      fallback: `https://dlhd.dad/stream/stream-${channelId}.php`
    });
  }
}