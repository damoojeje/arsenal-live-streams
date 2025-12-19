import axios from 'axios';
import { Match } from '../../types';
import logger from '../../utils/logger';

/**
 * DaddyLive Schedule Service v2.1
 * 
 * Fetches match schedules from DaddyLive's JSON API
 * Updated Dec 2025 - Uses schedule-generated.json API
 */

// Seed URL - DaddyLive uses redirects, so we follow them to get active domain
const SEED_URL = 'https://daddylive.sx/';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

export class DaddyLiveScheduleService {
  private scheduleCache: { data: Match[]; timestamp: number } | null = null;
  private cacheDuration = 60000; // 60 seconds
  private activeDomain: string | null = null;
  private lastDomainCheck = 0;
  private domainCacheDuration = 300000; // 5 minutes

  /**
   * Resolve the active DaddyLive domain by following redirects
   */
  private async resolveActiveDomain(): Promise<string> {
    const now = Date.now();
    
    // Return cached domain if still valid
    if (this.activeDomain && (now - this.lastDomainCheck) < this.domainCacheDuration) {
      return this.activeDomain;
    }

    try {
      logger.info(`Resolving active DaddyLive domain from seed: ${SEED_URL}`);
      
      const response = await axios.get(SEED_URL, {
        headers: { 'User-Agent': USER_AGENT },
        maxRedirects: 10,
        timeout: 10000,
        validateStatus: () => true
      });

      // Get final URL after redirects
      const finalUrl = response.request?.res?.responseUrl || response.config?.url || SEED_URL;
      const parsed = new URL(finalUrl);
      this.activeDomain = `${parsed.protocol}//${parsed.hostname}/`;
      this.lastDomainCheck = now;

      logger.info(`Active DaddyLive domain resolved: ${this.activeDomain}`);
      return this.activeDomain;
    } catch (error) {
      logger.warn(`Failed to resolve DaddyLive domain: ${error}`);
      // Fallback to known working domain
      this.activeDomain = 'https://daddyhd.com/';
      this.lastDomainCheck = now;
      return this.activeDomain;
    }
  }

  /**
   * Fetch soccer matches from DaddyLive JSON API
   */
  async fetchMatches(): Promise<Match[]> {
    // Return cached data if still valid
    if (this.scheduleCache && (Date.now() - this.scheduleCache.timestamp) < this.cacheDuration) {
      logger.info(`Returning ${this.scheduleCache.data.length} cached DaddyLive matches`);
      return this.scheduleCache.data;
    }

    try {
      const baseDomain = await this.resolveActiveDomain();
      const scheduleUrl = `${baseDomain}schedule/schedule-generated.json`;
      
      logger.info(`Fetching schedule from: ${scheduleUrl}`);

      const response = await axios.get(scheduleUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': baseDomain,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 15000
      });

      if (response.status !== 200) {
        logger.error(`Failed to fetch schedule: HTTP ${response.status}`);
        return this.scheduleCache?.data || [];
      }

      const scheduleData = response.data;
      const matches: Match[] = [];

      // Parse JSON structure: { "Date String": { "Category</span>": [...events] } }
      for (const dateKey of Object.keys(scheduleData)) {
        const dateSchedule = scheduleData[dateKey];

        // Look for Soccer category (note the </span> suffix in the key)
        const soccerKey = Object.keys(dateSchedule).find(k => 
          k.toLowerCase().includes('soccer') || k.toLowerCase().includes('football')
        );

        if (!soccerKey) continue;
        
        const soccerEvents = dateSchedule[soccerKey];
        if (!Array.isArray(soccerEvents)) continue;

        logger.info(`Found ${soccerEvents.length} soccer matches for ${dateKey}`);

        // Process each event
        for (const event of soccerEvents) {
          try {
            const eventName = event.event || '';
            const timeStr = event.time || 'TBD';
            
            // Combine channels and channels2 arrays
            const channels = [
              ...(event.channels || []),
              ...(event.channels2 || [])
            ];

            if (!eventName || channels.length === 0) continue;

            // Parse event name to extract competition and teams
            const { competition, homeTeam, awayTeam } = this.parseEventTitle(eventName);

            if (!homeTeam || !awayTeam) {
              logger.warn(`Could not parse teams from: ${eventName}`);
              continue;
            }

            // Create match object
            const match: Match = {
              id: `daddylive-${this.sanitize(eventName)}-${timeStr}`,
              homeTeam,
              awayTeam,
              time: timeStr,
              date: new Date().toISOString(),
              competition: competition || 'Football',
              links: channels.map((ch: any) => ({
                url: ch.channel_id || '',
                quality: 'HD',
                type: 'stream' as const,
                language: 'English',
                channelName: this.cleanText(ch.channel_name || 'Unknown')
              })),
              source: 'daddylive'
            };

            matches.push(match);
          } catch (parseError) {
            logger.warn(`Error parsing event: ${parseError}`);
          }
        }
      }

      // Cache the results
      this.scheduleCache = {
        data: matches,
        timestamp: Date.now()
      };

      logger.info(`DaddyLive: Found ${matches.length} soccer matches`);
      return matches;

    } catch (error) {
      logger.error(`Error fetching DaddyLive schedule: ${error}`);
      // Return stale cache if available
      return this.scheduleCache?.data || [];
    }
  }

  /**
   * Parse event title to extract competition and teams
   * Formats:
   *   - "League : Team A vs Team B"
   *   - "League - Subleague : Team A vs Team B"
   */
  private parseEventTitle(eventTitle: string): { competition: string; homeTeam: string; awayTeam: string } {
    let competition = 'Football';
    let matchPart = eventTitle;

    // Check if there's a colon separator (competition : match)
    if (eventTitle.includes(' : ')) {
      const colonIndex = eventTitle.lastIndexOf(' : ');
      competition = eventTitle.substring(0, colonIndex).trim();
      matchPart = eventTitle.substring(colonIndex + 3).trim();
    }

    // Parse team names from match part
    const { homeTeam, awayTeam } = this.parseTeamNames(matchPart);

    return { competition, homeTeam, awayTeam };
  }

  /**
   * Parse team names from event string
   */
  private parseTeamNames(eventName: string): { homeTeam: string; awayTeam: string } {
    // Common patterns: "Team A vs Team B", "Team A v Team B"
    const vsPatterns = [
      /^(.+?)\s+vs\.?\s+(.+?)$/i,
      /^(.+?)\s+v\s+(.+?)$/i,
      /^(.+?)\s+@\s+(.+?)$/i,
    ];

    for (const pattern of vsPatterns) {
      const match = eventName.match(pattern);
      if (match) {
        return {
          homeTeam: this.cleanText(match[1]),
          awayTeam: this.cleanText(match[2])
        };
      }
    }

    // Unable to parse
    return { homeTeam: '', awayTeam: '' };
  }

  /**
   * Clean text - decode HTML entities, normalize whitespace
   */
  private cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
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
    this.activeDomain = null;
    this.lastDomainCheck = 0;
  }

  /**
   * Get the currently resolved domain (for debugging)
   */
  getActiveDomain(): string | null {
    return this.activeDomain;
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
