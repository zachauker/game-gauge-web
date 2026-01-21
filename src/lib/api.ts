import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Type definitions matching backend API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Game types
export interface Game {
  id: string;
  igdbId?: number;
  title: string;
  slug: string;
  description?: string;
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  genres: string[];
  platforms: string[];
  coverImage?: string;
  metacritic?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reviews: number;
    ratings: number;
  };
}

// IGDB types
export interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    url: string;
    image_id: string;
  };
  first_release_date?: number;
  rating?: number;
  platforms?: Array<{
    name: string;
    abbreviation?: string;
  }>;
  inDatabase?: boolean;
}

// Rating types
export interface Rating {
  id: string;
  score: number;
  userId: string;
  gameId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageScore: number;
  totalRatings: number;
  distribution: Array<{
    score: number;
    count: number;
  }>;
}

// Review types
export interface Review {
  id: string;
  content: string;
  userId: string;
  gameId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// List types
export interface GameList {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  items?: GameListItem[];
  _count?: {
    items: number;
  };
}

export interface GameListItem {
  id: string;
  listId: string;
  gameId: string;
  notes?: string;
  order: number;
  addedAt: string;
  game?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string;
    releaseDate?: string;
  };
}

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error.message;
    }
    return axiosError.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

export default api;
