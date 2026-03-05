"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SteamLoginButton } from "./steam-login-button";
import { Loader2, ExternalLink, Unlink } from "lucide-react";

interface SteamStatus {
  isLinked: boolean;
  steamId: string | null;
  steamUsername: string | null;
  steamAvatar: string | null;
  steamProfileUrl: string | null;
}

/**
 * Card component for the user settings page that shows
 * the user's Steam link status and allows linking/unlinking.
 */
export function SteamLinkCard() {
  const [status, setStatus] = useState<SteamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchSteamStatus();
  }, []);

  const fetchSteamStatus = async () => {
    try {
      const response = await api.get("/auth/steam/status");
      setStatus(response.data.data);
    } catch (err) {
      setError("Failed to load Steam status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (
      !confirm(
        "Are you sure you want to unlink your Steam account? You can link it again later."
      )
    ) {
      return;
    }

    setIsUnlinking(true);
    setError("");
    setSuccessMessage("");

    try {
      await api.delete("/auth/steam/unlink");
      setStatus({
        isLinked: false,
        steamId: null,
        steamUsername: null,
        steamAvatar: null,
        steamProfileUrl: null,
      });
      setSuccessMessage("Steam account unlinked successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUnlinking(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SteamIcon className="h-5 w-5" />
          Steam Integration
        </CardTitle>
        <CardDescription>
          {status?.isLinked
            ? "Your Steam account is connected. This enables library syncing, activity tracking, and more."
            : "Connect your Steam account to import your game library, track playtime, and sync your wishlist."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {status?.isLinked ? (
          <div className="space-y-4">
            {/* Linked account info */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              {status.steamAvatar && (
                <img
                  src={status.steamAvatar}
                  alt="Steam avatar"
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {status.steamUsername}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  Steam ID: {status.steamId}
                </p>
              </div>
              {status.steamProfileUrl && (
                <a
                  href={status.steamProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Unlink button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {isUnlinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
              Unlink Steam Account
            </Button>
          </div>
        ) : (
          <SteamLoginButton mode="link" />
        )}
      </CardContent>
    </Card>
  );
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.19.007l2.862-4.146V8.9a4.482 4.482 0 0 1 4.482-4.482 4.482 4.482 0 0 1 4.482 4.482 4.482 4.482 0 0 1-4.482 4.482h-.104l-4.08 2.91c0 .074.004.148.004.224a3.376 3.376 0 0 1-3.376 3.376 3.39 3.39 0 0 1-3.331-2.806L.309 13.27A12.018 12.018 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zM7.54 18.21l-1.473-.61a2.535 2.535 0 0 0 4.817-.737 2.534 2.534 0 0 0-2.47-2.533l1.522.63a1.867 1.867 0 1 1-2.396 3.25zm8.36-5.598a2.988 2.988 0 0 0 2.988-2.989 2.988 2.988 0 0 0-2.988-2.988 2.988 2.988 0 0 0-2.989 2.988 2.99 2.99 0 0 0 2.989 2.989zm-.001-4.984a1.997 1.997 0 1 1 0 3.994 1.997 1.997 0 0 1 0-3.994z" />
    </svg>
  );
}
