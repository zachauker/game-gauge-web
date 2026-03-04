"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SteamLibraryEntry,
  SteamProfileInfo,
  getSteamProfile,
  getRecentlyPlayed,
  getSyncStatus,
  SteamSyncStatus,
  getSteamHeaderImage,
  formatPlaytimeCompact,
} from "@/lib/steam";
import { Gamepad2, ExternalLink, Clock, Loader2 } from "lucide-react";

interface SteamProfileSectionProps {
  isOwnProfile: boolean;
}

export function SteamProfileSection({ isOwnProfile }: SteamProfileSectionProps) {
  const [profile, setProfile] = useState<SteamProfileInfo | null>(null);
  const [recentGames, setRecentGames] = useState<SteamLibraryEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<SteamSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSteamData();
  }, []);

  const loadSteamData = async () => {
    try {
      setIsLoading(true);
      const [profileData, recentData, statusData] = await Promise.all([
        getSteamProfile().catch(() => null),
        getRecentlyPlayed(6).catch(() => []),
        getSyncStatus().catch(() => null),
      ]);

      setProfile(profileData);
      setRecentGames(recentData);
      setSyncStatus(statusData);
    } catch {
      setError("Failed to load Steam data");
    } finally {
      setIsLoading(false);
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

  if (error || !profile) {
    return null; // Silently hide if Steam data unavailable
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gamepad2 className="h-5 w-5" />
            Steam
          </CardTitle>
          <div className="flex items-center gap-2">
            {profile.profileUrl && (
              <a
                href={profile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steam Profile Summary */}
        <div className="flex items-center gap-3">
          {profile.avatarFull && (
            <Image
              src={profile.avatarFull}
              alt={profile.personaName}
              width={48}
              height={48}
              className="rounded-md"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{profile.personaName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className={
                  profile.onlineStatus === "Online"
                    ? "text-green-600 border-green-600/30 text-xs"
                    : "text-muted-foreground text-xs"
                }
              >
                {profile.onlineStatus}
              </Badge>
              {profile.steamLevel !== null && (
                <span className="text-xs text-muted-foreground">
                  Level {profile.steamLevel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {syncStatus && syncStatus.totalGames > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{syncStatus.totalGames} games</span>
            <span>{syncStatus.matchedGames} linked</span>
          </div>
        )}

        {/* Recently Played */}
        {recentGames.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Recently Played
            </p>
            <div className="grid grid-cols-3 gap-2">
              {recentGames.slice(0, 6).map((game) => (
                <div
                  key={game.steamAppId}
                  className="relative aspect-[460/215] rounded overflow-hidden bg-muted group"
                >
                  <Image
                    src={getSteamHeaderImage(game.steamAppId)}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-medium text-center px-1 line-clamp-2">
                      {game.name}
                    </span>
                  </div>
                  {game.playtimeRecent > 0 && (
                    <div className="absolute bottom-0.5 right-0.5">
                      <Badge className="bg-black/70 text-white border-0 text-[9px] px-1 py-0">
                        {formatPlaytimeCompact(game.playtimeRecent)}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Full Library Link */}
        {isOwnProfile && (
          <Link href="/steam/library">
            <Button variant="outline" size="sm" className="w-full">
              <Gamepad2 className="mr-2 h-4 w-4" />
              View Full Library
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
