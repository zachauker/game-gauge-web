"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react";
import { fetchUserRatings, ProfileRatingItem } from "@/lib/profile";

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function RatingsTab({ username }: { username: string }) {
  const [items, setItems] = useState<ProfileRatingItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const result = await fetchUserRatings(username, pageNum, 20);
        setItems((prev) => (pageNum === 1 ? result.items : [...prev, ...result.items]));
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch {
        // leave existing items in place on error
      } finally {
        setLoading(false);
      }
    },
    [username]
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

  if (!loading && items.length === 0) {
    return (
      <div className="py-14 text-center">
        <Star className="h-7 w-7 text-foreground/10 mx-auto mb-3" />
        <p className="text-[13px] text-foreground/35">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((rating) => (
        <Link
          key={rating.id}
          href={`/games/${rating.game.slug}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group"
        >
          <div className="w-9 h-12 rounded overflow-hidden bg-brand-purple/10 shrink-0 relative">
            {rating.game.coverImage && (
              <Image
                src={rating.game.coverImage}
                alt={rating.game.title}
                fill
                className="object-cover"
                sizes="36px"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
              {rating.game.title}
            </p>
            <p className="text-[11px] text-foreground/30 mt-0.5">
              {timeAgo(rating.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
            <span className="text-[13px] font-medium text-brand-amber tabular-nums">
              {rating.score}
            </span>
          </div>
        </Link>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />}
      </div>
    </div>
  );
}
