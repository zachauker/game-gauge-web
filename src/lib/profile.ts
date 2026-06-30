import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileGame {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

export interface ProfileRatingItem {
  id: string;
  score: number;
  createdAt: string;
  game: ProfileGame;
}

export interface ProfileReviewItem {
  id: string;
  content: string;
  spoilers: boolean;
  createdAt: string;
  game: ProfileGame;
  _count: { helpfulVotes: number };
}

export interface ProfileRatingPage {
  items: ProfileRatingItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface ProfileReviewPage {
  items: ProfileReviewItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function fetchUserRatings(
  username: string,
  page = 1,
  limit = 20
): Promise<ProfileRatingPage> {
  const { data } = await api.get(`/users/${username}/ratings`, {
    params: { page, limit },
  });
  return data.data;
}

export async function fetchUserReviews(
  username: string,
  page = 1,
  limit = 20
): Promise<ProfileReviewPage> {
  const { data } = await api.get(`/users/${username}/reviews`, {
    params: { page, limit },
  });
  return data.data;
}
