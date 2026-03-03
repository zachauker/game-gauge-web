"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SteamLibraryEntry,
  formatPlaytime,
  formatPlaytimeCompact,
  getSteamHeaderImage,
  getSteamStoreUrl,
  linkSteamGame,
} from "@/lib/steam";
import { Clock, ExternalLink, Gamepad2, Link2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface SteamLibraryCardProps {
  entry: SteamLibraryEntry;
  view?: "grid" | "list";
  onLinked?: (updatedEntry: SteamLibraryEntry) => void;
}

export function SteamLibraryCard({ entry, view = "grid", onLinked }: SteamLibraryCardProps) {
  const [currentEntry, setCurrentEntry] = useState(entry);
  const isMatched = !!currentEntry.game;
  const coverImage = currentEntry.game?.coverImage || null;
  const steamImage = getSteamHeaderImage(currentEntry.steamAppId);

  const handleLinked = (updated: SteamLibraryEntry) => {
    setCurrentEntry(updated);
    onLinked?.(updated);
  };

  if (view === "list") {
    return (
      <ListCard
        entry={currentEntry}
        isMatched={isMatched}
        steamImage={steamImage}
        coverImage={coverImage}
        onLinked={handleLinked}
      />
    );
  }

  return (
    <GridCard
      entry={currentEntry}
      isMatched={isMatched}
      steamImage={steamImage}
      coverImage={coverImage}
      onLinked={handleLinked}
    />
  );
}

function GridCard({
  entry,
  isMatched,
  steamImage,
  coverImage,
  onLinked,
}: {
  entry: SteamLibraryEntry;
  isMatched: boolean;
  steamImage: string;
  coverImage: string | null;
  onLinked: (updated: SteamLibraryEntry) => void;
}) {const [isLinking, setIsLinking] = useState(false);

  const handleLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLinking(true);

    try {
      const updated = await linkSteamGame(entry.steamAppId);
      toast.success(`Linked "${entry.name}" to Game Gauge!`);
      onLinked(updated);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Could not find a match in IGDB";
      toast.error(message);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg bg-card">
      {/* Image + Overlay */}
      <div className="relative aspect-[460/215] overflow-hidden bg-muted">
        <Image
          src={coverImage || steamImage}
          alt={entry.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== steamImage) {
              target.src = steamImage;
            }
          }}
        />

        {/* Playtime badge */}
        {entry.playtimeForever > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="secondary"
              className="bg-black/70 text-white border-0 backdrop-blur-sm"
            >
              <Clock className="mr-1 h-3 w-3" />
              {formatPlaytimeCompact(entry.playtimeForever)}
            </Badge>
          </div>
        )}

        {/* Recent playtime badge */}
        {entry.playtimeRecent > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-green-500/90 text-white border-0">
              {formatPlaytimeCompact(entry.playtimeRecent)} recent
            </Badge>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 z-20">
          {/* Steam button — always shown */}
          <a
            href={getSteamStoreUrl(entry.steamAppId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#1b2838] text-white text-sm font-medium hover:bg-[#2a475e] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
            Steam
          </a>

          {/* Game Gauge button or Import button */}
          {isMatched && entry.game ? (
            <Link
              href={`/games/${entry.game.slug}`}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Gamepad2 className="h-4 w-4" />
              Game Gauge
            </Link>
          ) : (
            <button
              onClick={handleLink}
              disabled={isLinking}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Linking…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Import to Game Gauge
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2">
          {entry.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {formatPlaytime(entry.playtimeForever)}
          </p>
          {isMatched && (
            <Badge
              variant="secondary"
              className="text-xs bg-primary/10 text-primary border-0"
            >
              <Link2 className="mr-1 h-3 w-3" />
              Linked
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ListCard({
  entry,
  isMatched,
  steamImage,
  coverImage,
  onLinked,
}: {
  entry: SteamLibraryEntry;
  isMatched: boolean;
  steamImage: string;
  coverImage: string | null;
  onLinked: (updated: SteamLibraryEntry) => void;
}) {
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLinking(true);

    try {
      const updated = await linkSteamGame(entry.steamAppId);
      toast.success(`Linked "${entry.name}" to Game Gauge!`);
      onLinked(updated);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Could not find a match in IGDB";
      toast.error(message);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden bg-muted">
            <Image
              src={coverImage || steamImage}
              alt={entry.name}
              fill
              className="object-cover"
              sizes="80px"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== steamImage) {
                  target.src = steamImage;
                }
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-3">
            <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
              {entry.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {formatPlaytime(entry.playtimeForever)}
              </span>
              {entry.playtimeRecent > 0 && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
                  {formatPlaytimeCompact(entry.playtimeRecent)} recent
                </Badge>
              )}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 pr-4 shrink-0">
            {isMatched && entry.game ? (
              <Link
                href={`/games/${entry.game.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Gamepad2 className="h-3 w-3" />
                View
              </Link>
            ) : (
              <button
                onClick={handleLink}
                disabled={isLinking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Linking…
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    Import
                  </>
                )}
              </button>
            )}
            <a
              href={getSteamStoreUrl(entry.steamAppId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1b2838] text-white text-xs font-medium hover:bg-[#2a475e] transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Steam
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}