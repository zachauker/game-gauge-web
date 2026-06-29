"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IGDBGame } from "@/lib/api";
import { GameCard } from "./game-card";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface AutoImportGameCardProps {
  game: IGDBGame;
}

/**
 * Wraps GameCard with an on-click import flow:
 * imports the game into our database on first interaction,
 * then navigates to the game's detail page.
 */
export function AutoImportGameCard({ game }: AutoImportGameCardProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isImporting) return;

    setIsImporting(true);
    try {
      const response = await api.post("/igdb/import", { igdbId: game.id });
      const importedGame = response.data.data;
      router.push(`/games/${importedGame.slug}`);
    } catch {
      setIsImporting(false);
    }
  };

  return (
    <div className="relative">
      <GameCard game={game} onClick={handleClick} />

      {isImporting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="h-6 w-6 animate-spin text-brand-purple/60" />
        </div>
      )}
    </div>
  );
}
