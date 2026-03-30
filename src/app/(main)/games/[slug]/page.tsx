"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { RatingDialog } from "@/components/games/rating-dialog";
import { RatingStats } from "@/components/games/rating-stats";
import { ReviewList } from "@/components/reviews/review-list";
import { AddToListDialog } from "@/components/lists/add-to-list-dialog";
import { api, getErrorMessage, RatingStats as RatingStatsType } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  Star,
  Gamepad,
  Loader2,
  ChevronLeft,
  MessageSquare,
  ListPlus,
  Pencil,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Game {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  platforms: string[];
  metacritic: number | null;
  igdbId: number | null;
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-brand-purple/10 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.07em] text-foreground/35 shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-foreground/70 text-right">{value}</span>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[11px] px-2.5 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/20 text-foreground/50 hover:text-foreground/70 hover:border-brand-purple/40 transition-colors cursor-default">
      {label}
    </span>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  sublabel,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  variant?: "default" | "primary" | "amber";
}) {
  const base =
    "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 text-left cursor-pointer";
  const variants = {
    default:
      "bg-card border-brand-purple/20 hover:border-brand-purple/40 text-foreground/60 hover:text-foreground/80",
    primary:
      "bg-brand-purple/20 border-brand-purple/40 hover:bg-brand-purple/30 text-foreground/80 hover:text-foreground",
    amber:
      "bg-brand-amber/10 border-brand-amber/25 hover:bg-brand-amber/15 text-brand-amber",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight">{label}</div>
        {sublabel && (
          <div className="text-[11px] opacity-60 mt-0.5">{sublabel}</div>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const slug = params.slug as string;

  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");

  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStatsType | null>(null);

  const [showAddToListDialog, setShowAddToListDialog] = useState(false);

  useEffect(() => {
    loadGameDetails();
  }, [slug]);

  useEffect(() => {
    if (game) loadRatings();
  }, [game?.id, isAuthenticated]);

  const loadGameDetails = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.get(`/games/slug/${slug}`);
      setGame(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRatings = async () => {
    if (!game) return;
    try {
      if (isAuthenticated) {
        try {
          const res = await api.get(`/games/${game.id}/rating/me`);
          setUserRating(res.data.data?.score ?? null);
        } catch {
          setUserRating(null);
        }
      }
      const statsRes = await api.get(`/games/${game.id}/rating/stats`);
      setRatingStats(statsRes.data.data);
    } catch {
      // ratings may not exist yet — silent fail is fine
    }
  };

  const handleRatingSubmit = async (score: number) => {
    if (!game) return;
    await api.post(`/games/${game.id}/rating`, { score });
    setUserRating(score);
    await loadRatings();
  };

  const releaseYear = game?.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple/50" />
        </div>
      </MainLayout>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !game) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-foreground/40 mb-4 text-[14px]">
            {error || "This game couldn't be found."}
          </p>
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

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <MainLayout>
      {/* ── Cinematic backdrop ── */}
      {game.coverImage && (
        <div className="absolute inset-x-0 top-14 h-[340px] overflow-hidden pointer-events-none -z-0">
          <Image
            src={game.coverImage}
            alt=""
            fill
            className="object-cover object-top scale-110"
            style={{ filter: "blur(40px)", opacity: 0.12 }}
            priority
            aria-hidden
          />
          {/* Fade out to background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-8">

        {/* ── Back nav ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-foreground/35 hover:text-foreground/70 transition-colors mb-8"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-8 lg:gap-10">

          {/* ── Col 1: Cover ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-brand-purple/10 border border-brand-purple/20 shadow-[0_8px_32px_rgba(77,64,117,0.25)]">
              {game.coverImage ? (
                <Image
                  src={game.coverImage}
                  alt={game.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="220px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gamepad className="h-12 w-12 text-foreground/10" />
                </div>
              )}
            </div>

            {/* Community score pill under cover */}
            {ratingStats && ratingStats.totalRatings > 0 && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-brand-amber text-brand-amber" />
                  <span className="text-[15px] font-medium text-foreground/80">
                    {ratingStats.averageScore.toFixed(1)}
                  </span>
                </div>
                <span className="text-[11px] text-foreground/30">
                  {ratingStats.totalRatings.toLocaleString()} rating
                  {ratingStats.totalRatings !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* ── Col 2: Info ── */}
          <div className="min-w-0 space-y-8">

            {/* Title + meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {releaseYear && (
                  <span className="text-[11px] uppercase tracking-[0.08em] text-foreground/35">
                    {releaseYear}
                  </span>
                )}
                {game.developer && (
                  <>
                    <span className="text-foreground/20">·</span>
                    <span className="text-[11px] uppercase tracking-[0.08em] text-foreground/35">
                      {game.developer}
                    </span>
                  </>
                )}
                {game.metacritic && (
                  <>
                    <span className="text-foreground/20">·</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-brand-teal/15 border border-brand-teal/25 text-brand-teal">
                      MC {game.metacritic}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-[26px] md:text-[32px] font-medium tracking-tight text-foreground leading-tight">
                {game.title}
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-brand-purple/15">
              {(["overview", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-[13px] capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-brand-amber text-foreground/90 font-medium"
                      : "border-transparent text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  {tab === "reviews" ? (
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Reviews
                    </span>
                  ) : (
                    "Overview"
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" ? (
              <div className="space-y-8">

                {/* Description */}
                {game.description && (
                  <div>
                    <p className="text-[14px] text-foreground/55 leading-relaxed whitespace-pre-wrap">
                      {game.description}
                    </p>
                  </div>
                )}

                {/* Genres */}
                {game.genres.length > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-3">
                      Genres
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {game.genres.map((g) => (
                        <Link key={g} href={`/browse/genre/${encodeURIComponent(g)}`}>
                          <Tag label={g} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platforms */}
                {game.platforms.length > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-3">
                      Platforms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {game.platforms.map((p) => (
                        <Tag key={p} label={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating stats */}
                {ratingStats && ratingStats.totalRatings > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-4">
                      Community ratings
                    </h3>
                    <RatingStats stats={ratingStats} />
                  </div>
                )}
              </div>
            ) : (
              <ReviewList gameId={game.id} />
            )}
          </div>

          {/* ── Col 3: Actions + details ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">

            {/* Your rating */}
            {isAuthenticated ? (
              <ActionButton
                onClick={() => setShowRatingDialog(true)}
                variant={userRating ? "amber" : "primary"}
                icon={
                  <Star
                    className={`h-4 w-4 ${userRating ? "fill-brand-amber text-brand-amber" : ""}`}
                  />
                }
                label={userRating ? `Your rating: ${userRating}/10` : "Rate this game"}
                sublabel={userRating ? "Tap to update" : undefined}
              />
            ) : (
              <Link href="/login">
                <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-brand-purple/20 bg-card text-foreground/40 text-[13px] hover:border-brand-purple/40 transition-colors cursor-pointer">
                  <Star className="h-4 w-4 shrink-0" />
                  Sign in to rate
                </div>
              </Link>
            )}

            {/* Add to list */}
            {isAuthenticated && (
              <ActionButton
                onClick={() => setShowAddToListDialog(true)}
                icon={<ListPlus className="h-4 w-4" />}
                label="Add to list"
              />
            )}

            {/* Write review */}
            {isAuthenticated && (
              <ActionButton
                onClick={() => setActiveTab("reviews")}
                icon={<Pencil className="h-4 w-4" />}
                label="Write a review"
              />
            )}

            {/* Metadata card */}
            <div className="bg-card border border-brand-purple/15 rounded-lg px-4 py-2 mt-2">
              {game.developer && (
                <MetaRow label="Developer" value={game.developer} />
              )}
              {game.publisher && (
                <MetaRow label="Publisher" value={game.publisher} />
              )}
              {game.releaseDate && (
                <MetaRow
                  label="Released"
                  value={new Date(game.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              )}
              {game.metacritic && (
                <MetaRow label="Metacritic" value={String(game.metacritic)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <RatingDialog
        gameName={game.title}
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        onSubmit={handleRatingSubmit}
        currentRating={userRating || undefined}
      />
      <AddToListDialog
        open={showAddToListDialog}
        onOpenChange={setShowAddToListDialog}
        gameId={game.id}
        gameTitle={game.title}
      />
    </MainLayout>
  );
}