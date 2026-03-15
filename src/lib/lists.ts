/**
 * src/lib/lists.ts
 *
 * Typed API helpers for all list-related operations.
 * Import these in pages/components instead of calling `api` directly.
 */

import { api } from "@/lib/api";
import type { GameList, GameListItem, DefaultLists } from "@/lib/api";

// ─── Default lists ─────────────────────────────────────────────────────────

/**
 * Fetch the three default list stubs for the current user.
 * Returns { wishlist, currentlyPlaying, completed }, each null if missing.
 */
export async function getDefaultLists(): Promise<DefaultLists> {
  const { data } = await api.get("/lists/defaults");
  return data.data;
}

// ─── List CRUD ─────────────────────────────────────────────────────────────

export async function getMyLists(): Promise<GameList[]> {
  const { data } = await api.get("/lists/me");
  return data.data ?? [];
}

export async function getList(listId: string): Promise<GameList> {
  const { data } = await api.get(`/lists/${listId}`);
  return data.data;
}

export async function createList(payload: {
  name: string;
  description?: string;
  isPublic: boolean;
}): Promise<GameList> {
  const { data } = await api.post("/lists", payload);
  return data.data;
}

export async function updateList(
  listId: string,
  payload: { name?: string; description?: string; isPublic?: boolean }
): Promise<GameList> {
  const { data } = await api.patch(`/lists/${listId}`, payload);
  return data.data;
}

export async function deleteList(listId: string): Promise<void> {
  await api.delete(`/lists/${listId}`);
}

// ─── List item operations ──────────────────────────────────────────────────

export async function addGameToList(
  listId: string,
  gameId: string,
  notes?: string
): Promise<GameListItem> {
  const { data } = await api.post(`/lists/${listId}/games`, { gameId, notes });
  return data.data;
}

export async function removeGameFromList(
  listId: string,
  gameId: string
): Promise<void> {
  await api.delete(`/lists/${listId}/games/${gameId}`);
}

export interface UpdateListItemPayload {
  notes?: string;
  order?: number;
  progressPct?: number;
  progressNote?: string;
}

export async function updateListItem(
  listId: string,
  gameId: string,
  payload: UpdateListItemPayload
): Promise<GameListItem> {
  const { data } = await api.patch(`/lists/${listId}/games/${gameId}`, payload);
  return data.data;
}

// ─── Achievement sync ──────────────────────────────────────────────────────

export async function syncAchievements(
  listId: string,
  gameId: string
): Promise<GameListItem> {
  const { data } = await api.post(
    `/lists/${listId}/games/${gameId}/sync-achievements`
  );
  return data.data;
}

export interface CompleteGamePayload {
  gameId: string;
  completionType: "beaten" | "100pct" | "abandoned" | "endless";
  rating?: number;
  review?: { content: string; spoilers: boolean };
}

export async function completeGame(payload: CompleteGamePayload) {
  const { data } = await api.post("/lists/completed/add", payload);
  return data.data;
}
