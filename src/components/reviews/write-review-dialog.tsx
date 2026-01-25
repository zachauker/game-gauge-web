"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

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

  const minLength = 10;
  const maxLength = 5000;
  const charsLeft = maxLength - content.length;
  const isValid = content.length >= minLength && content.length <= maxLength;

  // Reset form when dialog opens/closes
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
        content.length < minLength
          ? `Review must be at least ${minLength} characters`
          : `Review must be less than ${maxLength} characters`
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
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Write Your Review" : "Edit Your Review"}
            </DialogTitle>
            <DialogDescription>
              Share your thoughts about this game. Be respectful and constructive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Review Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Review</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you think of this game? Share your experience..."
                className="w-full min-h-[200px] px-3 py-2 text-sm bg-background border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    content.length < minLength
                      ? "text-muted-foreground"
                      : content.length > maxLength
                      ? "text-destructive"
                      : "text-green-600"
                  }
                >
                  {content.length} / {maxLength} characters
                </span>
                {content.length > 0 && content.length < minLength && (
                  <span className="text-muted-foreground">
                    {minLength - content.length} more needed
                  </span>
                )}
              </div>
            </div>

            {/* Spoiler Warning Checkbox */}
            <div className="flex items-start space-x-2 p-3 bg-muted rounded-md">
              <input
                type="checkbox"
                id="spoilers"
                checked={spoilers}
                onChange={(e) => setSpoilers(e.target.checked)}
                className="mt-1 h-4 w-4"
                disabled={isSubmitting}
              />
              <div className="flex-1">
                <Label htmlFor="spoilers" className="cursor-pointer flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>Contains Spoilers</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Check this if your review reveals plot points or surprises
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                {error}
              </div>
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
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Post Review" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
