import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

/**
 * DaddyLive Base Service
 * Handles domain resolution and HTTP client configuration
 * Based on plugin.video.daddylive v4.43 analysis
 */

// Official DaddyLive Kodi repo URLs
const REPO_URLS = [
  'https://team-crew.github.io/',  // Primary repo
  'https://fubuz.github.io/',      // Alternative repo
  'https://cmanbuilds.com/repo/'   // DaddyLive V2 repo
];

const SEED_URL = REPO_URLS[0]; // Start with primary repo

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

    // Try each repo URL in order
    for (const repoUrl of REPO_URLS) {
      try {
        logger.info(`Trying DaddyLive repo URL: ${repoUrl}`);

        // First check if the repo is accessible
        const repoResponse = await this.client.get(repoUrl, {
          maxRedirects: 5,
          timeout: 5000 // Short timeout for quick fallback
        });

        if (repoResponse.status === 200) {
          // Try to get the addon.xml from the repo
          const addonXmlUrl = `${repoUrl}repository.thecrew/addon.xml`;
          const addonResponse = await this.client.get(addonXmlUrl, {
            maxRedirects: 5,
            timeout: 5000
          });

          if (addonResponse.status === 200) {
            logger.info(`Found working DaddyLive repo: ${repoUrl}`);
            this.activeDomain = this.normalizeOrigin(repoUrl);
            this.lastDomainCheck = now;
            return this.activeDomain;
          }
        }
      } catch (error) {
        logger.warn(`Failed to access repo ${repoUrl}: ${error}`);
        continue; // Try next repo
      }
    }

    // If all repos fail, try the schedule URL directly
    try {
      const scheduleUrl = 'https://daddylive.sx/schedule/schedule-generated.php';
      const response = await this.client.get(scheduleUrl, {
        maxRedirects: 5
      });

      if (response.status === 200) {
        const domain = this.normalizeOrigin(scheduleUrl);
        logger.info(`Using direct schedule URL domain: ${domain}`);
        this.activeDomain = domain;
        this.lastDomainCheck = now;
        return domain;
      }
    } catch (error) {
      logger.error(`Failed to access direct schedule URL: ${error}`);
    }

    // If everything fails, return the primary repo URL
    logger.warn('All repo URLs failed, using primary repo URL');
    return REPO_URLS[0];
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