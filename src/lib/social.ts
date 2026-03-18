/**
 * src/lib/social.ts
 *
 * Typed API helpers for social features: follow system, activity feed,
 * reactions (likes), and comments on activity events.
 */

import { api } from "@/lib/api";

// ─── Follow types ──────────────────────────────────────────────────────────────

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export interface FollowUser {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  isFollowing?: boolean;
}

export interface PaginatedFollowResult {
  users: FollowUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Activity / feed types ─────────────────────────────────────────────────────

export type ActivityEventType =
  | "RATED_GAME"
  | "REVIEWED_GAME"
  | "ADDED_TO_LIST"
  | "COMPLETED_GAME"
  | "STARTED_GAME"
  | "FOLLOWED_USER"
  | "CREATED_LIST";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
  } | null;
  meta: Record<string, unknown> | null;
  // Hydrated by the backend
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}

export interface PaginatedActivityResult {
  events: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Interaction types ─────────────────────────────────────────────────────────

export interface EventComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Follow API ────────────────────────────────────────────────────────────────

export async function followUser(username: string): Promise<FollowStats> {
  const { data } = await api.post(`/users/${username}/follow`);
  return data.data;
}

export async function unfollowUser(username: string): Promise<FollowStats> {
  const { data } = await api.delete(`/users/${username}/follow`);
  return data.data;
}

export async function getFollowers(
  username: string,
  params: PaginationParams = {}
): Promise<PaginatedFollowResult> {
  const { data } = await api.get(`/users/${username}/followers`, { params });
  return data.data;
}

export async function getFollowing(
  username: string,
  params: PaginationParams = {}
): Promise<PaginatedFollowResult> {
  const { data } = await api.get(`/users/${username}/following`, { params });
  return data.data;
}

export async function getSuggestedUsers(limit = 5): Promise<FollowUser[]> {
  const { data } = await api.get(`/users/suggestions`, { params: { limit } });
  return data.data;
}

// ─── Feed API ──────────────────────────────────────────────────────────────────

export async function getFeed(
  params: PaginationParams = {}
): Promise<PaginatedActivityResult> {
  const { data } = await api.get(`/feed`, { params });
  return data.data;
}

export async function getGlobalFeed(
  params: PaginationParams = {}
): Promise<PaginatedActivityResult> {
  const { data } = await api.get(`/feed/global`, { params });
  return data.data;
}

export async function getUserActivity(
  username: string,
  params: PaginationParams = {}
): Promise<PaginatedActivityResult> {
  const { data } = await api.get(`/users/${username}/activity`, { params });
  return data.data;
}

// ─── Interaction API ───────────────────────────────────────────────────────────

export async function toggleReaction(
  eventId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const { data } = await api.post(`/feed/events/${eventId}/reactions`);
  return data.data;
}

export async function getComments(eventId: string): Promise<EventComment[]> {
  const { data } = await api.get(`/feed/events/${eventId}/comments`);
  return data.data;
}

export async function addComment(
  eventId: string,
  content: string
): Promise<{ comment: EventComment; commentCount: number }> {
  const { data } = await api.post(`/feed/events/${eventId}/comments`, { content });
  return data.data;
}

export async function deleteComment(
  eventId: string,
  commentId: string
): Promise<{ commentCount: number }> {
  const { data } = await api.delete(
    `/feed/events/${eventId}/comments/${commentId}`
  );
  return data.data;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a deep link for events that point to a specific piece of content.
 * Returns null for event types that have no dedicated destination page.
 */
export function getEventLink(event: ActivityEvent): string | null {
  const { type, game, meta } = event;

  switch (type) {
    case "REVIEWED_GAME":
      // Link to game page which shows reviews
      return game ? `/games/${game.slug}?tab=reviews` : null;

    case "RATED_GAME":
      return game ? `/games/${game.slug}` : null;

    case "COMPLETED_GAME":
    case "STARTED_GAME":
    case "ADDED_TO_LIST": {
      // If we have a listId in meta, link to that list
      const listId = meta?.listId as string | undefined;
      if (listId) return `/lists/${listId}`;
      return game ? `/games/${game.slug}` : null;
    }

    case "CREATED_LIST": {
      const listId = meta?.listId as string | undefined;
      return listId ? `/lists/${listId}` : null;
    }

    case "FOLLOWED_USER": {
      const username = meta?.username as string | undefined;
      return username ? `/users/${username}` : null;
    }

    default:
      return null;
  }
}

/** Human-readable sentence for an event */
export function getActivityDescription(event: ActivityEvent): string {
  const game = event.game?.title ?? "a game";
  switch (event.type) {
    case "RATED_GAME": {
      const score = event.meta?.score as number | undefined;
      return `rated ${game}${score ? ` ${score}/10` : ""}`;
    }
    case "REVIEWED_GAME":   return `reviewed ${game}`;
    case "COMPLETED_GAME":  return `completed ${game}`;
    case "STARTED_GAME":    return `started playing ${game}`;
    case "ADDED_TO_LIST":   return `added ${game} to a list`;
    case "CREATED_LIST": {
      const name = event.meta?.listName as string | undefined;
      return `created a list${name ? ` · "${name}"` : ""}`;
    }
    case "FOLLOWED_USER": {
      const username = event.meta?.username as string | undefined;
      return `followed ${username ?? "someone"}`;
    }
    default: return "did something";
  }
}

/** Relative timestamp */
export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60)  return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)      return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)     return `${weeks}w ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}