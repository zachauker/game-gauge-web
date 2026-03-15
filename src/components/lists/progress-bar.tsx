"use client";

/**
 * src/components/lists/progress-bar.tsx
 *
 * Displays a game's progress percentage as a visual bar.
 * Clicking anywhere on the bar (or the label) opens the edit dialog.
 */

import { cn } from "@/lib/utils";

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

  // Colour shifts green as progress increases
  const trackColor =
    pct === 100
      ? "bg-green-500"
      : pct >= 75
      ? "bg-emerald-500"
      : pct >= 40
      ? "bg-blue-500"
      : "bg-primary";

  return (
    <button
      type="button"
      onClick={editable ? onClick : undefined}
      disabled={!editable}
      className={cn(
        "w-full text-left group",
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
            "text-xs font-semibold tabular-nums",
            pct === 100 ? "text-green-500" : "text-foreground",
            editable && "group-hover:text-primary transition-colors"
          )}
        >
          {pct}%
          {editable && (
            <span className="ml-1 opacity-0 group-hover:opacity-60 transition-opacity text-[10px]">
              ✎
            </span>
          )}
        </span>
      </div>

      {/* Track */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            trackColor,
            editable && "group-hover:opacity-80"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
