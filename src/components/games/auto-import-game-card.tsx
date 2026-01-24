"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IGDBGame } from "@/lib/api";
import { GameCard } from "./game-card";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface AutoImportGameCardProps {
  game: IGDBGame;
}

/**
 * Wrapper around GameCard that automatically imports IGDB games
 * when clicked before navigating to the game detail page
 */
export function AutoImportGameCard({ game }: AutoImportGameCardProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // If already in database, navigate directly
    if (game.inDatabase) {
      // Need to get the actual UUID - for now navigate to IGDB ID page
      // which will handle the lookup and redirect
      router.push(`/games/igdb/${game.id}`);
      return;
    }

    // Import the game first
    setIsImporting(true);
    
    try {
      const response = await api.post("/igdb/import", {
        igdbId: game.id,
      });

      const importedGame = response.data.data;
      
      // Navigate to the imported game
      router.push(`/games/${importedGame.id}`);
    } catch (error) {
      console.error("Failed to import game:", error);
      // Still try to navigate - the game detail page will handle it
      router.push(`/games/igdb/${game.id}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="relative">
      <div onClick={handleClick} className="cursor-pointer">
        <GameCard game={game} />
      </div>
      
      {/* Importing Overlay */}
      {isImporting && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Importing game...</p>
          </div>
        </div>
      )}
    </div>
  );
}
