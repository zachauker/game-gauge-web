"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X, AlertTriangle } from "lucide-react";

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { content: string; spoilers: boolean }) => Promise<void>;
  initialContent?: string;
  initialSpoilers?: boolean;
  mode?: "create" | "edit";
}

export function WriteReviewDialog({
  open,
  onOpenChange,
  onSubmit,
  initialContent = "",
  initialSpoilers = false,
  mode = "create",
}: WriteReviewDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [spoilers, setSpoilers] = useState(initialSpoilers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const MIN = 10;
  const MAX = 5000;
  const remaining = MAX - content.length;
  const isValid = content.length >= MIN && content.length <= MAX;

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setSpoilers(initialSpoilers);
      setError("");
    }
  }, [open, initialContent, initialSpoilers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(
        content.length < MIN
          ? `Review must be at least ${MIN} characters`
          : `Review must be under ${MAX} characters`
      );
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({ content: content.trim(), spoilers });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to save review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border-brand-purple/25 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[15px] font-medium text-foreground">
              {mode === "create" ? "Write a review" : "Edit your review"}
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-brand-red/10 border border-brand-red/20 px-3 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-brand-red shrink-0" />
                <p className="text-[12px] text-brand-red">{error}</p>
              </div>
            )}

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground/50">
                Your review
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you think of this game? Share your experience, what worked, what didn't…"
                rows={7}
                maxLength={MAX}
                className={`w-full resize-none bg-card border rounded-lg px-3.5 py-3 text-[13px] text-foreground placeholder:text-foreground/25 outline-none transition-colors leading-relaxed ${
                  error && content.length < MIN
                    ? "border-brand-red/40 focus:border-brand-red/60"
                    : "border-brand-purple/20 hover:border-brand-purple/35 focus:border-brand-purple/55"
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/30">
                  Min. {MIN} characters
                </span>
                <span
                  className={`text-[11px] tabular-nums ${
                    remaining < 100
                      ? "text-brand-amber"
                      : "text-foreground/25"
                  }`}
                >
                  {remaining.toLocaleString()} left
                </span>
              </div>
            </div>

            {/* Spoiler toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={spoilers}
                  onChange={(e) => setSpoilers(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-5 rounded-full transition-colors ${
                    spoilers ? "bg-brand-purple" : "bg-foreground/10"
                  }`}
                />
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    spoilers ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
              <div>
                <p className="text-[12px] font-medium text-foreground/60 group-hover:text-foreground/80 transition-colors">
                  Contains spoilers
                </p>
                <p className="text-[11px] text-foreground/30">
                  Your review will be hidden behind a warning
                </p>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="border-t border-brand-purple/15 px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-[13px] text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40 disabled:cursor-not-allowed text-foreground text-[13px] font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "create" ? "Publish review" : "Save changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}