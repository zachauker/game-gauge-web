"use client";

/**
 * src/components/lists/progress-edit-dialog.tsx
 *
 * Small dialog triggered by clicking the progress bar.
 * Lets the owner update progressPct (0–100) and an optional note.
 */

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
import { Loader2 } from "lucide-react";

interface ProgressEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameTitle: string;
  currentPct: number | null | undefined;
  currentNote: string | null | undefined;
  onSubmit: (pct: number, note: string) => Promise<void>;
}

export function ProgressEditDialog({
  open,
  onOpenChange,
  gameTitle,
  currentPct,
  currentNote,
  onSubmit,
}: ProgressEditDialogProps) {
  const [pct, setPct] = useState<string>(String(currentPct ?? 0));
  const [note, setNote] = useState(currentNote ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state when dialog re-opens with fresh values
  useEffect(() => {
    if (open) {
      setPct(String(currentPct ?? 0));
      setNote(currentNote ?? "");
      setError("");
    }
  }, [open, currentPct, currentNote]);

  const parsedPct = parseInt(pct, 10);
  const isValid = !isNaN(parsedPct) && parsedPct >= 0 && parsedPct <= 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("Progress must be a whole number between 0 and 100");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(parsedPct, note.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick-set buttons
  const quickValues = [0, 25, 50, 75, 100];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription className="truncate">
              {gameTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Percentage input */}
            <div className="space-y-2">
              <Label htmlFor="pct">Completion %</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pct"
                  type="number"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  className="w-24 tabular-nums"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>

              {/* Visual slider */}
              <input
                type="range"
                min={0}
                max={100}
                value={isValid ? parsedPct : 0}
                onChange={(e) => setPct(e.target.value)}
                className="w-full accent-primary"
                disabled={isSubmitting}
              />

              {/* Quick-set chips */}
              <div className="flex gap-1.5 flex-wrap">
                {quickValues.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPct(String(v))}
                    disabled={isSubmitting}
                    className="px-2 py-0.5 text-xs rounded-full border border-border hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">
                Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="note"
                placeholder="e.g. Just finished act 2…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground text-right">
                {note.length}/300
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
