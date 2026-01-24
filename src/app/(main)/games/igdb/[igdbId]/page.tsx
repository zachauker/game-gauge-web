"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";

/**
 * This page handles IGDB games by:
 * 1. Checking if the game exists in our database by IGDB ID
 * 2. If not, importing it
 * 3. Redirecting to the proper game detail page with our UUID
 */
export default function IGDBGamePage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const igdbId = parseInt(params.igdbId as string, 10);

  useEffect(() => {
    if (isNaN(igdbId)) {
      setError("Invalid game ID");
      return;
    }

    importAndRedirect();
  }, [igdbId]);

  const importAndRedirect = async () => {
    try {
      // Import or get existing game
      const response = await api.post("/igdb/import", {
        igdbId,
      });

      const game = response.data.data;

      // Redirect to the proper game page with our UUID
      router.replace(`/games/${game.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Error Loading Game</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-primary hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Importing game from IGDB...
            </h2>
            <p className="text-muted-foreground">
              This will only take a moment
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
