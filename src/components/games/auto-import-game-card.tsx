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
 * Wrapper around GameCard that automatically imports IGDB games
 * when clicked before navigating to the game detail page
 */
export function AutoImportGameCard({ game }: AutoImportGameCardProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  // Log when component mounts
  console.log('AutoImportGameCard mounted for:', game.name);

  const handleClick = async (e: React.MouseEvent) => {
    console.log('AutoImportGameCard clicked for game:', game.name, 'IGDB ID:', game.id);
    
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    // Already importing, don't do it again
    if (isImporting) {
      console.log('Already importing, ignoring click');
      return;
    }

    setIsImporting(true);
    
    try {
      console.log('Calling POST /api/igdb/import with igdbId:', game.id);
      
      const response = await api.post("/igdb/import", {
        igdbId: game.id,
      });

      console.log('Import response:', response.data);
      const importedGame = response.data.data;
      
      console.log('Navigating to /games/' + importedGame.id);
      
      // Navigate to the imported game's detail page using our UUID
      router.push(`/games/${importedGame.slug}`);
    } catch (error: any) {
      console.error("Failed to import game:", error);
      console.error("Error response:", error.response?.data);
      setIsImporting(false);
      
      const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
      alert(`Failed to load game: ${errorMessage}`);
    }
  };

  return (
    <div className="relative">
      <GameCard game={game} onClick={handleClick} />
      
      {/* Importing Overlay */}
      {isImporting && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Loading game...</p>
          </div>
        </div>
      )}
    </div>
  );
}
