"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ActivityEvent,
  PaginatedActivityResult,
  getFeed,
  getGlobalFeed,
  getUserActivity,
} from "@/lib/social";
import { getErrorMessage } from "@/lib/api";

type FeedMode = "personal" | "global" | "user";

interface UseFeedOptions {
  mode: FeedMode;
  /** Required when mode === "user" */
  username?: string;
}

export function useFeed({ mode, username }: UseFeedOptions) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number): Promise<PaginatedActivityResult> => {
      if (mode === "personal") return getFeed({ page: pageNum, limit: 20 });
      if (mode === "global") return getGlobalFeed({ page: pageNum, limit: 20 });
      if (!username) throw new Error("username required for user mode");
      return getUserActivity(username, { page: pageNum, limit: 20 });
    },
    [mode, username]
  );

  // Initial load / re-load when mode or username changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setEvents([]);
    setPage(1);

    fetchPage(1)
      .then((result) => {
        if (cancelled) return;
        setEvents(result.events ?? []);
        setHasMore(result.hasMore ?? false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await fetchPage(nextPage);
      setEvents((prev) => [...prev, ...(result.events ?? [])]);
      setHasMore(result.hasMore ?? false);
      setPage(nextPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoadingMore, page]);

  return { events, hasMore, isLoading, isLoadingMore, error, loadMore };
}