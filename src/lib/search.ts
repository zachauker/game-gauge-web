import { api, IGDBGame, Game } from './api';

export interface SearchFilters {
  query?: string;
  sort?: 'relevance' | 'rating' | 'date';
  page?: number;
  limit?: number;
  genreId?: number;
}

export interface CommunityData {
  igdbId: number;
  slug: string;
  averageRating: number;
  ratingCount: number;
}

export interface DBGame {
  id: string;
  title: string;
  slug: string;
  igdbId?: number;
  coverImage?: string;
  genres: string[];
  platforms: string[];
  releaseDate?: string;
  averageRating?: number;
  ratingCount?: number;
}

export interface SearchResponse {
  games: IGDBGame[];
  total: number;
}

/**
 * Search IGDB for games
 */
export async function searchIGDB(filters: SearchFilters): Promise<SearchResponse> {
  const { query = '', page = 1, limit = 20, genreId } = filters;

  const response = await api.get('/igdb/search', {
    params: {
      q: query,
      limit,
      ...(genreId !== undefined && { genreId }),
    },
  });

  return {
    games: response.data.data || [],
    total: response.data.data?.length || 0,
  };
}

/**
 * Get popular games from IGDB
 */
export async function getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
  try {
    const response = await api.get('/igdb/popular', {
      params: { limit },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Get popular games error:', error);
    return [];
  }
}

/**
 * Get recent games from IGDB
 */
export async function getRecentGames(limit: number = 20): Promise<IGDBGame[]> {
  try {
    const response = await api.get('/igdb/recent', {
      params: { limit },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Get recent games error:', error);
    return [];
  }
}

/**
 * Get game details from IGDB
 */
export async function getIGDBGame(igdbId: number): Promise<IGDBGame | null> {
  try {
    const response = await api.get(`/igdb/games/${igdbId}`);
    return response.data.data;
  } catch (error) {
    console.error('Get IGDB game error:', error);
    return null;
  }
}

/**
 * Import game from IGDB to our database
 */
export async function importGame(igdbId: number): Promise<Game | null> {
  try {
    const response = await api.post('/igdb/import', { igdbId });
    return response.data.data;
  } catch (error) {
    console.error('Import game error:', error);
    return null;
  }
}

/**
 * Fetch community rating data for a batch of IGDB IDs
 * Used to overlay community ratings on IGDB search results
 * Returns a Map for O(1) lookup by igdbId
 */
export async function getBatchCommunityData(
  igdbIds: number[]
): Promise<Map<number, CommunityData>> {
  if (igdbIds.length === 0) return new Map();
  try {
    const response = await api.get('/games/by-igdb-ids', {
      params: { ids: igdbIds.join(',') },
    });
    const items: CommunityData[] = response.data.data || [];
    return new Map(items.map(item => [item.igdbId, item]));
  } catch (error) {
    console.error('Batch community data error:', error);
    return new Map();
  }
}

/**
 * Get top-rated games from the Game Gauge community database
 */
export async function getTopRatedGames(
  limit: number = 6,
  genre?: string
): Promise<DBGame[]> {
  try {
    const response = await api.get('/games/top-rated', {
      params: { limit, ...(genre && { genre }) },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Get top-rated games error:', error);
    return [];
  }
}

/**
 * Get trending games from the Game Gauge community database
 */
export async function getTrendingGames(
  limit: number = 6,
  genre?: string
): Promise<DBGame[]> {
  try {
    const response = await api.get('/games/trending', {
      params: { limit, ...(genre && { genre }) },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Get trending games error:', error);
    return [];
  }
}

/**
 * Get DB games with optional filtering (for the flat grid browse mode)
 */
export async function getDBGames(params: {
  genre?: string;
  platform?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}): Promise<{ games: DBGame[]; total: number; totalPages: number }> {
  try {
    const response = await api.get('/games', { params });
    return {
      games: response.data.data || [],
      total: response.data.pagination?.total || 0,
      totalPages: response.data.pagination?.totalPages || 0,
    };
  } catch (error) {
    console.error('Get DB games error:', error);
    return { games: [], total: 0, totalPages: 0 };
  }
}

/**
 * Format IGDB image URL
 */
export function getIGDBImageUrl(imageId: string, size: 'thumb' | 'cover_small' | 'cover_big' | 'screenshot_big' = 'cover_big'): string {
  if (!imageId) return '/placeholder-game.svg';
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

/**
 * Format IGDB date to readable string
 */
export function formatIGDBDate(timestamp?: number): string {
  if (!timestamp) return 'TBA';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
