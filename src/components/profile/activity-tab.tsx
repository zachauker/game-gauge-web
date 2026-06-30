"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Loader2, Star } from "lucide-react";
import { getUserActivity, ActivityEvent, timeAgo } from "@/lib/social";
import { ActivityEventCard } from "@/components/social/activity-event-card";

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
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group">
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
        <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
          {event.game?.title ?? targetUsername ?? "—"}
        </p>
        <p className="text-[11px] text-foreground/30 mt-0.5">
          {label} · {timeAgo(event.createdAt)}
        </p>
      </div>
      {event.type === "RATED_GAME" && score !== undefined && (
        <div className="flex items-center gap-1 shrink-0">
          <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
          <span className="text-[13px] font-medium text-brand-amber tabular-nums">
            {score}
          </span>
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function ActivityTab({ username }: { username: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const result = await getUserActivity(username, { page: pageNum, limit: 20 });
        setEvents((prev) =>
          pageNum === 1 ? result.events : [...prev, ...result.events]
        );
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch {
        // leave existing events in place on error
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

  if (!loading && events.length === 0) {
    return (
      <div className="py-14 text-center">
        <Activity className="h-7 w-7 text-foreground/10 mx-auto mb-3" />
        <p className="text-[13px] text-foreground/35">No activity yet</p>
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
        {loading && <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />}
      </div>
    </div>
  );
}
