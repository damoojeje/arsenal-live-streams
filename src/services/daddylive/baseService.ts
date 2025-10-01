import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

/**
 * DaddyLive Base Service
 * Handles domain resolution and HTTP client configuration
 * Based on plugin.video.daddylive v4.43 analysis
 */

const SEED_URL = 'https://daddylive.sx/';

const REQUIRED_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};

export class DaddyLiveBaseService {
  private client: AxiosInstance;
  private activeDomain: string = SEED_URL;
  private lastDomainCheck: number = 0;
  private domainCheckInterval: number = 3600000; // 1 hour

  constructor() {
    this.client = axios.create({
      timeout: 15000,
      maxRedirects: 5,
      headers: REQUIRED_HEADERS,
      validateStatus: (status) => status >= 200 && status < 500
    });
  }

  /**
   * Resolve active DaddyLive domain
   * Follows redirects to discover current active domain
   */
  async resolveActiveDomain(): Promise<string> {
    const now = Date.now();

    // Return cached domain if checked recently
    if (this.activeDomain && (now - this.lastDomainCheck) < this.domainCheckInterval) {
      return this.activeDomain;
    }

    try {
      logger.info(`Resolving active DaddyLive domain from seed: ${SEED_URL}`);

      const response = await this.client.get(SEED_URL, {
        maxRedirects: 5
      });

      // Extract final URL after redirects
      const finalUrl = response.request?.res?.responseUrl || response.config.url || SEED_URL;
      this.activeDomain = this.normalizeOrigin(finalUrl);
      this.lastDomainCheck = now;

      logger.info(`Active DaddyLive domain resolved: ${this.activeDomain}`);

      return this.activeDomain;
    } catch (error) {
      logger.error(`Failed to resolve DaddyLive domain: ${error}`);
      // Fallback to seed URL
      return SEED_URL;
    }
  }

  /**
   * Normalize URL to origin (protocol + domain)
   */
  private normalizeOrigin(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/`;
    } catch {
      return url.endsWith('/') ? url : `${url}/`;
    }
  }

  /**
   * Get HTTP client with proper headers
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Build full URL from path
   */
  async buildUrl(path: string): Promise<string> {
    const domain = await this.resolveActiveDomain();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${domain}${cleanPath}`;
  }

  /**
   * Get headers with referer and origin
   */
  getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...REQUIRED_HEADERS,
      'Referer': this.activeDomain,
      'Origin': this.activeDomain.replace(/\/$/, ''),
      ...additionalHeaders
    };
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