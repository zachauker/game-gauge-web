"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";

/**
 * Internal redirect route — imports a game on first access then
 * forwards to the canonical game detail page. Never linked to directly
 * from the UI; only reached via programmatic navigation.
 */
export default function GameImportPage() {
  const params  = useParams();
  const router  = useRouter();
  const [error, setError] = useState("");
  const igdbId  = parseInt(params.igdbId as string, 10);

  useEffect(() => {
    if (isNaN(igdbId)) { setError("Game not found"); return; }
    importAndRedirect();
  }, [igdbId]);

  const importAndRedirect = async () => {
    try {
      const response = await api.post("/igdb/import", { igdbId });
      router.replace(`/games/${response.data.data.slug}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-[14px] text-foreground/40 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-[13px] text-brand-purple hover:text-foreground transition-colors"
          >
            ← Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple/50" />
      </div>
    </MainLayout>
  );
}
