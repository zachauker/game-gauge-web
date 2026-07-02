"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MessageSquare,
  Trophy,
  Gamepad2,
  ListPlus,
  UserPlus,
  List,
  ExternalLink,
  Share2,
} from "lucide-react";
import { ActivityEvent, getEventLink, getActivityDescription, timeAgo } from "@/lib/social";
import { EventInteractions } from "@/components/social/event-interactions";
import { ShareToDialog } from "@/components/messages/share-to-dialog";

// ─── Event type display config ────────────────────────────────────────────────
// Icon colours mapped to brand tokens for visual consistency with the rest of
// the app. Amber = ratings, teal = content/completion, purple = primary actions.

const EVENT_META: Record<
  ActivityEvent["type"],
  { icon: React.ReactNode; colourClass: string; bgClass: string; label: string }
> = {
  RATED_GAME:     { icon: <Star className="h-3 w-3" aria-hidden="true" />,         colourClass: "text-brand-amber",      bgClass: "bg-brand-amber/10 border-brand-amber/20",    label: "Rating"    },
  REVIEWED_GAME:  { icon: <MessageSquare className="h-3 w-3" aria-hidden="true" />, colourClass: "text-brand-teal",       bgClass: "bg-brand-teal/10 border-brand-teal/20",      label: "Review"    },
  COMPLETED_GAME: { icon: <Trophy className="h-3 w-3" aria-hidden="true" />,        colourClass: "text-brand-teal",       bgClass: "bg-brand-teal/10 border-brand-teal/20",      label: "Completed" },
  STARTED_GAME:   { icon: <Gamepad2 className="h-3 w-3" aria-hidden="true" />,      colourClass: "text-brand-purple",     bgClass: "bg-brand-purple/10 border-brand-purple/20",  label: "Playing"   },
  ADDED_TO_LIST:  { icon: <ListPlus className="h-3 w-3" aria-hidden="true" />,      colourClass: "text-brand-amber/70",   bgClass: "bg-brand-amber/8 border-brand-amber/15",     label: "Added"     },
  CREATED_LIST:   { icon: <List className="h-3 w-3" aria-hidden="true" />,          colourClass: "text-brand-purple/70",  bgClass: "bg-brand-purple/8 border-brand-purple/15",   label: "New List"  },
  FOLLOWED_USER:  { icon: <UserPlus className="h-3 w-3" aria-hidden="true" />,      colourClass: "text-brand-pink",       bgClass: "bg-brand-pink/10 border-brand-pink/20",      label: "Follow"    },
};

interface ActivityEventCardProps {
  event: ActivityEvent;
  isOwnActivity?: boolean;
}

export function ActivityEventCard({
  event,
  isOwnActivity = false,
}: ActivityEventCardProps) {
  const typeMeta         = EVENT_META[event.type];
  const deepLink         = getEventLink(event);
  const excerpt          = event.meta?.excerpt as string | undefined;
  const score            = event.meta?.score as number | undefined;
  const listName         = event.meta?.listName as string | undefined;
  const followedUsername = event.meta?.username as string | undefined;
  const actorLabel       = isOwnActivity ? "You" : event.user.username;
  const description      = getActivityDescription(event);
  const [showShareDialog, setShowShareDialog] = useState(false);

  return (
    <article className="rounded-lg border border-brand-purple/15 bg-card p-3 hover:border-brand-purple/30 transition-colors motion-reduce:transition-none">
      <div className="flex gap-3">

        {/* ── Avatar ── */}
        <Link href={`/users/${event.user.username}`} className="shrink-0" tabIndex={-1}>
          <Avatar className="h-9 w-9">
            {event.user.avatar && (
              <AvatarImage src={event.user.avatar} alt={event.user.username} />
            )}
            <AvatarFallback className="bg-brand-purple/20 text-[11px] font-medium text-foreground/70">
              {event.user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* ── Main body ── */}
        <div className="flex-1 min-w-0 space-y-1">

          {/* Top row: description + type badge + timestamp */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] leading-snug">
              <Link
                href={`/users/${event.user.username}`}
                className="font-medium text-foreground hover:text-brand-purple transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {actorLabel}
              </Link>{" "}
              <span className="text-foreground/60">{description}</span>
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Event type badge */}
              <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${typeMeta.colourClass} ${typeMeta.bgClass}`}>
                {typeMeta.icon}
                {typeMeta.label}
              </span>
              <time
                dateTime={event.createdAt}
                className="text-[11px] text-foreground/50 whitespace-nowrap"
                title={new Date(event.createdAt).toLocaleString()}
              >
                {timeAgo(event.createdAt)}
              </time>
            </div>
          </div>

          {/* Review excerpt */}
          {excerpt && (
            <p className="text-[12px] text-foreground/60 line-clamp-2 leading-relaxed italic">
              &ldquo;{excerpt}&rdquo;
            </p>
          )}

          {/* List name for CREATED_LIST */}
          {listName && event.type === "CREATED_LIST" && (
            <p className="text-[12px] text-foreground/60">{listName}</p>
          )}

          {/* Followed user link */}
          {event.type === "FOLLOWED_USER" && followedUsername && (
            <Link
              href={`/users/${followedUsername}`}
              className="text-[12px] font-medium text-brand-purple hover:text-foreground transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              @{followedUsername}
            </Link>
          )}

          {/* Deep link CTA */}
          {deepLink && (
            <Link
              href={deepLink}
              className="inline-flex items-center gap-1 text-[11px] text-foreground/60 hover:text-brand-purple transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              {event.type === "REVIEWED_GAME"                                                                  && "Read review"}
              {event.type === "CREATED_LIST"                                                                   && "View list"}
              {(event.type === "ADDED_TO_LIST" || event.type === "STARTED_GAME" || event.type === "COMPLETED_GAME") && "View list"}
              {event.type === "RATED_GAME"                                                                     && "View game"}
              {event.type === "FOLLOWED_USER"                                                                  && `View @${followedUsername}`}
            </Link>
          )}

          {/* Likes + comments + share */}
          <div className="flex items-center gap-3">
            <EventInteractions
              eventId={event.id}
              initialLikeCount={event.likeCount ?? 0}
              initialCommentCount={event.commentCount ?? 0}
              initialHasLiked={event.hasLiked ?? false}
            />
            <button
              onClick={() => setShowShareDialog(true)}
              aria-label="Share this activity"
              className="text-foreground/50 hover:text-foreground/80 transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Game thumbnail ── */}
        {event.game && event.type !== "FOLLOWED_USER" && (
          <Link href={`/games/${event.game.slug}`} className="shrink-0 self-start" tabIndex={-1}>
            <div className="relative h-14 w-10 overflow-hidden rounded border border-brand-purple/10">
              {event.game.coverImage ? (
                <Image
                  src={event.game.coverImage}
                  alt={event.game.title}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-brand-purple/10 flex items-center justify-center">
                  <Gamepad2 className="h-4 w-4 text-foreground/30" aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>
        )}

        {/* ── Score pill for ratings ── */}
        {score !== undefined && (
          <div className="shrink-0 self-start flex items-center justify-center h-9 w-9 rounded-full bg-brand-amber/10 border border-brand-amber/20">
            <span className="text-[13px] font-semibold text-brand-amber">
              {score}
            </span>
          </div>
        )}

      </div>
      <ShareToDialog
        type="ACTIVITY_SHARE"
        entityId={event.id}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </article>
  );
}
