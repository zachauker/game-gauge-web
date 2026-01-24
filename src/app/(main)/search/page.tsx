"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/games/game-card";
import { AutoImportGameCard } from "@/components/games/auto-import-game-card";
import { searchIGDB, getPopularGames, getRecentGames } from "@/lib/search";
import { IGDBGame } from "@/lib/api";
import { Search, Loader2, TrendingUp, Clock } from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([]);
  const [popularGames, setPopularGames] = useState<IGDBGame[]>([]);
  const [recentGames, setRecentGames] = useState<IGDBGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");

  // Load popular games on mount
  useEffect(() => {
    loadPopularGames();
  }, []);

  // Load recent games when tab is clicked
  useEffect(() => {
    if (activeTab === "recent" && recentGames.length === 0) {
      loadRecentGames();
    }
  }, [activeTab]);

  const loadPopularGames = async () => {
    setIsLoadingPopular(true);
    try {
      const games = await getPopularGames(20);
      setPopularGames(games);
    } catch (error) {
      console.error("Failed to load popular games:", error);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  const loadRecentGames = async () => {
    setIsLoadingRecent(true);
    try {
      const games = await getRecentGames(20);
      setRecentGames(games);
    } catch (error) {
      console.error("Failed to load recent games:", error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const { games } = await searchIGDB({ query: searchQuery });
      setSearchResults(games);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Games</h1>
          <p className="text-muted-foreground">
            Search from 200,000+ games powered by IGDB
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
            {hasSearched && (
              <Button
                type="button"
                variant="outline"
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Search Results */}
        {hasSearched && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Search Results
              {searchResults.length > 0 && (
                <span className="text-muted-foreground text-lg ml-2">
                  ({searchResults.length} found)
                </span>
              )}
            </h2>

            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((game) => (
                  <AutoImportGameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No games found for "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try different keywords or check the spelling
                </p>
              </div>
            )}
          </div>
        )}

        {/* Browse Tabs (only show when not searching) */}
        {!hasSearched && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular Games
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="h-4 w-4" />
                Recent Releases
              </TabsTrigger>
            </TabsList>

            {/* Popular Games Tab */}
            <TabsContent value="popular">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Popular Games</h2>
                <p className="text-muted-foreground">
                  Top-rated games on IGDB
                </p>
              </div>

              {isLoadingPopular ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : popularGames.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {popularGames.map((game) => (
                    <AutoImportGameCard key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Failed to load popular games
                  </p>
                  <Button
                    variant="outline"
                    onClick={loadPopularGames}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Recent Games Tab */}
            <TabsContent value="recent">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Recent Releases</h2>
                <p className="text-muted-foreground">
                  Games released in the last 6 months
                </p>
              </div>

              {isLoadingRecent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recentGames.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentGames.map((game) => (
                    <AutoImportGameCard key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Failed to load recent games
                  </p>
                  <Button
                    variant="outline"
                    onClick={loadRecentGames}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
