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
      // Look for soccer/football categories
      const categoriesObj = categories as any;
      const soccerCategory = categoriesObj['Soccer'] || categoriesObj['Football'];

      if (soccerCategory && Array.isArray(soccerCategory)) {
        for (const event of soccerCategory) {
          // Parse team names from event name
          let homeTeam = '';
          let awayTeam = '';
          let competition = 'Live Match';

          // Try to extract teams from "Team A vs Team B" format
          const vsMatch = event.event.match(/^(.+?)\s+(?:vs\.?|v)\s+(.+?)(?:\s+\((.+?)\))?$/i);
          if (vsMatch) {
            homeTeam = vsMatch[1].trim();
            awayTeam = vsMatch[2].trim();
            if (vsMatch[3]) {
              competition = vsMatch[3].trim();
            }
          } else {
            // If no vs pattern, use whole event name
            homeTeam = event.event;
            awayTeam = 'TBD';
          }

          // Get channel ID for streaming
          const channelId = event.channels[0]?.channel_id || '1';

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
            links: [],
            source: 'daddylive',
            isArsenalMatch,
            streamLinks: [
              {
                source: 'DaddyLive',
                url: channelId,
                quality: 'HD'
              }
            ]
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
