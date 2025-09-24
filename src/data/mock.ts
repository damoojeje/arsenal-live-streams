import { Match } from '../types';
import logger from '../utils/logger';

export async function fetchMockData(): Promise<Match[]> {
  logger.info('Fetching mock data for testing');
  
  const mockMatches: Match[] = [
    {
      id: 'mock-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      time: '15:00',
      date: new Date().toISOString().split('T')[0],
      competition: 'Premier League',
      links: [
        {
          url: 'https://streamed.pk/watch/arsenal-chelsea-1',
          quality: 'HD',
          type: 'stream',
          language: 'English'
        },
        {
          url: 'https://sportsurge.bz/event/arsenal-chelsea-1',
          quality: '720p',
          type: 'stream',
          language: 'English'
        }
      ],
      source: 'mock-data'
    },
    {
      id: 'mock-2',
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      time: '17:30',
      date: new Date().toISOString().split('T')[0],
      competition: 'Premier League',
      links: [
        {
          url: 'https://streamed.pk/watch/man-city-liverpool-1',
          quality: 'HD',
          type: 'stream',
          language: 'English'
        }
      ],
      source: 'mock-data'
    },
    {
      id: 'mock-3',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      time: '20:00',
      date: new Date().toISOString().split('T')[0],
      competition: 'La Liga',
      links: [
        {
          url: 'https://totalsportek007.com/watch/barca-real-1',
          quality: 'HD',
          type: 'stream',
          language: 'Spanish'
        }
      ],
      source: 'mock-data'
    },
    {
      id: 'mock-4',
      homeTeam: 'Arsenal',
      awayTeam: 'Tottenham',
      time: '14:00',
      date: new Date().toISOString().split('T')[0],
      competition: 'Premier League',
      links: [
        {
          url: 'https://streamed.pk/watch/arsenal-tottenham-1',
          quality: 'HD',
          type: 'stream',
          language: 'English'
        }
      ],
      source: 'mock-data'
    }
  ];

  logger.info(`Mock data: Found ${mockMatches.length} matches`);
  return mockMatches;
}
