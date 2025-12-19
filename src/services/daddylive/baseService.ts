import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

/**
 * DaddyLive Base Service v2.0
 * 
 * Provides shared HTTP client configuration for DaddyLive services
 * Updated Dec 2025 - Simplified; domain resolution moved to individual services
 */

// Seed URL - DaddyLive uses redirects to reach the active domain
export const SEED_URL = 'https://daddylive.sx/';

// User agent matching the Kodi addon v4.50
export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

export class DaddyLiveBaseService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 15000,
      maxRedirects: 10,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      validateStatus: (status) => status >= 200 && status < 500
    });
  }

  /**
   * Get HTTP client with proper headers
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Get headers with referer and origin
   */
  getHeaders(baseDomain: string = 'https://daddyhd.com/'): Record<string, string> {
    const origin = baseDomain.replace(/\/$/, '');
    return {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': baseDomain,
      'Origin': origin
    };
  }

  /**
   * Resolve the active DaddyLive domain by following redirects
   * Utility method that can be used by any service
   */
  async resolveActiveDomain(): Promise<string> {
    try {
      logger.info(`Resolving active DaddyLive domain from: ${SEED_URL}`);
      
      const response = await this.client.get(SEED_URL, {
        maxRedirects: 10,
        timeout: 10000
      });

      // Get final URL after all redirects
      const finalUrl = response.request?.res?.responseUrl || response.config?.url || SEED_URL;
      const parsed = new URL(finalUrl);
      const domain = `${parsed.protocol}//${parsed.hostname}/`;
      
      logger.info(`Active DaddyLive domain: ${domain}`);
      return domain;
    } catch (error) {
      logger.warn(`Failed to resolve domain: ${error}`);
      return 'https://daddyhd.com/'; // Fallback
    }
  }
}

// Singleton instance
let instance: DaddyLiveBaseService | null = null;

export function getDaddyLiveBaseService(): DaddyLiveBaseService {
  if (!instance) {
    instance = new DaddyLiveBaseService();
  }
  return instance;
}
