"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Loader2, Star } from "lucide-react";
import { getUserActivity, ActivityEvent, timeAgo } from "@/lib/social";
import { ActivityEventCard } from "@/components/social/activity-event-card";
import { useInfiniteList } from "@/hooks/useInfiniteList";

const EVENT_LABELS: Partial<Record<ActivityEvent["type"], string>> = {
  RATED_GAME: "Rated",
  ADDED_TO_LIST: "Added to list",
  COMPLETED_GAME: "Completed",
  STARTED_GAME: "Started playing",
  FOLLOWED_USER: "Followed",
  CREATED_LIST: "Created list",
};

function CompactRow({ event }: { event: ActivityEvent }) {
  const label = EVENT_LABELS[event.type] ?? event.type;
  const href = event.game ? `/games/${event.game.slug}` : null;
  const score = event.meta?.score as number | undefined;
  const targetUsername = event.meta?.username as string | undefined;

  const inner = (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors motion-reduce:transition-none group">
      <div className="w-9 h-12 rounded overflow-hidden bg-brand-purple/10 shrink-0 relative">
        {event.game?.coverImage && (
          <Image
            src={event.game.coverImage}
            alt={event.game.title ?? ""}
            fill
            className="object-cover"
            sizes="36px"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors motion-reduce:transition-none">
          {event.game?.title ?? targetUsername ?? "—"}
        </p>
        <p className="text-[11px] text-foreground/60 mt-0.5">
          {label} · {timeAgo(event.createdAt)}
        </p>
      </div>
      {event.type === "RATED_GAME" && score !== undefined && (
        <div className="flex items-center gap-1 shrink-0">
          <Star className="h-3 w-3 fill-brand-amber text-brand-amber" aria-hidden="true" />
          <span className="text-[13px] font-medium text-brand-amber tabular-nums">
            {score}
          </span>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ActivityTab({ username }: { username: string }) {
  const fetchPage = useCallback(
    async (pageNum: number) => {
      const result = await getUserActivity(username, { page: pageNum, limit: 20 });
      return { items: result.events, hasMore: result.hasMore };
    },
    [username]
  );
  const { items: events, loading, sentinelRef } = useInfiniteList<ActivityEvent>(fetchPage);

  if (!loading && events.length === 0) {
    return (
      <div className="py-14 text-center">
        <Activity className="h-7 w-7 text-foreground/30 mx-auto mb-3" aria-hidden="true" />
        <p className="text-[13px] text-foreground/60">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) =>
        event.type === "REVIEWED_GAME" ? (
          <ActivityEventCard key={event.id} event={event} />
        ) : (
          <CompactRow key={event.id} event={event} />
        )
      )}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/30" aria-hidden="true" />}
      </div>
    </div>
  );
}
