import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../utils/logger';
import { Match } from '../../types';

/**
 * TotalSportek Scraper Service
 * Scrapes live and upcoming soccer/football matches from TotalSportek
 *
 * Website: https://totalsportek.army/
 * Match Page Pattern: /game/[team1-vs-team2]/[id]/
 */

export interface TotalSportekMatch {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  status: string; // "Match Started", "1 hr 26 min from now", etc.
  matchUrl: string;
  matchId: string;
  isLive: boolean;
}

export class TotalSportekScraperService {
  private baseUrl = 'https://totalsportek.army';
  private cache: TotalSportekMatch[] = [];
  private lastFetchTime = 0;
  private cacheDuration = 120000; // 2 minutes (more frequent updates for live matches)

  /**
   * Fetch soccer matches from TotalSportek homepage
   */
  async fetchMatches(): Promise<Match[]> {
    try {
      // Check cache first
      if (this.cache.length > 0 && (Date.now() - this.lastFetchTime) < this.cacheDuration) {
        logger.info(`TotalSportek: Returning ${this.cache.length} cached matches`);
        return this.convertToStandardFormat(this.cache);
      }

      logger.info('TotalSportek: Fetching matches from homepage...');

      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000
      });

      const html = response.data;
      const matches = this.parseMatches(html);

      this.cache = matches;
      this.lastFetchTime = Date.now();

      logger.info(`TotalSportek: Extracted ${matches.length} soccer matches`);

      return this.convertToStandardFormat(matches);

    } catch (error) {
      logger.error(`TotalSportek scraping error: ${error}`);

      // Return cached data if available
      if (this.cache.length > 0) {
        logger.warn('TotalSportek: Returning stale cache due to error');
        return this.convertToStandardFormat(this.cache);
      }

      return [];
    }
  }

  /**
   * Parse matches from TotalSportek HTML
   */
  private parseMatches(html: string): TotalSportekMatch[] {
    const $ = cheerio.load(html);
    const matches: TotalSportekMatch[] = [];

    // Find all match links directly (no wrapper classes)
    $('a[href*="/game/"]').each((_, element) => {
      try {
        const $link = $(element);
        const matchLink = $link.attr('href');

        if (!matchLink) return;

        const fullUrl = matchLink.startsWith('http') ? matchLink : `${this.baseUrl}${matchLink}`;

        // Extract match ID from URL: /game/team1-vs-team2/12345/
        const matchIdMatch = matchLink.match(/\/game\/[^\/]+\/(\d+)\/?/);
        if (!matchIdMatch) return;
        const matchId = matchIdMatch[1];

        // Extract teams from URL: /game/team1-vs-team2/
        const teamsMatch = matchLink.match(/\/game\/([^\/]+)\/\d+/);
        if (!teamsMatch) return;

        const teamsSlug = teamsMatch[1];
        const teamsParts = teamsSlug.split('-vs-');
        if (teamsParts.length !== 2) return;

        const homeTeam = this.formatTeamName(teamsParts[0]);
        const awayTeam = this.formatTeamName(teamsParts[1]);

        // Extract text from the link (contains status like "Match Started" or time)
        const linkText = $link.text().trim();

        // Extract status from text
        const statusMatch = linkText.match(/(Match Started|Live|\d+\s+(hr|hour|min|minute).+from now)/i);
        const statusText = statusMatch ? statusMatch[0] : 'TBD';

        const isLive = statusText.toLowerCase().includes('match started') ||
                       statusText.toLowerCase().includes('live');

        // Guess competition from team names
        const competitionText = this.guessCompetitionFromTeams(homeTeam, awayTeam);

        matches.push({
          homeTeam,
          awayTeam,
          competition: competitionText,
          status: statusText,
          matchUrl: fullUrl,
          matchId,
          isLive
        });

      } catch (error) {
        logger.warn(`TotalSportek: Error parsing match link: ${error}`);
      }
    });

    // Filter to only soccer/football matches
    const soccerMatches = matches.filter(m => this.isSoccerMatch(m));

    logger.info(`TotalSportek: Parsed ${matches.length} total matches, ${soccerMatches.length} soccer matches`);

    return soccerMatches;
  }

  /**
   * Format team name from URL slug
   */
  private formatTeamName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Determine if match is soccer based on team names or competition
   */
  private isSoccerMatch(match: TotalSportekMatch): boolean {
    const soccerKeywords = [
      'fc', 'united', 'city', 'town', 'rovers', 'wanderers', 'athletic', 'albion',
      'madrid', 'barcelona', 'juventus', 'milan', 'real', 'inter', 'bayern',
      'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
      'champions league', 'europa league', 'uefa', 'fifa', 'world cup',
      'mls', 'liga mx', 'championship', 'league one', 'league two'
    ];

    const matchText = `${match.homeTeam} ${match.awayTeam} ${match.competition}`.toLowerCase();

    // Exclude non-soccer sports
    const nonSoccerKeywords = ['nfl', 'nba', 'nhl', 'mlb', 'cricket', 'tennis', 'boxing', 'ufc', 'nascar'];
    for (const keyword of nonSoccerKeywords) {
      if (matchText.includes(keyword)) {
        return false;
      }
    }

    // Check for soccer indicators
    for (const keyword of soccerKeywords) {
      if (matchText.includes(keyword)) {
        return true;
      }
    }

    // Default to true if no clear indicators (conservative approach)
    return true;
  }

  /**
   * Guess competition from team names
   */
  private guessCompetitionFromTeams(homeTeam: string, awayTeam: string): string {
    const text = `${homeTeam} ${awayTeam}`.toLowerCase();

    if (text.includes('real madrid') || text.includes('barcelona') || text.includes('atletico')) {
      return 'La Liga';
    }
    if (text.includes('bayern') || text.includes('dortmund') || text.includes('leipzig')) {
      return 'Bundesliga';
    }
    if (text.includes('juventus') || text.includes('milan') || text.includes('inter') || text.includes('roma')) {
      return 'Serie A';
    }
    if (text.includes('psg') || text.includes('marseille') || text.includes('lyon')) {
      return 'Ligue 1';
    }
    if (text.includes('chelsea') || text.includes('arsenal') || text.includes('liverpool') ||
        text.includes('manchester') || text.includes('tottenham')) {
      return 'Premier League';
    }

    return 'Soccer';
  }

  /**
   * Convert TotalSportek matches to standard Match format
   */
  private convertToStandardFormat(tsMatches: TotalSportekMatch[]): Match[] {
    return tsMatches.map(tsMatch => {
      const match: Match = {
        id: `totalsportek-${tsMatch.matchId}`,
        homeTeam: tsMatch.homeTeam,
        awayTeam: tsMatch.awayTeam,
        competition: tsMatch.competition,
        time: tsMatch.isLive ? 'LIVE' : this.parseTimeFromStatus(tsMatch.status),
        date: new Date().toISOString().split('T')[0], // Today's date
        source: 'TotalSportek',
        links: [
          {
            url: tsMatch.matchUrl,
            quality: 'HD',
            type: 'stream',
            channelName: `${tsMatch.homeTeam} vs ${tsMatch.awayTeam}`
          }
        ]
      };

      return match;
    });
  }

  /**
   * Parse time from status text
   */
  private parseTimeFromStatus(status: string): string {
    if (status.toLowerCase().includes('live') || status.toLowerCase().includes('match started')) {
      return 'LIVE';
    }

    // Try to extract time like "1 hr 26 min from now"
    const timeMatch = status.match(/(\d+)\s+(hr|hour|min|minute)/i);
    if (timeMatch) {
      return 'TBD'; // Can't calculate exact time without knowing current time
    }

    // Try to match time format like "15:00"
    const exactTimeMatch = status.match(/(\d{1,2}):(\d{2})/);
    if (exactTimeMatch) {
      return status;
    }

    return 'TBD';
  }

  /**
   * Guess country from competition name
   */
  private guessCountryFromCompetition(competition: string): string {
    const comp = competition.toLowerCase();

    if (comp.includes('premier league') || comp.includes('championship') || comp.includes('league one') || comp.includes('league two')) {
      return 'England';
    }
    if (comp.includes('la liga') || comp.includes('segunda')) {
      return 'Spain';
    }
    if (comp.includes('bundesliga')) {
      return 'Germany';
    }
    if (comp.includes('serie a') || comp.includes('serie b')) {
      return 'Italy';
    }
    if (comp.includes('ligue 1') || comp.includes('ligue 2')) {
      return 'France';
    }
    if (comp.includes('mls')) {
      return 'USA';
    }
    if (comp.includes('liga mx')) {
      return 'Mexico';
    }
    if (comp.includes('champions league') || comp.includes('europa league') || comp.includes('uefa')) {
      return 'Europe';
    }

    return 'International';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetchTime = 0;
    logger.info('TotalSportek cache cleared');
  }
}

// Singleton instance
let instance: TotalSportekScraperService | null = null;

export function getTotalSportekScraperService(): TotalSportekScraperService {
  if (!instance) {
    instance = new TotalSportekScraperService();
  }
  return instance;
}
