"use client";

import { useEffect, useRef, useCallback } from "react";
import { Notification } from "@/lib/notifications";
import { NotificationRow } from "./notification-row";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  unreadCount: number;
  onLoadNotifications: () => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  loading,
  hasMore: _hasMore,
  unreadCount,
  onLoadNotifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Load notifications when drawer opens
  useEffect(() => {
    if (isOpen) {
      void onLoadNotifications();
    }
  }, [isOpen, onLoadNotifications]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Stop click propagation on the drawer panel so backdrop click doesn't fire
  const handleDrawerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onMouseDown={onClose}
        className={`
          fixed inset-0 z-40
          bg-black/40 backdrop-blur-sm
          transition-opacity duration-200
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        onMouseDown={handleDrawerMouseDown}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        className={`
          fixed right-0 top-0 z-50
          h-full w-full max-w-sm
          bg-background border-l border-border
          flex flex-col
          shadow-xl
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => void onMarkAllRead()}
                className="text-xs text-brand-purple hover:text-brand-purple/80 transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1 rounded-md text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              {/* CSS spinner */}
              <div className="h-6 w-6 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
            </div>
          ) : !loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-foreground/20 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-sm text-foreground/50">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                />
              ))}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
