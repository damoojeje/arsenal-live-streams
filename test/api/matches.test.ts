import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/matches';
import { fetchStreamed } from '../../src/data/streamed';
import { fetchSportsurge } from '../../src/data/sportsurge';
import { fetchTotalSportek } from '../../src/data/totalsportek';

// Mock the data modules
jest.mock('../../src/data/streamed');
jest.mock('../../src/data/sportsurge');
jest.mock('../../src/data/totalsportek');

const mockedFetchStreamed = fetchStreamed as jest.MockedFunction<typeof fetchStreamed>;
const mockedFetchSportsurge = fetchSportsurge as jest.MockedFunction<typeof fetchSportsurge>;
const mockedFetchTotalSportek = fetchTotalSportek as jest.MockedFunction<typeof fetchTotalSportek>;

describe('/api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filtered matches successfully', async () => {
    const mockMatches = [
      {
        id: '1',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        time: '15:00',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'streamed'
      },
      {
        id: '2',
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        time: '17:30',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'sportsurge'
      }
    ];

    mockedFetchStreamed.mockResolvedValue([mockMatches[0]]);
    mockedFetchSportsurge.mockResolvedValue([mockMatches[1]]);
    mockedFetchTotalSportek.mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      isArsenalMatch: true
    });
  });

  it('should handle partial failures gracefully', async () => {
    mockedFetchStreamed.mockResolvedValue([]);
    mockedFetchSportsurge.mockRejectedValue(new Error('Network error'));
    mockedFetchTotalSportek.mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveLength(0);
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data).toMatchObject({ error: 'Method not allowed' });
  });

  it('should deduplicate matches', async () => {
    const duplicateMatches = [
      {
        id: '1',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        time: '15:00',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'streamed'
      },
      {
        id: '2',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        time: '15:00',
        date: '2024-01-15',
        competition: 'Premier League',
        links: [],
        source: 'sportsurge'
      }
    ];

    mockedFetchStreamed.mockResolvedValue([duplicateMatches[0]]);
    mockedFetchSportsurge.mockResolvedValue([duplicateMatches[1]]);
    mockedFetchTotalSportek.mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveLength(1);
  });

  it('should set proper cache headers', async () => {
    mockedFetchStreamed.mockResolvedValue([]);
    mockedFetchSportsurge.mockResolvedValue([]);
    mockedFetchTotalSportek.mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getHeaders()).toMatchObject({
      'cache-control': 's-maxage=60, stale-while-revalidate=300',
      'content-type': 'application/json'
    });
  });
});
