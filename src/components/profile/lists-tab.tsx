"use client";

import { useCallback } from "react";
import Link from "next/link";
import { List, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useInfiniteList } from "@/hooks/useInfiniteList";

interface GameListItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: { items: number };
}

export function ListsTab({ userId }: { userId: string }) {
  const fetchPage = useCallback(
    async (pageNum: number) => {
      const { data } = await api.get(`/lists/user/${userId}`, {
        params: { page: pageNum, limit: 20 },
      });
      const result = data.data;
      const newLists: GameListItem[] = Array.isArray(result) ? result : result.data ?? [];
      const pagination = result.pagination as { page: number; totalPages: number } | undefined;
      const hasMore = pagination != null ? pagination.page < pagination.totalPages : false;
      return { items: newLists, hasMore };
    },
    [userId]
  );
  const { items: lists, loading, sentinelRef } = useInfiniteList<GameListItem>(fetchPage);

  if (!loading && lists.length === 0) {
    return (
      <div className="py-14 text-center">
        <List className="h-7 w-7 text-foreground/30 mx-auto mb-3" aria-hidden="true" />
        <p className="text-[13px] text-foreground/60">No public lists</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lists.map((list) => (
        <Link
          key={list.id}
          href={`/lists/${list.id}`}
          className="flex items-center justify-between p-3.5 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors motion-reduce:transition-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors motion-reduce:transition-none">
              {list.name}
            </p>
            {list.description && (
              <p className="text-[11px] text-foreground/60 truncate mt-0.5">
                {list.description}
              </p>
            )}
          </div>
          <span className="text-[11px] text-foreground/60 shrink-0 ml-4">
            {list._count.items} game{list._count.items !== 1 ? "s" : ""}
          </span>
        </Link>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/30" aria-hidden="true" />}
      </div>
    </div>
  );
}
