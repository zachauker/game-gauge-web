"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MainLayout } from "@/components/layout/main-layout";
import { api } from "@/lib/api";
import { Loader2, TrendingUp, Star, MessageSquare, Gamepad2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Game {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  releaseDate: string | null;
  genres: string[];
  platforms: string[];
  _count?: { ratings: number; reviews: number };
  averageRating?: number;
  ratingCount?: number;
  activityCount?: number;
}

type BrowseTab = "top-rated" | "trending" | "recently-reviewed";

// ─── Game card ────────────────────────────────────────────────────────────────

function BrowseGameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex flex-col bg-card border border-brand-purple/15 hover:border-brand-purple/40 rounded-lg overflow-hidden transition-colors"
    >
      {/* Cover */}
      <div className="aspect-[3/4] relative overflow-hidden bg-brand-purple/10 shrink-0">
        {game.coverImage ? (
          <Image
            src={game.coverImage}
            alt={game.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-[11px]">
            No image
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-2.5 flex flex-col gap-1">
        <h3 className="text-[12px] font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5em]">
          {game.title}
        </h3>
        {game.averageRating !== undefined && (
          <div className="flex items-center gap-1 text-[11px] text-foreground/40">
            <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
            <span className="text-brand-amber font-medium">{game.averageRating.toFixed(1)}</span>
            <span>({game.ratingCount})</span>
          </div>
        )}
        {game._count && !game.averageRating && (
          <p className="text-[11px] text-foreground/30">
            {game._count.ratings} ratings · {game._count.reviews} reviews
          </p>
        )}
        {game.activityCount !== undefined && !game._count && (
          <p className="text-[11px] text-foreground/30">{game.activityCount} recent</p>
        )}
      </div>
    </Link>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: { id: BrowseTab; label: string; icon: React.ReactNode }[] = [
  { id: "top-rated",         label: "Top Rated",         icon: <Star className="h-3.5 w-3.5" /> },
  { id: "trending",          label: "Trending",          icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: "recently-reviewed", label: "Recently Reviewed", icon: <MessageSquare className="h-3.5 w-3.5" /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const router = useRouter();

  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [topRated, setTopRated] = useState<Game[]>([]);
  const [trending, setTrending] = useState<Game[]>([]);
  const [recentlyReviewed, setRecentlyReviewed] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BrowseTab>("top-rated");

  useEffect(() => {
    loadBrowseData();
  }, []);

  const loadBrowseData = async () => {
    try {
      setIsLoading(true);
      const [genresRes, platformsRes, topRatedRes, trendingRes, recentlyReviewedRes] =
        await Promise.all([
          api.get("/games/genres"),
          api.get("/games/platforms"),
          api.get("/games/top-rated?limit=12"),
          api.get("/games/trending?limit=12"),
          api.get("/games/recently-reviewed?limit=12"),
        ]);
      setGenres(genresRes.data.data || []);
      setPlatforms(platformsRes.data.data || []);
      setTopRated(topRatedRes.data.data || []);
      setTrending(trendingRes.data.data || []);
      setRecentlyReviewed(recentlyReviewedRes.data.data || []);
    } catch {
      toast.error("Failed to load browse data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatGenreName = (genre: string) =>
    genre
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const activeGames =
    activeTab === "top-rated"
      ? topRated
      : activeTab === "trending"
      ? trending
      : recentlyReviewed;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40 mb-1">
            Discover
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Browse Games
          </h1>
          <p className="text-[13px] text-foreground/40 mt-1">
            Discover games by genre, see what's trending, and find your next favourite.
          </p>
        </div>

        {/* ── Featured sections (tabbed) ── */}
        <section className="mb-12">
          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-6 border-b border-brand-purple/15 pb-0">
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === id
                    ? "border-brand-amber text-brand-amber"
                    : "border-transparent text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Game grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3">
            {activeGames.map((game) => (
              <BrowseGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-brand-purple/15 mb-10" />

        {/* ── Browse by Genre ── */}
        <section className="mb-10">
          <div className="flex items-baseline gap-2 mb-5">
            <Gamepad2 className="h-4 w-4 text-foreground/30" />
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/40">
              Browse by Genre
            </h2>
          </div>

          {genres.length === 0 ? (
            <p className="text-[13px] text-foreground/30">No genres available yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/browse/genre/${encodeURIComponent(genre)}`}
                  className="flex items-center justify-between px-4 py-3 bg-card border border-brand-purple/15 hover:border-brand-purple/35 rounded-lg group transition-colors"
                >
                  <span className="text-[13px] text-foreground/70 group-hover:text-foreground transition-colors">
                    {formatGenreName(genre)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-foreground/25 group-hover:text-foreground/50 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Browse by Platform ── */}
        {platforms.length > 0 && (
          <section>
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/40 mb-5">
              Browse by Platform
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => router.push(`/search?platform=${encodeURIComponent(platform)}`)}
                  className="flex items-center justify-between px-4 py-3 bg-card border border-brand-purple/15 hover:border-brand-purple/35 rounded-lg group text-left transition-colors"
                >
                  <span className="text-[13px] text-foreground/70 group-hover:text-foreground transition-colors">
                    {platform}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-foreground/25 group-hover:text-foreground/50 transition-colors" />
                </button>
              ))}
            </div>
          </section>
        )}

      </div>
    </MainLayout>
  );
}
