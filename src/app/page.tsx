"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {MainLayout} from "@/components/layout/main-layout";
import {AutoImportGameCard} from "@/components/games/auto-import-game-card";
import {useAuthStore} from "@/store/auth";
import {getPopularGames, getRecentGames} from "@/lib/search";
import {api} from "@/lib/api";
import {IGDBGame} from "@/lib/api";
import {
    Search,
    ArrowRight,
    Gamepad2,
    Star,
    BookOpen,
    TrendingUp,
    Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
    totalRatings: number;
    totalReviews: number;
    totalLists: number;
    averageRating: number;
}

interface ActivityEvent {
    id: string;
    type: string;
    createdAt: string;
    user: { username: string; avatar: string | null };
    game?: { title: string; slug: string };
    rating?: { score: number };
    review?: { content: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
                           title,
                           href,
                       }: {
    title: string;
    href?: string;
}) {
    return (
        <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/40">
                {title}
            </h2>
            {href && (
                <Link
                    href={href}
                    className="flex items-center gap-1 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                    View all
                    <ArrowRight className="h-3 w-3"/>
                </Link>
            )}
        </div>
    );
}

function StatCard({
                      value,
                      label,
                      icon,
                  }: {
    value: string | number;
    label: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 bg-card border border-brand-purple/15 rounded-lg p-4">
            <div className="text-foreground/30">{icon}</div>
            <div className="text-2xl font-medium tracking-tight text-foreground">
                {value}
            </div>
            <div className="text-[11px] text-foreground/40 uppercase tracking-[0.06em]">
                {label}
            </div>
        </div>
    );
}

function ActivityItem({event}: { event: ActivityEvent }) {
    const initials = event.user.username.substring(0, 2).toUpperCase();

    const actionText = () => {
        switch (event.type) {
            case "RATING":
                return (
                    <>
                        rated{" "}
                        <Link
                            href={`/games/${event.game?.slug}`}
                            className="text-foreground/80 italic hover:text-foreground transition-colors"
                        >
                            {event.game?.title}
                        </Link>{" "}
                        <span className="text-brand-amber font-medium">
              {event.rating?.score}/10
            </span>
                    </>
                );
            case "REVIEW":
                return (
                    <>
                        reviewed{" "}
                        <Link
                            href={`/games/${event.game?.slug}`}
                            className="text-foreground/80 italic hover:text-foreground transition-colors"
                        >
                            {event.game?.title}
                        </Link>
                    </>
                );
            case "LIST_ADD":
                return (
                    <>
                        added{" "}
                        <Link
                            href={`/games/${event.game?.slug}`}
                            className="text-foreground/80 italic hover:text-foreground transition-colors"
                        >
                            {event.game?.title}
                        </Link>{" "}
                        to a list
                    </>
                );
            default:
                return <>logged activity</>;
        }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / 3_600_000);
        if (hours < 1) return "just now";
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="flex items-center gap-3 py-3 border-b border-brand-purple/10 last:border-0">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-brand-purple/30 flex items-center justify-center shrink-0">
                {event.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={event.user.avatar}
                        alt={event.user.username}
                        className="w-7 h-7 rounded-full object-cover"
                    />
                ) : (
                    <span className="text-[10px] font-medium text-foreground/60">
            {initials}
          </span>
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground/50 leading-snug truncate">
                    <Link
                        href={`/users/${event.user.username}`}
                        className="text-foreground/80 font-medium hover:text-foreground transition-colors"
                    >
                        {event.user.username}
                    </Link>{" "}
                    {actionText()}
                </p>
            </div>

            {/* Time */}
            <span className="text-[11px] text-foreground/25 shrink-0">
        {timeAgo(event.createdAt)}
      </span>
        </div>
    );
}

// ─── Hero: authenticated ───────────────────────────────────────────────────────

function AuthenticatedHero({
                               user,
                               stats,
                           }: {
    user: any;
    stats: UserStats | null;
}) {
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="border-b border-brand-purple/20 px-4 lg:px-8 py-10">
            <div className="container mx-auto">
                <p className="text-[11px] uppercase tracking-[0.1em] text-brand-amber mb-2">
                    {greeting}
                </p>
                <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">
                    {user?.username}
                </h1>
                <p className="text-[13px] text-foreground/40 mb-8">
                    Your gaming journal
                </p>

                {/* Stats row */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard
                            value={stats.totalRatings}
                            label="Games rated"
                            icon={<Star className="h-4 w-4"/>}
                        />
                        <StatCard
                            value={stats.totalReviews}
                            label="Reviews written"
                            icon={<BookOpen className="h-4 w-4"/>}
                        />
                        <StatCard
                            value={stats.totalLists}
                            label="Lists"
                            icon={<TrendingUp className="h-4 w-4"/>}
                        />
                        <StatCard
                            value={
                                stats.averageRating ? stats.averageRating.toFixed(1) : "—"
                            }
                            label="Avg. rating"
                            icon={<Star className="h-4 w-4"/>}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Hero: unauthenticated ─────────────────────────────────────────────────────

function GuestHero() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="border-b border-brand-purple/20 px-4 lg:px-8 py-16 md:py-24">
            <div className="container mx-auto max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-4">
                    A home for every game you've played
                </p>
                <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground leading-tight mb-4">
                    Track, review, and discuss
                    <br/>
                    <span className="text-foreground/40">the games that matter to you.</span>
                </h1>
                <p className="text-[14px] text-foreground/40 leading-relaxed mb-10 max-w-lg">
                    GameGauge is a journal for your gaming life — backed by real playtime
                    data, thoughtful reviews, and a community that takes games as seriously
                    as you do.
                </p>

                {/* Inline search */}
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
                    <div
                        className="flex-1 flex items-center gap-3 bg-card border border-brand-purple/25 hover:border-brand-purple/50 focus-within:border-brand-purple/60 rounded-lg px-4 py-3 transition-colors">
                        <Search className="h-4 w-4 text-foreground/30 shrink-0"/>
                        <input
                            type="text"
                            placeholder="Search for a game to get started…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/25 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-brand-purple hover:bg-brand-purple/80 text-foreground text-[13px] font-medium px-5 py-3 rounded-lg transition-colors shrink-0"
                    >
                        Search
                    </button>
                </form>

                {/* CTAs */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/register"
                        className="text-[13px] font-medium text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                        Create a free account
                        <ArrowRight className="h-3.5 w-3.5"/>
                    </Link>
                    <span className="text-foreground/20">·</span>
                    <Link
                        href="/login"
                        className="text-[13px] text-foreground/40 hover:text-foreground/70 transition-colors"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Game grid skeleton ────────────────────────────────────────────────────────

function GameGridSkeleton() {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg bg-card border border-brand-purple/10 animate-pulse"/>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
    const {user, isAuthenticated} = useAuthStore();

    const [popularGames, setPopularGames] = useState<IGDBGame[]>([]);
    const [recentGames, setRecentGames] = useState<IGDBGame[]>([]);
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(false);

    // Load popular games
    useEffect(() => {
        getPopularGames(6).then((games) => {
            setPopularGames(games);
            setLoadingPopular(false);
        });
    }, []);

    // Load recent releases
    useEffect(() => {
        getRecentGames(6).then((games) => {
            setRecentGames(games);
            setLoadingRecent(false);
        });
    }, []);

    // Load user-specific data when authenticated
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // User stats — requires username in path
        api
            .get(`/users/${user.username}/stats`)
            .then((res) => setStats(res.data.data))
            .catch(() => {
            });

        // Activity — also username-scoped
        setLoadingActivity(true);
        api
            .get(`/users/${user.username}/activity`, {params: {limit: 8}})
            .then((res) => setActivity(res.data.data || []))
            .catch(() => {
            })
            .finally(() => setLoadingActivity(false));
    }, [isAuthenticated, user]);

    return (
        <MainLayout>
            {/* ── Hero ── */}
            {isAuthenticated ? (
                <AuthenticatedHero user={user} stats={stats}/>
            ) : (
                <GuestHero/>
            )}

            {/* ── Main content ── */}
            <div className="container mx-auto px-4 lg:px-8 py-10">
                <div className={`grid gap-10 ${isAuthenticated ? "lg:grid-cols-[1fr_300px]" : ""}`}>

                    {/* ── Left column: game sections ── */}
                    <div className="space-y-10">

                        {/* Popular games */}
                        <section>
                            <SectionHeader title="Popular right now" href="/search?sort=popular"/>
                            {loadingPopular ? (
                                <GameGridSkeleton/>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                    {popularGames.map((game) => (
                                        <AutoImportGameCard key={game.id} game={game}/>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Divider */}
                        <div className="h-px bg-brand-purple/15"/>

                        {/* New releases */}
                        <section>
                            <SectionHeader title="New releases" href="/search?sort=recent"/>
                            {loadingRecent ? (
                                <GameGridSkeleton/>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                    {recentGames.map((game) => (
                                        <AutoImportGameCard key={game.id} game={game}/>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── Right column: activity feed (authenticated only) ── */}
                    {isAuthenticated && (
                        <aside>
                            <SectionHeader title="Friend activity"/>
                            <div className="bg-card border border-brand-purple/15 rounded-lg px-4 py-2">
                                {loadingActivity ? (
                                    <div className="space-y-3 py-2">
                                        {Array.from({length: 4}).map((_, i) => (
                                            <div key={i} className="h-8 rounded bg-brand-purple/10 animate-pulse"/>
                                        ))}
                                    </div>
                                ) : activity.length > 0 ? (
                                    activity.map((event) => (
                                        <ActivityItem key={event.id} event={event}/>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <Gamepad2 className="h-6 w-6 text-foreground/20 mx-auto mb-3"/>
                                        <p className="text-[12px] text-foreground/30 leading-relaxed">
                                            No activity yet.
                                            <br/>
                                            Follow other players to see their updates here.
                                        </p>
                                        <Link
                                            href="/search?tab=users"
                                            className="inline-block mt-4 text-[12px] text-brand-purple hover:text-foreground transition-colors"
                                        >
                                            Find people to follow →
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Upsell: connect Steam */}
                            {!(user as any)?.steamId && (
                                <div className="mt-4 bg-card border border-brand-teal/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-brand-teal mt-0.5 shrink-0"/>
                                        <div>
                                            <p className="text-[12px] font-medium text-foreground/70 mb-1">
                                                Connect Steam
                                            </p>
                                            <p className="text-[11px] text-foreground/35 leading-relaxed mb-3">
                                                Sync your library, playtime, and achievements automatically.
                                            </p>
                                            <Link
                                                href="/settings"
                                                className="text-[11px] text-brand-teal hover:text-brand-teal/80 transition-colors"
                                            >
                                                Connect your account →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </aside>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}