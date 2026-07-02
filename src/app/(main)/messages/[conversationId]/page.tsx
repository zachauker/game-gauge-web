"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchConversation, ConversationDetail } from "@/lib/messages";
import { MessageThread } from "@/components/messages/message-thread";
import { useAuthStore } from "@/store/auth";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setConversation(null);
    setError(false);
    fetchConversation(params.conversationId)
      .then(setConversation)
      .catch(() => setError(true));
  }, [params.conversationId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <p className="text-sm text-foreground/60">Couldn&apos;t load this conversation.</p>
        <Link
          href="/messages"
          className="text-sm text-brand-purple hover:text-foreground/80 transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to conversations
        </Link>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
      </div>
    );
  }

  const title = conversation.isGroup
    ? conversation.name || "Unnamed group"
    : (conversation.participants.find((p) => p.userId !== user?.id)?.user.username ?? "Conversation");

  return <MessageThread conversationId={conversation.id} title={title} />;
}
