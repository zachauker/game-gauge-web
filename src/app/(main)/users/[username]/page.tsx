"use client";

import React, {useState, useEffect} from "react";
import {useParams, useRouter} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {MainLayout} from "@/components/layout/main-layout";
import {SteamProfileSection} from "@/components/steam/steam-profile-section";
import {api} from "@/lib/api";
import {useAuthStore} from "@/store/auth";
import {
    Star,
    MessageSquare,
    List,
    Loader2,
    Settings,
    ChevronLeft,
    Calendar,
    BookOpen,
} from "lucide-react";
import {toast} from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatar: string | null;
    createdAt: string;
    _count: { ratings: number; reviews: number; lists: number };
}

interface UserStats {
    totalRatings: number;
    totalReviews: number;
    totalLists: number;
    averageRating: number;
    publicListsCount: number;
}

interface Rating {
    id: string;
    score: number;
    createdAt: string;
    game: {
        id: string;
        title: string;
        slug: string;
        coverImage: string | null;
        releaseDate: string | null;
    };
}

interface Review {
    id: string;
    content: string;
    spoilers: boolean;
    createdAt: string;
    game: {
        id: string;
        title: string;
        slug: string;
        coverImage: string | null;
    };
    _count: { helpfulVotes: number };
}

interface GameList {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
    _count: { items: number };
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatPill({
                      value,
                      label,
                  }: {
    value: string | number;
    label: string;
}) {
    return (
        <div className="text-center px-4 first:pl-0 last:pr-0 border-r border-brand-purple/15 last:border-0">
            <p className="text-[18px] font-medium text-foreground leading-tight tabular-nums">
                {value}
            </p>
            <p className="text-[11px] text-foreground/35 uppercase tracking-[0.06em] mt-0.5">
                {label}
            </p>
        </div>
    );
}

function TabButton({
                       active,
                       onClick,
                       icon,
                       label,
                   }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                active
                    ? "border-brand-amber text-foreground/90 font-medium"
                    : "border-transparent text-foreground/40 hover:text-foreground/70"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function timeAgo(dateString: string): string {
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

// ─── Ratings tab ──────────────────────────────────────────────────────────────

function RatingsTab({ratings}: { ratings: Rating[] }) {
    if (ratings.length === 0) {
        return (
            <div className="py-14 text-center">
                <Star className="h-7 w-7 text-foreground/10 mx-auto mb-3"/>
                <p className="text-[13px] text-foreground/35">No ratings yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {ratings.map((rating) => (
                <Link
                    key={rating.id}
                    href={`/games/${rating.game.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group"
                >
                    {/* Cover */}
                    <div className="w-9 h-12 rounded overflow-hidden bg-brand-purple/10 shrink-0 relative">
                        {rating.game.coverImage ? (
                            <Image
                                src={rating.game.coverImage}
                                alt={rating.game.title}
                                fill
                                className="object-cover"
                                sizes="36px"
                            />
                        ) : null}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
                            {rating.game.title}
                        </p>
                        <p className="text-[11px] text-foreground/30 mt-0.5">
                            {timeAgo(rating.createdAt)}
                        </p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-3 w-3 fill-brand-amber text-brand-amber"/>
                        <span className="text-[13px] font-medium text-brand-amber tabular-nums">
              {rating.score}
            </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ─── Reviews tab ──────────────────────────────────────────────────────────────

function ReviewsTab({reviews}: { reviews: Review[] }) {
    if (reviews.length === 0) {
        return (
            <div className="py-14 text-center">
                <MessageSquare className="h-7 w-7 text-foreground/10 mx-auto mb-3"/>
                <p className="text-[13px] text-foreground/35">No reviews yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {reviews.map((review) => (
                <Link
                    key={review.id}
                    href={`/games/${review.game.slug}`}
                    className="block p-4 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group"
                >
                    {/* Game name + date */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-9 rounded overflow-hidden bg-brand-purple/10 shrink-0 relative">
                                {review.game.coverImage ? (
                                    <Image
                                        src={review.game.coverImage}
                                        alt={review.game.title}
                                        fill
                                        className="object-cover"
                                        sizes="28px"
                                    />
                                ) : null}
                            </div>
                            <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
                                {review.game.title}
                            </p>
                        </div>
                        <span className="text-[11px] text-foreground/25 shrink-0">
              {timeAgo(review.createdAt)}
            </span>
                    </div>

                    {/* Excerpt */}
                    {review.spoilers ? (
                        <p className="text-[12px] text-foreground/30 italic">
                            Contains spoilers — click to read
                        </p>
                    ) : (
                        <p className="text-[12px] text-foreground/50 leading-relaxed line-clamp-2">
                            {review.content}
                        </p>
                    )}

                    {/* Helpful count */}
                    {review._count.helpfulVotes > 0 && (
                        <p className="text-[11px] text-foreground/25 mt-2">
                            {review._count.helpfulVotes} found this helpful
                        </p>
                    )}
                </Link>
            ))}
        </div>
    );
}

// ─── Lists tab ────────────────────────────────────────────────────────────────

function ListsTab({lists}: { lists: GameList[] }) {
    if (lists.length === 0) {
        return (
            <div className="py-14 text-center">
                <List className="h-7 w-7 text-foreground/10 mx-auto mb-3"/>
                <p className="text-[13px] text-foreground/35">No public lists</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {lists.map((list) => (
                <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-card border border-brand-purple/10 hover:border-brand-purple/25 transition-colors group"
                >
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
                            {list.name}
                        </p>
                        {list.description && (
                            <p className="text-[11px] text-foreground/35 truncate mt-0.5">
                                {list.description}
                            </p>
                        )}
                    </div>
                    <span className="text-[11px] text-foreground/30 shrink-0 ml-4">
            {list._count.items} game{list._count.items !== 1 ? "s" : ""}
          </span>
                </Link>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const {user: currentUser} = useAuthStore();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);
    const [publicLists, setPublicLists] = useState<GameList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"ratings" | "reviews" | "lists">(
        "ratings"
    );

    const isOwnProfile = currentUser?.username === username;

    useEffect(() => {
        loadProfile();
    }, [username]);

    const loadProfile = async () => {
        setIsLoading(true);
        setError("");
        try {
            const [profileRes, statsRes] = await Promise.all([
                api.get(`/users/${username}`),
                api.get(`/users/${username}/stats`),
            ]);

            const profileData = profileRes.data.data;
            setProfile(profileData);
            setStats(statsRes.data.data);

            // Use dedicated endpoints with the user's ID — these return
            // the correct shape with game data included
            const [ratingsRes, reviewsRes, listsRes] = await Promise.all([
                api.get(`/ratings/me/recent?limit=12`).catch(() =>
                    // Fall back to empty if not authenticated (viewing someone else's profile)
                    ({data: {data: []}})
                ),
                api.get(`/reviews/me/recent?limit=12`).catch(() =>
                    ({data: {data: []}})
                ),
                api.get(`/lists/user/${profileData.id}?limit=12`),
            ]);

            setRecentRatings(ratingsRes.data.data || []);
            setRecentReviews(reviewsRes.data.data || []);
            setPublicLists(listsRes.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || "Failed to load profile");
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-7 w-7 animate-spin text-foreground/20"/>
                </div>
            </MainLayout>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────

    if (error || !profile) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-[14px] text-foreground/40 mb-4">
                        {error || "This user couldn't be found."}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="text-[13px] text-brand-purple hover:text-foreground/70 transition-colors"
                    >
                        ← Go back
                    </button>
                </div>
            </MainLayout>
        );
    }

    const displayName =
        profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile.username;

    const initials = profile.username.substring(0, 2).toUpperCase();

    const joinYear = new Date(profile.createdAt).getFullYear();

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <MainLayout>
            <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">

                {/* ── Back ── */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors mb-8"
                >
                    <ChevronLeft className="h-3.5 w-3.5"/>
                    Back
                </button>

                {/* ── Profile header ── */}
                <div className="flex items-start gap-5 mb-8">
                    {/* Avatar */}
                    <div
                        className="h-20 w-20 rounded-full bg-brand-purple/25 border-2 border-brand-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {profile.avatar ? (
                            <Image
                                src={profile.avatar}
                                alt={displayName}
                                width={80}
                                height={80}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-[22px] font-medium text-foreground/50">
                {initials}
              </span>
                        )}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-[20px] font-medium tracking-tight text-foreground leading-tight">
                                    {displayName}
                                </h1>
                                {profile.firstName && profile.lastName && (
                                    <p className="text-[13px] text-foreground/40 mt-0.5">
                                        @{profile.username}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            {isOwnProfile ? (
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-1.5 text-[12px] text-foreground/40 hover:text-foreground/70 bg-card border border-brand-purple/20 hover:border-brand-purple/35 rounded-lg px-3 py-1.5 transition-all shrink-0"
                                >
                                    <Settings className="h-3.5 w-3.5"/>
                                    Edit profile
                                </Link>
                            ) : (
                                <button
                                    className="text-[12px] font-medium text-foreground bg-brand-purple hover:bg-brand-purple/80 rounded-lg px-4 py-1.5 transition-colors shrink-0">
                                    Follow
                                </button>
                            )}
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="text-[13px] text-foreground/50 leading-relaxed mt-2 max-w-lg">
                                {profile.bio}
                            </p>
                        )}

                        {/* Join date */}
                        <p className="flex items-center gap-1.5 text-[11px] text-foreground/25 mt-2">
                            <Calendar className="h-3 w-3"/>
                            Member since {joinYear}
                        </p>
                    </div>
                </div>

                {/* ── Stats row ── */}
                {stats && (
                    <div className="flex items-center gap-0 mb-8 p-4 bg-card border border-brand-purple/15 rounded-lg">
                        <StatPill value={stats.totalRatings} label="Ratings"/>
                        <StatPill value={stats.totalReviews} label="Reviews"/>
                        <StatPill value={stats.publicListsCount} label="Lists"/>
                        <StatPill
                            value={
                                stats.averageRating > 0
                                    ? stats.averageRating.toFixed(1)
                                    : "—"
                            }
                            label="Avg score"
                        />
                    </div>
                )}

                {/* ── Two column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">

                    {/* ── Left: Activity tabs ── */}
                    <div>
                        {/* Tab bar */}
                        <div className="flex items-center border-b border-brand-purple/15 mb-6">
                            <TabButton
                                active={activeTab === "ratings"}
                                onClick={() => setActiveTab("ratings")}
                                icon={<Star className="h-3.5 w-3.5"/>}
                                label="Ratings"
                            />
                            <TabButton
                                active={activeTab === "reviews"}
                                onClick={() => setActiveTab("reviews")}
                                icon={<BookOpen className="h-3.5 w-3.5"/>}
                                label="Reviews"
                            />
                            <TabButton
                                active={activeTab === "lists"}
                                onClick={() => setActiveTab("lists")}
                                icon={<List className="h-3.5 w-3.5"/>}
                                label="Lists"
                            />
                        </div>

                        {/* Tab content */}
                        {activeTab === "ratings" && (
                            <RatingsTab ratings={recentRatings}/>
                        )}
                        {activeTab === "reviews" && (
                            <ReviewsTab reviews={recentReviews}/>
                        )}
                        {activeTab === "lists" && <ListsTab lists={publicLists}/>}
                    </div>

                    {/* ── Right: Steam section (own profile) or minimal sidebar ── */}
                    <div className="space-y-4">
                        {isOwnProfile ? (
                            <SteamProfileSection isOwnProfile={isOwnProfile}/>
                        ) : (
                            /* Visitor view — show a taste summary if stats available */
                            stats && stats.averageRating > 0 && (
                                <div className="bg-card border border-brand-purple/15 rounded-lg p-4 space-y-3">
                                    <h3 className="text-[11px] uppercase tracking-[0.08em] text-foreground/30">
                                        Taste profile
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                    <span className="text-[28px] font-medium text-foreground/80 tabular-nums">
                      {stats.averageRating.toFixed(1)}
                    </span>
                                        <span className="text-[12px] text-foreground/30">
                      avg score
                    </span>
                                    </div>
                                    <p className="text-[11px] text-foreground/30 leading-relaxed">
                                        Based on {stats.totalRatings} rating
                                        {stats.totalRatings !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}