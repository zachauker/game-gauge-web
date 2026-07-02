"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react";
import { fetchUserReviews, ProfileReviewItem } from "@/lib/profile";
import { timeAgo } from "@/lib/social";
import { useInfiniteList } from "@/hooks/useInfiniteList";

export function ReviewsTab({ username }: { username: string }) {
  const fetchPage = useCallback(
    (pageNum: number) => fetchUserReviews(username, pageNum, 20),
    [username]
  );
  const { items, loading, sentinelRef } = useInfiniteList<ProfileReviewItem>(fetchPage);

  if (!loading && items.length === 0) {
    return (
      <div className="py-14 text-center">
        <BookOpen className="h-7 w-7 text-foreground/30 mx-auto mb-3" aria-hidden="true" />
        <p className="text-[13px] text-foreground/60">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((review) => (
        <Link
          key={review.id}
          href={`/games/${review.game.slug}`}
          className="block p-4 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors motion-reduce:transition-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors motion-reduce:transition-none">
                {review.game.title}
              </p>
            </div>
            <span className="text-[11px] text-foreground/60 shrink-0">
              {timeAgo(review.createdAt)}
            </span>
          </div>

          {review.spoilers ? (
            <p className="text-[12px] text-foreground/60 italic">
              Contains spoilers — click to read
            </p>
          ) : (
            <p className="text-[12px] text-foreground/50 leading-relaxed line-clamp-2">
              {review.content}
            </p>
          )}

          {review._count.helpfulVotes > 0 && (
            <p className="text-[11px] text-foreground/60 mt-2">
              {review._count.helpfulVotes} found this helpful
            </p>
          )}
        </Link>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/30" aria-hidden="true" />}
      </div>
    </div>
  );
}
