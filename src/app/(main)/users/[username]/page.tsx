"use client";

import {useState, useEffect} from "react";
import {useParams, useRouter} from "next/navigation";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {SteamProfileSection} from "@/components/steam/steam-profile-section";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
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
} from "lucide-react";
import {toast} from "sonner";

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
    _count: {
        helpfulVotes: number;
    };
}

interface GameList {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
    _count: {
        items: number;
    };
}

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

    const isOwnProfile = currentUser?.username === username;

    useEffect(() => {
        loadProfile();
    }, [username]);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            setError("");

            const [profileRes, statsRes, activityRes] = await Promise.all([
                api.get(`/users/${username}`),
                api.get(`/users/${username}/stats`),
                api.get(`/users/${username}/activity?limit=10`),
            ]);

            const profileData = profileRes.data.data;
            setProfile(profileData);
            setStats(statsRes.data.data);
            setRecentRatings(activityRes.data.data.ratings || []);
            setRecentReviews(activityRes.data.data.reviews || []);

            // Fetch lists now that we have the user ID
            const listsRes = await api.get(`/lists/user/${profileData.id}?limit=10`);
            setPublicLists(listsRes.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || "Failed to load profile");
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatJoinDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

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

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="mb-4"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4"/>
                            Back
                        </Button>

                        {isOwnProfile && (
                            <Button
                                variant="outline"
                                onClick={() => router.push("/settings")}
                            >
                                <Settings className="mr-2 h-4 w-4"/>
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div
                            className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profile.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="h-16 w-16 text-muted-foreground"/>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{displayName}</h1>
                            <p className="text-xl text-muted-foreground mb-4">
                                @{profile.username}
                            </p>

                            {profile.bio && (
                                <p className="text-muted-foreground mb-4">{profile.bio}</p>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4"/>
                                <span>Joined {formatJoinDate(profile.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Star className="h-6 w-6 text-primary"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {stats.totalRatings}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Ratings</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <MessageSquare className="h-6 w-6 text-primary"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {stats.totalReviews}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Reviews</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <List className="h-6 w-6 text-primary"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalLists}</p>
                                        <p className="text-sm text-muted-foreground">Lists</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Star className="h-6 w-6 text-primary fill-primary"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {stats.averageRating.toFixed(1)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Avg Rating
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isOwnProfile && (
                    <SteamProfileSection isOwnProfile={isOwnProfile}/>
                )}

                {/* Activity Tabs */}
                <Tabs defaultValue="ratings" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ratings">Recent Ratings</TabsTrigger>
                        <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
                        <TabsTrigger value="lists">Public Lists</TabsTrigger>
                    </TabsList>

                    {/* Ratings Tab */}
                    <TabsContent value="ratings">
                        {recentRatings.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                                    <p className="text-muted-foreground">
                                        No ratings yet
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentRatings.map((rating) => (
                                    <Card
                                        key={rating.id}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => router.push(`/games/${rating.game.slug}`)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                {rating.game.coverImage ? (
                                                    <div
                                                        className="w-16 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                                                        <img
                                                            src={rating.game.coverImage}
                                                            alt={rating.game.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-16 h-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              No Image
                            </span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold truncate mb-1">
                                                        {rating.game.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="secondary">
                                                            <Star className="h-3 w-3 mr-1 fill-current"/>
                                                            {rating.score}/10
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(rating.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews">
                        {recentReviews.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                                    <p className="text-muted-foreground">
                                        No reviews yet
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {recentReviews.map((review) => (
                                    <Card
                                        key={review.id}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => router.push(`/games/${review.game.id}`)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                {review.game.coverImage && (
                                                    <div
                                                        className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                                        <img
                                                            src={review.game.coverImage}
                                                            alt={review.game.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold mb-2">
                                                        {review.game.title}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                                                        {review.content}
                                                    </p>
                                                    <div
                                                        className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>{formatDate(review.createdAt)}</span>
                                                        {review._count.helpfulVotes > 0 && (
                                                            <span>
                                {review._count.helpfulVotes} helpful
                              </span>
                                                        )}
                                                        {review.spoilers && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Spoilers
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Lists Tab */}
                    {/* Lists Tab */}
                    <TabsContent value="lists">
                        {publicLists.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <List className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                                    <p className="text-muted-foreground">
                                        No public lists yet
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {publicLists.map((list) => (
                                    <Card
                                        key={list.id}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => router.push(`/lists/${list.id}`)}
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold truncate mb-1">{list.name}</h4>
                                                    {list.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                            {list.description}
                                                        </p>
                                                    )}
                                                    <div
                                                        className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <List className="h-3 w-3"/>
                                                        <span>{list._count.items} {list._count.items === 1 ? "game" : "games"}</span>
                                                        <span>·</span>
                                                        <span>{formatDate(list.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="flex-shrink-0">
                                                    Public
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
