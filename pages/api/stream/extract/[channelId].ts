import type { NextApiRequest, NextApiResponse } from 'next';
import { getDaddyLiveStreamExtractor, ExtractedStream } from '../../../../src/services/daddylive/streamExtractor';
import logger from '../../../../src/utils/logger';

/**
 * Stream Extraction API Endpoint
 *
 * Extracts direct m3u8 URLs from DaddyLive pages for ad-free playback
 *
 * IMPORTANT: This endpoint does NOT proxy video data
 * - It only extracts the m3u8 URL from the HTML (~10KB operation)
 * - Browser plays video directly from DaddyLive CDN
 * - Our server never touches the video stream itself
 *
 * Usage:
 *   GET /api/stream/extract/468
 *
 * Response:
 *   {
 *     "success": true,
 *     "streamUrl": "https://cdn.../stream.m3u8",
 *     "quality": "HD",
 *     "type": "hls"
 *   }
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtractedStream>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { channelId } = req.query;

  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid channel ID'
    });
  }

  try {
    logger.info(`Stream extraction requested for channel: ${channelId}`);

    const extractor = getDaddyLiveStreamExtractor();
    const result = await extractor.extractStreamUrl(channelId);

    // Set appropriate cache headers
    if (result.success) {
      // Cache successful extractions for 5 minutes
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    } else {
      // Don't cache failures
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    res.setHeader('Content-Type', 'application/json');

    // Return extraction result
    res.status(result.success ? 200 : 500).json(result);

  } catch (error) {
    logger.error(`Stream extraction error for channel ${channelId}: ${error}`);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'iframe',
      fallbackUrl: `https://dlhd.dad/stream/stream-${channelId}.php`
    });
  }
}
