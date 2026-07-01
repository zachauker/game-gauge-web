"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";
import {
  ConversationSummary,
  fetchRequests,
  acceptConversation,
  declineConversation,
} from "@/lib/messages";

export function useMessageRequests() {
  const { socket } = useSocket();
  const [requests, setRequests] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await fetchRequests());
    } catch (err) {
      console.error("Failed to load message requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!socket) return;
    socket.on("conversation:new", reload);
    return () => void socket.off("conversation:new", reload);
  }, [socket, reload]);

  const accept = useCallback(async (id: string) => {
    await acceptConversation(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const decline = useCallback(async (id: string) => {
    await declineConversation(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { requests, loading, accept, decline, reload };
}
