"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { List, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface GameListItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: { items: number };
}

export function ListsTab({ userId }: { userId: string }) {
  const [lists, setLists] = useState<GameListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const { data } = await api.get(`/lists/user/${userId}`, {
          params: { page: pageNum, limit: 20 },
        });
        const result = data.data;
        const newLists: GameListItem[] = Array.isArray(result)
          ? result
          : result.data ?? [];
        setLists((prev) => (pageNum === 1 ? newLists : [...prev, ...newLists]));
        const pagination = result.pagination as { page: number; totalPages: number } | undefined;
        setHasMore(pagination != null ? pagination.page < pagination.totalPages : false);
        setPage(pageNum);
      } catch {
        // leave existing lists in place on error
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        loadPage(page + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadPage]);

  if (!loading && lists.length === 0) {
    return (
      <div className="py-14 text-center">
        <List className="h-7 w-7 text-foreground/10 mx-auto mb-3" />
        <p className="text-[13px] text-foreground/35">No public lists</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lists.map((list) => (
        <Link
          key={list.id}
          href={`/lists/${list.id}`}
          className="flex items-center justify-between p-3.5 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group"
        >
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
              {list.name}
            </p>
            {list.description && (
              <p className="text-[11px] text-foreground/35 truncate mt-0.5">
                {list.description}
              </p>
            )}
          </div>
          <span className="text-[11px] text-foreground/30 shrink-0 ml-4">
            {list._count.items} game{list._count.items !== 1 ? "s" : ""}
          </span>
        </Link>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />}
      </div>
    </div>
  );
}
