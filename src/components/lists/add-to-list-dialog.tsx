"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check, Plus, X, List } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface GameList {
  id: string;
  name: string;
  isPublic: boolean;
  _count?: { items: number };
}

interface AddToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  gameTitle: string;
}

export function AddToListDialog({
  open,
  onOpenChange,
  gameId,
  gameTitle,
}: AddToListDialogProps) {
  const [lists, setLists] = useState<GameList[]>([]);
  const [gameInLists, setGameInLists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchLists();
  }, [open]);

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/lists/me");
      const userLists: GameList[] = res.data.data || [];
      setLists(userLists);

      // Check membership in parallel
      const inSet = new Set<string>();
      await Promise.all(
        userLists.map(async (list) => {
          try {
            const r = await api.get(`/lists/${list.id}`);
            const items = r.data.data.items || [];
            if (items.some((item: any) => item.gameId === gameId)) {
              inSet.add(list.id);
            }
          } catch { /* ignore */ }
        })
      );
      setGameInLists(inSet);
    } catch {
      toast.error("Failed to load lists");
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = async (listId: string) => {
    const inList = gameInLists.has(listId);
    setIsSubmitting(listId);
    try {
      if (inList) {
        await api.delete(`/lists/${listId}/games/${gameId}`);
        setGameInLists((prev) => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
        toast.success("Removed from list");
      } else {
        await api.post(`/lists/${listId}/games`, { gameId });
        setGameInLists((prev) => new Set(prev).add(listId));
        toast.success("Added to list");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Something went wrong");
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-background border-brand-purple/25 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[15px] font-medium text-foreground">
                Add to list
              </DialogTitle>
              <p className="text-[12px] text-foreground/60 mt-0.5 line-clamp-1">
                {gameTitle}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="text-foreground/50 hover:text-foreground/80 transition-colors motion-reduce:transition-none mt-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </DialogHeader>

        {/* List */}
        <div className="px-5 py-4 max-h-72 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/30" aria-hidden="true" />
            </div>
          ) : lists.length === 0 ? (
            <div className="py-8 text-center">
              <List className="h-8 w-8 text-foreground/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-[12px] text-foreground/60">
                You don't have any lists yet.
              </p>
            </div>
          ) : (
            lists.map((list) => {
              const inList = gameInLists.has(list.id);
              const loading = isSubmitting === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => toggle(list.id)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors motion-reduce:transition-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    inList
                      ? "bg-brand-teal/10 border-brand-teal/25 hover:border-brand-teal/40"
                      : "bg-card border-brand-purple/15 hover:border-brand-purple/35"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground/80 truncate">
                      {list.name}
                    </p>
                    {list._count && (
                      <p className="text-[11px] text-foreground/60 mt-0.5">
                        {list._count.items} game{list._count.items !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 ml-3">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground/30" aria-hidden="true" />
                    ) : inList ? (
                      <Check className="h-4 w-4 text-brand-teal" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4 text-foreground/40" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-brand-purple/15 px-5 py-3">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-[13px] text-foreground/60 hover:text-foreground/80 transition-colors motion-reduce:transition-none text-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}