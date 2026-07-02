"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { searchUsers, createConversation, UserSearchResult } from "@/lib/messages";
import { toast } from "sonner";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}

export function NewConversationDialog({ open, onOpenChange, onCreated }: NewConversationDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(value);
        setResults(users.filter((u) => !selected.some((s) => s.id === u.id)));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't search users");
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const addUser = (user: UserSearchResult) => {
    setSelected((prev) => [...prev, user]);
    setResults((prev) => prev.filter((u) => u.id !== user.id));
    setQuery("");
  };

  const removeUser = (userId: string) => {
    setSelected((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setCreating(true);
    try {
      const isGroup = selected.length > 1;
      const conversation = await createConversation(
        selected.map((u) => u.username),
        isGroup,
        isGroup ? groupName.trim() || undefined : undefined
      );
      onOpenChange(false);
      setSelected([]);
      setGroupName("");
      onCreated(conversation.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 bg-brand-purple/15 text-xs rounded-full px-2.5 py-1"
                >
                  {user.username}
                  <button
                    onClick={() => removeUser(user.id)}
                    aria-label={`Remove ${user.username}`}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {selected.length > 1 && (
            <Input
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}

          <Input
            placeholder="Search by username..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <div className="max-h-48 overflow-y-auto space-y-1">
            {searching ? (
              <p className="text-xs text-foreground/60 px-1">Searching...</p>
            ) : results.length === 0 && query.trim() ? (
              <p className="text-xs text-foreground/60 px-1">No users found</p>
            ) : (
              results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => addUser(user)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-foreground/5 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {user.username}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void handleCreate()} disabled={selected.length === 0 || creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
