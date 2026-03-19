"use client";

import {ActivityEventCard} from "@/components/social/activity-event-card";
import { useFeed } from "@/hooks/useFeed";
import { Button } from "@/components/ui/button";
import { Loader2, Rss } from "lucide-react";

type FeedMode = "personal" | "global" | "user";

interface ActivityFeedProps {
  mode: FeedMode;
  username?: string;
  isOwnActivity?: boolean;
  emptyMessage?: string;
}

export function ActivityFeed({
  mode,
  username,
  isOwnActivity = false,
  emptyMessage = "No activity yet.",
}: ActivityFeedProps) {
  const { events = [], hasMore, isLoading, isLoadingMore, error, loadMore } =
    useFeed({ mode, username });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg border bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <Rss className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={loadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Load more
        </Button>
      )}
    </div>
  );
}