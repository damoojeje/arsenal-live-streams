import { Match, FilteredMatch } from '../types';
import teamsConfig from '../config/teams.json';
import logger from '../utils/logger';

interface TeamsConfig {
  clubs: string[];
}

const teams = (teamsConfig as TeamsConfig).clubs;

// Create a comprehensive list of team aliases and variations
const teamAliases: Record<string, string[]> = {
  'Arsenal': ['Arsenal', 'Arsenal FC', 'Gunners'],
  'Chelsea': ['Chelsea', 'Chelsea FC', 'Blues'],
  'Manchester City': ['Manchester City', 'Man City', 'Man City FC', 'City'],
  'Manchester United': ['Manchester United', 'Man United', 'Man Utd', 'Man United FC', 'United'],
  'Newcastle United': ['Newcastle United', 'Newcastle', 'Newcastle FC', 'Magpies'],
  'Liverpool': ['Liverpool', 'Liverpool FC', 'Reds'],
  'Barcelona': ['Barcelona', 'Barcelona FC', 'Barca', 'FC Barcelona'],
  'Real Madrid': ['Real Madrid', 'Real Madrid CF', 'Real', 'Los Blancos'],
  'AC Milan': ['AC Milan', 'Milan', 'ACM'],
  'Inter Milan': ['Inter Milan', 'Inter', 'Inter FC', 'Internazionale'],
  'Juventus': ['Juventus', 'Juventus FC', 'Juve', 'Old Lady'],
  'Napoli': ['Napoli', 'SSC Napoli', 'Napoli FC'],
  'PSG': ['PSG', 'Paris Saint-Germain', 'Paris SG', 'Paris'],
  'Bayern Munich': ['Bayern Munich', 'Bayern', 'FC Bayern', 'FC Bayern Munich']
};

export function filterMatches(input: Match[]): FilteredMatch[] {
  logger.info(`Filtering ${input.length} matches for target clubs`);
  
  const filteredMatches: FilteredMatch[] = [];
  
  for (const match of input) {
    const isArsenalMatch = isTargetClubMatch(match.homeTeam, match.awayTeam);
    
    if (isArsenalMatch) {
      filteredMatches.push({
        ...match,
        isArsenalMatch
      });
    }
  }
  
  logger.info(`Filtered to ${filteredMatches.length} matches involving target clubs`);
  return filteredMatches;
}

function isTargetClubMatch(homeTeam: string, awayTeam: string): boolean {
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  for (const targetClub of teams) {
    const aliases = teamAliases[targetClub] || [targetClub];
    
    for (const alias of aliases) {
      const normalizedAlias = normalizeTeamName(alias);
      
      if (normalizedHome.includes(normalizedAlias) || normalizedAway.includes(normalizedAlias)) {
        return true;
      }
    }
  }
  
  return false;
}

function normalizeTeamName(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function getTeamAliases(): Record<string, string[]> {
  return teamAliases;
}

export function getTargetClubs(): string[] {
  return teams;
}
