import * as cheerio from 'cheerio';
import { getTotalSportekBaseService } from './baseService';
import { Match } from '../../types';
import logger from '../../utils/logger';

/**
 * TotalSportek Schedule Service
 * Scrapes match listings from TotalSportek soccerstreams page
 */

export class TotalSportekScheduleService {
  private baseService = getTotalSportekBaseService();
  private scheduleCache: { data: Match[]; timestamp: number } | null = null;
  private cacheDuration = 180000; // 3 minutes (longer than DaddyLive due to scraping cost)

  /**
   * Fetch football matches from TotalSportek
   */
  async fetchMatches(): Promise<Match[]> {
    // Return cached data if still valid
    if (this.scheduleCache && (Date.now() - this.scheduleCache.timestamp) < this.cacheDuration) {
      logger.info('Returning cached TotalSportek schedule');
      return this.scheduleCache.data;
    }

    try {
      logger.info('Fetching TotalSportek soccerstreams page...');

      const client = this.baseService.getClient();
      const response = await client.get('/soccerstreams');

      if (response.status !== 200) {
        logger.error(`TotalSportek returned status ${response.status}`);
        return [];
      }

      const html = response.data;
      const matches = this.parseMatches(html);

      // Cache the results
      this.scheduleCache = {
        data: matches,
        timestamp: Date.now()
      };

      logger.info(`TotalSportek: Found ${matches.length} matches`);
      return matches;

    } catch (error) {
      logger.error(`Error fetching TotalSportek schedule: ${error}`);
      return [];
    }
  }

  /**
   * Parse matches from HTML
   */
  private parseMatches(html: string): Match[] {
    const matches: Match[] = [];

    try {
      const $ = cheerio.load(html);

      // TotalSportek structure: League headers followed by match lists
      // Find all league sections
      $('h2, h3').each((index, element) => {
        const leagueName = $(element).text().trim();

        // Skip non-league headers
        if (!this.isValidLeague(leagueName)) {
          return;
        }

        // Find the match list following this header
        let matchList = $(element).next('ul');

        // If not immediately after, look for nearby ul
        if (matchList.length === 0) {
          matchList = $(element).nextAll('ul').first();
        }

        if (matchList.length === 0) {
          return;
        }

        // Parse each match in the list
        matchList.find('li').each((_, matchElement) => {
          try {
            const matchText = $(matchElement).text().trim();
            const matchLink = $(matchElement).find('a').attr('href');

            if (!matchText || !matchLink) {
              return;
            }

            const match = this.parseMatchText(matchText, matchLink, leagueName);
            if (match) {
              matches.push(match);
            }
          } catch (error) {
            logger.warn(`Failed to parse match element: ${error}`);
          }
        });
      });

    } catch (error) {
      logger.error(`Error parsing TotalSportek HTML: ${error}`);
    }

    return matches;
  }

  /**
   * Parse individual match text
   * Format: "Soccer Koln VS Hamburger SV Starts in 12hr:16min"
   */
  private parseMatchText(text: string, link: string, league: string): Match | null {
    try {
      // Remove "Soccer" prefix if present
      let cleanText = text.replace(/^Soccer\s+/i, '').trim();

      // Extract time information (e.g., "Starts in 12hr:16min")
      const timeMatch = cleanText.match(/Starts in (.+)$/i);
      const timeStr = timeMatch ? timeMatch[1].trim() : 'TBD';

      // Remove time part to get teams
      cleanText = cleanText.replace(/Starts in .+$/i, '').trim();

      // Parse team names (format: "Team A VS Team B" or "Team A vs Team B")
      const teams = this.parseTeamNames(cleanText);
      if (!teams) {
        return null;
      }

      // Extract match ID from link (e.g., "/Team-A-vs-Team-B/123" -> "123")
      const matchIdMatch = link.match(/\/([^\/]+)$/);
      const matchId = matchIdMatch ? matchIdMatch[1] : this.sanitize(cleanText);

      // Convert relative time to approximate date/time
      const matchDateTime = this.parseRelativeTime(timeStr);

      return {
        id: `totalsportek-${matchId}`,
        homeTeam: teams.homeTeam,
        awayTeam: teams.awayTeam,
        time: matchDateTime.time,
        date: matchDateTime.date,
        competition: league,
        links: [
          {
            url: link, // Store the match page URL
            quality: 'HD',
            type: 'stream',
            language: 'English',
            channelName: 'TotalSportek'
          }
        ],
        source: 'totalsportek'
      };

    } catch (error) {
      logger.warn(`Failed to parse match text: ${text} - ${error}`);
      return null;
    }
  }

  /**
   * Parse team names from match string
   */
  private parseTeamNames(text: string): { homeTeam: string; awayTeam: string } | null {
    // Try different separator patterns
    const patterns = [
      /^(.+?)\s+VS\s+(.+?)$/i,
      /^(.+?)\s+vs\s+(.+?)$/i,
      /^(.+?)\s+v\s+(.+?)$/i,
      /^(.+?)\s+-\s+(.+?)$/i
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

    return null;
  }

  /**
   * Parse relative time string to approximate date/time
   * Input: "12hr:16min", "2hr:30min", "45min"
   * Output: { time: "15:00", date: "2025-11-01T12:00:00.000Z" }
   */
  private parseRelativeTime(timeStr: string): { time: string; date: string } {
    try {
      const now = new Date();

      // Parse hours and minutes
      const hourMatch = timeStr.match(/(\d+)hr/);
      const minMatch = timeStr.match(/(\d+)min/);

      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minMatch ? parseInt(minMatch[1]) : 0;

      // Calculate match time
      const matchTime = new Date(now.getTime() + (hours * 60 + minutes) * 60000);

      // Format time as HH:MM
      const timeFormatted = matchTime.toTimeString().slice(0, 5);

      return {
        time: timeFormatted,
        date: matchTime.toISOString()
      };

    } catch (error) {
      // Fallback to TBD if parsing fails
      return {
        time: 'TBD',
        date: new Date().toISOString()
      };
    }
  }

  /**
   * Check if string is a valid league/competition name
   */
  private isValidLeague(name: string): boolean {
    const validPatterns = [
      /premier league/i,
      /la liga/i,
      /serie a/i,
      /bundesliga/i,
      /ligue 1/i,
      /champions league/i,
      /europa league/i,
      /championship/i,
      /eredivisie/i,
      /liga mx/i,
      /mls/i,
      /world cup/i,
      /euros/i
    ];

    return validPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Sanitize string for use in ID
   */
  private sanitize(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.scheduleCache = null;
  }
}

// Singleton instance
let instance: TotalSportekScheduleService | null = null;

export function getTotalSportekScheduleService(): TotalSportekScheduleService {
  if (!instance) {
    instance = new TotalSportekScheduleService();
  }
  return instance;
}
