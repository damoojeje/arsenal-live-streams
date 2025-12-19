import axios from 'axios';
import logger from '../../utils/logger';

/**
 * DaddyLive Stream Resolver Service v2.0
 * 
 * Resolves channel IDs to playable HLS stream URLs
 * Updated Dec 2025 - Matches Kodi addon v4.50 authentication flow
 */

const SEED_URL = 'https://daddylive.sx/';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

interface ResolvedStream {
  url: string;
  headers: Record<string, string>;
  quality: string;
  type: 'hls';
}

export class DaddyLiveStreamResolver {
  private activeDomain: string | null = null;
  private lastDomainCheck = 0;
  private domainCacheDuration = 300000; // 5 minutes

  /**
   * Resolve the active DaddyLive domain
   */
  private async resolveActiveDomain(): Promise<string> {
    const now = Date.now();
    
    if (this.activeDomain && (now - this.lastDomainCheck) < this.domainCacheDuration) {
      return this.activeDomain;
    }

    try {
      const response = await axios.get(SEED_URL, {
        headers: { 'User-Agent': USER_AGENT },
        maxRedirects: 10,
        timeout: 10000,
        validateStatus: () => true
      });

      const finalUrl = response.request?.res?.responseUrl || response.config?.url || SEED_URL;
      const parsed = new URL(finalUrl);
      this.activeDomain = `${parsed.protocol}//${parsed.hostname}/`;
      this.lastDomainCheck = now;

      logger.info(`Stream resolver domain: ${this.activeDomain}`);
      return this.activeDomain;
    } catch (error) {
      logger.warn(`Domain resolution failed: ${error}`);
      this.activeDomain = 'https://daddyhd.com/';
      return this.activeDomain;
    }
  }

  /**
   * Get headers with proper referer
   */
  private getHeaders(baseDomain: string): Record<string, string> {
    return {
      'User-Agent': USER_AGENT,
      'Referer': baseDomain,
      'Origin': baseDomain.replace(/\/$/, ''),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
  }

  /**
   * Extract embedded iframe URL from stream page
   */
  async extractEmbedUrl(channelId: string): Promise<string | null> {
    try {
      const baseDomain = await this.resolveActiveDomain();
      const streamPageUrl = `${baseDomain}watch.php?id=${channelId}`;
      
      logger.info(`Extracting embed URL for channel: ${channelId}`);

      const response = await axios.get(streamPageUrl, {
        headers: this.getHeaders(baseDomain),
        timeout: 15000
      });

      if (response.status !== 200) {
        throw new Error(`Stream page returned status ${response.status}`);
      }

      const html = response.data as string;

      // Look for Player 2 data-url (as per Kodi addon)
      const player2Match = html.match(/data-url="([^"]+)"\s+title="PLAYER 2"/i);
      if (player2Match) {
        let url2 = player2Match[1].replace('//cast', '/cast');
        if (!url2.startsWith('http')) {
          url2 = new URL(url2, baseDomain).toString();
        }
        logger.info(`Found PLAYER 2 embed: ${url2}`);
        return url2;
      }

      // Fallback: Look for iframe src
      const iframeMatch = html.match(/iframe\s+src="([^"]+)"/i);
      if (iframeMatch) {
        let url = iframeMatch[1];
        if (!url.startsWith('http')) {
          url = new URL(url, baseDomain).toString();
        }
        logger.info(`Found iframe embed: ${url}`);
        return url;
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
   * Uses the same authentication flow as Kodi addon v4.50
   */
  async resolveStream(channelId: string): Promise<ResolvedStream | null> {
    try {
      const baseDomain = await this.resolveActiveDomain();
      logger.info(`Resolving DaddyLive stream for channel: ${channelId}`);

      // Step 1: Get the watch page
      const watchUrl = `${baseDomain}watch.php?id=${channelId}`;
      const headers = this.getHeaders(baseDomain);

      const watchResponse = await axios.get(watchUrl, { headers, timeout: 15000 });
      if (watchResponse.status !== 200) {
        throw new Error(`Watch page returned ${watchResponse.status}`);
      }

      let html = watchResponse.data as string;
      let pageUrl = watchUrl;

      // Step 2: Find and follow Player 2 or iframe
      const player2Match = html.match(/data-url="([^"]+)"\s+title="PLAYER 2"/i);
      let playerUrl: string;
      
      if (player2Match) {
        playerUrl = player2Match[1].replace('//cast', '/cast');
        if (!playerUrl.startsWith('http')) {
          playerUrl = new URL(playerUrl, baseDomain).toString();
        }
      } else {
        const iframeMatch = html.match(/iframe\s+src="([^"]+)"/i);
        if (!iframeMatch) {
          logger.warn('No player URL found');
          return null;
        }
        playerUrl = iframeMatch[1];
        if (!playerUrl.startsWith('http')) {
          playerUrl = new URL(playerUrl, baseDomain).toString();
        }
      }

      // Step 3: Fetch player page
      const playerHeaders = { ...headers, 'Referer': watchUrl };
      const playerResponse = await axios.get(playerUrl, { headers: playerHeaders, timeout: 15000 });
      html = playerResponse.data as string;
      pageUrl = playerUrl;

      // Step 4: Check for nested iframe
      const nestedIframeMatch = html.match(/iframe\s+src="([^"]+)"/i);
      if (nestedIframeMatch) {
        let nestedUrl = nestedIframeMatch[1];
        if (!nestedUrl.startsWith('http')) {
          nestedUrl = new URL(nestedUrl, playerUrl).toString();
        }
        const nestedHeaders = { ...headers, 'Referer': playerUrl };
        const nestedResponse = await axios.get(nestedUrl, { headers: nestedHeaders, timeout: 15000 });
        html = nestedResponse.data as string;
        pageUrl = nestedUrl;
      }

      // Step 5: Extract CHANNEL_KEY
      const channelKeyMatch = html.match(/const\s+(?:CHANNEL_KEY|CHANNEL_ID|CH(?:ANNEL)?_?KEY?)\s*=\s*["']([^"']+)["']/i);
      if (!channelKeyMatch) {
        logger.warn('CHANNEL_KEY not found');
        return null;
      }
      const channelKey = channelKeyMatch[1];
      logger.info(`Found CHANNEL_KEY: ${channelKey}`);

      // Step 6: Handle AUTH2 flow (newer method)
      const authTokenMatch = html.match(/const\s+AUTH_TOKEN\s*=\s*["']([^"']+)["']/i);
      const authCountryMatch = html.match(/const\s+AUTH_COUNTRY\s*=\s*["']([^"']+)["']/i);
      const authTsMatch = html.match(/const\s+AUTH_TS\s*=\s*["']([^"']+)["']/i);
      const authExpiryMatch = html.match(/const\s+AUTH_EXPIRY\s*=\s*["']([^"']+)["']/i);

      if (authTokenMatch && authCountryMatch && authTsMatch && authExpiryMatch) {
        logger.info('Using AUTH2 flow');
        const authHeaders = {
          'User-Agent': USER_AGENT,
          'Referer': pageUrl,
          'Origin': new URL(pageUrl).origin
        };

        try {
          await axios.post('https://security.newkso.ru/auth2.php', {
            channelKey,
            country: authCountryMatch[1],
            timestamp: authTsMatch[1],
            expiry: authExpiryMatch[1],
            token: authTokenMatch[1]
          }, { headers: authHeaders, timeout: 10000 });
          logger.info('AUTH2 called successfully');
        } catch (e) {
          logger.warn(`AUTH2 failed: ${e}`);
        }
      }

      // Step 7: Legacy BUNDLE/XJZ auth flow
      const bundleMatch = html.match(/const\s+(?:BUNDLE|IJXX|XKZK)\s*=\s*["']([^"']+)["']/i);
      if (bundleMatch) {
        try {
          const decoded = JSON.parse(Buffer.from(bundleMatch[1], 'base64').toString());
          const parts: Record<string, string> = {};
          for (const [k, v] of Object.entries(decoded)) {
            parts[k] = Buffer.from(v as string, 'base64').toString();
          }

          if (parts.b_host && parts.b_script && parts.b_ts && parts.b_rnd && parts.b_sig) {
            let authScript = parts.b_script;
            if (/\ba\.php$/i.test(authScript)) {
              authScript = authScript.replace(/\ba\.php$/i, 'auth.php');
            }

            const authBase = parts.b_host.startsWith('http') 
              ? new URL(authScript, parts.b_host).toString()
              : new URL(authScript, pageUrl).toString();

            const authUrl = `${authBase}?channel_id=${encodeURIComponent(channelKey)}&ts=${encodeURIComponent(parts.b_ts)}&rnd=${encodeURIComponent(parts.b_rnd)}&sig=${encodeURIComponent(parts.b_sig)}`;

            try {
              await axios.get(authUrl, {
                headers: { 'User-Agent': USER_AGENT, 'Referer': pageUrl, 'Origin': new URL(pageUrl).origin },
                timeout: 10000
              });
              logger.info('Legacy auth called');
            } catch (e) {
              logger.warn(`Legacy auth failed: ${e}`);
            }
          }
        } catch (e) {
          logger.warn(`Bundle decode failed: ${e}`);
        }
      }

      // Step 8: Server lookup and build m3u8 URL
      const hostRaw = new URL(pageUrl).origin;
      const serverLookupUrl = `${hostRaw}/server_lookup.php?channel_id=${encodeURIComponent(channelKey)}`;

      try {
        const lookupResponse = await axios.get(serverLookupUrl, {
          headers: { 'User-Agent': USER_AGENT, 'Referer': pageUrl, 'Origin': hostRaw },
          timeout: 10000
        });

        const serverKey = lookupResponse.data?.server_key || 'top1/cdn';
        let m3u8Url: string;

        if (serverKey === 'top1/cdn') {
          m3u8Url = `https://top1.newkso.ru/top1/cdn/${channelKey}/mono.m3u8`;
        } else {
          m3u8Url = `https://${serverKey}new.newkso.ru/${serverKey}/${channelKey}/mono.m3u8`;
        }

        logger.info(`Resolved stream URL: ${m3u8Url}`);

        return {
          url: m3u8Url,
          headers: {
            'Referer': `${hostRaw}/`,
            'Origin': hostRaw,
            'User-Agent': USER_AGENT
          },
          quality: 'HD',
          type: 'hls'
        };
      } catch (e) {
        logger.error(`Server lookup failed: ${e}`);
        
        // Fallback: Try default server
        const fallbackUrl = `https://top1.newkso.ru/top1/cdn/${channelKey}/mono.m3u8`;
        return {
          url: fallbackUrl,
          headers: {
            'Referer': `${hostRaw}/`,
            'Origin': hostRaw,
            'User-Agent': USER_AGENT
          },
          quality: 'HD',
          type: 'hls'
        };
      }

    } catch (error) {
      logger.error(`Error resolving stream: ${error}`);
      return null;
    }
  }

  /**
   * Clear cached domain
   */
  clearCache(): void {
    this.activeDomain = null;
    this.lastDomainCheck = 0;
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
