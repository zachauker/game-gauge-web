"use client";

import Image from "next/image";
import Link from "next/link";
import { IGDBGame } from "@/lib/api";
import { getIGDBImageUrl, formatIGDBDate } from "@/lib/search";
import { Star, CheckCircle } from "lucide-react";

interface GameCardProps {
  game: IGDBGame;
  onClick?: (e: React.MouseEvent) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const coverUrl = game.cover?.image_id
    ? getIGDBImageUrl(game.cover.image_id, "cover_big")
    : null;

  // IGDB rating is 0–100, display as x.x / 10
  const rating = game.rating ? (game.rating / 10).toFixed(1) : null;

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  const primaryPlatform =
    game.platforms && game.platforms.length > 0
      ? game.platforms[0].abbreviation || game.platforms[0].name
      : null;

  const content = (
    <div className="group relative flex flex-col h-full rounded-lg overflow-hidden bg-card border border-brand-purple/20 hover:border-brand-purple/50 transition-all duration-200 cursor-pointer">

      {/* ── Cover image ── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-purple/10 shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          // Placeholder when no cover art available
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.2 }}>
              <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="16" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
        )}

        {/* Gradient overlay — always present, darkens on hover for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-200" />

        {/* ── IGDB community rating — top right ── */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Star className="h-2.5 w-2.5 fill-brand-amber text-brand-amber" />
            <span className="text-[11px] font-medium text-brand-amber leading-none">
              {rating}
            </span>
          </div>
        )}

        {/* ── In database badge — top left ── */}
        {game.inDatabase && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-teal/20 backdrop-blur-sm border border-brand-teal/30 rounded px-1.5 py-0.5">
            <CheckCircle className="h-2.5 w-2.5 text-brand-teal" />
            <span className="text-[11px] font-medium text-brand-teal leading-none">
              Added
            </span>
          </div>
        )}

        {/* ── Title + meta pinned to bottom of cover ── */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
          <h3 className="text-[13px] font-medium text-white leading-snug line-clamp-2 group-hover:text-brand-blush transition-colors duration-150">
            {game.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {releaseYear && (
              <span className="text-[11px] text-white/50">{releaseYear}</span>
            )}
            {releaseYear && primaryPlatform && (
              <span className="text-[11px] text-white/30">·</span>
            )}
            {primaryPlatform && (
              <span className="text-[11px] text-white/50 truncate">
                {primaryPlatform}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="h-full">
        {content}
      </div>
    );
  }

  return (
    <Link href={`/games/${game.id}`} className="h-full block">
      {content}
    </Link>
  );
}