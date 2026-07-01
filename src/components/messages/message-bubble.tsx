"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Message } from "@/lib/messages";
import { ShareAttachmentCard } from "./share-attachment-card";
import { useAuthStore } from "@/store/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
                autoFocus
                className="text-sm rounded-lg border border-brand-purple/40 bg-background px-3 py-2 outline-none resize-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={2}
              />
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => void handleSaveEdit()}
                  className="text-brand-purple font-medium rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-foreground/60 hover:text-foreground/80 transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
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
                    ? "italic text-foreground/50 bg-foreground/[0.03]"
                    : isOwn
                      ? "bg-brand-purple text-foreground"
                      : "bg-foreground/[0.06] text-foreground"
                }
              `}
            >
              {message.deletedAt ? "Message deleted" : message.content}
              {message.editedAt && !message.deletedAt && (
                <span className="text-[10px] opacity-80 ml-1.5">(edited)</span>
              )}
            </div>
          )}
        </div>

        {isOwn && !message.deletedAt && message.type === "TEXT" && !editing && (
          <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Message options"
                  className="p-1 rounded text-foreground/50 hover:text-foreground/80 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-brand-purple/20 text-[13px] min-w-[140px]">
                <DropdownMenuItem
                  onClick={() => setEditing(true)}
                  className="cursor-pointer text-foreground/70 focus:text-foreground"
                >
                  Edit
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => setConfirmingDelete(true)}
                    className="cursor-pointer text-brand-red focus:text-brand-red focus:bg-brand-red/10"
                  >
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can&apos;t be undone. The message will be replaced with &quot;Message
                  deleted&quot; for everyone in the conversation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void onDelete(message.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
