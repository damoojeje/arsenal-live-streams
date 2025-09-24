import { fetchStreamed } from '../../src/data/streamed';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock cheerio
jest.mock('cheerio');
const mockedCheerio = cheerio as jest.Mocked<typeof cheerio>;

describe('Streamed Data Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch matches from API successfully', async () => {
    const mockApiResponse = {
      status: 200,
      data: [
        {
          id: '1',
          home_team: 'Arsenal',
          away_team: 'Chelsea',
          time: '15:00',
          date: '2024-01-15',
          competition: 'Premier League'
        }
      ]
    };

    mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

    const result = await fetchStreamed();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      time: '15:00',
      source: 'streamed-api'
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/events'),
      expect.objectContaining({
        timeout: 10000,
        headers: expect.objectContaining({
          'User-Agent': expect.any(String)
        })
      })
    );
  });

  it('should fallback to HTML scraping when API fails', async () => {
    // Mock API failure
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    // Mock HTML response
    const mockHtmlResponse = {
      status: 200,
      data: '<html><body><a href="/watch/123">Arsenal vs Chelsea</a></body></html>'
    };

    mockedAxios.get.mockResolvedValueOnce(mockHtmlResponse);

    // Mock cheerio
    const mockCheerio = {
      load: jest.fn().mockReturnValue({
        'a[href*="/watch/"]': {
          each: jest.fn().mockImplementation((callback) => {
            callback(0, {
              attr: jest.fn().mockReturnValue('/watch/123'),
              text: jest.fn().mockReturnValue('Arsenal vs Chelsea')
            });
          })
        }
      })
    };

    mockedCheerio.load.mockReturnValue(mockCheerio.load());

    const result = await fetchStreamed();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      source: 'streamed-html'
    });
  });

  it('should handle errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const result = await fetchStreamed();

    expect(result).toHaveLength(0);
  });
});
