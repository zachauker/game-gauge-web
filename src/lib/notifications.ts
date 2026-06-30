/**
 * src/lib/notifications.ts
 *
 * Typed API helpers and display utilities for the notifications feature.
 */

import { api } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = 'FOLLOWED_YOU' | 'LIKED_EVENT' | 'COMMENTED_EVENT';

export interface NotificationActor {
  id: string;
  username: string;
  avatar: string | null;
}

export interface NotificationEvent {
  id: string;
  type: string;
  meta: Record<string, unknown>;
  game: {
    title: string;
    slug: string;
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: NotificationActor;
  event: NotificationEvent | null;
}

export interface NotificationPage {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ─── API Helpers ───────────────────────────────────────────────────────────────

export async function fetchNotifications(page = 1, limit = 20): Promise<NotificationPage> {
  const { data } = await api.get('/notifications', { params: { page, limit } });
  return data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

// ─── Display Helpers ───────────────────────────────────────────────────────────

export function getNotificationText(notification: Notification): string {
  const { actor, type } = notification;

  switch (type) {
    case 'FOLLOWED_YOU':
      return `${actor.username} started following you`;
    case 'LIKED_EVENT':
      return `${actor.username} liked your activity`;
    case 'COMMENTED_EVENT':
      return `${actor.username} commented on your activity`;
    default: {
      // Exhaustiveness guard — TypeScript will narrow `type` to `never` here
      const _exhaustive: never = type;
      return `${actor.username} did something`;
    }
  }
}

export function getNotificationLink(notification: Notification): string {
  const { actor, type, event } = notification;

  switch (type) {
    case 'FOLLOWED_YOU':
      return `/users/${actor.username}`;
    case 'LIKED_EVENT':
    case 'COMMENTED_EVENT':
      return event ? `/activity/${event.id}` : '/feed';
    default: {
      const _exhaustive: never = type;
      return '/feed';
    }
  }
}
