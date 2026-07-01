"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchConversation, ConversationDetail } from "@/lib/messages";
import { MessageThread } from "@/components/messages/message-thread";
import { useAuthStore } from "@/store/auth";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);

  useEffect(() => {
    void fetchConversation(params.conversationId).then(setConversation);
  }, [params.conversationId]);

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
