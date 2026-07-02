"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface PageResult<T> {
  items: T[];
  hasMore: boolean;
}

/**
 * Infinite-scroll list loader driven by an IntersectionObserver sentinel.
 * `fetchPage` must be a stable (useCallback'd) function -- it doubles as the
 * effect dependency that resets and reloads the list when its identity changes
 * (e.g. when the underlying username/userId changes).
 */
export function useInfiniteList<T>(fetchPage: (page: number) => Promise<PageResult<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const result = await fetchPage(pageNum);
        setItems((prev) => (pageNum === 1 ? result.items : [...prev, ...result.items]));
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch {
        toast.error("Couldn't load more right now");
      } finally {
        setLoading(false);
      }
    },
    [fetchPage]
  );

  // Reset and reload from page 1 whenever fetchPage changes identity.
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    void loadPage(1);
    // loadPage is derived from fetchPage, so depending on fetchPage alone is sufficient
    // and avoids re-running this reset whenever loadPage's own identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        void loadPage(page + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadPage]);

  return { items, loading, hasMore, sentinelRef };
}
