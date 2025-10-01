import { getDaddyLiveBaseService } from './baseService';
import logger from '../../utils/logger';

/**
 * DaddyLive Stream Resolver Service
 * Resolves channel IDs to playable HLS stream URLs
 * Based on plugin.video.daddylive v4.43 authentication flow
 */

interface StreamBundle {
  b_ts: string;
  b_rnd: string;
  b_sig: string;
}

interface ResolvedStream {
  url: string;
  headers: Record<string, string>;
  quality: string;
  type: 'hls';
}

export class DaddyLiveStreamResolver {
  private baseService = getDaddyLiveBaseService();

  /**
   * Extract embedded iframe URL from stream page (bypasses ads)
   */
  async extractEmbedUrl(channelId: string): Promise<string | null> {
    try {
      logger.info(`Extracting embed URL for channel: ${channelId}`);

      const streamPageUrl = await this.baseService.buildUrl(`stream/stream-${channelId}.php`);
      const client = this.baseService.getClient();

      const response = await client.get(streamPageUrl, {
        headers: this.baseService.getHeaders()
      });

      if (response.status !== 200) {
        throw new Error(`Stream page returned status ${response.status}`);
      }

      const html = response.data as string;

      // Look for iframe embed patterns
      const iframePatterns = [
        /<iframe[^>]+src=["']([^"']+)["']/gi,
        /embedUrl\s*[:=]\s*["']([^"']+)["']/gi,
        /embed\s*[:=]\s*["']([^"']+)["']/gi,
        /player\s*[:=]\s*["']([^"']+)["']/gi
      ];

      for (const pattern of iframePatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          const url = match[1];
          // Filter out ad iframes and tracking pixels
          if (url &&
              !url.includes('doubleclick') &&
              !url.includes('google') &&
              !url.includes('ad') &&
              !url.includes('analytics') &&
              (url.includes('embed') || url.includes('player') || url.includes('stream'))) {
            logger.info(`Found potential embed URL: ${url}`);
            return url;
          }
        }
      }

      logger.warn(`No embed URL found for channel ${channelId}`);
      return null;
    } catch (error) {
      logger.error(`Error extracting embed URL: ${error}`);
      return null;
    }
  }

  /**
   * Resolve channel ID to playable stream URL
   * Uses multiple fallback methods to find direct m3u8 URL
   */
  async resolveStream(channelId: string): Promise<ResolvedStream | null> {
    try {
      logger.info(`Resolving DaddyLive stream for channel: ${channelId}`);

      // Method 1: Try direct m3u8 URL patterns (most common)
      const directUrls = this.generateDirectStreamUrls(channelId);
      for (const url of directUrls) {
        if (await this.testStreamUrl(url)) {
          logger.info(`Found working direct stream: ${url}`);
          return {
            url,
            headers: this.baseService.getHeaders(),
            quality: 'HD',
            type: 'hls'
          };
        }
      }

      logger.info('Direct URLs failed, trying page extraction...');

      // Method 2: Extract from page HTML
      const streamPageUrl = await this.baseService.buildUrl(`stream/stream-${channelId}.php`);
      const client = this.baseService.getClient();

      const response = await client.get(streamPageUrl, {
        headers: this.baseService.getHeaders()
      });

      if (response.status !== 200) {
        throw new Error(`Stream page returned status ${response.status}`);
      }

      const html = response.data as string;

      // Try to extract m3u8 URLs directly from HTML
      const m3u8Url = this.extractM3U8FromHtml(html);
      if (m3u8Url && await this.testStreamUrl(m3u8Url)) {
        logger.info(`Extracted m3u8 from HTML: ${m3u8Url}`);
        return {
          url: m3u8Url,
          headers: this.baseService.getHeaders(),
          quality: 'HD',
          type: 'hls'
        };
      }

      // Method 3: Try original complex extraction (if page structure supports it)
      const channelKey = this.extractChannelKey(html);
      const xjzBundle = this.extractXJZBundle(html);

      if (channelKey && xjzBundle) {
        logger.info('Attempting complex extraction with auth...');
        const authParams = this.decodeBundle(xjzBundle);

        if (authParams) {
          const iframeHost = this.extractIframeHost(html);
          if (iframeHost) {
            const authPath = this.getAuthPath();
            const authUrl = `${iframeHost}${authPath}?channel_id=${channelKey}&ts=${authParams.b_ts}&rnd=${authParams.b_rnd}&sig=${authParams.b_sig}`;

            try {
              await client.get(authUrl, {
                headers: this.baseService.getHeaders()
              });
            } catch (error) {
              logger.warn(`Auth endpoint call failed: ${error}`);
            }

            const serverLookupUrl = `${iframeHost}/serverLookup/${channelKey}`;
            let serverKey = 'top1';

            try {
              const serverResponse = await client.get(serverLookupUrl, {
                headers: this.baseService.getHeaders()
              });

              if (serverResponse.data && serverResponse.data.server_key) {
                serverKey = serverResponse.data.server_key;
              }
            } catch (error) {
              logger.warn(`Server lookup failed: ${error}`);
            }

            const hlsUrl = this.constructHLSUrl(serverKey, channelId);
            if (await this.testStreamUrl(hlsUrl)) {
              logger.info(`Complex extraction succeeded: ${hlsUrl}`);
              return {
                url: hlsUrl,
                headers: this.baseService.getHeaders(),
                quality: 'HD',
                type: 'hls'
              };
            }
          }
        }
      }

      logger.error('All stream extraction methods failed');
      return null;

    } catch (error) {
      logger.error(`Error resolving stream: ${error}`);
      return null;
    }
  }

  /**
   * Generate common direct stream URL patterns
   */
  private generateDirectStreamUrls(channelId: string): string[] {
    const servers = ['top1', 'top2', 'top3', 'cdn1', 'cdn2'];
    const urls: string[] = [];

    for (const server of servers) {
      // Pattern 1: https://server.newkso.ru/server/cdn/channelId/mono.m3u8
      urls.push(`https://${server}.newkso.ru/${server}/cdn/${channelId}/mono.m3u8`);

      // Pattern 2: https://server.newkso.ru/server/channelId/mono.m3u8
      urls.push(`https://${server}.newkso.ru/${server}/${channelId}/mono.m3u8`);
    }

    return urls;
  }

  /**
   * Extract m3u8 URL directly from HTML
   */
  private extractM3U8FromHtml(html: string): string | null {
    const patterns = [
      /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,
      /"(https?:\/\/[^"]+\.m3u8[^"]*)"/gi,
      /'(https?:\/\/[^']+\.m3u8[^']*)'/gi,
      /source:\s*["']([^"']+\.m3u8[^"']*)["']/gi,
      /src:\s*["']([^"']+\.m3u8[^"']*)["']/gi
    ];

    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern));
      for (const match of matches) {
        const url = match[1] || match[0];
        if (url && url.includes('newkso') && !url.includes('ads')) {
          logger.info(`Found potential m3u8 URL: ${url}`);
          return url.replace(/["']/g, '').trim();
        }
      }
    }

    return null;
  }

  /**
   * Test if a stream URL is accessible
   */
  private async testStreamUrl(url: string): Promise<boolean> {
    try {
      const client = this.baseService.getClient();
      const response = await client.head(url, {
        headers: this.baseService.getHeaders(),
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 302 || status === 301
      });

      return response.status === 200 || response.status === 302 || response.status === 301;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract CHANNEL_KEY from HTML
   */
  private extractChannelKey(html: string): string | null {
    const patterns = [
      /const CHANNEL_KEY\s*=\s*["']([^"']+)["']/i,
      /CHANNEL_KEY\s*=\s*["']([^"']+)["']/i,
      /channel_key\s*[=:]\s*["']([^"']+)["']/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        logger.info(`Extracted CHANNEL_KEY: ${match[1]}`);
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract XJZ bundle from HTML
   */
  private extractXJZBundle(html: string): string | null {
    const patterns = [
      /const XJZ\s*=\s*["']([^"']+)["']/i,
      /XJZ\s*=\s*["']([^"']+)["']/i,
      /xjz\s*[=:]\s*["']([^"']+)["']/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        logger.info('Extracted XJZ bundle');
        return match[1];
      }
    }

    return null;
  }

  /**
   * Decode Base64 bundle to get auth parameters
   */
  private decodeBundle(bundle: string): StreamBundle | null {
    try {
      const decoded = Buffer.from(bundle, 'base64').toString('utf-8');
      const params = JSON.parse(decoded);

      if (params.b_ts && params.b_rnd && params.b_sig) {
        return {
          b_ts: params.b_ts,
          b_rnd: params.b_rnd,
          b_sig: params.b_sig
        };
      }

      return null;
    } catch (error) {
      logger.error(`Failed to decode bundle: ${error}`);
      return null;
    }
  }

  /**
   * Extract iframe host from HTML
   */
  private extractIframeHost(html: string): string | null {
    // Look for patterns like: host = ['https://', 'domain', '.com/'].join('')
    const patterns = [
      /host\s*=\s*\[["']([^"']+)["'],\s*["']([^"']+)["'],\s*["']([^"']+)["']\]\.join\(['"]?['"]?\)/i,
      /iframe.*?src=["']([^"']+)["']/i,
      /https?:\/\/[^\/\s"']+\.newkso\.ru/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        if (pattern.source.includes('\\[')) {
          // Array join pattern
          const host = `${match[1]}${match[2]}${match[3]}`;
          logger.info(`Extracted iframe host: ${host}`);
          return host;
        } else if (match[1]) {
          // Direct URL pattern
          const url = new URL(match[1]);
          const host = `${url.protocol}//${url.host}/`;
          logger.info(`Extracted iframe host: ${host}`);
          return host;
        }
      }
    }

    // Fallback to common domain
    logger.warn('Using fallback iframe host');
    return 'https://news.newkso.ru/';
  }

  /**
   * Get auth path using XOR decryption
   * bx = [40, 60, 61, 33, 103, 57, 33, 57]
   * XOR with 73 = "/getAuth"
   */
  private getAuthPath(): string {
    const bx = [40, 60, 61, 33, 103, 57, 33, 57];
    const authPath = bx.map(b => String.fromCharCode(b ^ 73)).join('');
    return authPath;
  }

  /**
   * Construct final HLS m3u8 URL
   */
  private constructHLSUrl(serverKey: string, channelId: string): string {
    // Pattern from Kodi addon:
    // https://{server_key}new.newkso.ru/{server_key}/{channel_id}/mono.m3u8
    // OR
    // https://top1.newkso.ru/top1/cdn/{channel_id}/mono.m3u8

    if (serverKey.includes('/')) {
      // Server key already contains path
      return `https://${serverKey}new.newkso.ru/${serverKey}/${channelId}/mono.m3u8`;
    } else {
      // Simple server key
      return `https://${serverKey}.newkso.ru/${serverKey}/cdn/${channelId}/mono.m3u8`;
    }
  }
}

// Singleton instance
let instance: DaddyLiveStreamResolver | null = null;

export function getDaddyLiveStreamResolver(): DaddyLiveStreamResolver {
  if (!instance) {
    instance = new DaddyLiveStreamResolver();
  }
  return instance;
}