import { getDaddyLiveBaseService } from './baseService';
import { Match } from '../../types';
import logger from '../../utils/logger';

/**
 * DaddyLive Schedule Service
 * Scrapes match schedule from dlhd.dad website
 * Updated to use actual DaddyLive website structure (Nov 2025)
 */

export class DaddyLiveScheduleService {
  private baseService = getDaddyLiveBaseService();
  private scheduleCache: { data: Match[]; timestamp: number } | null = null;
  private cacheDuration = 60000; // 60 seconds

  /**
   * Fetch football matches from DaddyLive schedule API
   */
  async fetchMatches(): Promise<Match[]> {
    // Return cached data if still valid
    if (this.scheduleCache && (Date.now() - this.scheduleCache.timestamp) < this.cacheDuration) {
      logger.info('Returning cached DaddyLive schedule');
      return this.scheduleCache.data;
    }

    try {
      // Scrape the actual DaddyLive website
      const cheerio = require('cheerio');
      const client = this.baseService.getClient();
      const scheduleUrl = 'https://dlhd.dad/index.php?cat=Soccer';

      logger.info(`Fetching schedule from: ${scheduleUrl}`);

      const response = await client.get(scheduleUrl, {
        headers: {
          ...this.baseService.getHeaders(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      if (response.status !== 200) {
        logger.error(`Failed to fetch schedule: HTTP ${response.status}`);
        return [];
      }

      const $ = cheerio.load(response.data);
      const matches: Match[] = [];

      // Parse schedule events
      $('.schedule__event').each((_: number, element: any) => {
        try {
          const $event = $(element);

          // Extract time
          const timeStr = $event.find('.schedule__time').attr('data-time') || '';

          // Extract event title (League : Team A vs Team B)
          const eventTitle = $event.find('.schedule__eventTitle').text().trim();

          // Extract channels
          const channels: any[] = [];
          $event.find('.schedule__channels a').each((__: number, linkElement: any) => {
            const $link = $(linkElement);
            const href = $link.attr('href') || '';
            const channelName = $link.attr('title') || $link.text().trim();
            const channelId = href.match(/id=(\d+)/)?.[1];

            if (channelId) {
              channels.push({
                channel_id: channelId,
                channel_name: channelName
              });
            }
          });

          if (!eventTitle || channels.length === 0) {
            return; // Skip events without title or channels
          }

          // Parse event title to extract competition and teams
          const { competition, homeTeam, awayTeam } = this.parseEventTitle(eventTitle);

          if (!homeTeam || !awayTeam) {
            logger.warn(`Could not parse teams from: ${eventTitle}`);
            return;
          }

          // Create match object
          const match: Match = {
            id: `daddylive-${this.sanitize(eventTitle)}-${timeStr}`,
            homeTeam,
            awayTeam,
            time: timeStr || 'TBD',
            date: new Date().toISOString(),
            competition: competition || 'Football',
            links: channels.map(channel => ({
              url: channel.channel_id,
              quality: 'HD',
              type: 'stream' as const,
              language: 'English',
              channelName: channel.channel_name
            })),
            source: 'daddylive'
          };

          matches.push(match);
        } catch (error) {
          logger.warn(`Error parsing event: ${error}`);
        }
      });

      // Cache the results
      this.scheduleCache = {
        data: matches,
        timestamp: Date.now()
      };

      logger.info(`DaddyLive: Found ${matches.length} football matches`);
      return matches;

    } catch (error) {
      logger.error(`Error fetching DaddyLive schedule: ${error}`);
      return [];
    }
  }

  /**
   * Parse event title to extract competition and teams
   * Format: "League : Team A vs Team B" or "League - Sublease : Team A vs Team B"
   */
  private parseEventTitle(eventTitle: string): { competition: string; homeTeam: string; awayTeam: string } {
    let competition = 'Football';
    let matchPart = eventTitle;

    // Check if there's a colon separator (competition : match)
    if (eventTitle.includes(' : ')) {
      const parts = eventTitle.split(' : ');
      competition = parts[0].trim();
      matchPart = parts[1].trim();
    } else if (eventTitle.includes(' - ') && eventTitle.includes(' vs ')) {
      // Handle format like "League - Sublease - Team A vs Team B"
      const lastVsIndex = eventTitle.lastIndexOf(' vs ');
      const beforeVs = eventTitle.substring(0, lastVsIndex);
      const afterVs = eventTitle.substring(lastVsIndex + 4);

      // Find the last dash before the teams
      const lastDashIndex = beforeVs.lastIndexOf(' - ');
      if (lastDashIndex !== -1) {
        competition = beforeVs.substring(0, lastDashIndex).trim();
        matchPart = beforeVs.substring(lastDashIndex + 3).trim() + ' vs ' + afterVs.trim();
      }
    }

    // Parse team names from match part
    const { homeTeam, awayTeam } = this.parseTeamNames(matchPart);

    return { competition, homeTeam, awayTeam };
  }


  /**
   * Parse team names from event string
   */
  private parseTeamNames(eventName: string): { homeTeam: string; awayTeam: string } {
    // Common patterns: "Team A vs Team B", "Team A v Team B", "Team A - Team B"
    const patterns = [
      /^(.+?)\s+vs\s+(.+?)$/i,
      /^(.+?)\s+v\s+(.+?)$/i,
      /^(.+?)\s+@\s+(.+?)$/i
    ];

    for (const pattern of patterns) {
      const match = eventName.match(pattern);
      if (match) {
        return {
          homeTeam: match[1].trim(),
          awayTeam: match[2].trim()
        };
      }
    }

    // Fallback: split by common separators
    if (eventName.includes(' vs ')) {
      const parts = eventName.split(' vs ');
      return { homeTeam: parts[0].trim(), awayTeam: parts[1].trim() };
    }

    // Unable to parse
    return { homeTeam: '', awayTeam: '' };
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
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.scheduleCache = null;
  }
}

// Singleton instance
let instance: DaddyLiveScheduleService | null = null;

export function getDaddyLiveScheduleService(): DaddyLiveScheduleService {
  if (!instance) {
    instance = new DaddyLiveScheduleService();
  }
  return instance;
}