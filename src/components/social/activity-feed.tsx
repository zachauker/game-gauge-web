"use client";

import { ActivityEventCard } from "@/components/social/activity-event-card";
import { useFeed } from "@/hooks/useFeed";
import { Loader2, Rss } from "lucide-react";

type FeedMode = "personal" | "global" | "user";

interface ActivityFeedProps {
  mode: FeedMode;
  username?: string;
  isOwnActivity?: boolean;
  emptyMessage?: string;
  /** Optional CTA rendered below the empty-state message */
  emptyAction?: React.ReactNode;
}

export function ActivityFeed({
  mode,
  username,
  isOwnActivity = false,
  emptyMessage = "No activity yet.",
  emptyAction,
}: ActivityFeedProps) {
  const { events = [], hasMore, isLoading, isLoadingMore, error, loadMore } =
    useFeed({ mode, username });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg border border-brand-purple/10 bg-card animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  // Only replace the whole view with an error when there's nothing to show
  // yet. A failed "load more" after events are already on screen must not
  // wipe out what's already loaded.
  if (error && events.length === 0) {
    return (
      <div className="rounded-lg border border-brand-red/20 bg-brand-red/5 p-6 text-center">
        <p className="text-[13px] text-brand-red mb-3">{error}</p>
        <button
          onClick={loadMore}
          className="text-[12px] text-brand-red underline hover:no-underline transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-purple/15 bg-card py-16 text-center">
        <Rss className="h-8 w-8 text-foreground/30" aria-hidden="true" />
        <p className="text-[13px] text-foreground/60">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => (
        <ActivityEventCard
          key={event.id}
          event={event}
          isOwnActivity={isOwnActivity}
        />
      ))}

      {error && (
        <p className="text-[12px] text-brand-red text-center">{error}</p>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoadingMore}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-brand-purple/20 hover:border-brand-purple/40 text-[13px] text-foreground/60 hover:text-foreground/80 transition-colors motion-reduce:transition-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isLoadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {error ? "Try again" : "Load more"}
        </button>
      )}
    </div>
  );
}
