import { api, IGDBGame, Game } from './api';

export interface SearchFilters {
  query?: string;
  sort?: 'relevance' | 'rating' | 'date';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  games: IGDBGame[];
  total: number;
}

/**
 * Search IGDB for games
 */
export async function searchIGDB(filters: SearchFilters): Promise<SearchResponse> {
  const { query = '', page = 1, limit = 20 } = filters;
  
  try {
    const response = await api.get('/igdb/search', {
      params: {
        q: query,
        limit,
      },
    });

    return {
      games: response.data.data || [],
      total: response.data.data?.length || 0,
    };
  } catch (error) {
    console.error('IGDB search error:', error);
    return { games: [], total: 0 };
  }
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
