import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../utils/logger';

/**
 * DaddyLive Stream Extractor
 * Extracts direct m3u8 URLs from DaddyLive stream pages
 * NO VIDEO PROXYING - Only URL extraction (lightweight)
 *
 * How it works:
 * 1. Fetch DaddyLive page HTML (~10KB)
 * 2. Extract m3u8 URL using regex/cheerio
 * 3. Return direct URL to browser
 * 4. Browser plays video directly from DaddyLive CDN (NOT through our server)
 */

export interface ExtractedStream {
  success: boolean;
  streamUrl?: string;
  quality?: string;
  type?: 'hls' | 'iframe';
  headers?: Record<string, string>;
  error?: string;
  fallbackUrl?: string;
}

export class DaddyLiveStreamExtractor {
  private cache: Map<string, { url: string; timestamp: number }> = new Map();
  private cacheDuration = 300000; // 5 minutes (URLs expire frequently)

  /**
   * Extract direct stream URL from DaddyLive page
   * @param channelId - DaddyLive channel ID (e.g., "468")
   * @returns Extracted stream information
   */
  async extractStreamUrl(channelId: string): Promise<ExtractedStream> {
    try {
      // Check cache first
      const cached = this.cache.get(channelId);
      if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
        logger.info(`Stream URL cache hit for channel ${channelId}`);
        return {
          success: true,
          streamUrl: cached.url,
          quality: 'HD',
          type: 'hls',
          headers: this.getRequiredHeaders()
        };
      }

      // Fetch the DaddyLive stream page
      const pageUrl = `https://dlhd.dad/stream/stream-${channelId}.php`;
      logger.info(`Fetching DaddyLive page: ${pageUrl}`);

      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://dlhd.dad/',
          'DNT': '1'
        },
        timeout: 10000
      });

      const html = response.data;

      // Method 1: Extract m3u8 URL from JavaScript variables
      const m3u8Match = this.extractFromJavaScript(html);
      if (m3u8Match) {
        logger.info(`Extracted m3u8 URL for channel ${channelId}: ${m3u8Match}`);

        // Cache the result
        this.cache.set(channelId, { url: m3u8Match, timestamp: Date.now() });

        return {
          success: true,
          streamUrl: m3u8Match,
          quality: 'HD',
          type: 'hls',
          headers: this.getRequiredHeaders()
        };
      }

      // Method 2: Extract from HTML using Cheerio
      const cheerioMatch = this.extractFromHtml(html);
      if (cheerioMatch) {
        logger.info(`Extracted m3u8 URL via Cheerio for channel ${channelId}: ${cheerioMatch}`);

        // Cache the result
        this.cache.set(channelId, { url: cheerioMatch, timestamp: Date.now() });

        return {
          success: true,
          streamUrl: cheerioMatch,
          quality: 'HD',
          type: 'hls',
          headers: this.getRequiredHeaders()
        };
      }

      // Method 3: Try alternative URL patterns
      const alternativeUrl = this.tryAlternativePatterns(channelId);
      if (alternativeUrl) {
        logger.info(`Using alternative URL pattern for channel ${channelId}`);
        return {
          success: true,
          streamUrl: alternativeUrl,
          quality: 'HD',
          type: 'hls',
          headers: this.getRequiredHeaders()
        };
      }

      // Extraction failed - return fallback to iframe
      logger.warn(`Failed to extract m3u8 URL for channel ${channelId}, falling back to iframe`);

      return {
        success: false,
        error: 'Could not extract direct stream URL',
        type: 'iframe',
        fallbackUrl: pageUrl
      };

    } catch (error) {
      logger.error(`Error extracting stream for channel ${channelId}: ${error}`);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'iframe',
        fallbackUrl: `https://dlhd.dad/stream/stream-${channelId}.php`
      };
    }
  }

  /**
   * Extract m3u8 URL from JavaScript code in the HTML
   */
  private extractFromJavaScript(html: string): string | null {
    // Common patterns in DaddyLive pages:
    // 1. source: 'https://.../*.m3u8'
    // 2. file: "https://.../*.m3u8"
    // 3. var stream = "https://.../*.m3u8"

    const patterns = [
      /source\s*:\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i,
      /file\s*:\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i,
      /var\s+\w+\s*=\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i,
      /src\s*=\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i,
      /(https?:\/\/[^\s'"<>]+\.m3u8[^\s'"<>]*)/gi  // Generic m3u8 URL
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const url = match[1];
        // Validate it's a proper m3u8 URL
        if (this.isValidM3u8Url(url)) {
          return url;
        }
      }
    }

    return null;
  }

  /**
   * Extract m3u8 URL from HTML using Cheerio
   */
  private extractFromHtml(html: string): string | null {
    try {
      const $ = cheerio.load(html);

      // Look for video/source elements with m3u8 URLs
      const sources = $('video source, source[type*="mpegurl"], source[type*="m3u8"]');

      for (let i = 0; i < sources.length; i++) {
        const src = $(sources[i]).attr('src');
        if (src && this.isValidM3u8Url(src)) {
          return src;
        }
      }

      // Look for data attributes
      const dataAttrs = $('[data-url], [data-stream], [data-source]');
      for (let i = 0; i < dataAttrs.length; i++) {
        const url = $(dataAttrs[i]).attr('data-url') ||
                    $(dataAttrs[i]).attr('data-stream') ||
                    $(dataAttrs[i]).attr('data-source');
        if (url && this.isValidM3u8Url(url)) {
          return url;
        }
      }

      return null;
    } catch (error) {
      logger.warn(`Cheerio parsing error: ${error}`);
      return null;
    }
  }

  /**
   * Try alternative URL patterns based on channel ID
   * Some DaddyLive channels use predictable URL structures
   */
  private tryAlternativePatterns(channelId: string): string | null {
    // Common DaddyLive CDN patterns (may need updates as they change)
    const patterns = [
      `https://rr.vipstreams.in/live/stream-${channelId}/playlist.m3u8`,
      `https://webhdrunns.mizhls.ru/lb/premium${channelId}/index.m3u8`,
      `https://dlhd.so/${channelId}/index.m3u8`
    ];

    // Return first pattern as attempt (will be validated during playback)
    // This is speculative - may not work for all channels
    return null; // Disabled for now - too unreliable
  }

  /**
   * Validate if URL is a proper m3u8 URL
   */
  private isValidM3u8Url(url: string): boolean {
    if (!url) return false;

    // Must be HTTP(S) URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }

    // Must contain .m3u8
    if (!url.includes('.m3u8')) {
      return false;
    }

    // Should not contain obvious junk
    const junkPatterns = ['javascript:', 'data:', 'blob:', '<', '>'];
    for (const junk of junkPatterns) {
      if (url.includes(junk)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get required headers for m3u8 playback
   * These headers may be needed for CORS/authentication
   */
  private getRequiredHeaders(): Record<string, string> {
    return {
      'Referer': 'https://dlhd.dad/',
      'Origin': 'https://dlhd.dad',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };
  }

  /**
   * Clear cache for a specific channel or all channels
   */
  clearCache(channelId?: string): void {
    if (channelId) {
      this.cache.delete(channelId);
      logger.info(`Cleared cache for channel ${channelId}`);
    } else {
      this.cache.clear();
      logger.info('Cleared all stream URL cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size
    };
  }
}

// Singleton instance
let instance: DaddyLiveStreamExtractor | null = null;

export function getDaddyLiveStreamExtractor(): DaddyLiveStreamExtractor {
  if (!instance) {
    instance = new DaddyLiveStreamExtractor();
  }
  return instance;
}
