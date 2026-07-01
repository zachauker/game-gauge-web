"use client";

import Link from "next/link";
import { Gamepad2, ListIcon, Star, Activity } from "lucide-react";
import { Message } from "@/lib/messages";

const CARD_CLASS =
  "flex items-center gap-3 rounded-lg border border-border bg-foreground/[0.03] px-3 py-2.5 max-w-xs hover:bg-foreground/[0.06] transition-colors";

export function ShareAttachmentCard({ message }: { message: Message }) {
  if (message.type === "GAME_SHARE" && message.game) {
    return (
      <Link href={`/games/${message.game.slug}`} className={CARD_CLASS}>
        <Gamepad2 className="h-5 w-5 text-brand-purple shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{message.game.title}</p>
          <p className="text-xs text-foreground/50">Game</p>
        </div>
      </Link>
    );
  }

  if (message.type === "LIST_SHARE" && message.list) {
    return (
      <Link href={`/lists/${message.list.id}`} className={CARD_CLASS}>
        <ListIcon className="h-5 w-5 text-brand-amber shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{message.list.name}</p>
          <p className="text-xs text-foreground/50">{message.list._count.items} games</p>
        </div>
      </Link>
    );
  }

  if (message.type === "REVIEW_SHARE" && message.review) {
    return (
      <Link href={`/games/${message.review.game.slug}?tab=reviews`} className={CARD_CLASS}>
        <Star className="h-5 w-5 text-brand-pink shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{message.review.game.title}</p>
          <p className="text-xs text-foreground/50 truncate">{message.review.content}</p>
        </div>
      </Link>
    );
  }

  if (message.type === "ACTIVITY_SHARE" && message.activityEvent) {
    return (
      <Link
        href={message.activityEvent.game ? `/games/${message.activityEvent.game.slug}` : "/feed"}
        className={CARD_CLASS}
      >
        <Activity className="h-5 w-5 text-brand-purple shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {message.activityEvent.user.username}&apos;s activity
          </p>
          <p className="text-xs text-foreground/50 truncate">{message.activityEvent.game?.title ?? ""}</p>
        </div>
      </Link>
    );
  }

  return <p className="text-sm text-foreground/40 italic">Shared content unavailable</p>;
}
