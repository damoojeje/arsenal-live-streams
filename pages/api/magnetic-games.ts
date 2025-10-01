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
    // Fetch today's games from magnetic.website
    const response = await fetch('https://magnetic.website/todays_games2.txt');
    const text = await response.text();

    // Parse the text file
    const lines = text.split('\n');
    const matches: ParsedMatch[] = [];
    const currentDate = new Date().toISOString();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('***')) continue;

      // Parse format: TIME | SPORT | EVENT | CHANNELS
      const parts = trimmed.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const [timeStr, sport, event, channels] = parts;

        // Only process Football/Soccer matches
        if (sport && (sport.toLowerCase().includes('football') || sport.toLowerCase().includes('soccer'))) {
          // Parse team names from event
          let homeTeam = '';
          let awayTeam = '';
          const competition = sport;

          // Try to extract teams from "Team A vs Team B" or "Team A @ Team B"
          const vsMatch = event.match(/(.+?)\s+(?:vs\.?|@)\s+(.+)/i);
          if (vsMatch) {
            homeTeam = vsMatch[1].trim();
            awayTeam = vsMatch[2].trim();
          } else {
            // If we can't parse teams, use the event as homeTeam
            homeTeam = event;
            awayTeam = 'TBD';
          }

          // Check if it's an Arsenal match
          const isArsenalMatch =
            homeTeam.toLowerCase().includes('arsenal') ||
            awayTeam.toLowerCase().includes('arsenal');

          matches.push({
            id: `magnetic-${Date.now()}-${matches.length}`,
            homeTeam,
            awayTeam,
            time: timeStr || 'TBD',
            date: currentDate,
            competition,
            links: [],
            source: 'magnetic',
            isArsenalMatch,
            streamLinks: [
              {
                source: 'DaddyLive',
                url: '#',
                quality: 'HD'
              }
            ]
          });
        }
      }
    }

    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching magnetic games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}
