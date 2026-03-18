"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MessageSquare,
  Trophy,
  Gamepad2,
  ListPlus,
  UserPlus,
  List,
  ExternalLink,
} from "lucide-react";
import { ActivityEvent, getEventLink, getActivityDescription, timeAgo } from "@/lib/social";
import {EventInteractions} from "@/components/social/event-interactions";
import { cn } from "@/lib/utils";

// ─── Icon + colour map ─────────────────────────────────────────────────────────

const EVENT_META: Record<
  ActivityEvent["type"],
  { icon: React.ReactNode; colourClass: string; label: string }
> = {
  RATED_GAME:     { icon: <Star className="h-3.5 w-3.5" />,         colourClass: "text-yellow-500", label: "Rating" },
  REVIEWED_GAME:  { icon: <MessageSquare className="h-3.5 w-3.5" />, colourClass: "text-blue-500",   label: "Review" },
  COMPLETED_GAME: { icon: <Trophy className="h-3.5 w-3.5" />,        colourClass: "text-green-500",  label: "Completed" },
  STARTED_GAME:   { icon: <Gamepad2 className="h-3.5 w-3.5" />,      colourClass: "text-purple-500", label: "Playing" },
  ADDED_TO_LIST:  { icon: <ListPlus className="h-3.5 w-3.5" />,      colourClass: "text-orange-500", label: "Added" },
  CREATED_LIST:   { icon: <List className="h-3.5 w-3.5" />,          colourClass: "text-indigo-500", label: "New List" },
  FOLLOWED_USER:  { icon: <UserPlus className="h-3.5 w-3.5" />,      colourClass: "text-pink-500",   label: "Follow" },
};

interface ActivityEventCardProps {
  event: ActivityEvent;
  isOwnActivity?: boolean;
}

export function ActivityEventCard({
  event,
  isOwnActivity = false,
}: ActivityEventCardProps) {
  const typeMeta   = EVENT_META[event.type];
  const deepLink   = getEventLink(event);
  const excerpt    = event.meta?.excerpt as string | undefined;
  const score      = event.meta?.score as number | undefined;
  const listName   = event.meta?.listName as string | undefined;
  const followedUsername = event.meta?.username as string | undefined;
  const actorLabel = isOwnActivity ? "You" : event.user.username;
  const description = getActivityDescription(event);

  return (
    <article className="rounded-lg border bg-card p-3 hover:bg-accent/20 transition-colors">
      <div className="flex gap-3">
        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <Link href={`/users/${event.user.username}`} className="shrink-0" tabIndex={-1}>
          <Avatar className="h-9 w-9">
            {event.user.avatar && (
              <AvatarImage src={event.user.avatar} alt={event.user.username} />
            )}
            <AvatarFallback className="text-xs">
              {event.user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* ── Main body ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-1">

          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-snug">
              <Link
                href={`/users/${event.user.username}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {actorLabel}
              </Link>{" "}
              <span className="text-muted-foreground">{description}</span>
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="secondary"
                className={cn("gap-1 text-[11px] px-1.5 py-0", typeMeta.colourClass)}
              >
                {typeMeta.icon}
                {typeMeta.label}
              </Badge>
              <time
                dateTime={event.createdAt}
                className="text-xs text-muted-foreground whitespace-nowrap"
                title={new Date(event.createdAt).toLocaleString()}
              >
                {timeAgo(event.createdAt)}
              </time>
            </div>
          </div>

          {/* Review excerpt */}
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
              &ldquo;{excerpt}&rdquo;
            </p>
          )}

          {/* List name for CREATED_LIST */}
          {listName && event.type === "CREATED_LIST" && (
            <p className="text-xs text-muted-foreground">{listName}</p>
          )}

          {/* Followed user link */}
          {event.type === "FOLLOWED_USER" && followedUsername && (
            <Link
              href={`/users/${followedUsername}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              @{followedUsername}
            </Link>
          )}

          {/* Deep link CTA */}
          {deepLink && (
            <Link
              href={deepLink}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {event.type === "REVIEWED_GAME"  && "Read review"}
              {event.type === "CREATED_LIST"   && "View list"}
              {(event.type === "ADDED_TO_LIST" || event.type === "STARTED_GAME" || event.type === "COMPLETED_GAME") && "View list"}
              {event.type === "RATED_GAME"     && "View game"}
              {event.type === "FOLLOWED_USER"  && `View @${followedUsername}`}
            </Link>
          )}

          {/* Interactions bar */}
          <EventInteractions
            eventId={event.id}
            initialLikeCount={event.likeCount ?? 0}
            initialCommentCount={event.commentCount ?? 0}
            initialHasLiked={event.hasLiked ?? false}
          />
        </div>

        {/* ── Game thumbnail (right) ───────────────────────────────────────── */}
        {event.game && event.type !== "FOLLOWED_USER" && (
          <Link href={`/games/${event.game.slug}`} className="shrink-0 self-start" tabIndex={-1}>
            <div className="relative h-14 w-10 overflow-hidden rounded">
              {event.game.coverImage ? (
                <Image
                  src={event.game.coverImage}
                  alt={event.game.title}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>
        )}

        {/* ── Score pill for ratings ───────────────────────────────────────── */}
        {score !== undefined && (
          <div className="shrink-0 self-start flex items-center justify-center h-9 w-9 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              {score}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}