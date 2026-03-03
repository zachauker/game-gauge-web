"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SteamSyncResult,
  SteamSyncStatus,
  syncSteamLibrary,
  syncRecentlyPlayed,
  formatRelativeTime,
} from "@/lib/steam";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SyncButtonProps {
  syncStatus: SteamSyncStatus | null;
  onSyncComplete: (result: SteamSyncResult) => void;
  variant?: "full" | "recent";
}

export function SyncButton({
  syncStatus,
  onSyncComplete,
  variant = "full",
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const result =
        variant === "full"
          ? await syncSteamLibrary()
          : await syncRecentlyPlayed();

      toast.success(
        `Synced ${result.totalGames} games — ${result.matchedGames} matched to Game Gauge`,
        {
          description: result.newlyImported > 0
            ? `${result.newlyImported} new games imported`
            : undefined,
          duration: 5000,
        }
      );

      onSyncComplete(result);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        "Sync failed";
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant={variant === "full" ? "default" : "outline"}
        size="sm"
      >
        {isSyncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {variant === "full" ? "Syncing library…" : "Syncing recent…"}
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            {variant === "full" ? "Sync Library" : "Sync Recent"}
          </>
        )}
      </Button>

      {syncStatus && syncStatus.lastSynced && (
        <span className="text-xs text-muted-foreground">
          Last synced {formatRelativeTime(syncStatus.lastSynced)}
        </span>
      )}
    </div>
  );
}

interface SyncStatusBarProps {
  syncStatus: SteamSyncStatus;
}

export function SyncStatusBar({ syncStatus }: SyncStatusBarProps) {
  const matchRate =
    syncStatus.totalGames > 0
      ? Math.round((syncStatus.matchedGames / syncStatus.totalGames) * 100)
      : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {syncStatus.totalGames.toLocaleString()} games
      </Badge>
      <Badge
        variant="secondary"
        className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {syncStatus.matchedGames.toLocaleString()} linked ({matchRate}%)
      </Badge>
      {syncStatus.unmatchedGames > 0 && (
        <Badge
          variant="secondary"
          className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
        >
          <AlertCircle className="mr-1 h-3 w-3" />
          {syncStatus.unmatchedGames.toLocaleString()} unlinked
        </Badge>
      )}
    </div>
  );
}
