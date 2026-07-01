'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, Gamepad2 } from 'lucide-react';
import { api, IGDBGame } from '@/lib/api';
import { DBGame, CommunityData, getIGDBImageUrl } from '@/lib/search';
import { toast } from 'sonner';

type DiscoverGameCardProps =
  | { mode: 'db'; game: DBGame }
  | { mode: 'igdb'; game: IGDBGame; communityData?: CommunityData };

function CardShell({
  coverUrl,
  title,
  averageRating,
  ratingCount,
  releaseYear,
  children,
}: {
  coverUrl: string | null;
  title: string;
  averageRating?: number;
  ratingCount?: number;
  releaseYear?: number | null;
  children?: React.ReactNode;
}) {
  const showRating = averageRating !== undefined && averageRating > 0 && ratingCount !== undefined && ratingCount > 0;

  return (
    <div className="group relative flex flex-col rounded-lg overflow-hidden bg-card border border-brand-purple/20 hover:border-brand-purple/50 transition-[border-color] duration-200 motion-reduce:transition-none cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-purple/10 shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Gamepad2 className="h-8 w-8 text-foreground" aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {showRating && (
          <div
            aria-label={`Community rating: ${averageRating!.toFixed(1)} out of 10`}
            className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5"
          >
            <Star className="h-2.5 w-2.5 fill-brand-amber text-brand-amber" aria-hidden="true" />
            <span className="text-xs font-medium text-brand-amber leading-none">
              {averageRating!.toFixed(1)}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
          <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">
            {title}
          </h3>
          {releaseYear && (
            <span className="text-xs text-white/50">{releaseYear}</span>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

export function DiscoverGameCard(props: DiscoverGameCardProps) {
  if (props.mode === 'db') {
    const { game } = props;
    const releaseYear = game.releaseDate
      ? new Date(game.releaseDate).getFullYear()
      : null;

    return (
      <Link
        href={`/games/${game.slug}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <CardShell
          coverUrl={game.coverImage || null}
          title={game.title}
          averageRating={game.averageRating}
          ratingCount={game.ratingCount}
          releaseYear={releaseYear}
        />
      </Link>
    );
  }

  // igdb mode
  const { game, communityData } = props;
  return <IGDBCard game={game} communityData={communityData} />;
}

function IGDBCard({ game, communityData }: { game: IGDBGame; communityData?: CommunityData }) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  const coverUrl = game.cover?.image_id
    ? getIGDBImageUrl(game.cover.image_id, 'cover_big')
    : null;

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isImporting) return;
    setIsImporting(true);
    try {
      const response = await api.post('/igdb/import', { igdbId: game.id });
      const importedGame = response.data.data;
      router.push(`/games/${importedGame.slug}`);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        "Couldn't open this game right now";
      toast.error(message);
      setIsImporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left bg-transparent border-0 p-0 block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={game.name}
      >
        <CardShell
          coverUrl={coverUrl}
          title={game.name}
          averageRating={communityData?.averageRating}
          ratingCount={communityData?.ratingCount}
          releaseYear={releaseYear}
        />
      </button>

      {isImporting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="h-6 w-6 animate-spin text-brand-purple/60" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
