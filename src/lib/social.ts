/**
 * src/lib/social.ts
 *
 * Typed API helpers for social features: follow system + activity feed.
 */

import { api } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────

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
}

export interface PaginatedActivityResult {
  events: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Follow API ────────────────────────────────────────────────────────────

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

// ─── Feed API ──────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Human-readable label for each activity event type */
export function getActivityLabel(
  event: ActivityEvent,
  isOwnActivity = false
): string {
  const actor = isOwnActivity ? "You" : event.user.username;
  const game = event.game?.title ?? "a game";

  switch (event.type) {
    case "RATED_GAME": {
      const score = event.meta?.score as number | undefined;
      return `${actor} rated ${game}${score ? ` · ${score}/10` : ""}`;
    }
    case "REVIEWED_GAME":
      return `${actor} reviewed ${game}`;
    case "COMPLETED_GAME":
      return `${actor} completed ${game}`;
    case "STARTED_GAME":
      return `${actor} started playing ${game}`;
    case "ADDED_TO_LIST":
      return `${actor} added ${game} to a list`;
    case "CREATED_LIST": {
      const listName = event.meta?.listName as string | undefined;
      return `${actor} created a list${listName ? ` · "${listName}"` : ""}`;
    }
    case "FOLLOWED_USER": {
      const followed = event.meta?.username as string | undefined;
      return `${actor} followed ${followed ?? "someone"}`;
    }
    default:
      return `${actor} did something`;
  }
}

/** Relative timestamp — "2 hours ago", "3 days ago", etc. */
export function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
