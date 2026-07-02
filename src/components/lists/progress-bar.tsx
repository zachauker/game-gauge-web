"use client";

/**
 * src/components/lists/progress-bar.tsx
 *
 * Displays a game's progress percentage as a visual bar.
 * Clicking anywhere on the bar (or the label) opens the edit dialog.
 */

import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface ProgressBarProps {
  /** 0–100 */
  value: number | null | undefined;
  onClick?: () => void;
  /** Show the clickable edit affordance (owner only) */
  editable?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  onClick,
  editable = false,
  className,
}: ProgressBarProps) {
  const pct = value ?? 0;

  // Track stays brand-purple in progress; shifts to brand-teal at full completion
  const trackColor = pct === 100 ? "bg-brand-teal" : "bg-primary";

  return (
    <button
      type="button"
      onClick={editable ? onClick : undefined}
      disabled={!editable}
      className={cn(
        "w-full text-left group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        editable && "cursor-pointer",
        !editable && "cursor-default",
        className
      )}
      aria-label={editable ? `Edit progress: ${pct}%` : `Progress: ${pct}%`}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          Progress
        </span>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums flex items-center",
            pct === 100 ? "text-brand-teal" : "text-foreground",
            editable && "group-hover:text-primary transition-colors motion-reduce:transition-none"
          )}
        >
          {pct}%
          {editable && (
            <Pencil
              aria-hidden="true"
              className="ml-1 h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity motion-reduce:transition-none"
            />
          )}
        </span>
      </div>

      {/* Track */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 motion-reduce:transition-none",
            trackColor,
            editable && "group-hover:opacity-80"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
