import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../utils/logger';

/**
 * DaddyLive Channels Service v2.0
 * 
 * Scrapes 24/7 live sports channels from DaddyLive
 * Updated Dec 2025 - Uses dynamic domain resolution matching Kodi addon v4.50
 */

// Seed URL and User Agent matching the Kodi addon
const SEED_URL = 'https://daddylive.sx/';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

export interface Channel {
  id: string;
  name: string;
  url: string;
  category?: string;
}

export class DaddyLiveChannelsService {
  private channelsCache: { data: Channel[]; timestamp: number } | null = null;
  private cacheDuration = 3600000; // 1 hour (channels don't change often)
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
   * Fetch all 24/7 channels from DaddyLive
   * Matches the channels() function from Kodi addon
   */
  async fetchChannels(): Promise<Channel[]> {
    // Return cached data if still valid
    if (this.channelsCache && (Date.now() - this.channelsCache.timestamp) < this.cacheDuration) {
      logger.info(`Returning ${this.channelsCache.data.length} cached DaddyLive channels`);
      return this.channelsCache.data;
    }

    try {
      const baseDomain = await this.resolveActiveDomain();
      const channelsUrl = `${baseDomain}24-7-channels.php`;

      logger.info(`Fetching 24/7 channels from: ${channelsUrl}`);

      const response = await axios.get(channelsUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': baseDomain,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 15000
      });

      if (response.status !== 200) {
        logger.error(`Failed to fetch channels: HTTP ${response.status}`);
        return this.channelsCache?.data || [];
      }

      const $ = cheerio.load(response.data);
      const channels: Channel[] = [];

      // Parse channel cards - matching Kodi addon's card_rx pattern
      // <a class="card" href="..." data-title="...">
      $('a.card').each((_, element) => {
        try {
          const $card = $(element);
          const href = $card.attr('href') || '';
          const dataTitle = $card.attr('data-title') || '';
          
          // Get title from card__title div or data-title attribute
          const titleFromDom = $card.find('.card__title').text().trim();
          const channelName = this.cleanChannelName(titleFromDom || dataTitle);

          // Extract channel ID from URL (watch.php?id=123)
          const idMatch = href.match(/[?&]id=(\d+)/);
          if (!idMatch || !channelName) return;

          const channelId = idMatch[1];
          
          // Skip 18+ content
          if (channelName.toLowerCase().includes('18+')) return;

          // Categorize channel
          const category = this.categorizeChannel(channelName);

          channels.push({
            id: channelId,
            name: channelName,
            url: href,
            category
          });
        } catch (error) {
          logger.warn(`Error parsing channel card: ${error}`);
        }
      });

      // Fallback: Also try the old link format if no cards found
      if (channels.length === 0) {
        $('a[href*="watch.php?id="]').each((_, element) => {
          try {
            const $link = $(element);
            const href = $link.attr('href') || '';
            const title = $link.attr('data-title') || $link.attr('title') || $link.text().trim();

            const idMatch = href.match(/[?&]id=(\d+)/);
            if (!idMatch) return;

            const channelId = idMatch[1];
            const channelName = this.cleanChannelName(title);
            if (!channelName || channelName.toLowerCase().includes('18+')) return;

            const category = this.categorizeChannel(channelName);

            channels.push({
              id: channelId,
              name: channelName,
              url: href,
              category
            });
          } catch (error) {
            logger.warn(`Error parsing channel link: ${error}`);
          }
        });
      }

      // Remove duplicates (same ID can appear multiple times)
      const uniqueChannels = Array.from(
        new Map(channels.map(ch => [ch.id, ch])).values()
      );

      // Sort by name
      uniqueChannels.sort((a, b) => a.name.localeCompare(b.name));

      // Cache the results
      this.channelsCache = {
        data: uniqueChannels,
        timestamp: Date.now()
      };

      logger.info(`DaddyLive: Found ${uniqueChannels.length} 24/7 channels`);
      return uniqueChannels;

    } catch (error) {
      logger.error(`Error fetching DaddyLive channels: ${error}`);
      return this.channelsCache?.data || [];
    }
  }

  /**
   * Clean channel name (remove extra spaces, fix formatting)
   */
  private cleanChannelName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^\d+(?=[A-Za-z])/, '') // Remove leading numbers attached to letters
      .replace(/\(|\)/g, '')
      .trim();
  }

  /**
   * Categorize channel based on name patterns
   */
  private categorizeChannel(name: string): string {
    const lowerName = name.toLowerCase();

    // Premium Sports Networks
    if (lowerName.includes('sky sports')) return 'Sky Sports';
    if (lowerName.includes('bt sport') || lowerName.includes('tnt sports')) return 'TNT/BT Sports';
    if (lowerName.includes('espn')) return 'ESPN';
    if (lowerName.includes('bein')) return 'beIN Sports';
    if (lowerName.includes('dazn')) return 'DAZN';
    if (lowerName.includes('supersport')) return 'SuperSport';
    if (lowerName.includes('canal+') || lowerName.includes('canal plus')) return 'Canal+';
    if (lowerName.includes('movistar')) return 'Movistar';
    if (lowerName.includes('arena')) return 'Arena Sport';
    if (lowerName.includes('astro')) return 'Astro';
    if (lowerName.includes('fox sport')) return 'Fox Sports';
    if (lowerName.includes('eurosport')) return 'Eurosport';
    if (lowerName.includes('nba')) return 'NBA';
    if (lowerName.includes('nfl')) return 'NFL';
    if (lowerName.includes('mlb')) return 'MLB';
    if (lowerName.includes('premier sports')) return 'Premier Sports';
    
    // General sports
    if (lowerName.includes('sport')) return 'Sports';

    // News
    if (lowerName.includes('news') || lowerName.includes('cnn') || lowerName.includes('bbc news')) return 'News';

    // Entertainment
    if (lowerName.includes('movie') || lowerName.includes('film') || lowerName.includes('cinema')) return 'Movies';
    if (lowerName.includes('hbo') || lowerName.includes('showtime') || lowerName.includes('starz')) return 'Premium';

    // PPV
    if (lowerName.includes('ppv') || lowerName.includes('pay per view')) return 'PPV';

    // Default
    return 'General';
  }

  /**
   * Search channels by name
   */
  async searchChannels(query: string): Promise<Channel[]> {
    const allChannels = await this.fetchChannels();
    const lowerQuery = query.toLowerCase();

    return allChannels.filter(channel =>
      channel.name.toLowerCase().includes(lowerQuery) ||
      channel.category?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get channels by category
   */
  async getChannelsByCategory(category: string): Promise<Channel[]> {
    const allChannels = await this.fetchChannels();
    return allChannels.filter(channel => channel.category === category);
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const allChannels = await this.fetchChannels();
    const categories = new Set(allChannels.map(ch => ch.category).filter(Boolean) as string[]);
    return Array.from(categories).sort();
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.channelsCache = null;
    this.activeDomain = null;
    this.lastDomainCheck = 0;
  }
}

// Singleton instance
let instance: DaddyLiveChannelsService | null = null;

export function getDaddyLiveChannelsService(): DaddyLiveChannelsService {
  if (!instance) {
    instance = new DaddyLiveChannelsService();
  }
  return instance;
}
