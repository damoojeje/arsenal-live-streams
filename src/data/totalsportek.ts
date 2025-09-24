import axios from 'axios';
import * as cheerio from 'cheerio';
import { Match, StreamLink } from '../types';
import logger from '../utils/logger';

const BASE_URL = 'https://live.totalsportek007.com';

export async function fetchTotalSportek(): Promise<Match[]> {
  const matches: Match[] = [];
  
  try {
    logger.info(`Fetching from TotalSportek: ${BASE_URL}`);
    
    const response = await axios.get(BASE_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    logger.info(`TotalSportek response: ${response.status} ${response.statusText}`);
    
    const $ = cheerio.load(response.data);
    
    // Look for match entries with team names in divs - prioritize live/upcoming matches
    const matchContainers = $('a.competition[href*="vs-"], a[href*="vs-"]').slice(0, 20); // Limit to first 20 matches
    
    matchContainers.each((index, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      // Look for team names in the container
      const teamDivs = $el.find('div.row div.col-12');
      if (teamDivs.length >= 2) {
        const homeTeam = $(teamDivs[0]).text().trim();
        const awayTeam = $(teamDivs[1]).text().trim();
        
        // Only include matches with our target teams
        const targetTeams = ['Arsenal', 'Chelsea', 'Manchester City', 'Manchester United', 'Liverpool', 'Barcelona', 'Real Madrid', 'AC Milan', 'Inter Milan', 'Juventus', 'Napoli', 'PSG', 'Bayern Munich', 'Tottenham', 'Atletico Madrid'];
        
        if (homeTeam && awayTeam && homeTeam !== awayTeam) {
          const isTargetMatch = targetTeams.some(team => 
            homeTeam.toLowerCase().includes(team.toLowerCase()) || 
            awayTeam.toLowerCase().includes(team.toLowerCase())
          );
          
          if (isTargetMatch) {
            matches.push({
              id: `totalsportek-${index}`,
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              time: 'Live',
              date: new Date().toISOString().split('T')[0],
              competition: 'Football',
              links: [{
                url: href && href.startsWith('http') ? href : `${BASE_URL}${href || ''}`,
                quality: 'HD',
                type: 'stream' as const,
                language: 'English'
              }],
              source: 'totalsportek'
            });
          }
        }
      }
    });
    
    // Also look for match entries in the "Important Games" section
    const matchEntries = $('div:contains("from now"), div:contains("Match Started")').filter(function() {
      const text = $(this).text();
      return text.includes('from now') || text.includes('Match Started');
    });
    
    matchEntries.each((index, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      // Parse match text like "24min from now Port Vale Arsenal"
      const matchInfo = parseTotalSportekMatch(text);
      
      if (matchInfo.homeTeam && matchInfo.awayTeam) {
        // Look for the "Live stream" button or link
        const streamButton = $el.find('a:contains("Live stream"), a:contains("Stream")').first();
        const streamUrl = streamButton.attr('href') || '#';
        
        matches.push({
          id: `totalsportek-${index}`,
          homeTeam: matchInfo.homeTeam,
          awayTeam: matchInfo.awayTeam,
          time: matchInfo.time || 'TBD',
          date: matchInfo.date || new Date().toISOString().split('T')[0],
          competition: matchInfo.competition || 'Football',
          links: [{
            url: streamUrl.startsWith('http') ? streamUrl : `${BASE_URL}${streamUrl}`,
            quality: 'HD',
            type: 'stream' as const,
            language: 'English'
          }],
          source: 'totalsportek'
        });
      }
    });
    
    // Also look for team-specific links in the "Top Teams" section - limit to first 10
    const teamLinks = $('a[href*="Stream"], a[href*="stream"]').slice(0, 10);
    
    teamLinks.each((index, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text && text.includes('Stream')) {
        // Extract team name from text like "Arsenal Streams"
        const teamName = text.replace(/\s+Streams?/i, '').trim();
        
        if (teamName && ['Arsenal', 'Chelsea', 'Manchester City', 'Manchester United', 'Liverpool', 'Barcelona', 'Real Madrid', 'AC Milan', 'Inter Milan', 'Juventus', 'Napoli', 'PSG', 'Bayern Munich'].includes(teamName)) {
          matches.push({
            id: `totalsportek-team-${index}`,
            homeTeam: teamName,
            awayTeam: 'TBD',
            time: 'TBD',
            date: new Date().toISOString().split('T')[0],
            competition: 'Football',
            links: [{
              url: href && href.startsWith('http') ? href : `${BASE_URL}${href || ''}`,
              quality: 'HD',
              type: 'stream' as const,
              language: 'English'
            }],
            source: 'totalsportek'
          });
        }
      }
    });
    
    logger.info(`TotalSportek: Found ${matches.length} matches`);
    
  } catch (error) {
    logger.error(`Error fetching from TotalSportek: ${error}`);
  }
  
  return matches;
}

function parseTotalSportekMatch(text: string): {
  homeTeam: string;
  awayTeam: string;
  time?: string;
  date?: string;
  competition?: string;
} {
  // Parse patterns like "24min from now Port Vale Arsenal" or "Match Started Getafe Deportivo Alaves"
  const patterns = [
    /(\d+min)\s+from\s+now\s+(.+?)\s+(.+?)(?:\s+Point|$)/i,
    /Match\s+Started\s+(.+?)\s+(.+?)(?:\s+Point|$)/i,
    /(\d+hr\s+\d+min)\s+from\s+now\s+(.+?)\s+(.+?)(?:\s+Point|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        homeTeam: match[2]?.trim() || '',
        awayTeam: match[3]?.trim() || '',
        time: match[1]?.trim() || 'TBD',
        date: new Date().toISOString().split('T')[0],
        competition: 'Football'
      };
    }
  }
  
  return { homeTeam: '', awayTeam: '' };
}

function parseMatchInfo(dataMatch: string, text: string): {
  homeTeam: string;
  awayTeam: string;
  time?: string;
  date?: string;
  competition?: string;
} {
  // Try to parse from data-match attribute first
  try {
    const matchData = JSON.parse(dataMatch);
    return {
      homeTeam: matchData.homeTeam || matchData.home_team || '',
      awayTeam: matchData.awayTeam || matchData.away_team || '',
      time: matchData.time || matchData.start_time,
      date: matchData.date || matchData.match_date,
      competition: matchData.competition || matchData.league
    };
  } catch {
    // Fallback to text parsing
    return parseMatchFromText(text);
  }
}

function parseMatchFromText(text: string): {
  homeTeam: string;
  awayTeam: string;
  time?: string;
  date?: string;
  competition?: string;
} {
  // Common patterns for match text
  const patterns = [
    /^(.+?)\s+vs\s+(.+?)$/i,
    /^(.+?)\s+v\s+(.+?)$/i,
    /^(.+?)\s+-\s+(.+?)$/i,
    /^(.+?)\s+@\s+(.+?)$/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        homeTeam: match[1].trim(),
        awayTeam: match[2].trim()
      };
    }
  }
  
  // If no pattern matches, try to split by common separators
  const separators = [' vs ', ' v ', ' - ', ' @ '];
  for (const sep of separators) {
    if (text.includes(sep)) {
      const parts = text.split(sep);
      if (parts.length === 2) {
        return {
          homeTeam: parts[0].trim(),
          awayTeam: parts[1].trim()
        };
      }
    }
  }
  
  return { homeTeam: '', awayTeam: '' };
}
