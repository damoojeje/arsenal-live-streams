import axios from 'axios';
import * as cheerio from 'cheerio';
import { Match, StreamLink } from '../types';
import logger from '../utils/logger';

const BASE_URL = 'https://streamed.pk';
const API_URL = `${BASE_URL}/api/events`;
const FALLBACK_URL = `${BASE_URL}/category/football`;

export async function fetchStreamed(): Promise<Match[]> {
  const matches: Match[] = [];
  
  try {
    // Try API first
    const today = new Date().toISOString().split('T')[0];
    const apiUrl = `${API_URL}?sport=football&date=${today}`;
    
    logger.info(`Fetching from Streamed API: ${apiUrl}`);
    
    try {
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      logger.info(`Streamed API response: ${response.status} ${response.statusText}`);
      
      if (response.data && Array.isArray(response.data)) {
        const apiMatches = response.data.map((event: any, index: number) => ({
          id: `streamed-api-${index}`,
          homeTeam: event.home_team || 'TBD',
          awayTeam: event.away_team || 'TBD',
          time: event.time || 'TBD',
          date: event.date || today,
          competition: event.competition || 'Football',
          links: [{
            url: `${BASE_URL}/watch/${event.id || index}`,
            quality: 'HD',
            type: 'stream' as const,
            language: 'English'
          }],
          source: 'streamed-api'
        }));
        
        matches.push(...apiMatches);
        logger.info(`Streamed API: Found ${apiMatches.length} matches`);
      }
    } catch (apiError) {
      logger.warn(`Streamed API failed, trying HTML fallback: ${apiError}`);
    }
    
    // HTML fallback
    if (matches.length === 0) {
      logger.info(`Fetching from Streamed HTML: ${FALLBACK_URL}`);
      
      const response = await axios.get(FALLBACK_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      logger.info(`Streamed HTML response: ${response.status} ${response.statusText}`);
      
      const $ = cheerio.load(response.data);
      const matchElements = $('a[href*="/watch/"]');
      
      matchElements.each((index, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const text = $el.text().trim();
        
        if (href && text) {
          // Parse team names from text (basic parsing)
          const teams = text.split(' vs ').map(t => t.trim());
          if (teams.length === 2) {
            matches.push({
              id: `streamed-html-${index}`,
              homeTeam: teams[0],
              awayTeam: teams[1],
              time: 'TBD',
              date: new Date().toISOString().split('T')[0],
              competition: 'Football',
              links: [{
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                quality: 'HD',
                type: 'stream' as const,
                language: 'English'
              }],
              source: 'streamed-html'
            });
          }
        }
      });
      
      logger.info(`Streamed HTML: Found ${matches.length} matches`);
    }
    
  } catch (error) {
    logger.error(`Error fetching from Streamed: ${error}`);
  }
  
  return matches;
}
