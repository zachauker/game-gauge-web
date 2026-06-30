"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDrawer } from "./notification-drawer";

export function NotificationBell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    unreadCount,
    notifications,
    loading,
    hasMore,
    loadNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount.toString();

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <Bell className="h-5 w-5" />
        </button>

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none pointer-events-none"
          >
            {badgeLabel}
          </span>
        )}
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
        loading={loading}
        hasMore={hasMore}
        unreadCount={unreadCount}
        onLoadNotifications={loadNotifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </>
  );
}
