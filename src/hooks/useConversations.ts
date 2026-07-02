"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";
import { ConversationSummary, fetchConversations, fetchUnreadCount } from "@/lib/messages";

export function useConversations() {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchConversations();
      setConversations(page.conversations);
      setError(false);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadUnread = useCallback(async () => {
    try {
      setUnreadCount(await fetchUnreadCount());
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    void reload();
    void reloadUnread();
  }, [reload, reloadUnread]);

  // REST fallback: poll unread count every 60s in case the socket is down
  useEffect(() => {
    const intervalId = setInterval(() => void reloadUnread(), 60_000);
    return () => clearInterval(intervalId);
  }, [reloadUnread]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      void reload();
      void reloadUnread();
    };

    socket.on("message:new", handleUpdate);
    socket.on("conversation:new", handleUpdate);
    socket.on("conversation:updated", handleUpdate);
    socket.on("unread:update", reloadUnread);

    return () => {
      socket.off("message:new", handleUpdate);
      socket.off("conversation:new", handleUpdate);
      socket.off("conversation:updated", handleUpdate);
      socket.off("unread:update", reloadUnread);
    };
  }, [socket, reload, reloadUnread]);

  return { conversations, unreadCount, loading, error, reload };
}
