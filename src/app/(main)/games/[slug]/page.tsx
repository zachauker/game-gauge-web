"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { MainLayout } from "@/components/layout/main-layout";
import { RatingDialog } from "@/components/games/rating-dialog";
import { RatingStats } from "@/components/games/rating-stats";
import { ReviewList } from "@/components/reviews/review-list";
import { WriteReviewDialog } from "@/components/reviews/write-review-dialog";
import { AddToListDialog } from "@/components/lists/add-to-list-dialog";
import { ShareToDialog } from "@/components/messages/share-to-dialog";
import { AutoImportGameCard } from "@/components/games/auto-import-game-card";
import { api, getErrorMessage, RatingStats as RatingStatsType, IGDBGame } from "@/lib/api";
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
  Share2,
  CheckCircle2,
  Users,
  Play,
  Images,
  ExternalLink,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Game {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  storyline: string | null;
  coverImage: string | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  themes: string[];
  gameModes: string[];
  perspectives: string[];
  platforms: string[];
  franchise: string | null;
  ageRating: string | null;
  metacritic: number | null;
  igdbRating: number | null;
  igdbRatingCount: number | null;
  websiteOfficial: string | null;
  websiteSteam: string | null;
  igdbId: number | null;
}

interface GameMedia {
  screenshots: Array<{ imageId: string; url: string }>;
  videos: Array<{ videoId: string; name: string }>;
}

interface FriendActivity {
  user:      { id: string; username: string; avatar: string | null };
  score:     number;
  hasReview: boolean;
  ratedAt:   string;
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

interface UserListStatus {
  id: string;
  name: string;
  listType: string;
}

// ─── Reusable primitives ──────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-brand-purple/10 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.07em] text-foreground/35 shrink-0">{label}</span>
      <span className="text-[13px] text-foreground/70 text-right">{value}</span>
    </div>
  );
}

function Tag({ label, href }: { label: string; href?: string }) {
  const cls = "inline-block text-[11px] px-2.5 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/20 text-foreground/50 hover:text-foreground/70 hover:border-brand-purple/40 transition-colors";
  return href
    ? <Link href={href} className={cls}>{label}</Link>
    : <span className={cls}>{label}</span>;
}

function ActionButton({
  onClick, icon, label, sublabel, variant = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  variant?: "default" | "primary" | "amber";
}) {
  const variants = {
    default: "bg-card border-brand-purple/20 hover:border-brand-purple/40 text-foreground/60 hover:text-foreground/80",
    primary: "bg-brand-purple/20 border-brand-purple/40 hover:bg-brand-purple/30 text-foreground/80 hover:text-foreground",
    amber:   "bg-brand-amber/10 border-brand-amber/25 hover:bg-brand-amber/15 text-brand-amber",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 text-left cursor-pointer ${variants[variant]}`}
    >
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight">{label}</div>
        {sublabel && <div className="text-[11px] opacity-60 mt-0.5">{sublabel}</div>}
      </div>
    </button>
  );
}

// ─── List status chips ────────────────────────────────────────────────────────

const LIST_TYPE_LABEL: Record<string, string> = {
  wishlist: "Wishlist", playing: "Playing", completed: "Completed",
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

// ─── Friends activity panel ───────────────────────────────────────────────────

function FriendsActivityPanel({ friends }: { friends: FriendActivity[] }) {
  if (friends.length === 0) return null;
  return (
    <div className="bg-card border border-brand-purple/15 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-foreground/30" />
        <span className="text-[11px] uppercase tracking-[0.07em] text-foreground/35">Friends</span>
      </div>
      <div className="space-y-2.5">
        {friends.map((f) => {
          const initials = f.user.username.substring(0, 2).toUpperCase();
          return (
            <div key={f.user.id} className="flex items-center gap-2.5">
              <Link href={`/users/${f.user.username}`} className="shrink-0">
                <div className="h-7 w-7 rounded-full bg-brand-purple/20 flex items-center justify-center overflow-hidden">
                  {f.user.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={f.user.avatar} alt={f.user.username} className="h-7 w-7 object-cover" />
                    : <span className="text-[9px] font-medium text-foreground/60">{initials}</span>}
                </div>
              </Link>
              <Link href={`/users/${f.user.username}`} className="flex-1 text-[12px] text-foreground/60 hover:text-foreground transition-colors truncate">
                {f.user.username}
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[12px] font-medium text-brand-amber tabular-nums">{f.score}</span>
                {f.hasReview && (
                  <span title="Has a review"><MessageSquare className="h-3 w-3 text-brand-teal" /></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top review preview ───────────────────────────────────────────────────────

function TopReviewPreview({ review, onReadAll, totalReviews }: {
  review: Review;
  onReadAll: () => void;
  totalReviews: number;
}) {
  const score    = review.rating?.score;
  const initials = review.user.username.substring(0, 2).toUpperCase();
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30">Community highlight</h3>
        <button onClick={onReadAll} className="text-[11px] text-foreground/30 hover:text-brand-purple transition-colors">
          Read all {totalReviews} review{totalReviews !== 1 ? "s" : ""} →
        </button>
      </div>
      <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-lg p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-7 w-7 rounded-full bg-brand-purple/25 flex items-center justify-center shrink-0 overflow-hidden">
            {review.user.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={review.user.avatar} alt={review.user.username} className="h-7 w-7 object-cover" />
              : <span className="text-[9px] font-medium text-foreground/60">{initials}</span>}
          </div>
          <Link href={`/users/${review.user.username}`} className="text-[12px] font-medium text-foreground/70 hover:text-foreground transition-colors">
            {review.user.username}
          </Link>
          {score && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-brand-amber">
              <Star className="h-3 w-3 fill-brand-amber" />{score}/10
            </span>
          )}
        </div>
        {review.spoilers
          ? <p className="text-[12px] text-foreground/30 italic">This review contains spoilers.</p>
          : <p className="text-[13px] text-foreground/55 leading-relaxed italic line-clamp-4">&ldquo;{review.content}&rdquo;</p>}
      </div>
    </div>
  );
}

// ─── Trailer embed ────────────────────────────────────────────────────────────

function TrailerEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="rounded-lg overflow-hidden bg-black aspect-video relative group">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <>
          {/* YouTube thumbnail as poster */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Play button overlay */}
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors"
            aria-label="Play trailer"
          >
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
              <Play className="h-7 w-7 fill-white text-white ml-1" />
            </div>
          </button>
          {/* Video label */}
          <div className="absolute bottom-3 left-3 text-[11px] text-white/60 font-medium tracking-wide">
            {title}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Screenshot grid ──────────────────────────────────────────────────────────

function ScreenshotGrid({
  screenshots,
  onOpen,
}: {
  screenshots: Array<{ imageId: string; url: string }>;
  onOpen: (index: number) => void;
}) {
  if (screenshots.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {screenshots.map((s, i) => (
        <button
          key={s.imageId}
          onClick={() => onOpen(i)}
          className="relative aspect-video rounded-lg overflow-hidden bg-brand-purple/10 group focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.url.replace('screenshot_huge', 'screenshot_med')}
            alt={`Screenshot ${i + 1}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
          />
        </button>
      ))}
    </div>
  );
}

// ─── Age rating badge ─────────────────────────────────────────────────────────

const ESRB_COLOURS: Record<string, string> = {
  E:    "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
  "E10+": "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
  T:    "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  M:    "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
  AO:   "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
};

function AgeRatingBadge({ rating }: { rating: string }) {
  const colourClass = ESRB_COLOURS[rating] ?? "bg-brand-slate/10 border-brand-slate/20 text-foreground/50";
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${colourClass}`}>
      {rating}
    </span>
  );
}

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = "overview" | "media" | "reviews";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const slug = params.slug as string;

  // ── Core ─────────────────────────────────────────────────────────────────
  const [game, setGame]           = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ── Ratings ──────────────────────────────────────────────────────────────
  const [showRatingDialog, setShowRatingDialog]   = useState(false);
  const [userRating, setUserRating]               = useState<number | null>(null);
  const [ratingStats, setRatingStats]             = useState<RatingStatsType | null>(null);

  // ── Lists ────────────────────────────────────────────────────────────────
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [listStatuses, setListStatuses]               = useState<UserListStatus[]>([]);

  // ── Review write ─────────────────────────────────────────────────────────
  const [showWriteReviewDialog, setShowWriteReviewDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [topReview, setTopReview]                         = useState<Review | null>(null);
  const [totalReviews, setTotalReviews]                   = useState(0);

  // ── Media ────────────────────────────────────────────────────────────────
  const [media, setMedia]                   = useState<GameMedia>({ screenshots: [], videos: [] });
  const [lightboxIndex, setLightboxIndex]   = useState(-1); // -1 = closed

  // ── Similar games ────────────────────────────────────────────────────────
  const [similarGames, setSimilarGames] = useState<IGDBGame[]>([]);

  // ── Social ───────────────────────────────────────────────────────────────
  const [friendsActivity, setFriendsActivity] = useState<FriendActivity[]>([]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => { loadGameDetails(); }, [slug]);

  useEffect(() => {
    if (!game) return;
    loadRatings();
    loadTopReview();
    loadFriendsActivity();
    if (game.igdbId) {
      loadMedia(game.igdbId);
      loadSimilarGames(game.igdbId);
    }
  }, [game?.id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && game) loadListStatuses();
  }, [isAuthenticated, game?.id]);

  const loadGameDetails = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.get(`/games/slug/${slug}`);
      const data = res.data.data;

      // Normalise array fields — games imported before the metadata migration
      // have null rather than [] for these columns. Coerce to empty arrays so
      // downstream .length / .map calls never throw.
      setGame({
        ...data,
        genres:       data.genres       ?? [],
        themes:       data.themes       ?? [],
        gameModes:    data.gameModes     ?? [],
        perspectives: data.perspectives ?? [],
        platforms:    data.platforms    ?? [],
      });
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
        } catch { setUserRating(null); }
      }
      const statsRes = await api.get(`/games/${game.id}/rating/stats`);
      setRatingStats(statsRes.data.data);
    } catch { /* silent — ratings may not exist yet */ }
  };

  const loadTopReview = async () => {
    if (!game) return;
    try {
      const res = await api.get(`/games/${game.id}/reviews?page=1&limit=1&sortBy=helpfulCount&sortOrder=desc`);
      setTopReview(res.data.data?.[0] ?? null);
      setTotalReviews(res.data.pagination?.total ?? 0);
    } catch { setTopReview(null); }
  };

  const loadListStatuses = async () => {
    if (!game) return;
    try {
      const lists = await getMyLists();
      const containing = lists.filter((l) =>
        (l.items ?? []).some((item: any) => item.gameId === game.id)
      );
      setListStatuses(containing.map((l) => ({ id: l.id, name: l.name, listType: l.listType ?? "" })));
    } catch { /* non-critical */ }
  };

  const loadFriendsActivity = async () => {
    if (!game) return;
    try {
      const res = await api.get(`/games/${game.id}/friends-activity`);
      setFriendsActivity(res.data.data ?? []);
    } catch { /* non-critical */ }
  };

  const loadMedia = async (igdbId: number) => {
    try {
      const res = await api.get(`/igdb/media/${igdbId}`);
      setMedia(res.data.data ?? { screenshots: [], videos: [] });
    } catch { /* non-critical */ }
  };

  const loadSimilarGames = async (igdbId: number) => {
    try {
      const res = await api.get(`/igdb/similar/${igdbId}`);
      setSimilarGames(res.data.data ?? []);
    } catch { /* non-critical */ }
  };

  const handleRatingSubmit = async (score: number) => {
    if (!game) return;
    await api.post(`/games/${game.id}/rating`, { score });
    setUserRating(score);
    await loadRatings();
  };

  const handleReviewCreate = async (data: { content: string; spoilers: boolean }) => {
    if (!game) return;
    await api.post(`/games/${game.id}/reviews`, data);
    await loadTopReview();
  };

  const releaseYear = game?.releaseDate ? new Date(game.releaseDate).getFullYear() : null;

  // Whether the Media tab should be surfaced at all
  const hasMedia = media.screenshots.length > 0 || media.videos.length > 1;

  // Lightbox slides from screenshots array
  const lightboxSlides = media.screenshots.map((s) => ({ src: s.url }));

  // ── Loading / error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple/50" />
        </div>
      </MainLayout>
    );
  }

  if (error || !game) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-foreground/40 mb-4 text-[14px]">{error || "This game couldn't be found."}</p>
          <button onClick={() => router.back()} className="text-[13px] text-brand-purple hover:text-foreground transition-colors">
            ← Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  // Trailer = first video; additional videos shown in Media tab
  const primaryVideo   = media.videos[0] ?? null;
  const additionalVideos = media.videos.slice(1);

  return (
    <MainLayout>
      {/* ── Cinematic backdrop ── */}
      {game.coverImage && (
        <div className="absolute inset-x-0 top-14 h-[340px] overflow-hidden pointer-events-none -z-0">
          <Image src={game.coverImage} alt="" fill className="object-cover object-top scale-110"
            style={{ filter: "blur(40px)", opacity: 0.12 }} priority aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-8">

        {/* ── Back nav ── */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-foreground/35 hover:text-foreground/70 transition-colors mb-8">
          <ChevronLeft className="h-3.5 w-3.5" />Back
        </button>

        {/* ── Main grid: cover | info | sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-8 lg:gap-10">

          {/* ── Col 1: Cover ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-brand-purple/10 border border-brand-purple/20 shadow-[0_8px_32px_rgba(77,64,117,0.25)]">
              {game.coverImage
                ? <Image src={game.coverImage} alt={game.title} fill className="object-cover" priority sizes="220px" />
                : <div className="absolute inset-0 flex items-center justify-center"><Gamepad className="h-12 w-12 text-foreground/10" /></div>}
            </div>

            {/* Community score */}
            {ratingStats && ratingStats.totalRatings > 0 && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-brand-amber text-brand-amber" />
                  <span className="text-[15px] font-medium text-foreground/80">{ratingStats.averageScore.toFixed(1)}</span>
                </div>
                <span className="text-[11px] text-foreground/30">
                  {ratingStats.totalRatings.toLocaleString()} rating{ratingStats.totalRatings !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* ── Col 2: Main content ── */}
          <div className="min-w-0 space-y-8">

            {/* Title + meta line */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Franchise chip */}
                {game.franchise && (
                  <span className="text-[11px] text-brand-amber/80 uppercase tracking-[0.08em]">
                    {game.franchise}
                  </span>
                )}
                {game.franchise && (releaseYear || game.developer) && (
                  <span className="text-foreground/20">·</span>
                )}
                {releaseYear && (
                  <span className="text-[11px] uppercase tracking-[0.08em] text-foreground/35">{releaseYear}</span>
                )}
                {game.developer && (
                  <>
                    <span className="text-foreground/20">·</span>
                    <span className="text-[11px] uppercase tracking-[0.08em] text-foreground/35">{game.developer}</span>
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
                {game.ageRating && <AgeRatingBadge rating={game.ageRating} />}
              </div>
              <h1 className="text-[26px] md:text-[32px] font-medium tracking-tight text-foreground leading-tight">
                {game.title}
              </h1>
            </div>

            {/* ── Trailer (primary video) — featured above tabs ── */}
            {primaryVideo && (
              <TrailerEmbed videoId={primaryVideo.videoId} title={primaryVideo.name} />
            )}

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-brand-purple/15">
              {(["overview", ...(hasMedia ? ["media"] : []), "reviews"] as Tab[]).map((tab) => (
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
                      <MessageSquare className="h-3.5 w-3.5" />Reviews
                      {totalReviews > 0 && <span className="text-[11px] text-foreground/30">({totalReviews})</span>}
                    </span>
                  ) : tab === "media" ? (
                    <span className="flex items-center gap-1.5">
                      <Images className="h-3.5 w-3.5" />Media
                    </span>
                  ) : "Overview"}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <div className="space-y-8">

                {/* Description */}
                {game.description && (
                  <p className="text-[14px] text-foreground/55 leading-relaxed whitespace-pre-wrap">
                    {game.description}
                  </p>
                )}

                {/* Storyline — shown if different content exists */}
                {game.storyline && game.storyline !== game.description && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-2">Storyline</h3>
                    <p className="text-[13px] text-foreground/45 leading-relaxed italic whitespace-pre-wrap">
                      {game.storyline}
                    </p>
                  </div>
                )}

                {/* Tag rows: Genres, Themes, Game Modes, Perspectives, Platforms */}
                {[
                  { label: "Genres",      items: game.genres,       getHref: (g: string) => `/browse/genre/${encodeURIComponent(g)}` },
                  { label: "Themes",      items: game.themes,       getHref: undefined },
                  { label: "Game modes",  items: game.gameModes,    getHref: undefined },
                  { label: "Perspective", items: game.perspectives, getHref: undefined },
                  { label: "Platforms",   items: game.platforms,    getHref: undefined },
                ].filter(({ items }) => (items?.length ?? 0) > 0).map(({ label, items, getHref }) => (
                  <div key={label}>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-3">{label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <Tag key={item} label={item} href={getHref ? getHref(item) : undefined} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Rating distribution */}
                {ratingStats && ratingStats.totalRatings > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-4">Community ratings</h3>
                    <RatingStats stats={ratingStats} />
                  </div>
                )}

                {/* Top review preview */}
                {topReview && (
                  <TopReviewPreview review={topReview} totalReviews={totalReviews} onReadAll={() => setActiveTab("reviews")} />
                )}

                {/* Similar games */}
                {similarGames.length > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-4">More like this</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                      {similarGames.map((g) => (
                        <div key={g.id} className="shrink-0 w-[120px]">
                          <AutoImportGameCard game={g} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Media tab ── */}
            {activeTab === "media" && (
              <div className="space-y-8">

                {/* Additional videos */}
                {additionalVideos.length > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-4">Videos</h3>
                    <div className="space-y-4">
                      {additionalVideos.map((v) => (
                        <TrailerEmbed key={v.videoId} videoId={v.videoId} title={v.name} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {media.screenshots.length > 0 && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30 mb-4">
                      Screenshots
                      <span className="text-foreground/25 normal-case tracking-normal ml-1.5">({media.screenshots.length})</span>
                    </h3>
                    <ScreenshotGrid
                      screenshots={media.screenshots}
                      onOpen={(index) => setLightboxIndex(index)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Reviews tab ── */}
            {activeTab === "reviews" && (
              <ReviewList
                gameId={game.id}
                onReviewChange={loadTopReview}
              />
            )}
          </div>

          {/* ── Col 3: Sidebar ── */}
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
                  <Star className="h-4 w-4 shrink-0" />Sign in to rate
                </div>
              </Link>
            )}

            {isAuthenticated && (
              <ActionButton onClick={() => setShowAddToListDialog(true)} icon={<ListPlus className="h-4 w-4" />} label="Add to list" />
            )}
            {isAuthenticated && (
              <ActionButton onClick={() => setShowWriteReviewDialog(true)} icon={<Pencil className="h-4 w-4" />} label="Write a review" />
            )}
            {isAuthenticated && (
              <ActionButton onClick={() => setShowShareDialog(true)} icon={<Share2 className="h-4 w-4" />} label="Share" />
            )}

            {/* List status chips */}
            <ListStatusChips statuses={listStatuses} />

            {/* Friends' ratings */}
            <FriendsActivityPanel friends={friendsActivity} />

            {/* Metadata card */}
            <div className="bg-card border border-brand-purple/15 rounded-lg px-4 py-2">
              {game.developer  && <MetaRow label="Developer" value={game.developer} />}
              {game.publisher  && <MetaRow label="Publisher" value={game.publisher} />}
              {game.franchise  && <MetaRow label="Series" value={game.franchise} />}
              {game.releaseDate && (
                <MetaRow label="Released"
                  value={new Date(game.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              )}
              {game.metacritic    && <MetaRow label="Critic score" value={`${game.metacritic} / 100`} />}
              {game.igdbRating    && game.igdbRatingCount && (
                <MetaRow label="User score" value={`${game.igdbRating.toFixed(1)} / 10 (${game.igdbRatingCount.toLocaleString()} votes)`} />
              )}
              {game.ageRating     && <MetaRow label="Rating" value={game.ageRating} />}
            </div>

            {/* External links */}
            {(game.websiteOfficial || game.websiteSteam) && (
              <div className="bg-card border border-brand-purple/15 rounded-lg px-4 py-3 space-y-2">
                {game.websiteOfficial && (
                  <a href={game.websiteOfficial} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px] text-foreground/50 hover:text-foreground/80 transition-colors">
                    <Globe className="h-3.5 w-3.5 shrink-0" />Official site
                    <ExternalLink className="h-3 w-3 ml-auto text-foreground/25" />
                  </a>
                )}
                {game.websiteSteam && (
                  <a href={game.websiteSteam} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px] text-foreground/50 hover:text-foreground/80 transition-colors">
                    {/* Steam icon */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                    </svg>
                    Steam store
                    <ExternalLink className="h-3 w-3 ml-auto text-foreground/25" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={lightboxSlides}
      />

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
      <WriteReviewDialog
        open={showWriteReviewDialog}
        onOpenChange={setShowWriteReviewDialog}
        onSubmit={handleReviewCreate}
        mode="create"
      />
      <ShareToDialog
        type="GAME_SHARE"
        entityId={game.id}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </MainLayout>
  );
}
