"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
import { Message, fetchMessages } from "@/lib/messages";

export function useMessages(conversationId: string | null) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const page = await fetchMessages(conversationId);
      const ordered = [...page].reverse(); // API returns newest-first
      setMessages(ordered);
      lastMessageIdRef.current = ordered[ordered.length - 1]?.id ?? null;
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    const older = await fetchMessages(conversationId, messages[0].id);
    setMessages((prev) => [...[...older].reverse(), ...prev]);
  }, [conversationId, messages]);

  const resync = useCallback(async () => {
    if (!conversationId || !lastMessageIdRef.current) return;
    const page = await fetchMessages(conversationId);
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = [...page].reverse().filter((m) => !known.has(m.id));
      if (fresh.length === 0) return prev;
      lastMessageIdRef.current = fresh[fresh.length - 1].id;
      return [...prev, ...fresh];
    });
  }, [conversationId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNew = (message: Message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      lastMessageIdRef.current = message.id;
    };
    const handleEdited = (message: Message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };
    const handleDeleted = ({ id }: { id: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, deletedAt: new Date().toISOString(), content: null } : m
        )
      );
    };
    const handleReconnect = () => void resync();

    socket.on("message:new", handleNew);
    socket.on("message:edited", handleEdited);
    socket.on("message:deleted", handleDeleted);
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("message:new", handleNew);
      socket.off("message:edited", handleEdited);
      socket.off("message:deleted", handleDeleted);
      socket.off("connect", handleReconnect);
    };
  }, [socket, conversationId, resync]);

  return { messages, loading, loadOlder };
}
