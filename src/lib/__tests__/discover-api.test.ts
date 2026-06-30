import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  getBatchCommunityData,
  getTopRatedGames,
  getTrendingGames,
  getDBGames,
  searchIGDB,
} from '../search';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGet.mockReset();
});

describe('getBatchCommunityData', () => {
  it('returns empty map when no ids provided', async () => {
    const result = await getBatchCommunityData([]);
    expect(result.size).toBe(0);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('calls /games/by-igdb-ids with comma-joined ids', async () => {
    mockGet.mockResolvedValue({
      data: {
        success: true,
        data: [{ igdbId: 123, slug: 'game-one', averageRating: 8.5, ratingCount: 10 }],
      },
    });
    const result = await getBatchCommunityData([123, 456]);
    expect(mockGet).toHaveBeenCalledWith('/games/by-igdb-ids', { params: { ids: '123,456' } });
    expect(result.get(123)?.averageRating).toBe(8.5);
  });

  it('returns empty map on error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    const result = await getBatchCommunityData([123]);
    expect(result.size).toBe(0);
  });
});

describe('getTopRatedGames', () => {
  it('calls /games/top-rated with limit and genre', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await getTopRatedGames(6, 'Action');
    expect(mockGet).toHaveBeenCalledWith('/games/top-rated', {
      params: { limit: 6, genre: 'Action' },
    });
  });

  it('omits genre param when not provided', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await getTopRatedGames(6);
    expect(mockGet).toHaveBeenCalledWith('/games/top-rated', {
      params: { limit: 6 },
    });
  });
});

describe('getTrendingGames', () => {
  it('calls /games/trending with limit and genre', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await getTrendingGames(6, 'RPG');
    expect(mockGet).toHaveBeenCalledWith('/games/trending', {
      params: { limit: 6, genre: 'RPG' },
    });
  });
});

describe('getDBGames', () => {
  it('calls /games with the given params and returns paginated result', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{ id: '1', title: 'Test', slug: 'test', genres: [], platforms: [] }],
        pagination: { total: 1, totalPages: 1 },
      },
    });
    const result = await getDBGames({ genre: 'Action', sortBy: 'averageRating', page: 1, limit: 24 });
    expect(result.total).toBe(1);
    expect(result.games).toHaveLength(1);
  });
});

describe('searchIGDB with genreId', () => {
  it('passes genreId to the API when provided', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await searchIGDB({ query: 'zelda', limit: 10, genreId: 12 });
    expect(mockGet).toHaveBeenCalledWith('/igdb/search', {
      params: { q: 'zelda', limit: 10, genreId: 12 },
    });
  });

  it('omits genreId when not provided', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await searchIGDB({ query: 'zelda', limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/igdb/search', {
      params: { q: 'zelda', limit: 10 },
    });
  });
});
