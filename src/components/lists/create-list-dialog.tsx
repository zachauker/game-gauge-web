"use client";

import { useState } from "react";
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
import { Loader2, Globe, Lock } from "lucide-react";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; isPublic: boolean }) => Promise<void>;
  initialData?: {
    name: string;
    description?: string;
    isPublic: boolean;
  };
}

export function CreateListDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CreateListDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("List name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setIsPublic(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Edit List" : "Create New List"}
            </DialogTitle>
            <DialogDescription>
              {initialData
                ? "Update your list details"
                : "Create a new list to organize your games"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Favorite RPGs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="What's this list about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <Label>Privacy</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isPublic ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsPublic(true)}
                  disabled={isSubmitting}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Public
                </Button>
                <Button
                  type="button"
                  variant={!isPublic ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsPublic(false)}
                  disabled={isSubmitting}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Private
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPublic
                  ? "Anyone can view this list"
                  : "Only you can view this list"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
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
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                "Update List"
              ) : (
                "Create List"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
