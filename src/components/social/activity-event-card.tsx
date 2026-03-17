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
} from "lucide-react";
import { ActivityEvent, getActivityLabel, timeAgo } from "@/lib/social";
import { cn } from "@/lib/utils";

// ─── Icon + colour per event type ─────────────────────────────────────────

const EVENT_META: Record<
  ActivityEvent["type"],
  { icon: React.ReactNode; colour: string; label: string }
> = {
  RATED_GAME:     { icon: <Star className="h-3.5 w-3.5" />,      colour: "text-yellow-500", label: "Rating" },
  REVIEWED_GAME:  { icon: <MessageSquare className="h-3.5 w-3.5" />, colour: "text-blue-500",   label: "Review" },
  COMPLETED_GAME: { icon: <Trophy className="h-3.5 w-3.5" />,     colour: "text-green-500",  label: "Completed" },
  STARTED_GAME:   { icon: <Gamepad2 className="h-3.5 w-3.5" />,   colour: "text-purple-500", label: "Playing" },
  ADDED_TO_LIST:  { icon: <ListPlus className="h-3.5 w-3.5" />,   colour: "text-orange-500", label: "Added" },
  CREATED_LIST:   { icon: <List className="h-3.5 w-3.5" />,       colour: "text-indigo-500", label: "New List" },
  FOLLOWED_USER:  { icon: <UserPlus className="h-3.5 w-3.5" />,   colour: "text-pink-500",   label: "Follow" },
};

interface ActivityEventCardProps {
  event: ActivityEvent;
  /** When true, renders the card as "your own" activity (you → you) */
  isOwnActivity?: boolean;
}

export function ActivityEventCard({
  event,
  isOwnActivity = false,
}: ActivityEventCardProps) {
  const meta = EVENT_META[event.type];
  const excerpt = event.meta?.excerpt as string | undefined;
  const score = event.meta?.score as number | undefined;
  const followedUsername = event.meta?.username as string | undefined;

  return (
    <article className="flex gap-3 rounded-lg border bg-card p-3 hover:bg-accent/30 transition-colors">
      {/* Avatar */}
      <Link
        href={`/users/${event.user.username}`}
        className="shrink-0"
        tabIndex={-1}
        aria-hidden
      >
        <Avatar className="h-9 w-9">
          {event.user.avatar && (
            <AvatarImage src={event.user.avatar} alt={event.user.username} />
          )}
          <AvatarFallback className="text-xs">
            {event.user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {/* Top row: event label + badge + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm leading-snug">
            <Link
              href={`/users/${event.user.username}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {isOwnActivity ? "You" : event.user.username}
            </Link>
            {" "}
            <span className="text-muted-foreground">
              {getActivityLabel(event, isOwnActivity).replace(
                isOwnActivity ? "You" : event.user.username,
                ""
              )}
            </span>
          </p>

          <Badge
            variant="secondary"
            className={cn("shrink-0 gap-1 text-[11px] px-1.5 py-0", meta.colour)}
          >
            {meta.icon}
            {meta.label}
          </Badge>

          <time
            dateTime={event.createdAt}
            className="ml-auto shrink-0 text-xs text-muted-foreground"
          >
            {timeAgo(event.createdAt)}
          </time>
        </div>

        {/* Review excerpt */}
        {excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            &ldquo;{excerpt}&rdquo;
          </p>
        )}

        {/* Follow event — link to followed user */}
        {event.type === "FOLLOWED_USER" && followedUsername && (
          <Link
            href={`/users/${followedUsername}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            @{followedUsername}
          </Link>
        )}
      </div>

      {/* Game thumbnail (right side) */}
      {event.game && event.type !== "FOLLOWED_USER" && (
        <Link href={`/games/${event.game.slug}`} className="shrink-0" tabIndex={-1}>
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

      {/* Score pill for ratings */}
      {score !== undefined && (
        <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            {score}
          </span>
        </div>
      )}
    </article>
  );
}
