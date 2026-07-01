"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { sendMessage, editMessage, deleteMessage } from "@/lib/messages";
import { toast } from "sonner";

interface MessageThreadProps {
  conversationId: string;
  title: string;
}

export function MessageThread({ conversationId, title }: MessageThreadProps) {
  const { messages, loading } = useMessages(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (content: string) => {
    try {
      await sendMessage(conversationId, { type: "TEXT", content });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const handleEdit = async (messageId: string, content: string) => {
    try {
      await editMessage(conversationId, messageId, content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to edit message");
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(conversationId, messageId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete message");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer onSend={handleSend} />
    </div>
  );
}
