import { filterMatches } from '../../src/data/filter';
import { Match } from '../../src/types';

describe('Filter Module', () => {
  const mockMatches: Match[] = [
    {
      id: '1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      time: '15:00',
      date: '2024-01-15',
      competition: 'Premier League',
      links: [],
      source: 'test'
    },
    {
      id: '2',
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      time: '17:30',
      date: '2024-01-15',
      competition: 'Premier League',
      links: [],
      source: 'test'
    },
    {
      id: '3',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      time: '20:00',
      date: '2024-01-15',
      competition: 'La Liga',
      links: [],
      source: 'test'
    },
    {
      id: '4',
      homeTeam: 'Tottenham',
      awayTeam: 'West Ham',
      time: '14:00',
      date: '2024-01-15',
      competition: 'Premier League',
      links: [],
      source: 'test'
    }
  ];

  it('should filter matches for target clubs only', () => {
    const result = filterMatches(mockMatches);

    expect(result).toHaveLength(3);
    expect(result.map(m => m.id)).toEqual(['1', '2', '3']);
  });

  it('should handle case-insensitive team names', () => {
    const matchesWithCaseVariations: Match[] = [
      {
        id: '1',
        homeTeam: 'arsenal',
        awayTeam: 'CHELSEA',
        time: '15:00',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'test'
      },
      {
        id: '2',
        homeTeam: 'manchester city',
        awayTeam: 'liverpool',
        time: '17:30',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'test'
      }
    ];

    const result = filterMatches(matchesWithCaseVariations);

    expect(result).toHaveLength(2);
  });

  it('should handle team aliases', () => {
    const matchesWithAliases: Match[] = [
      {
        id: '1',
        homeTeam: 'Arsenal FC',
        awayTeam: 'Chelsea FC',
        time: '15:00',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'test'
      },
      {
        id: '2',
        homeTeam: 'Man City',
        awayTeam: 'Man United',
        time: '17:30',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'test'
      },
      {
        id: '3',
        homeTeam: 'Barca',
        awayTeam: 'Real',
        time: '20:00',
        date: '2024-01-15',
        competition: 'La Liga',
        links: [],
        source: 'test'
      }
    ];

    const result = filterMatches(matchesWithAliases);

    expect(result).toHaveLength(3);
  });

  it('should return empty array for no matches', () => {
    const emptyMatches: Match[] = [];
    const result = filterMatches(emptyMatches);

    expect(result).toHaveLength(0);
  });

  it('should mark Arsenal matches correctly', () => {
    const result = filterMatches(mockMatches);
    const arsenalMatch = result.find(m => m.homeTeam === 'Arsenal' || m.awayTeam === 'Arsenal');

    expect(arsenalMatch?.isArsenalMatch).toBe(true);
  });
});
