"use client";

/**
 * src/components/lists/complete-game-dialog.tsx
 *
 * 3-step modal for marking a game as complete:
 *   Step 1 — Completion type (beaten / 100% / abandoned / endless)
 *   Step 2 — Rating (1–10, optional — skip available)
 *   Step 3 — Review (optional — skip available)
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trophy,
  Star,
  MessageSquare,
  ChevronRight,
  Sword,
  Sparkles,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────

type CompletionType = "beaten" | "100pct" | "abandoned" | "endless";
type Step = 1 | 2 | 3;

const COMPLETION_OPTIONS: {
  value: CompletionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "beaten",
    label: "Beaten",
    description: "Finished the main story",
    icon: <Sword className="h-5 w-5" />,
    color: "text-blue-500",
  },
  {
    value: "100pct",
    label: "100%",
    description: "Full completion — all achievements",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-yellow-500",
  },
  {
    value: "abandoned",
    label: "Abandoned",
    description: "Put it down for good",
    icon: <X className="h-5 w-5" />,
    color: "text-red-500",
  },
  {
    value: "endless",
    label: "Endless",
    description: "No real ending — just moved on",
    icon: <Clock className="h-5 w-5" />,
    color: "text-purple-500",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────

interface CompleteGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  gameTitle: string;
  /** Called after a successful completion so the parent can reload */
  onCompleted: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export function CompleteGameDialog({
  open,
  onOpenChange,
  gameId,
  gameTitle,
  onCompleted,
}: CompleteGameDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [completionType, setCompletionType] = useState<CompletionType | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSpoilers, setReviewSpoilers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setCompletionType(null);
      setRating(null);
      setHoveredRating(null);
      setReviewContent("");
      setReviewSpoilers(false);
      setError("");
    }
  }, [open]);

  const selectedOption = COMPLETION_OPTIONS.find((o) => o.value === completionType);

  const handleSubmit = async () => {
    if (!completionType) return;
    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/lists/completed/add", {
        gameId,
        completionType,
        ...(rating !== null ? { rating } : {}),
        ...(reviewContent.trim().length >= 10
          ? { review: { content: reviewContent.trim(), spoilers: reviewSpoilers } }
          : {}),
      });

      toast.success(`${gameTitle} marked as completed!`);
      onCompleted();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step indicators ──────────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {([1, 2, 3] as Step[]).map((s) => (
        <div
          key={s}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/50" : "w-4 bg-muted"
          )}
        />
      ))}
    </div>
  );

  // ── Step 1: Completion type ──────────────────────────────────────────────

  const Step1 = () => (
    <>
      <DialogHeader>
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
        </div>
        <DialogTitle className="text-center">How did it go?</DialogTitle>
        <DialogDescription className="text-center truncate">
          {gameTitle}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 py-4">
        {COMPLETION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setCompletionType(option.value)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left transition-all",
              "hover:border-primary/50 hover:bg-accent",
              completionType === option.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            )}
          >
            <span className={option.color}>{option.icon}</span>
            <span className="font-semibold text-sm">{option.label}</span>
            <span className="text-xs text-muted-foreground leading-snug">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setStep(2)}
          disabled={!completionType}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );

  // ── Step 2: Rating ───────────────────────────────────────────────────────

  const Step2 = () => {
    const displayRating = hoveredRating ?? rating;

    return (
      <>
        <DialogHeader>
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-center">How would you rate it?</DialogTitle>
          <DialogDescription className="text-center">
            Optional — you can skip this
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {/* Star row */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                type="button"
                onMouseEnter={() => setHoveredRating(score)}
                onMouseLeave={() => setHoveredRating(null)}
                onClick={() => setRating(score === rating ? null : score)}
                className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                aria-label={`Rate ${score}`}
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    displayRating !== null && score <= displayRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Label */}
          <div className="text-center h-5">
            {displayRating !== null && (
              <span className="text-sm font-semibold text-yellow-500 tabular-nums">
                {displayRating} / 10
              </span>
            )}
          </div>

          {/* Completion type reminder */}
          {selectedOption && (
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="gap-1.5">
                <span className={selectedOption.color}>{selectedOption.icon}</span>
                {selectedOption.label}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button variant="ghost" onClick={() => setStep(3)}>
            Skip
          </Button>
          <Button onClick={() => setStep(3)} disabled={rating === null}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </DialogFooter>
      </>
    );
  };

  // ── Step 3: Review ───────────────────────────────────────────────────────

  const Step3 = () => {
    const charCount = reviewContent.length;
    const isReviewValid = charCount === 0 || charCount >= 10;
    const hasReview = charCount >= 10;

    return (
      <>
        <DialogHeader>
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <DialogTitle className="text-center">Leave a review?</DialogTitle>
          <DialogDescription className="text-center">
            Optional — you can skip this too
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <textarea
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            placeholder="Share your thoughts on the game…"
            maxLength={5000}
            rows={5}
            className={cn(
              "w-full resize-none rounded-md border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
              !isReviewValid && charCount > 0 && "border-destructive focus:ring-destructive"
            )}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{!isReviewValid && charCount > 0 ? "Minimum 10 characters" : ""}</span>
            <span className={charCount > 4800 ? "text-destructive" : ""}>
              {charCount}/5000
            </span>
          </div>

          {/* Spoilers toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={reviewSpoilers}
              onChange={(e) => setReviewSpoilers(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            <span className="text-muted-foreground">Contains spoilers</span>
          </label>

          {/* Summary of what will be saved */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm text-muted-foreground">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <span className={selectedOption.color}>{selectedOption.icon}</span>
                <span>{selectedOption.label}</span>
              </div>
            )}
            {rating !== null && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{rating}/10 rating will be saved</span>
              </div>
            )}
            {!hasReview && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>No review (skipped)</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setStep(2)} disabled={isSubmitting}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isReviewValid}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                {hasReview ? "Complete & Review" : "Mark Complete"}
              </>
            )}
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <StepIndicator />
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </DialogContent>
    </Dialog>
  );
}
