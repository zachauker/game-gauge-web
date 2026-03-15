"use client";

/**
 * src/components/lists/achievement-badge.tsx
 *
 * Displays a Steam achievement snapshot on a Currently Playing card.
 * Clicking the badge triggers a sync if the cache is stale (>1 hour),
 * otherwise just shows a "cache fresh" tooltip.
 *
 * Props:
 *   achievements — the cached snapshot from GameListItem.steamAchievements
 *                  (null = never synced)
 *   isSyncing    — parent is mid-sync request
 *   onSync       — called when user clicks to request a refresh
 *   hasSteam     — user has a Steam account linked (hide if not)
 */

import { cn } from "@/lib/utils";
import { Trophy, RefreshCw, Loader2 } from "lucide-react";
import type { SteamAchievements } from "@/lib/api";

interface AchievementBadgeProps {
  achievements: SteamAchievements | null | undefined;
  isSyncing: boolean;
  onSync: () => void;
  hasSteam: boolean;
  className?: string;
}

export function AchievementBadge({
  achievements,
  isSyncing,
  onSync,
  hasSteam,
  className,
}: AchievementBadgeProps) {
  if (!hasSteam) return null;

  // How stale is the cache?
  const isStale = !achievements?.lastFetched
    ? true
    : Date.now() - new Date(achievements.lastFetched).getTime() > 60 * 60 * 1000;

  const pct = achievements?.percentage ?? null;

  return (
    <button
      type="button"
      onClick={onSync}
      disabled={isSyncing}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-xs font-medium transition-all",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        achievements
          ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
          : "border-muted-foreground/20 bg-muted/50 text-muted-foreground hover:bg-muted",
        className
      )}
      title={
        isSyncing
          ? "Syncing achievements…"
          : achievements
          ? `Last synced ${formatAge(achievements.lastFetched)} — click to refresh`
          : "Click to sync achievements from Steam"
      }
    >
      {isSyncing ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trophy className="h-3 w-3" />
      )}

      {achievements ? (
        <>
          <span className="tabular-nums">
            {achievements.earned}/{achievements.total}
          </span>
          {pct !== null && (
            <span className="opacity-60">({pct}%)</span>
          )}
          {/* Stale indicator */}
          {isStale && !isSyncing && (
            <RefreshCw className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
          )}
        </>
      ) : (
        <span>Sync achievements</span>
      )}
    </button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
