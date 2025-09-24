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
    
    // Look for live stream links
    const streamElements = $('a.live-stream[data-match]');
    
    streamElements.each((index, element) => {
      const $el = $(element);
      const dataMatch = $el.attr('data-match');
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (dataMatch && href && text) {
        // Parse match information from data-match attribute or text
        const matchInfo = parseMatchInfo(dataMatch, text);
        
        if (matchInfo.homeTeam && matchInfo.awayTeam) {
          matches.push({
            id: `totalsportek-${index}`,
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            time: matchInfo.time || 'TBD',
            date: matchInfo.date || new Date().toISOString().split('T')[0],
            competition: matchInfo.competition || 'Football',
            links: [{
              url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
              quality: 'HD',
              type: 'stream' as const,
              language: 'English'
            }],
            source: 'totalsportek'
          });
        }
      }
    });
    
    // Also look for regular match links
    const matchLinks = $('a[href*="/match/"], a[href*="/watch/"]');
    
    matchLinks.each((index, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text && !text.includes('Live Stream')) {
        const matchInfo = parseMatchFromText(text);
        
        if (matchInfo.homeTeam && matchInfo.awayTeam) {
          matches.push({
            id: `totalsportek-link-${index}`,
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            time: matchInfo.time || 'TBD',
            date: matchInfo.date || new Date().toISOString().split('T')[0],
            competition: matchInfo.competition || 'Football',
            links: [{
              url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
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
