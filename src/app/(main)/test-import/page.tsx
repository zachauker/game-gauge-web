"use client";

import { AutoImportGameCard } from "@/components/games/auto-import-game-card";
import { MainLayout } from "@/components/layout/main-layout";

export default function TestPage() {
  // Test game data
  const testGame = {
    id: 1942,
    name: "The Witcher 3: Wild Hunt",
    cover: {
      id: 1,
      url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
      image_id: "co1wyy"
    },
    first_release_date: 1431993600,
    rating: 95,
    platforms: [
      { name: "PC", abbreviation: "PC" },
      { name: "PlayStation 4", abbreviation: "PS4" }
    ]
  };

  console.log('TestPage rendered');

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Auto-Import Test</h1>
        <p className="mb-4">Click the game card below. Check console for logs.</p>
        
        <div className="max-w-xs">
          <AutoImportGameCard game={testGame} />
        </div>

        <div className="mt-8 p-4 bg-muted rounded">
          <h2 className="font-bold mb-2">Expected Console Output:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>TestPage rendered</li>
            <li>AutoImportGameCard mounted for: The Witcher 3: Wild Hunt</li>
            <li>(After click) AutoImportGameCard clicked for game: The Witcher 3: Wild Hunt IGDB ID: 1942</li>
            <li>(After click) Calling POST /api/igdb/import with igdbId: 1942</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  );
}
