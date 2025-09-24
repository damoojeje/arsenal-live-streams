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
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 15000,
      protocolTimeout: 30000
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(LEAGUE_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    logger.info(`Sportsurge page loaded successfully`);
    
    // Wait for any content to load first
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Try multiple selectors for events
    const selectors = [
      'div.event',
      '.event',
      '[class*="event"]',
      '.match',
      '[class*="match"]',
      '.game',
      '[class*="game"]'
    ];
    
    let eventSelector = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        eventSelector = selector;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!eventSelector) {
      logger.warn('No event selectors found, trying to get page content');
      const content = await page.content();
      logger.info(`Page content length: ${content.length}`);
      // Log some content to debug
      logger.info(`Page title: ${await page.title()}`);
    }
    
    const eventData = await page.evaluate(() => {
      const events: any[] = [];
      
      // Debug: log all elements with 'event' in class name
      const allElements = document.querySelectorAll('*');
      const eventClassElements = Array.from(allElements).filter(el => 
        el.className && el.className.toString().toLowerCase().includes('event')
      );
      
      console.log('Found elements with "event" in class:', eventClassElements.length);
      
      // Try different selectors
      const selectors = [
        'div.event',
        '.event',
        '[class*="event"]',
        '.match',
        '[class*="match"]',
        '.game',
        '[class*="game"]'
      ];
      
      let foundElements = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          foundElements = Array.from(elements);
          break;
        }
      }
      
      if (foundElements.length === 0) {
        // If no specific selectors work, look for any div with text content
        const allDivs = document.querySelectorAll('div');
        const textDivs = Array.from(allDivs).filter(div => 
          div.textContent && div.textContent.trim().length > 0
        );
        console.log(`Found ${textDivs.length} divs with text content`);
        
        // Look for Arsenal specifically
        const arsenalDivs = textDivs.filter(div => 
          div.textContent.toLowerCase().includes('arsenal')
        );
        console.log(`Found ${arsenalDivs.length} divs mentioning Arsenal`);
      }
      
      const eventElements = foundElements;
      
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
