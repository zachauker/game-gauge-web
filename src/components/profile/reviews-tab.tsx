"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react";
import { fetchUserReviews, ProfileReviewItem } from "@/lib/profile";

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

export function ReviewsTab({ username }: { username: string }) {
  const [items, setItems] = useState<ProfileReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const result = await fetchUserReviews(username, pageNum, 20);
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
        <BookOpen className="h-7 w-7 text-foreground/10 mx-auto mb-3" />
        <p className="text-[13px] text-foreground/35">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((review) => (
        <Link
          key={review.id}
          href={`/games/${review.game.slug}`}
          className="block p-4 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-9 rounded overflow-hidden bg-brand-purple/10 shrink-0 relative">
                {review.game.coverImage && (
                  <Image
                    src={review.game.coverImage}
                    alt={review.game.title}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                )}
              </div>
              <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
                {review.game.title}
              </p>
            </div>
            <span className="text-[11px] text-foreground/25 shrink-0">
              {timeAgo(review.createdAt)}
            </span>
          </div>

          {review.spoilers ? (
            <p className="text-[12px] text-foreground/30 italic">
              Contains spoilers — click to read
            </p>
          ) : (
            <p className="text-[12px] text-foreground/50 leading-relaxed line-clamp-2">
              {review.content}
            </p>
          )}

          {review._count.helpfulVotes > 0 && (
            <p className="text-[11px] text-foreground/25 mt-2">
              {review._count.helpfulVotes} found this helpful
            </p>
          )}
        </Link>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />}
      </div>
    </div>
  );
}
