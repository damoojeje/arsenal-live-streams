import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Aggregated Stream Sources API
 * Returns multiple working stream sources for redundancy
 */

interface StreamSource {
  name: string;
  url: string;
  type: 'iframe' | 'direct';
  priority: number;
  status: 'active' | 'checking' | 'down';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { channelId, matchName } = req.query;

  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ error: 'Channel ID is required' });
  }

  // Multiple source aggregators (in priority order)
  const sources: StreamSource[] = [
    // DaddyLive (primary)
    {
      name: 'DaddyLive',
      url: `https://dlhd.dad/stream/stream-${channelId}.php`,
      type: 'iframe',
      priority: 1,
      status: 'active'
    },
    // Alternative domain 1
    {
      name: 'DaddyLive Alt',
      url: `https://daddylivestream.com/stream/stream-${channelId}.php`,
      type: 'iframe',
      priority: 2,
      status: 'active'
    },
    // StreamEast (if available)
    {
      name: 'StreamEast',
      url: `https://streameast.io/player/${channelId}`,
      type: 'iframe',
      priority: 3,
      status: 'checking'
    },
    // Backup embed sources
    {
      name: 'HD Streams',
      url: `https://embedme.top/embed/${channelId}`,
      type: 'iframe',
      priority: 4,
      status: 'checking'
    },
    {
      name: 'CricHD',
      url: `https://hdfree.live/embed/${channelId}`,
      type: 'iframe',
      priority: 5,
      status: 'checking'
    }
  ];

  // Filter to active sources only for now
  const activeSources = sources.filter(s => s.status === 'active');

  res.status(200).json({
    channelId,
    matchName: matchName || 'Live Match',
    sources: activeSources,
    totalSources: activeSources.length,
    recommendation: activeSources[0], // Highest priority
    lastUpdated: new Date().toISOString()
  });
}
