"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface GameList {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  _count?: {
    items: number;
  };
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
  const [notes, setNotes] = useState<{ [listId: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Fetch user's lists when dialog opens
  useEffect(() => {
    if (open) {
      fetchLists();
    }
  }, [open]);

  const fetchLists = async () => {
    try {
      setIsLoading(true);
      
      // Get user's lists
      const listsResponse = await api.get("/lists/me");
      const userLists = listsResponse.data.data || [];
      setLists(userLists);

      // Check which lists already contain this game
      const listIds = userLists.map((list: GameList) => list.id);
      const inListsSet = new Set<string>();

      for (const listId of listIds) {
        try {
          const listResponse = await api.get(`/lists/${listId}`);
          const items = listResponse.data.data.items || [];
          const hasGame = items.some((item: any) => item.gameId === gameId);
          if (hasGame) {
            inListsSet.add(listId);
          }
        } catch (error) {
          // Ignore errors for individual list checks
          console.error(`Failed to check list ${listId}:`, error);
        }
      }

      setGameInLists(inListsSet);
    } catch (error: any) {
      toast.error("Failed to load lists");
      console.error("Failed to fetch lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    try {
      setIsSubmitting(listId);

      const listNotes = notes[listId]?.trim() || undefined;

      await api.post(`/lists/${listId}/games`, {
        gameId,
        notes: listNotes,
      });

      // Update state
      setGameInLists(prev => new Set(prev).add(listId));
      toast.success(`Added "${gameTitle}" to list`);
      
      // Clear notes for this list
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[listId];
        return newNotes;
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Failed to add game to list";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleRemoveFromList = async (listId: string) => {
    try {
      setIsSubmitting(listId);

      await api.delete(`/lists/${listId}/games/${gameId}`);

      // Update state
      setGameInLists(prev => {
        const newSet = new Set(prev);
        newSet.delete(listId);
        return newSet;
      });
      
      toast.success(`Removed "${gameTitle}" from list`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Failed to remove game from list";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleClose = () => {
    setNotes({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription>
            Choose which lists to add "{gameTitle}" to
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-3 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You don't have any lists yet.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  handleClose();
                  // Navigate to lists page - you can implement this with router
                  window.location.href = "/lists";
                }}
              >
                Create Your First List
              </Button>
            </div>
          ) : (
            lists.map((list) => {
              const inList = gameInLists.has(list.id);
              const isProcessing = isSubmitting === list.id;

              return (
                <div
                  key={list.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{list.name}</h4>
                      {list.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {list.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {list._count?.items || 0} games • {list.isPublic ? "Public" : "Private"}
                      </p>
                    </div>

                    {inList ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(list.id)}
                        disabled={isProcessing}
                        className="flex-shrink-0"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            In List
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToList(list.id)}
                        disabled={isProcessing}
                        className="flex-shrink-0"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Notes input - only show if not already in list */}
                  {!inList && (
                    <div className="space-y-1">
                      <Label htmlFor={`notes-${list.id}`} className="text-xs">
                        Notes (optional)
                      </Label>
                      <textarea
                        id={`notes-${list.id}`}
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Add a personal note..."
                        value={notes[list.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [list.id]: e.target.value,
                          }))
                        }
                        maxLength={500}
                        disabled={isProcessing}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
