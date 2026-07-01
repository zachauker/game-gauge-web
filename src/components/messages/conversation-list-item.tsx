"use client";

import { ConversationSummary } from "@/lib/messages";

function conversationTitle(conversation: ConversationSummary): string {
  if (conversation.isGroup) return conversation.name || "Unnamed group";
  return conversation.otherParticipants[0]?.username ?? "Unknown user";
}

function messagePreview(conversation: ConversationSummary): string {
  const message = conversation.lastMessage;
  if (!message) return "No messages yet";
  if (message.deletedAt) return "Message deleted";
  switch (message.type) {
    case "TEXT":
      return message.content ?? "";
    case "GAME_SHARE":
      return `Shared a game${message.game ? `: ${message.game.title}` : ""}`;
    case "LIST_SHARE":
      return `Shared a list${message.list ? `: ${message.list.name}` : ""}`;
    case "REVIEW_SHARE":
      return "Shared a review";
    case "ACTIVITY_SHARE":
      return "Shared an activity";
    default:
      return "";
  }
}

interface ConversationListItemProps {
  conversation: ConversationSummary;
  active: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, active, onClick }: ConversationListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b border-border transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset
        ${active ? "bg-brand-purple/10" : "hover:bg-foreground/5"}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-sm truncate ${conversation.unread ? "font-semibold text-foreground" : "text-foreground/80"}`}
        >
          {conversationTitle(conversation)}
        </span>
        {conversation.unread && (
          <span className="h-2 w-2 rounded-full bg-brand-amber shrink-0" aria-hidden="true" />
        )}
      </div>
      <p className="text-xs text-foreground/50 truncate mt-0.5">{messagePreview(conversation)}</p>
    </button>
  );
}
