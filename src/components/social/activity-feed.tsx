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
            className="h-20 rounded-lg border border-brand-purple/10 bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-brand-red/20 bg-brand-red/5 p-6 text-center">
        <p className="text-[13px] text-brand-red">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-purple/15 bg-card py-16 text-center">
        <Rss className="h-8 w-8 text-foreground/20" />
        <p className="text-[13px] text-foreground/40">{emptyMessage}</p>
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

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoadingMore}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-brand-purple/20 hover:border-brand-purple/40 text-[13px] text-foreground/50 hover:text-foreground/80 transition-colors disabled:opacity-50"
        >
          {isLoadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Load more
        </button>
      )}
    </div>
  );
}
