"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react";
import { fetchUserRatings, ProfileRatingItem } from "@/lib/profile";
import { timeAgo } from "@/lib/social";
import { useInfiniteList } from "@/hooks/useInfiniteList";

export function RatingsTab({ username }: { username: string }) {
  const fetchPage = useCallback(
    (pageNum: number) => fetchUserRatings(username, pageNum, 20),
    [username]
  );
  const { items, loading, sentinelRef } = useInfiniteList<ProfileRatingItem>(fetchPage);

  if (!loading && items.length === 0) {
    return (
      <div className="py-14 text-center">
        <Star className="h-7 w-7 text-foreground/30 mx-auto mb-3" aria-hidden="true" />
        <p className="text-[13px] text-foreground/60">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((rating) => (
        <Link
          key={rating.id}
          href={`/games/${rating.game.slug}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors motion-reduce:transition-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors motion-reduce:transition-none">
              {rating.game.title}
            </p>
            <p className="text-[11px] text-foreground/60 mt-0.5">
              {timeAgo(rating.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3 w-3 fill-brand-amber text-brand-amber" aria-hidden="true" />
            <span className="text-[13px] font-medium text-brand-amber tabular-nums">
              {rating.score}
            </span>
          </div>
        </Link>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/30" aria-hidden="true" />}
      </div>
    </div>
  );
}
