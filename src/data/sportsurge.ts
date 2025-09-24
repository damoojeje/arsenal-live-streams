import puppeteer from 'puppeteer';
import { Match, StreamLink } from '../types';
import logger from '../utils/logger';

const BASE_URL = 'https://sportsurge.bz';
const LEAGUE_URL = `${BASE_URL}/leagues/premier-league`;

export async function fetchSportsurge(): Promise<Match[]> {
  const matches: Match[] = [];
  
  try {
    logger.info(`Fetching from Sportsurge: ${LEAGUE_URL}`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(LEAGUE_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    logger.info(`Sportsurge page loaded successfully`);
    
    // Wait for event blocks to load
    await page.waitForSelector('div.event', { timeout: 10000 });
    
    const eventData = await page.evaluate(() => {
      const events: any[] = [];
      const eventElements = document.querySelectorAll('div.event');
      
      eventElements.forEach((element, index) => {
        const homeTeamEl = element.querySelector('.home-team');
        const awayTeamEl = element.querySelector('.away-team');
        const timeEl = element.querySelector('.event-time');
        const linkEl = element.querySelector('a[href*="/event/"]');
        
        if (homeTeamEl && awayTeamEl) {
          events.push({
            id: `sportsurge-${index}`,
            homeTeam: homeTeamEl.textContent?.trim() || 'TBD',
            awayTeam: awayTeamEl.textContent?.trim() || 'TBD',
            time: timeEl?.textContent?.trim() || 'TBD',
            link: linkEl?.getAttribute('href') || ''
          });
        }
      });
      
      return events;
    });
    
    await browser.close();
    
    // Process the scraped data
    eventData.forEach((event) => {
      if (event.homeTeam && event.awayTeam) {
        matches.push({
          id: event.id,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          time: event.time,
          date: new Date().toISOString().split('T')[0],
          competition: 'Premier League',
          links: [{
            url: event.link.startsWith('http') ? event.link : `${BASE_URL}${event.link}`,
            quality: 'HD',
            type: 'stream' as const,
            language: 'English'
          }],
          source: 'sportsurge'
        });
      }
    });
    
    logger.info(`Sportsurge: Found ${matches.length} matches`);
    
  } catch (error) {
    logger.error(`Error fetching from Sportsurge: ${error}`);
  }
  
  return matches;
}
