'use client';

import Link from 'next/link';
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
  emoji,
  title,
  onSeeAll,
}: {
  emoji: string;
  title: string;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-medium text-white/45 uppercase tracking-[0.08em]">
        {emoji} {title}
      </h2>
      <button
        type="button"
        onClick={onSeeAll}
        className="text-xs text-brand-purple/60 hover:text-brand-purple transition-colors"
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
          emoji="⭐"
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
          emoji="🔥"
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
          emoji="🆕"
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
