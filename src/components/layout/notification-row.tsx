"use client";

import Link from "next/link";
import {
  Notification,
  getNotificationText,
  getNotificationLink,
} from "@/lib/notifications";

// ─── Relative Time Helper ──────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => Promise<void>;
}

export function NotificationRow({ notification, onMarkRead }: NotificationRowProps) {
  const { actor, read, createdAt } = notification;
  const href = getNotificationLink(notification);
  const text = getNotificationText(notification);

  const handleClick = () => {
    if (!read) {
      void onMarkRead(notification.id);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`
        flex items-start gap-3 px-4 py-3
        border-l-2 transition-colors
        hover:bg-brand-purple/5
        ${read ? "border-transparent" : "border-brand-purple"}
      `}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {actor.avatar ? (
          <img
            src={actor.avatar}
            alt={actor.username}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center text-[13px] font-medium text-foreground/90">
            {actor.username[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Text + timestamp */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${read ? "text-foreground/60" : "text-foreground"}`}>
          {text}
        </p>
        <p className="text-[11px] text-foreground/40 mt-0.5">
          {formatRelativeTime(createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!read && (
        <div className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-brand-purple" />
      )}
    </Link>
  );
}
