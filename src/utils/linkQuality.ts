import { StreamLink } from '../types';

export interface QualityMetrics {
  score: number;
  factors: {
    domainReputation: number;
    linkPattern: number;
    qualityIndicators: number;
    adLikelihood: number;
  };
}

// Domain reputation scoring (higher = better)
const DOMAIN_SCORES: Record<string, number> = {
  // High quality streaming domains
  'streameast': 8,
  'buffstreams': 7,
  'crackstreams': 7,
  'sportslemon': 6,
  'viprow': 6,
  'strikeout': 5,
  'firstrowsports': 5,
  // Medium quality
  'rojadirecta': 4,
  'atdhe': 4,
  // Lower quality/ad-heavy
  'sportstream': 3,
  'liveonscore': 2,
  'popup': 1,
  'ads': 0
};

// Suspicious URL patterns that indicate ads or low quality
const SUSPICIOUS_PATTERNS = [
  /\b(popup|pop-up|ad|ads|banner|click|download|install)\b/i,
  /\b(casino|betting|porn|adult|sex|xxx)\b/i,
  /\.(exe|apk|zip|rar|dmg)$/i,
  /\bmobile\b.*\bapp\b/i,
  /\bfree\b.*\bmoney\b/i
];

// Quality indicators in URLs or domains
const QUALITY_INDICATORS = [
  /\b(hd|fullhd|1080p|720p|4k|uhd)\b/i,
  /\b(stream|live|watch|tv)\b/i,
  /\b(sport|football|soccer)\b/i
];

export function rankStreamLinks(links: StreamLink[]): StreamLink[] {
  if (!links || links.length === 0) return [];

  // Calculate quality metrics for each link
  const rankedLinks = links.map(link => ({
    ...link,
    qualityMetrics: calculateQualityScore(link)
  })).sort((a, b) => b.qualityMetrics.score - a.qualityMetrics.score);

  // Ranking completed - logging removed for client-side compatibility

  return rankedLinks;
}

export function calculateQualityScore(link: StreamLink): QualityMetrics {
  const url = link.url.toLowerCase();
  const domain = extractDomain(url);

  // Domain reputation score (0-10)
  const domainReputation = getDomainScore(domain);

  // Link pattern analysis (0-10)
  const linkPattern = analyzeLinkPattern(url);

  // Quality indicators (0-10)
  const qualityIndicators = analyzeQualityIndicators(url, link.quality);

  // Ad likelihood (0-10, inverted - lower is better)
  const adLikelihood = 10 - analyzeAdLikelihood(url);

  // Weighted score calculation
  const score = (
    domainReputation * 0.3 +
    linkPattern * 0.25 +
    qualityIndicators * 0.25 +
    adLikelihood * 0.2
  );

  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal
    factors: {
      domainReputation,
      linkPattern,
      qualityIndicators,
      adLikelihood
    }
  };
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.split('/')[0].replace('www.', '');
  }
}

function getDomainScore(domain: string): number {
  // Check exact matches first
  for (const [knownDomain, score] of Object.entries(DOMAIN_SCORES)) {
    if (domain.includes(knownDomain)) {
      return score;
    }
  }

  // Default score based on domain characteristics
  if (domain.includes('stream') || domain.includes('sport')) return 5;
  if (domain.includes('live') || domain.includes('tv')) return 4;
  if (domain.includes('watch')) return 3;

  return 2; // Unknown domain default
}

function analyzeLinkPattern(url: string): number {
  let score = 5; // Start with neutral score

  // Positive patterns
  if (url.includes('/live/') || url.includes('/stream/')) score += 2;
  if (url.includes('/watch/') || url.includes('/player/')) score += 1;
  if (url.includes('football') || url.includes('soccer')) score += 1;

  // Negative patterns
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url))) score -= 3;
  if (url.includes('redirect') || url.includes('goto')) score -= 2;
  if (url.length > 200) score -= 1; // Very long URLs often suspicious

  return Math.max(0, Math.min(10, score));
}

function analyzeQualityIndicators(url: string, quality?: string): number {
  let score = 0;

  // Quality indicators in URL
  if (QUALITY_INDICATORS.some(pattern => pattern.test(url))) score += 2;

  // Quality metadata
  if (quality) {
    const q = quality.toLowerCase();
    if (q.includes('hd') || q.includes('1080p')) score += 3;
    else if (q.includes('720p') || q.includes('high')) score += 2;
    else if (q.includes('sd') || q.includes('medium')) score += 1;
  }

  // SSL/HTTPS bonus
  if (url.startsWith('https://')) score += 1;

  return Math.min(10, score);
}

function analyzeAdLikelihood(url: string): number {
  let score = 0;

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) score += 2;
  }

  // Multiple redirects or tracking parameters
  if (url.includes('?ref=') || url.includes('&utm_')) score += 1;
  if (url.includes('clickid') || url.includes('affiliate')) score += 2;

  // Extremely long URLs often have tracking
  if (url.length > 150) score += 1;

  return Math.min(10, score);
}

export function cleanStreamUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'ref', 'referer', 'referrer', 'source', 'clickid', 'affiliate',
      'fbclid', 'gclid', 'msclkid', 'mc_eid', 'mc_cid'
    ];

    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    return url; // Return original if URL parsing fails
  }
}

export function filterHighQualityLinks(links: StreamLink[], minScore: number = 5): StreamLink[] {
  return links
    .map(link => ({
      ...link,
      qualityMetrics: calculateQualityScore(link)
    }))
    .filter(link => link.qualityMetrics.score >= minScore)
    .sort((a, b) => b.qualityMetrics.score - a.qualityMetrics.score)
    .slice(0, 5); // Return top 5 highest quality links
}