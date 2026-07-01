"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { ConversationListItem } from "./conversation-list-item";
import { RequestsTab } from "./requests-tab";
import { NewConversationDialog } from "./new-conversation-dialog";

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (conversationId: string) => void;
}

export function ConversationList({ activeConversationId, onSelect }: ConversationListProps) {
  const { conversations, loading, reload } = useConversations();
  const [tab, setTab] = useState<"inbox" | "requests">("inbox");
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("inbox")}
            className={`px-2.5 py-1 rounded-md text-sm transition-colors ${tab === "inbox" ? "bg-brand-purple/15 text-foreground" : "text-foreground/50 hover:text-foreground/80"}`}
          >
            Inbox
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-2.5 py-1 rounded-md text-sm transition-colors ${tab === "requests" ? "bg-brand-purple/15 text-foreground" : "text-foreground/50 hover:text-foreground/80"}`}
          >
            Requests
          </button>
        </div>
        <button
          onClick={() => setNewConversationOpen(true)}
          aria-label="New conversation"
          className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "inbox" ? (
          loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-12 px-4">
              No conversations yet — start one with the + button above.
            </p>
          ) : (
            conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeConversationId}
                onClick={() => onSelect(conversation.id)}
              />
            ))
          )
        ) : (
          <RequestsTab
            onAccepted={(id) => {
              void reload();
              onSelect(id);
            }}
          />
        )}
      </div>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        onCreated={(id) => {
          void reload();
          onSelect(id);
        }}
      />
    </div>
  );
}
