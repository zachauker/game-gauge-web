"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { searchUsers, createConversation, sendMessage, MessageType, UserSearchResult } from "@/lib/messages";
import { toast } from "sonner";

interface ShareToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MessageType;
  entityId: string;
}

export function ShareToDialog({ open, onOpenChange, type, entityId }: ShareToDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const handleSearch = async (value: string) => {
    setQuery(value);
    setResults(value.trim() ? await searchUsers(value) : []);
  };

  const handleSend = async (user: UserSearchResult) => {
    setSendingTo(user.id);
    try {
      const conversation = await createConversation([user.username], false);
      await sendMessage(conversation.id, { type, entityId });
      toast.success(`Shared with ${user.username}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send to...</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search by username..."
          value={query}
          onChange={(e) => void handleSearch(e.target.value)}
        />

        <div className="max-h-56 overflow-y-auto space-y-1 py-2">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => void handleSend(user)}
              disabled={sendingTo !== null}
              className="flex items-center justify-between w-full text-left px-2 py-2 rounded-md text-sm hover:bg-foreground/5 disabled:opacity-50"
            >
              {user.username}
              {sendingTo === user.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
