"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-4 py-3 shrink-0">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Message..."
        maxLength={4000}
        className="flex-1 bg-foreground/[0.04] border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-brand-purple/50 transition-colors"
      />
      <button
        type="submit"
        disabled={!content.trim() || sending}
        aria-label="Send message"
        className="p-2 rounded-full bg-brand-purple text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-purple/80 transition-colors"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
