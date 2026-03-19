"use client";

import {useState, useEffect} from "react";
import {useParams, useRouter} from "next/navigation";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {SteamProfileSection} from "@/components/steam/steam-profile-section";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {FollowButton} from "@/components/social/follow-button";
import {FollowStats} from "@/components/social/follow-stats";
import {ActivityFeed} from "@/components/social/activity-feed";
import {api} from "@/lib/api";
import {useAuthStore} from "@/store/auth";
import {
    User,
    Calendar,
    Star,
    MessageSquare,
    List,
    Loader2,
    Settings,
    ChevronLeft,
    Activity,
} from "lucide-react";
import {toast} from "sonner";

// ─── Local types ───────────────────────────────────────────────────────────

interface UserProfile {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatar: string | null;
    createdAt: string;
    _count: {
        ratings: number;
        reviews: number;
        lists: number;
    };
}

interface UserStats {
    totalRatings: number;
    totalReviews: number;
    totalLists: number;
    averageRating: number;
    publicListsCount: number;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    isFollowedBy: boolean;
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

// ─── Page ──────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const {user: currentUser, isAuthenticated} = useAuthStore();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);
    const [publicLists, setPublicLists] = useState<GameList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Local follow state so FollowButton updates the stat bar in real time
    const [followerCount, setFollowerCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwnProfile = currentUser?.username === username;

    useEffect(() => {
        loadProfile();
    }, [username]);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            setError("");

            const [profileRes, statsRes] = await Promise.all([
                api.get(`/users/${username}`),
                api.get(`/users/${username}/stats`),
            ]);

            const profileData = profileRes.data.data;
            const statsData = statsRes.data.data;

            setProfile(profileData);
            setStats(statsData);
            setFollowerCount(statsData.followerCount ?? 0);
            setIsFollowing(statsData.isFollowing ?? false);

            // Fetch ratings, reviews, and lists in parallel now that we have the userId
            const [ratingsRes, reviewsRes, listsRes] = await Promise.all([
                api.get(`/games/ratings/user/${profileData.id}?limit=10`).catch(() => ({data: {data: []}})),
                api.get(`/games/reviews/user/${profileData.id}?limit=10`).catch(() => ({data: {data: []}})),
                api.get(`/lists/user/${profileData.id}?limit=10`).catch(() => ({data: {data: []}})),
            ]);

            setRecentRatings(ratingsRes.data.data ?? []);
            setRecentReviews(reviewsRes.data.data ?? []);
            setPublicLists(listsRes.data.data ?? []);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || "Failed to load profile");
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const formatJoinDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });

    // ── Loading / error states ────────────────────────────────────────────────

    if (isLoading) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error || !profile) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
                        <p className="text-muted-foreground mb-6">
                            {error || "This user doesn't exist."}
                        </p>
                        <Button onClick={() => router.back()}>
                            <ChevronLeft className="mr-2 h-4 w-4"/>
                            Go Back
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const displayName =
        profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile.username;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* ── Profile Header ─────────────────────────────────────────── */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">

                                {/* Avatar */}
                                <Avatar className="h-20 w-20 shrink-0">
                                    {profile.avatar && (
                                        <AvatarImage src={profile.avatar} alt={displayName}/>
                                    )}
                                    <AvatarFallback className="text-2xl">
                                        {profile.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h1 className="text-2xl font-bold">{displayName}</h1>
                                            {displayName !== profile.username && (
                                                <p className="text-muted-foreground text-sm">
                                                    @{profile.username}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2 shrink-0">
                                            {isOwnProfile ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push("/settings")}
                                                >
                                                    <Settings className="mr-1.5 h-4 w-4"/>
                                                    Edit Profile
                                                </Button>
                                            ) : isAuthenticated ? (
                                                <FollowButton
                                                    username={profile.username}
                                                    initialIsFollowing={isFollowing}
                                                    initialFollowerCount={followerCount}
                                                    onToggle={(nowFollowing) => {
                                                        setIsFollowing(nowFollowing);
                                                        setFollowerCount((c) =>
                                                            nowFollowing ? c + 1 : c - 1
                                                        );
                                                    }}
                                                />
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Follow stats */}
                                    <FollowStats
                                        username={profile.username}
                                        followerCount={followerCount}
                                        followingCount={stats?.followingCount ?? 0}
                                    />

                                    {profile.bio && (
                                        <p className="text-sm text-muted-foreground">{profile.bio}</p>
                                    )}

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5"/>
                      Joined {formatJoinDate(profile.createdAt)}
                    </span>
                                        {stats && (
                                            <>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5"/>
                            {stats.totalRatings} ratings
                        </span>
                                                <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5"/>
                                                    {stats.totalReviews} reviews
                        </span>
                                                <span className="flex items-center gap-1">
                          <List className="h-3.5 w-3.5"/>
                                                    {stats.publicListsCount} lists
                        </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isOwnProfile && (
                        <SteamProfileSection isOwnProfile={isOwnProfile}/>
                    )}

                    {/* ── Tabs ──────────────────────────────────────────────────── */}
                    <Tabs defaultValue="activity">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="activity" className="gap-1.5">
                                <Activity className="h-4 w-4"/>
                                Activity
                            </TabsTrigger>
                            <TabsTrigger value="ratings" className="gap-1.5">
                                <Star className="h-4 w-4"/>
                                Ratings
                            </TabsTrigger>
                            <TabsTrigger value="reviews" className="gap-1.5">
                                <MessageSquare className="h-4 w-4"/>
                                Reviews
                            </TabsTrigger>
                            <TabsTrigger value="lists" className="gap-1.5">
                                <List className="h-4 w-4"/>
                                Lists
                            </TabsTrigger>
                        </TabsList>

                        {/* Activity tab */}
                        <TabsContent value="activity" className="mt-4">
                            <ActivityFeed
                                mode="user"
                                username={profile.username}
                                isOwnActivity={isOwnProfile}
                                emptyMessage={
                                    isOwnProfile
                                        ? "Your activity will appear here as you rate, review, and track games."
                                        : `${profile.username} hasn't done anything yet.`
                                }
                            />
                        </TabsContent>

                        {/* Ratings tab */}
                        <TabsContent value="ratings" className="mt-4">
                            {recentRatings.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No ratings yet.
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {recentRatings.map((r) => (
                                        <Card key={r.id} className="hover:bg-accent/30 transition-colors">
                                            <CardContent className="flex items-center gap-3 py-3">
                                                <div
                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/10 shrink-0">
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                            {r.score}
                          </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {r.game.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(r.createdAt)}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Reviews tab */}
                        <TabsContent value="reviews" className="mt-4">
                            {recentReviews.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No reviews yet.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {recentReviews.map((rev) => (
                                        <Card key={rev.id}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <p className="text-sm font-medium">{rev.game.title}</p>
                                                        {rev.spoilers ? (
                                                            <p className="text-xs text-muted-foreground italic">
                                                                [Spoilers hidden]
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                                {rev.content}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(rev.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Lists tab */}
                        <TabsContent value="lists" className="mt-4">
                            {publicLists.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No public lists yet.
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {publicLists.map((list) => (
                                        <Card
                                            key={list.id}
                                            className="cursor-pointer hover:bg-accent/30 transition-colors"
                                            onClick={() => router.push(`/lists/${list.id}`)}
                                        >
                                            <CardContent className="py-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-sm font-medium">{list.name}</p>
                                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                                        {list._count.items} games
                                                    </Badge>
                                                </div>
                                                {list.description && (
                                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                                        {list.description}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </MainLayout>
    );
}