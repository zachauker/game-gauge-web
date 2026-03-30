"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Loader2, X } from "lucide-react";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
  currentRating?: number;
  onSubmit: (rating: number) => Promise<void>;
}

const RATING_LABELS: Record<number, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Poor",
  4: "Below average",
  5: "Average",
  6: "Decent",
  7: "Good",
  8: "Great",
  9: "Excellent",
  10: "Masterpiece",
};

export function RatingDialog({
  open,
  onOpenChange,
  gameName,
  currentRating,
  onSubmit,
}: RatingDialogProps) {
  const [rating, setRating] = useState(currentRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if currentRating changes while open
  useEffect(() => {
    setRating(currentRating ?? 0);
  }, [currentRating, open]);

  const display = hovered || rating;

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      onOpenChange(false);
    } catch {
      // parent handles error toasts
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-background border-brand-purple/25 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[15px] font-medium text-foreground">
                {currentRating ? "Update your rating" : "Rate this game"}
              </DialogTitle>
              <p className="text-[12px] text-foreground/40 mt-0.5 line-clamp-1">
                {gameName}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-foreground/30 hover:text-foreground/60 transition-colors mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Star picker */}
        <div className="px-6 py-8">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                type="button"
                onMouseEnter={() => setHovered(score)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(score === rating ? 0 : score)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${score}`}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    display > 0 && score <= display
                      ? "fill-brand-amber text-brand-amber"
                      : "text-foreground/15"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Score + label */}
          <div className="h-8 flex items-center justify-center gap-2">
            {display > 0 ? (
              <>
                <span className="text-[22px] font-medium text-brand-amber leading-none tabular-nums">
                  {display}
                </span>
                <span className="text-[13px] text-foreground/40">
                  / 10 · {RATING_LABELS[display]}
                </span>
              </>
            ) : (
              <span className="text-[13px] text-foreground/25">
                Select a score
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-purple/15 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="text-[13px] text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40 disabled:cursor-not-allowed text-foreground text-[13px] font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {currentRating ? "Update" : "Save rating"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}