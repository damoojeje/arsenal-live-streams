/**
 * Team Logo Service
 * Provides team logos/crests with multiple fallback options
 */

// Team logo mapping (free CDN sources)
const TEAM_LOGOS: Record<string, string> = {
  // Premier League
  'arsenal': 'https://resources.premierleague.com/premierleague/badges/70/t3.png',
  'chelsea': 'https://resources.premierleague.com/premierleague/badges/70/t8.png',
  'liverpool': 'https://resources.premierleague.com/premierleague/badges/70/t14.png',
  'manchester city': 'https://resources.premierleague.com/premierleague/badges/70/t43.png',
  'manchester united': 'https://resources.premierleague.com/premierleague/badges/70/t1.png',
  'tottenham': 'https://resources.premierleague.com/premierleague/badges/70/t6.png',
  'newcastle': 'https://resources.premierleague.com/premierleague/badges/70/t4.png',
  'aston villa': 'https://resources.premierleague.com/premierleague/badges/70/t7.png',
  'brighton': 'https://resources.premierleague.com/premierleague/badges/70/t36.png',
  'west ham': 'https://resources.premierleague.com/premierleague/badges/70/t21.png',
  'everton': 'https://resources.premierleague.com/premierleague/badges/70/t11.png',
  'leicester': 'https://resources.premierleague.com/premierleague/badges/70/t13.png',
  'brentford': 'https://resources.premierleague.com/premierleague/badges/70/t94.png',
  'fulham': 'https://resources.premierleague.com/premierleague/badges/70/t54.png',
  'wolves': 'https://resources.premierleague.com/premierleague/badges/70/t39.png',
  'crystal palace': 'https://resources.premierleague.com/premierleague/badges/70/t31.png',
  'bournemouth': 'https://resources.premierleague.com/premierleague/badges/70/t91.png',
  'nottingham forest': 'https://resources.premierleague.com/premierleague/badges/70/t17.png',
  'luton': 'https://resources.premierleague.com/premierleague/badges/70/t102.png',
  'burnley': 'https://resources.premierleague.com/premierleague/badges/70/t90.png',
  'sheffield united': 'https://resources.premierleague.com/premierleague/badges/70/t49.png',
  'southampton': 'https://resources.premierleague.com/premierleague/badges/70/t20.png',

  // European Teams (common opponents)
  'barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'real madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'bayern munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_%282017%29.svg',
  'psg': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'paris saint-germain': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'juventus': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg',
  'ac milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'inter milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'atletico madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'borussia dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'ajax': 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
  'porto': 'https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg',
  'benfica': 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg',
};

// Team name normalization (handles variations)
const TEAM_NAME_VARIATIONS: Record<string, string> = {
  'man city': 'manchester city',
  'man utd': 'manchester united',
  'man united': 'manchester united',
  'spurs': 'tottenham',
  'tottenham hotspur': 'tottenham',
  'newcastle united': 'newcastle',
  'aston villa': 'aston villa',
  'west ham united': 'west ham',
  'leicester city': 'leicester',
  'brentford fc': 'brentford',
  'fulham fc': 'fulham',
  'wolverhampton': 'wolves',
  'crystal palace': 'crystal palace',
  'afc bournemouth': 'bournemouth',
  'nottingham forest': 'nottingham forest',
  'luton town': 'luton',
  'burnley fc': 'burnley',
  'sheffield utd': 'sheffield united',
  'fc barcelona': 'barcelona',
  'real madrid cf': 'real madrid',
  'fc bayern': 'bayern munich',
  'bayern': 'bayern munich',
  'paris sg': 'psg',
  'juventus fc': 'juventus',
  'ac milan': 'ac milan',
  'inter': 'inter milan',
  'atletico': 'atletico madrid',
  'bvb': 'borussia dortmund',
  'dortmund': 'borussia dortmund',
  'afc ajax': 'ajax',
  'fc porto': 'porto',
  'sl benfica': 'benfica',
};

/**
 * Normalize team name for logo lookup
 */
function normalizeTeamName(teamName: string): string {
  const normalized = teamName.toLowerCase().trim();
  return TEAM_NAME_VARIATIONS[normalized] || normalized;
}

/**
 * Get team logo URL
 * Returns logo URL or null if not found
 */
export function getTeamLogo(teamName: string): string | null {
  const normalized = normalizeTeamName(teamName);
  return TEAM_LOGOS[normalized] || null;
}

/**
 * Get team initials for fallback display
 */
export function getTeamInitials(teamName: string): string {
  return teamName
    .split(' ')
    .filter(word => word.length > 0 && !['fc', 'afc', 'united', 'city'].includes(word.toLowerCase()))
    .map(word => word[0].toUpperCase())
    .join('')
    .substring(0, 3) || teamName.substring(0, 2).toUpperCase();
}

/**
 * Preload team logos for faster display
 */
export function preloadTeamLogos(teamNames: string[]): void {
  teamNames.forEach(teamName => {
    const logoUrl = getTeamLogo(teamName);
    if (logoUrl) {
      const img = new Image();
      img.src = logoUrl;
    }
  });
}

/**
 * Check if logo exists (async)
 */
export async function checkLogoExists(logoUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = logoUrl;
  });
}
