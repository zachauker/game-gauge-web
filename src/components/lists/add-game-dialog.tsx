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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import Image from "next/image";

interface AddGameToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (gameId: string, notes?: string) => Promise<void>;
}

interface Game {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  releaseDate: string | null;
  platforms: string[];
}

export function AddGameToListDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddGameToListDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Search games when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchGames();
    } else {
      setGames([]);
    }
  }, [searchQuery]);

  const searchGames = async () => {
    setIsSearching(true);
    setError("");

    try {
      const response = await api.get("/games", {
        params: { search: searchQuery, limit: 10 },
      });
      setGames(response.data.data.games || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGame) {
      setError("Please select a game");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(selectedGame.id, notes.trim() || undefined);

      // Reset form
      setSearchQuery("");
      setGames([]);
      setSelectedGame(null);
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add game");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setGames([]);
    setSelectedGame(null);
    setNotes("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Game to List</DialogTitle>
          <DialogDescription>
            Search for a game and add it to your list
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="space-y-4 flex-1 overflow-auto">
            {/* Search Input */}
            {!selectedGame && (
              <div className="space-y-2">
                <Label htmlFor="search">Search Games</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by game title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            )}

            {/* Search Results */}
            {!selectedGame && games.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                {games.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGame(game)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <div className="w-12 h-16 relative rounded overflow-hidden bg-muted flex-shrink-0">
                      {game.coverImage ? (
                        <Image
                          src={game.coverImage}
                          alt={game.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{game.title}</p>
                      {game.platforms && game.platforms.length > 0 && (
                        <p className="text-sm text-muted-foreground truncate">
                          {game.platforms.join(", ")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!selectedGame && searchQuery.length >= 2 && !isSearching && games.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No games found. Try a different search term.
              </p>
            )}

            {/* Selected Game */}
            {selectedGame && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/50">
                  <div className="w-16 h-20 relative rounded overflow-hidden bg-muted flex-shrink-0">
                    {selectedGame.coverImage ? (
                      <Image
                        src={selectedGame.coverImage}
                        alt={selectedGame.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedGame.title}</p>
                    {selectedGame.platforms && selectedGame.platforms.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedGame.platforms.join(", ")}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGame(null)}
                    disabled={isSubmitting}
                  >
                    Change
                  </Button>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Add personal notes about this game..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {notes.length}/500 characters
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedGame}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to List"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
