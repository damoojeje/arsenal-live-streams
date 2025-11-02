import { getDaddyLiveBaseService } from './baseService';
import logger from '../../utils/logger';

/**
 * DaddyLive Channels Service
 * Scrapes 24/7 live sports channels from dlhd.dad
 * Updated Nov 2025 - Using actual DaddyLive website
 */

export interface Channel {
  id: string;
  name: string;
  url: string; // /watch.php?id=NUMBER
  category?: string;
}

export class DaddyLiveChannelsService {
  private baseService = getDaddyLiveBaseService();
  private channelsCache: { data: Channel[]; timestamp: number } | null = null;
  private cacheDuration = 3600000; // 1 hour (channels don't change often)

  /**
   * Fetch all 24/7 channels from DaddyLive
   */
  async fetchChannels(): Promise<Channel[]> {
    // Return cached data if still valid
    if (this.channelsCache && (Date.now() - this.channelsCache.timestamp) < this.cacheDuration) {
      logger.info('Returning cached DaddyLive channels');
      return this.channelsCache.data;
    }

    try {
      const cheerio = require('cheerio');
      const client = this.baseService.getClient();
      const channelsUrl = 'https://dlhd.dad/24-7-channels.php';

      logger.info(`Fetching 24/7 channels from: ${channelsUrl}`);

      const response = await client.get(channelsUrl, {
        headers: {
          ...this.baseService.getHeaders(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      if (response.status !== 200) {
        logger.error(`Failed to fetch channels: HTTP ${response.status}`);
        return [];
      }

      const $ = cheerio.load(response.data);
      const channels: Channel[] = [];

      // Parse channel links
      $('a[href*="/watch.php?id="]').each((_: number, element: any) => {
        try {
          const $link = $(element);
          const href = $link.attr('href') || '';
          const title = $link.attr('data-title') || $link.attr('title') || $link.text().trim();

          // Extract channel ID from URL
          const channelIdMatch = href.match(/id=(\d+)/);
          if (!channelIdMatch) return;

          const channelId = channelIdMatch[1];
          const channelName = this.cleanChannelName(title);

          if (!channelName || !channelId) return;

          // Try to determine category from channel name
          const category = this.categorizeChannel(channelName);

          channels.push({
            id: channelId,
            name: channelName,
            url: href,
            category
          });
        } catch (error) {
          logger.warn(`Error parsing channel: ${error}`);
        }
      });

      // Remove duplicates (same ID can appear multiple times)
      const uniqueChannels = Array.from(
        new Map(channels.map(ch => [ch.id, ch])).values()
      );

      // Cache the results
      this.channelsCache = {
        data: uniqueChannels,
        timestamp: Date.now()
      };

      logger.info(`DaddyLive: Found ${uniqueChannels.length} 24/7 channels`);
      return uniqueChannels;

    } catch (error) {
      logger.error(`Error fetching DaddyLive channels: ${error}`);
      return [];
    }
  }

  /**
   * Clean channel name (remove extra spaces, fix formatting)
   */
  private cleanChannelName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces → single space
      .replace(/\(|\)/g, '') // Remove parentheses
      .trim();
  }

  /**
   * Categorize channel based on name patterns
   */
  private categorizeChannel(name: string): string {
    const lowerName = name.toLowerCase();

    // Sports networks
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
    if (lowerName.includes('fox')) return 'Fox Sports';

    // General sports
    if (lowerName.includes('sport')) return 'Sports';

    // News
    if (lowerName.includes('news') || lowerName.includes('cnn') || lowerName.includes('bbc')) return 'News';

    // Entertainment
    if (lowerName.includes('movie') || lowerName.includes('film')) return 'Movies';
    if (lowerName.includes('hbo') || lowerName.includes('showtime')) return 'Premium';

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
