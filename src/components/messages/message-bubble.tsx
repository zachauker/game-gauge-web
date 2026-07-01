"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Message } from "@/lib/messages";
import { ShareAttachmentCard } from "./share-attachment-card";
import { useAuthStore } from "@/store/auth";

interface MessageBubbleProps {
  message: Message;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export function MessageBubble({ message, onEdit, onDelete }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isOwn = user?.id === message.senderId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? "");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSaveEdit = async () => {
    if (!draft.trim()) return;
    await onEdit(message.id, draft.trim());
    setEditing(false);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
      <div className={`flex items-end gap-1.5 max-w-[75%] ${isOwn ? "flex-row-reverse" : ""}`}>
        <div>
          {message.type !== "TEXT" ? (
            <ShareAttachmentCard message={message} />
          ) : editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="text-sm rounded-lg border border-brand-purple/40 bg-background px-3 py-2 outline-none resize-none"
                rows={2}
              />
              <div className="flex gap-2 text-xs">
                <button onClick={() => void handleSaveEdit()} className="text-brand-purple font-medium">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-foreground/40">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`
                rounded-lg px-3 py-2 text-sm
                ${
                  message.deletedAt
                    ? "italic text-foreground/40 bg-foreground/[0.03]"
                    : isOwn
                      ? "bg-brand-purple text-foreground"
                      : "bg-foreground/[0.06] text-foreground"
                }
              `}
            >
              {message.deletedAt ? "Message deleted" : message.content}
              {message.editedAt && !message.deletedAt && (
                <span className="text-[10px] opacity-60 ml-1.5">(edited)</span>
              )}
            </div>
          )}
        </div>

        {isOwn && !message.deletedAt && message.type === "TEXT" && !editing && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Message options"
              className="p-1 rounded text-foreground/40 hover:text-foreground/70"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full mb-1 right-0 bg-background border border-border rounded-md shadow-lg py-1 text-xs whitespace-nowrap z-10">
                <button
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 hover:bg-foreground/5"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    void onDelete(message.id);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-brand-red hover:bg-brand-red/5"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
