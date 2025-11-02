import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

/**
 * TotalSportek Base Service
 * Handles HTTP client configuration and anti-bot measures
 */

const BASE_URL = 'https://totalsportek7.com';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

export class TotalSportekBaseService {
  private client: AxiosInstance;
  private requestCount: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      maxRedirects: 5,
      headers: this.getRotatingHeaders(),
      validateStatus: (status) => status >= 200 && status < 500
    });
  }

  /**
   * Get HTTP client with rotating user agents
   */
  getClient(): AxiosInstance {
    // Rotate user agent on each request
    this.requestCount++;
    this.client.defaults.headers['User-Agent'] = this.getRandomUserAgent();
    return this.client;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return BASE_URL;
  }

  /**
   * Get rotating headers to avoid bot detection
   */
  private getRotatingHeaders(): Record<string, string> {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  /**
   * Get random user agent from pool
   */
  private getRandomUserAgent(): string {
    return USER_AGENTS[this.requestCount % USER_AGENTS.length];
  }

  /**
   * Add delay between requests to avoid rate limiting
   */
  async delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let instance: TotalSportekBaseService | null = null;

export function getTotalSportekBaseService(): TotalSportekBaseService {
  if (!instance) {
    instance = new TotalSportekBaseService();
  }
  return instance;
}
