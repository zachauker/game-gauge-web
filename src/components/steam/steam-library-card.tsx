"use client";

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
} from "@/lib/steam";
import { Clock, ExternalLink, Gamepad2, Link2 } from "lucide-react";

interface SteamLibraryCardProps {
  entry: SteamLibraryEntry;
  view?: "grid" | "list";
}

export function SteamLibraryCard({ entry, view = "grid" }: SteamLibraryCardProps) {
  const isMatched = !!entry.game;
  const coverImage = entry.game?.coverImage || null;
  const steamImage = getSteamHeaderImage(entry.steamAppId);

  if (view === "list") {
    return <ListCard entry={entry} isMatched={isMatched} steamImage={steamImage} coverImage={coverImage} />;
  }

  return <GridCard entry={entry} isMatched={isMatched} steamImage={steamImage} coverImage={coverImage} />;
}

function GridCard({
  entry,
  isMatched,
  steamImage,
  coverImage,
}: {
  entry: SteamLibraryEntry;
  isMatched: boolean;
  steamImage: string;
  coverImage: string | null;
}) {
  const inner = (
    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] bg-card">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={coverImage || steamImage}
          alt={entry.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onError={(e) => {
            // Fall back to Steam header image if cover fails
            const target = e.target as HTMLImageElement;
            if (target.src !== steamImage) {
              target.src = steamImage;
            }
          }}
        />

        {/* Playtime badge */}
        {entry.playtimeForever > 0 && (
          <div className="absolute top-2 left-2">
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
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500/90 text-white border-0">
              {formatPlaytimeCompact(entry.playtimeRecent)} recent
            </Badge>
          </div>
        )}

        {/* Matched indicator */}
        {isMatched && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="bg-primary/90 text-primary-foreground border-0"
            >
              <Link2 className="mr-1 h-3 w-3" />
              Linked
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {entry.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {formatPlaytime(entry.playtimeForever)}
        </p>
      </CardContent>
    </Card>
  );

  if (isMatched && entry.game) {
    return <Link href={`/games/${entry.game.id}`}>{inner}</Link>;
  }

  return (
    <a href={getSteamStoreUrl(entry.steamAppId)} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}

function ListCard({
  entry,
  isMatched,
  steamImage,
  coverImage,
}: {
  entry: SteamLibraryEntry;
  isMatched: boolean;
  steamImage: string;
  coverImage: string | null;
}) {
  const content = (
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

          {/* Right side badges */}
          <div className="flex items-center gap-2 pr-4 shrink-0">
            {isMatched ? (
              <Badge variant="secondary" className="text-xs">
                <Link2 className="mr-1 h-3 w-3" />
                Linked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <ExternalLink className="mr-1 h-3 w-3" />
                Steam
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isMatched && entry.game) {
    return <Link href={`/games/${entry.game.id}`}>{content}</Link>;
  }

  return (
    <a href={getSteamStoreUrl(entry.steamAppId)} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}
