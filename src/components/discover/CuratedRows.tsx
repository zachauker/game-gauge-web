'use client';

import { Star, TrendingUp, Sparkles } from 'lucide-react';
import { DBGame } from '@/lib/search';
import { IGDBGame } from '@/lib/api';
import { GameGrid } from './GameGrid';
import { DiscoverGameCard } from './DiscoverGameCard';

interface CuratedRowsProps {
  topRated: DBGame[];
  trending: DBGame[];
  newReleases: IGDBGame[];
  isLoading: boolean;
  onSeeAllTopRated: () => void;
  onSeeAllTrending: () => void;
  onSeeAllNew: () => void;
}

function SectionHeader({
  icon: Icon,
  title,
  onSeeAll,
}: {
  icon: typeof Star;
  title: string;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <Icon className="h-4 w-4 text-brand-purple/70" aria-hidden="true" />
        {title}
      </h2>
      <button
        type="button"
        onClick={onSeeAll}
        className="text-xs text-foreground/50 hover:text-foreground/80 transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        See all →
      </button>
    </div>
  );
}

export function CuratedRows({
  topRated,
  trending,
  newReleases,
  isLoading,
  onSeeAllTopRated,
  onSeeAllTrending,
  onSeeAllNew,
}: CuratedRowsProps) {
  return (
    <div className="space-y-10">
      {/* Top Rated */}
      <section>
        <SectionHeader
          icon={Star}
          title="Top Rated on Game Gauge"
          onSeeAll={onSeeAllTopRated}
        />
        <GameGrid isLoading={isLoading} skeletonCount={6}>
          {topRated.map(game => (
            <DiscoverGameCard key={game.id} mode="db" game={game} />
          ))}
        </GameGrid>
      </section>

      {/* Trending */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          title="Trending This Week"
          onSeeAll={onSeeAllTrending}
        />
        <GameGrid isLoading={isLoading} skeletonCount={6}>
          {trending.map(game => (
            <DiscoverGameCard key={game.id} mode="db" game={game} />
          ))}
        </GameGrid>
      </section>

      {/* New Releases */}
      <section>
        <SectionHeader
          icon={Sparkles}
          title="New Releases"
          onSeeAll={onSeeAllNew}
        />
        <GameGrid isLoading={isLoading} skeletonCount={6}>
          {newReleases.map(game => (
            <DiscoverGameCard key={game.id} mode="igdb" game={game} />
          ))}
        </GameGrid>
      </section>
    </div>
  );
}
