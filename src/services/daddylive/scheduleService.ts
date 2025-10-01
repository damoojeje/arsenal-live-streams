import { getDaddyLiveBaseService } from './baseService';
import { Match } from '../../types';
import logger from '../../utils/logger';

/**
 * DaddyLive Schedule Service
 * Fetches match schedule from DaddyLive API
 * Based on plugin.video.daddylive v4.43 analysis
 */

interface DaddyLiveChannel {
  channel_name: string;
  channel_id: string;
}

interface DaddyLiveEvent {
  event: string;           // "Arsenal vs Chelsea"
  time: string;            // "15:00" UTC
  channels: DaddyLiveChannel[];
}

interface DaddyLiveSchedule {
  [date: string]: {
    [category: string]: DaddyLiveEvent[];
  };
}

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
      const url = await this.baseService.buildUrl('schedule/schedule-generated.php');
      logger.info(`Fetching DaddyLive schedule from: ${url}`);

      const client = this.baseService.getClient();
      const response = await client.get<DaddyLiveSchedule>(url, {
        headers: this.baseService.getHeaders()
      });

      if (response.status !== 200) {
        throw new Error(`Schedule API returned status ${response.status}`);
      }

      const schedule = response.data;
      const matches = this.parseSchedule(schedule);

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
   * Parse schedule data into Match objects
   */
  private parseSchedule(schedule: DaddyLiveSchedule): Match[] {
    const matches: Match[] = [];

    // Iterate through all date keys in the schedule
    for (const dateKey of Object.keys(schedule)) {
      const daySchedule = schedule[dateKey];

      // Soccer/Football categories to check
      const soccerCategories = [
        'All Soccer Events',
        'England - Championship/EFL Trophy/League One',
        'England - Premier League',
        'Spain - La Liga',
        'Italy - Serie A',
        'Germany - Bundesliga',
        'France - Ligue 1',
        'UEFA Champions League',
        'UEFA Europa League',
        'FIFA World Cup Qualifiers'
      ];

      // Check all potential soccer categories
      for (const category of soccerCategories) {
        const events = daySchedule[category];
        if (!events || !Array.isArray(events)) continue;

        for (const event of events) {
          try {
            const match = this.parseEvent(event, dateKey);
            if (match) {
              matches.push(match);
            }
          } catch (error) {
            logger.warn(`Failed to parse event: ${error}`);
          }
        }
      }

      // Also check for any other categories containing soccer/football keywords
      for (const category of Object.keys(daySchedule)) {
        const lowerCategory = category.toLowerCase();
        if (
          (lowerCategory.includes('soccer') ||
           lowerCategory.includes('football') ||
           lowerCategory.includes('premier') ||
           lowerCategory.includes('liga') ||
           lowerCategory.includes('serie')) &&
          !soccerCategories.includes(category)
        ) {
          const events = daySchedule[category];
          if (!events || !Array.isArray(events)) continue;

          for (const event of events) {
            try {
              const match = this.parseEvent(event, dateKey);
              if (match) {
                matches.push(match);
              }
            } catch (error) {
              logger.warn(`Failed to parse event: ${error}`);
            }
          }
        }
      }
    }

    return matches;
  }

  /**
   * Parse individual event into Match object
   */
  private parseEvent(event: DaddyLiveEvent, dateKey: string): Match | null {
    try {
      // Extract competition and teams from event string
      // Format: "Europe - UEFA Youth League : Kairat U19 vs Real Madrid U19"
      const { competition, homeTeam, awayTeam } = this.parseEventString(event.event);

      if (!homeTeam || !awayTeam) {
        logger.warn(`Could not parse teams from: ${event.event}`);
        return null;
      }

      // Extract simple date from dateKey (e.g., "Tuesday 30th Sep 2025" -> "2025-09-30")
      const simpleDate = this.extractDate(dateKey);

      // Create match object
      const match: Match = {
        id: `daddylive-${this.sanitize(event.event)}-${event.time}`,
        homeTeam,
        awayTeam,
        time: event.time || 'TBD',
        date: simpleDate,
        competition: competition || 'Football',
        links: event.channels.map(channel => ({
          url: channel.channel_id,
          quality: 'HD',
          type: 'stream' as const,
          language: channel.channel_name || 'English',
          channelName: channel.channel_name
        })),
        source: 'daddylive'
      };

      return match;
    } catch (error) {
      logger.error(`Error parsing event: ${error}`);
      return null;
    }
  }

  /**
   * Parse event string to extract competition and team names
   * Format: "Europe - UEFA Youth League : Kairat U19 vs Real Madrid U19"
   */
  private parseEventString(eventString: string): { competition: string; homeTeam: string; awayTeam: string } {
    let competition = 'Football';
    let matchPart = eventString;

    // Check if there's a colon separator (competition : match)
    if (eventString.includes(' : ')) {
      const parts = eventString.split(' : ');
      competition = parts[0].trim();
      matchPart = parts[1].trim();
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
   * Extract date from date key string
   * Format: "Tuesday 30th Sep 2025 - Schedule Time UK GMT" -> "2025-09-30"
   */
  private extractDate(dateKey: string): string {
    try {
      // Extract the date part before the dash
      const datePart = dateKey.split(' - ')[0].trim();

      // Parse date formats like "Tuesday 30th Sep 2025"
      const months: Record<string, string> = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'september': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
      };

      // Match patterns like "30th Sep 2025"
      const match = datePart.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})/i);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = months[match[2].toLowerCase()] || '01';
        const year = match[3];
        return `${year}-${month}-${day}`;
      }

      // Fallback to today's date
      return new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
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