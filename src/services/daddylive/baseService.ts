import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

/**
 * DaddyLive Base Service
 * Handles HTTP client configuration for dlhd.dad
 * Updated Nov 2025 - Using actual DaddyLive website
 */

// Current active DaddyLive domain (daddylivestream.com redirects here)
const DADDYLIVE_DOMAIN = 'https://dlhd.dad/';

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
  private activeDomain: string = DADDYLIVE_DOMAIN;

  constructor() {
    this.client = axios.create({
      timeout: 15000,
      maxRedirects: 5,
      headers: REQUIRED_HEADERS,
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
   * Build full URL from path
   */
  buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${DADDYLIVE_DOMAIN}${cleanPath}`;
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