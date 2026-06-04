"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { AutoImportGameCard } from "@/components/games/auto-import-game-card";
import { searchIGDB, getPopularGames, getRecentGames } from "@/lib/search";
import { IGDBGame } from "@/lib/api";
import { Search, Loader2, TrendingUp, Clock, X } from "lucide-react";

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function GameGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-lg bg-card border border-brand-purple/10 animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/40">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[12px] text-foreground/25">
          {count} result{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Inner page (uses useSearchParams — must be wrapped in Suspense) ──────────

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([]);
  const [popularGames, setPopularGames] = useState<IGDBGame[]>([]);
  const [recentGames, setRecentGames] = useState<IGDBGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [activeTab, setActiveTab] = useState<"popular" | "recent">("popular");

  // Run search function
  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setActiveQuery(query);
    try {
      const { games } = await searchIGDB({ query });
      setSearchResults(games);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Run on mount if URL has ?q=
  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load popular on mount
  useEffect(() => {
    setIsLoadingPopular(true);
    getPopularGames(20)
      .then(setPopularGames)
      .finally(() => setIsLoadingPopular(false));
  }, []);

  // Load recent when tab switches
  useEffect(() => {
    if (activeTab === "recent" && recentGames.length === 0) {
      setIsLoadingRecent(true);
      getRecentGames(20)
        .then(setRecentGames)
        .finally(() => setIsLoadingRecent(false));
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // Push to URL so it's shareable / back-button friendly
    router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    runSearch(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue("");
    setSearchResults([]);
    setHasSearched(false);
    setActiveQuery("");
    router.push("/search");
  };

  return (
    <MainLayout>
      {/* ── Page header ── */}
      <div className="border-b border-brand-purple/20 px-4 lg:px-8 py-8">
        <div className="container mx-auto">
          <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/30 mb-2">
            Powered by IGDB · 200,000+ games
          </p>
          <h1 className="text-[22px] font-medium tracking-tight text-foreground mb-6">
            Discover Games
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="max-w-xl">
            <div className="flex items-center gap-2 bg-card border border-brand-purple/25 hover:border-brand-purple/45 focus-within:border-brand-purple/60 rounded-xl px-4 py-3 transition-colors">
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-foreground/30 shrink-0 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-foreground/30 shrink-0" />
              )}
              <input
                type="text"
                placeholder="Search by title, developer, genre…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/25 outline-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-foreground/25 hover:text-foreground/60 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-foreground/25 mt-2 ml-1">
              Press enter to search
            </p>
          </form>
        </div>
      </div>

      {/* ── Results / Browse ── */}
      <div className="container mx-auto px-4 lg:px-8 py-8">

        {/* Search results */}
        {hasSearched && (
          <div>
            {isSearching ? (
              <>
                <SectionHeader title="Searching…" />
                <GameGridSkeleton />
              </>
            ) : searchResults.length > 0 ? (
              <>
                <SectionHeader
                  title={`Results for "${activeQuery}"`}
                  count={searchResults.length}
                />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {searchResults.map((game) => (
                    <AutoImportGameCard key={game.id} game={game} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <p className="text-[14px] text-foreground/40 mb-1">
                  No results for "{activeQuery}"
                </p>
                <p className="text-[12px] text-foreground/25">
                  Try different keywords or check your spelling
                </p>
                <button
                  onClick={handleClear}
                  className="mt-6 text-[12px] text-brand-purple hover:text-foreground/70 transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

        {/* Browse tabs — only shown when not searching */}
        {!hasSearched && (
          <div>
            {/* Tab switcher */}
            <div className="flex items-center gap-1 border-b border-brand-purple/15 mb-7">
              {(
                [
                  { key: "popular", label: "Popular", icon: TrendingUp },
                  { key: "recent", label: "New releases", icon: Clock },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                    activeTab === key
                      ? "border-brand-amber text-foreground/90 font-medium"
                      : "border-transparent text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Popular */}
            {activeTab === "popular" && (
              <>
                <SectionHeader title="Popular right now" />
                {isLoadingPopular ? (
                  <GameGridSkeleton />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {popularGames.map((game) => (
                      <AutoImportGameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Recent */}
            {activeTab === "recent" && (
              <>
                <SectionHeader title="New releases" />
                {isLoadingRecent ? (
                  <GameGridSkeleton />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {recentGames.map((game) => (
                      <AutoImportGameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// ─── Export wrapped in Suspense (required for useSearchParams) ────────────────

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-7 w-7 animate-spin text-foreground/20" />
          </div>
        </MainLayout>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}