"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Notification,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications";

interface UseNotificationsReturn {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  loadNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Poll unread count on mount and every 60 seconds
  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      fetchUnreadCount()
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
        })
        .catch(() => {
          // Silently ignore polling errors
        });
    };

    poll();
    const intervalId = setInterval(poll, 60_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchNotifications(1, 20);
      setNotifications(page.notifications);
      setHasMore(page.pagination.hasMore);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(notificationId);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  return {
    unreadCount,
    notifications,
    loading,
    hasMore,
    loadNotifications,
    markRead,
    markAllRead,
  };
}
