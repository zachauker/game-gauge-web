"use client";

import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { ConversationList } from "@/components/messages/conversation-list";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ conversationId?: string }>();
  const activeConversationId = params?.conversationId ?? null;

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div
          className={`w-full sm:max-w-xs shrink-0 sm:block ${activeConversationId ? "hidden" : "block"}`}
        >
          <ConversationList
            activeConversationId={activeConversationId}
            onSelect={(id) => router.push(`/messages/${id}`)}
          />
        </div>
        <div className={`flex-1 min-w-0 ${activeConversationId ? "block" : "hidden sm:block"}`}>
          {children}
        </div>
      </div>
    </MainLayout>
  );
}
