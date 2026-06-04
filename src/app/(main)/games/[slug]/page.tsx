"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { RatingDialog } from "@/components/games/rating-dialog";
import { RatingStats } from "@/components/games/rating-stats";
import { ReviewList } from "@/components/reviews/review-list";
import { WriteReviewDialog } from "@/components/reviews/write-review-dialog";
import { AddToListDialog } from "@/components/lists/add-to-list-dialog";
import { api, getErrorMessage, RatingStats as RatingStatsType } from "@/lib/api";
import { getMyLists } from "@/lib/lists";
import { useAuthStore } from "@/store/auth";
import {
  Star,
  Gamepad,
  Loader2,
  ChevronLeft,
  MessageSquare,
  ListPlus,
  Pencil,
  CheckCircle2,
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

interface Review {
  id: string;
  content: string;
  spoilers: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; avatar: string | null };
  rating?: { id: string; score: number } | null;
  _count?: { helpfulVotes: number };
}

/** A list that contains this game, keyed by listType for display. */
interface UserListStatus {
  id: string;
  name: string;
  listType: string;
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

function Tag({ label, href }: { label: string; href?: string }) {
  const cls =
    "inline-block text-[11px] px-2.5 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/20 text-foreground/50 hover:text-foreground/70 hover:border-brand-purple/40 transition-colors cursor-default";
  if (href) return <Link href={href} className={cls}>{label}</Link>;
  return <span className={cls}>{label}</span>;
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
    default: "bg-card border-brand-purple/20 hover:border-brand-purple/40 text-foreground/60 hover:text-foreground/80",
    primary: "bg-brand-purple/20 border-brand-purple/40 hover:bg-brand-purple/30 text-foreground/80 hover:text-foreground",
    amber:   "bg-brand-amber/10 border-brand-amber/25 hover:bg-brand-amber/15 text-brand-amber",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight">{label}</div>
        {sublabel && <div className="text-[11px] opacity-60 mt-0.5">{sublabel}</div>}
      </div>
    </button>
  );
}

// ─── List status chips ────────────────────────────────────────────────────────
// Shown in the sidebar when the game is already in one or more of the user's lists.

const LIST_TYPE_LABEL: Record<string, string> = {
  wishlist:  "Wishlist",
  playing:   "Playing",
  completed: "Completed",
};

function ListStatusChips({ statuses }: { statuses: UserListStatus[] }) {
  if (statuses.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1">
      {statuses.map((s) => (
        <Link
          key={s.id}
          href={`/lists/${s.id}`}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal hover:bg-brand-teal/20 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          {LIST_TYPE_LABEL[s.listType] ?? s.name}
        </Link>
      ))}
    </div>
  );
}

// ─── Top review preview ───────────────────────────────────────────────────────
// Condensed best-review card shown at the bottom of the Overview tab.

function TopReviewPreview({
  review,
  onReadAll,
  totalReviews,
}: {
  review: Review;
  onReadAll: () => void;
  totalReviews: number;
}) {
  const score    = review.rating?.score;
  const initials = review.user.username.substring(0, 2).toUpperCase();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30">
          Community highlight
        </h3>
        <button
          onClick={onReadAll}
          className="text-[11px] text-foreground/30 hover:text-brand-purple transition-colors"
        >
          Read all {totalReviews} review{totalReviews !== 1 ? "s" : ""} →
        </button>
      </div>

      <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-lg p-4">
        {/* Reviewer header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-7 w-7 rounded-full bg-brand-purple/25 flex items-center justify-center shrink-0 overflow-hidden">
            {review.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.user.avatar} alt={review.user.username} className="h-7 w-7 object-cover" />
            ) : (
              <span className="text-[9px] font-medium text-foreground/60">{initials}</span>
            )}
          </div>
          <Link
            href={`/users/${review.user.username}`}
            className="text-[12px] font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            {review.user.username}
          </Link>
          {score && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-brand-amber">
              <Star className="h-3 w-3 fill-brand-amber" />
              {score}/10
            </span>
          )}
        </div>

        {/* Excerpt — spoilered reviews show a placeholder */}
        {review.spoilers ? (
          <p className="text-[12px] text-foreground/30 italic">
            This review contains spoilers.
          </p>
        ) : (
          <p className="text-[13px] text-foreground/55 leading-relaxed italic line-clamp-4">
            &ldquo;{review.content}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const slug    = params.slug as string;

  // ── Core game state ──────────────────────────────────────────────────────
  const [game, setGame]             = useState<Game | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string>("");
  const [activeTab, setActiveTab]   = useState<"overview" | "reviews">("overview");

  // ── Ratings ──────────────────────────────────────────────────────────────
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [userRating, setUserRating]             = useState<number | null>(null);
  const [ratingStats, setRatingStats]           = useState<RatingStatsType | null>(null);

  // ── Lists ────────────────────────────────────────────────────────────────
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [listStatuses, setListStatuses]               = useState<UserListStatus[]>([]);

  // ── Review write dialog (opened directly from sidebar) ───────────────────
  const [showWriteReviewDialog, setShowWriteReviewDialog] = useState(false);

  // ── Top review for overview tab ──────────────────────────────────────────
  const [topReview, setTopReview]         = useState<Review | null>(null);
  const [totalReviews, setTotalReviews]   = useState(0);

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadGameDetails();
  }, [slug]);

  useEffect(() => {
    if (game) {
      loadRatings();
      loadTopReview();
    }
  }, [game?.id, isAuthenticated]);

  useEffect(() => {
    // Load which of the user's lists contain this game
    if (isAuthenticated && game) loadListStatuses();
  }, [isAuthenticated, game?.id]);

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
      // ratings may not exist yet — silent fail
    }
  };

  const loadTopReview = async () => {
    if (!game) return;
    try {
      const res = await api.get(
        `/games/${game.id}/reviews?page=1&limit=1&sortBy=helpfulCount&sortOrder=desc`
      );
      const reviews: Review[] = res.data.data ?? [];
      const pagination        = res.data.pagination;
      setTopReview(reviews[0] ?? null);
      setTotalReviews(pagination?.total ?? reviews.length);
    } catch {
      setTopReview(null);
    }
  };

  const loadListStatuses = async () => {
    if (!game) return;
    try {
      // Fetch all user lists and find which ones contain this game
      const lists = await getMyLists();
      const containing = lists.filter((l) =>
        (l.items ?? []).some((item: any) => item.gameId === game.id)
      );
      setListStatuses(
        containing.map((l) => ({ id: l.id, name: l.name, listType: l.listType ?? "" }))
      );
    } catch {
      // Non-critical — don't surface this error
    }
  };

  const handleRatingSubmit = async (score: number) => {
    if (!game) return;
    await api.post(`/games/${game.id}/rating`, { score });
    setUserRating(score);
    await loadRatings();
  };

  // After a review is written via the sidebar button, refresh the top review
  const handleReviewCreate = async (data: { content: string; spoilers: boolean }) => {
    if (!game) return;
    await api.post(`/games/${game.id}/reviews`, data);
    await loadTopReview();
  };

  const releaseYear = game?.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple/50" />
        </div>
      </MainLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

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

  // ── Main render ───────────────────────────────────────────────────────────

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

            {/* Community score under cover */}
            {ratingStats && ratingStats.totalRatings > 0 && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-brand-amber text-brand-amber" />
                  <span className="text-[15px] font-medium text-foreground/80">
                    {ratingStats.averageScore.toFixed(1)}
                  </span>
                </div>
                <span className="text-[11px] text-foreground/30">
                  {ratingStats.totalRatings.toLocaleString()} rating{ratingStats.totalRatings !== 1 ? "s" : ""}
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

            {/* Tab bar */}
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
                      {totalReviews > 0 && (
                        <span className="text-[11px] text-foreground/30">({totalReviews})</span>
                      )}
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
                  <p className="text-[14px] text-foreground/55 leading-relaxed whitespace-pre-wrap">
                    {game.description}
                  </p>
                )}

                {/* Genres */}
                {game.genres.length > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-3">
                      Genres
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {game.genres.map((g) => (
                        <Tag key={g} label={g} href={`/browse/genre/${encodeURIComponent(g)}`} />
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

                {/* Rating distribution */}
                {ratingStats && ratingStats.totalRatings > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-4">
                      Community ratings
                    </h3>
                    <RatingStats stats={ratingStats} />
                  </div>
                )}

                {/* Top review preview — shown when at least one review exists */}
                {topReview && (
                  <TopReviewPreview
                    review={topReview}
                    totalReviews={totalReviews}
                    onReadAll={() => setActiveTab("reviews")}
                  />
                )}

              </div>
            ) : (
              /* Reviews tab — passes a callback so the sidebar write button can
                 also trigger a refresh of the top review on the overview tab    */
              <ReviewList
                gameId={game.id}
                onReviewChange={loadTopReview}
              />
            )}
          </div>

          {/* ── Col 3: Actions + details ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">

            {/* Rate */}
            {isAuthenticated ? (
              <ActionButton
                onClick={() => setShowRatingDialog(true)}
                variant={userRating ? "amber" : "primary"}
                icon={<Star className={`h-4 w-4 ${userRating ? "fill-brand-amber text-brand-amber" : ""}`} />}
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

            {/* Write review — opens dialog directly, no tab switch */}
            {isAuthenticated && (
              <ActionButton
                onClick={() => setShowWriteReviewDialog(true)}
                icon={<Pencil className="h-4 w-4" />}
                label="Write a review"
              />
            )}

            {/* List status chips — which lists already contain this game */}
            <ListStatusChips statuses={listStatuses} />

            {/* Metadata card */}
            <div className="bg-card border border-brand-purple/15 rounded-lg px-4 py-2 mt-2">
              {game.developer && <MetaRow label="Developer" value={game.developer} />}
              {game.publisher && <MetaRow label="Publisher" value={game.publisher} />}
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
      {/* Write review dialog — triggered directly from sidebar button */}
      <WriteReviewDialog
        open={showWriteReviewDialog}
        onOpenChange={setShowWriteReviewDialog}
        onSubmit={handleReviewCreate}
        mode="create"
      />
    </MainLayout>
  );
}
