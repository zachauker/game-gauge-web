"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";

export function MessagesNavIcon() {
  const { unreadCount } = useConversations();
  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount.toString();

  return (
    <Link
      href="/messages"
      aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      className="relative p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
    >
      <Send className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none pointer-events-none"
        >
          {badgeLabel}
        </span>
      )}
    </Link>
  );
}
