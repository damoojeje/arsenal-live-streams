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

    // Parse the text file - new format: Sport | \n Date Time \n Teams (Competition) | \n TV Coverage
    const lines = text.split('\n');
    const matches: ParsedMatch[] = [];
    const currentDate = new Date().toISOString();

    let currentSport = '';
    let currentTime = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Line 1: Sport name followed by |
      if (line.endsWith('|')) {
        currentSport = line.replace('|', '').trim();
        continue;
      }

      // Line 2: Date and time
      if (line.match(/^\d{2}\/\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)-/)) {
        // Extract just the time portion (e.g., "03:00 PM")
        const timeMatch = line.match(/(\d{1,2}:\d{2}\s+(?:AM|PM))/);
        currentTime = timeMatch ? timeMatch[1] : 'TBD';
        continue;
      }

      // Line 3: Event info (Teams and Competition)
      if (line.includes('(') && line.includes(')') && currentSport.toLowerCase().includes('football')) {
        // Extract teams and competition
        const eventMatch = line.match(/^(.+?)\s*\((.+?)\)/);
        if (eventMatch) {
          const teamsStr = eventMatch[1].trim();
          const competition = eventMatch[2].trim();

          // Parse team names - look for " - " separator
          let homeTeam = '';
          let awayTeam = '';

          const teamMatch = teamsStr.match(/^(.+?)\s+-\s+(.+?)(?:\s+\(|$)/);
          if (teamMatch) {
            homeTeam = teamMatch[1].trim();
            awayTeam = teamMatch[2].trim();
          } else {
            homeTeam = teamsStr;
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
            time: currentTime || 'TBD',
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
