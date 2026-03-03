import { api } from './api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SteamSyncResult {
  totalGames: number;
  matchedGames: number;
  unmatchedGames: number;
  newlyImported: number;
  syncDuration: number;
}

export interface SteamSyncStatus {
  totalGames: number;
  matchedGames: number;
  unmatchedGames: number;
  lastSynced: string | null;
}

export interface SteamLibraryEntry {
  id: string;
  userId: string;
  steamAppId: number;
  gameId: string | null;
  name: string;
  playtimeForever: number;  // minutes
  playtimeRecent: number;   // minutes (last 2 weeks)
  iconUrl: string | null;
  lastPlayed: string | null;
  lastSynced: string;
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    igdbId: number | null;
    genres: string[];
  } | null;
}

export interface SteamLibraryResponse {
  syncStatus: SteamSyncStatus;
  data: SteamLibraryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SteamProfileInfo {
  steamId: string;
  personaName: string;
  profileUrl: string;
  avatarFull: string;
  onlineStatus: string;
  isPublic: boolean;
  steamLevel: number | null;
  memberSince: string | null;
  lastLogoff: string | null;
  country: string | null;
}

export interface SteamWishlistItem {
  steamAppId: number;
  name: string;
  priority: number;
  dateAdded: string;
  gameId: string | null;
  igdbId: number | null;
  matched: boolean;
  storeUrl: string;
}

// ──────────────────────────────────────────────
// API functions
// ──────────────────────────────────────────────

/** Trigger a full Steam library sync */
export async function syncSteamLibrary(): Promise<SteamSyncResult> {
  const { data } = await api.post('/steam/sync/library');
  return data.data;
}

/** Trigger a lightweight sync of recently played games */
export async function syncRecentlyPlayed(): Promise<SteamSyncResult> {
  const { data } = await api.post('/steam/sync/recent');
  return data.data;
}

/** Get sync status metadata */
export async function getSyncStatus(): Promise<SteamSyncStatus> {
  const { data } = await api.get('/steam/sync/status');
  return data.data;
}

/** Get the user's cached Steam library */
export async function getSteamLibrary(params: {
  page?: number;
  limit?: number;
  sortBy?: 'playtimeForever' | 'playtimeRecent' | 'name' | 'lastPlayed';
  sortOrder?: 'asc' | 'desc';
  matchedOnly?: boolean;
} = {}): Promise<SteamLibraryResponse> {
  const { data } = await api.get('/steam/library', { params });
  return data.data;
}

/** Get recently played games from cache */
export async function getRecentlyPlayed(limit: number = 20): Promise<SteamLibraryEntry[]> {
  const { data } = await api.get('/steam/recent', { params: { limit } });
  return data.data;
}

/** Get Steam wishlist (live fetch) */
export async function getSteamWishlist(): Promise<SteamWishlistItem[]> {
  const { data } = await api.get('/steam/wishlist');
  return data.data;
}

/** Get Steam profile info */
export async function getSteamProfile(): Promise<SteamProfileInfo> {
  const { data } = await api.get('/steam/profile');
  return data.data;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Format minutes into a readable playtime string */
export function formatPlaytime(minutes: number): string {
  if (minutes === 0) return 'Never played';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours >= 100) return `${hours.toLocaleString()}h`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Format a compact playtime for badges */
export function formatPlaytimeCompact(minutes: number): string {
  if (minutes === 0) return '0h';
  if (minutes < 60) return '<1h';
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString()}h`;
}

/** Get the Steam store page URL for an app */
export function getSteamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`;
}

/** Get the Steam community header image URL */
export function getSteamHeaderImage(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

/** Get a smaller Steam capsule image */
export function getSteamCapsuleImage(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`;
}

/** Get the large Steam library hero image */
export function getSteamLibraryImage(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
}

/** Format a date into relative time (e.g. "2 hours ago") */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
