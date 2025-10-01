import type { NextApiRequest, NextApiResponse } from 'next';

interface MagneticGame {
  time: string;
  sport: string;
  event: string;
  channels: string;
}

interface ParsedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
  competition: string;
  links: any[];
  source: string;
  isArsenalMatch: boolean;
  streamLinks?: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set cache-control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // Fetch schedule from DaddyLive - using resolved domain
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'Referer': 'https://daddylivestream.com/',
      'Origin': 'https://daddylivestream.com'
    };
    const response = await fetch('https://daddylivestream.com/schedule/schedule-generated.php', { headers });
    const scheduleData = await response.json();

    const matches: ParsedMatch[] = [];
    const currentDate = new Date().toISOString();

    // Iterate through all dates in the schedule
    for (const [dateKey, categories] of Object.entries(scheduleData)) {
      // Look for soccer/football categories (multiple possible names)
      const categoriesObj = categories as any;
      const soccerCategories = [
        categoriesObj['Soccer'],
        categoriesObj['Football'],
        categoriesObj['All Soccer Events'],
        categoriesObj['England - Championship/EFL Trophy/League One']
      ].filter(cat => cat && Array.isArray(cat));

      // Process all soccer-related categories
      for (const soccerCategory of soccerCategories) {
        for (const event of soccerCategory) {
          // Skip Simulcast events (multi-game broadcasts)
          if (event.event.includes('Simulcast')) {
            continue;
          }

          // Parse DaddyLive event format: "Country/Competition : Home Team vs Away Team"
          let homeTeam = '';
          let awayTeam = '';
          let competition = 'Live Match';

          // Split by colon to separate competition from match
          const parts = event.event.split(':');

          if (parts.length >= 2) {
            // First part is the competition/country
            competition = parts[0].trim();

            // Second part contains "Home vs Away" or "Home vs. Away"
            const matchPart = parts.slice(1).join(':').trim();
            const vsMatch = matchPart.match(/^(.+?)\s+vs\.?\s+(.+)$/i);

            if (vsMatch) {
              homeTeam = vsMatch[1].trim();
              awayTeam = vsMatch[2].trim();
            } else {
              // Fallback: if no "vs" found, use the whole match part
              homeTeam = matchPart;
              awayTeam = 'TBD';
            }
          } else {
            // No colon separator, try to parse as "Team vs Team" or "Team vs. Team"
            const vsMatch = event.event.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
            if (vsMatch) {
              homeTeam = vsMatch[1].trim();
              awayTeam = vsMatch[2].trim();
            } else {
              // Skip matches that can't be parsed
              continue;
            }
          }

          // Get all available channels for this match
          const channels = Array.isArray(event.channels) ? event.channels : [];
          const streamLinks = channels.map((channel: any) => ({
            channelName: channel.channel_name || 'DaddyLive',
            url: channel.channel_id,  // Just the channel ID, not the full URL
            channelId: channel.channel_id,
            quality: 'HD',
            type: 'stream'
          }));

          // Skip if no channels available
          if (streamLinks.length === 0) {
            continue;
          }

          // Check if it's an Arsenal match
          const isArsenalMatch =
            homeTeam.toLowerCase().includes('arsenal') ||
            awayTeam.toLowerCase().includes('arsenal');

          matches.push({
            id: `daddylive-${Date.now()}-${matches.length}`,
            homeTeam,
            awayTeam,
            time: event.time || 'TBD',
            date: currentDate,
            competition,
            links: streamLinks,  // Use streamLinks as links
            source: 'daddylive',
            isArsenalMatch,
            streamLinks
          });
        }
      }
    }

    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching DaddyLive games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}
