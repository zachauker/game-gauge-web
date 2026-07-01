'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import {
  FilterChips,
  SortOption,
} from '@/components/discover/FilterChips';
import { CuratedRows } from '@/components/discover/CuratedRows';
import { GameGrid } from '@/components/discover/GameGrid';
import { DiscoverGameCard } from '@/components/discover/DiscoverGameCard';
import {
  searchIGDB,
  getTopRatedGames,
  getTrendingGames,
  getRecentGames,
  getBatchCommunityData,
  getDBGames,
  DBGame,
  CommunityData,
} from '@/lib/search';
import { getIgdbGenreId } from '@/lib/igdb-genres';
import { IGDBGame } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';

const SORT_TO_API: Record<SortOption, { sortBy: string; sortOrder: string }> = {
  'top-rated': { sortBy: 'averageRating', sortOrder: 'desc' },
  'trending': { sortBy: 'createdAt', sortOrder: 'desc' },
  'release-date': { sortBy: 'releaseDate', sortOrder: 'desc' },
  'a-z': { sortBy: 'title', sortOrder: 'asc' },
};

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverContent />
    </Suspense>
  );
}

function DiscoverContent() {
  const searchParams = useSearchParams();

  // URL-driven state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeGenre, setActiveGenre] = useState<string | null>(
    searchParams.get('genre') || null
  );
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<SortOption>('top-rated');

  // showFlat: collapse to flat grid without needing filter chips to be active
  const [showFlat, setShowFlat] = useState(false);
  // retryCount: incremented to re-trigger search effect after error
  const [retryCount, setRetryCount] = useState(0);

  // Data state
  const [topRated, setTopRated] = useState<DBGame[]>([]);
  const [trending, setTrending] = useState<DBGame[]>([]);
  const [newReleases, setNewReleases] = useState<IGDBGame[]>([]);
  const [browseGames, setBrowseGames] = useState<DBGame[]>([]);
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([]);
  const [communityMap, setCommunityMap] = useState<Map<number, CommunityData>>(new Map());

  // Loading/error state
  const [isCuratedLoading, setIsCuratedLoading] = useState(true);
  const [isBrowseLoading, setIsBrowseLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived modes
  const searchMode = query.trim().length > 0;
  const filterMode = !searchMode && (showFlat || activeGenre !== null || activePlatform !== null);

  // Load curated rows on mount and when genre changes (browse mode only)
  useEffect(() => {
    if (searchMode || filterMode) return;
    setIsCuratedLoading(true);
    Promise.all([
      getTopRatedGames(6, activeGenre || undefined),
      getTrendingGames(6, activeGenre || undefined),
      getRecentGames(6),
    ])
      .then(([tr, tw, nr]) => {
        setTopRated(tr);
        setTrending(tw);
        setNewReleases(nr);
      })
      .finally(() => setIsCuratedLoading(false));
  }, [activeGenre, searchMode, filterMode]);

  // Load flat browse grid when in filter mode
  useEffect(() => {
    if (!filterMode) return;
    setIsBrowseLoading(true);
    const { sortBy, sortOrder } = SORT_TO_API[activeSort];
    getDBGames({
      genre: activeGenre || undefined,
      platform: activePlatform || undefined,
      sortBy,
      sortOrder,
      page: browsePage,
      limit: 24,
    })
      .then(({ games, totalPages }) => {
        setBrowseGames(games);
        setBrowseTotalPages(totalPages);
      })
      .finally(() => setIsBrowseLoading(false));
  }, [filterMode, activeGenre, activePlatform, activeSort, browsePage]);

  // Debounced IGDB search
  useEffect(() => {
    if (!searchMode) {
      setSearchResults([]);
      setCommunityMap(new Map());
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearchLoading(true);
      setSearchError(false);
      try {
        const genreId = activeGenre ? getIgdbGenreId(activeGenre) : undefined;
        const { games } = await searchIGDB({ query, limit: 50, genreId });
        setSearchResults(games);
        if (games.length > 0) {
          const ids = games.map(g => g.id);
          const map = await getBatchCommunityData(ids);
          setCommunityMap(map);
        }
      } catch {
        setSearchError(true);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeGenre, searchMode, retryCount]);

  const handleGenreChange = useCallback((genre: string | null) => {
    setActiveGenre(genre);
    setBrowsePage(1);
    if (!genre && !activePlatform) setShowFlat(false);
  }, [activePlatform]);

  const handlePlatformChange = useCallback((platform: string | null) => {
    setActivePlatform(platform);
    setBrowsePage(1);
    if (!platform && !activeGenre) setShowFlat(false);
  }, [activeGenre]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setActiveSort(sort);
    setBrowsePage(1);
  }, []);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (!value) {
      setShowFlat(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowFlat(false);
  };

  const seeAllTopRated = () => {
    setShowFlat(true);
    setActiveSort('top-rated');
    setBrowsePage(1);
  };

  const seeAllTrending = () => {
    setShowFlat(true);
    setActiveSort('trending');
    setBrowsePage(1);
  };

  const seeAllNew = () => {
    setShowFlat(true);
    setActiveSort('release-date');
    setBrowsePage(1);
  };

  const resultLabel = searchMode
    ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${query}"${
        activeGenre ? ` in ${activeGenre}` : ''
      } · via IGDB`
    : null;

  return (
    <MainLayout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-foreground/60 uppercase tracking-widest mb-1">Discover</p>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Games</h1>
        <p className="text-sm text-foreground/60">200,000+ titles · powered by IGDB</p>
      </div>

      {/* Search bar */}
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 mb-4 transition-colors motion-reduce:transition-none ${
        searchMode
          ? 'border-brand-purple/60 bg-brand-purple/5'
          : 'border-brand-purple/30 bg-foreground/[0.03]'
      }`}>
        <Search className="h-4 w-4 text-foreground/30 shrink-0" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by title, developer…"
          value={query}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/50 outline-none"
          aria-label="Search games"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="text-foreground/50 hover:text-foreground/80 transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mb-6">
        <FilterChips
          activeGenre={activeGenre}
          activePlatform={activePlatform}
          activeSort={activeSort}
          searchMode={searchMode}
          onGenreChange={handleGenreChange}
          onPlatformChange={handlePlatformChange}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Body */}
      {searchMode ? (
        <div>
          {resultLabel && (
            <p className="text-xs text-foreground/60 mb-4">{resultLabel}</p>
          )}
          {searchError ? (
            <div className="text-center py-12">
              <p className="text-foreground/60 text-sm mb-3">Search failed. Please try again.</p>
              <button
                type="button"
                onClick={() => setRetryCount(c => c + 1)}
                className="text-xs text-brand-purple hover:text-primary transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try again
              </button>
            </div>
          ) : (
            <GameGrid isLoading={isSearchLoading} skeletonCount={12}>
              {searchResults.map(game => (
                <DiscoverGameCard
                  key={game.id}
                  mode="igdb"
                  game={game}
                  communityData={communityMap.get(game.id)}
                />
              ))}
            </GameGrid>
          )}
        </div>
      ) : filterMode ? (
        <div>
          <GameGrid isLoading={isBrowseLoading} skeletonCount={24}>
            {browseGames.map(game => (
              <DiscoverGameCard key={game.id} mode="db" game={game} />
            ))}
          </GameGrid>
          {browseTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                type="button"
                disabled={browsePage <= 1}
                onClick={() => setBrowsePage(p => p - 1)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground/70 hover:border-brand-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-foreground/60">
                {browsePage} / {browseTotalPages}
              </span>
              <button
                type="button"
                disabled={browsePage >= browseTotalPages}
                onClick={() => setBrowsePage(p => p + 1)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground/70 hover:border-brand-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <CuratedRows
          topRated={topRated}
          trending={trending}
          newReleases={newReleases}
          isLoading={isCuratedLoading}
          onSeeAllTopRated={seeAllTopRated}
          onSeeAllTrending={seeAllTrending}
          onSeeAllNew={seeAllNew}
        />
      )}
    </div>
    </MainLayout>
  );
}
