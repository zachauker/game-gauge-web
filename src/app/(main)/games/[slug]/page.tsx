"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingDialog } from "@/components/games/rating-dialog";
import { RatingStats } from "@/components/games/rating-stats";
import { ReviewList } from "@/components/reviews/review-list";
import { AddToListDialog } from "@/components/lists/add-to-list-dialog";
import { api, getErrorMessage, RatingStats as RatingStatsType } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  Star,
  Calendar,
  Gamepad,
  Loader2,
  ChevronLeft,
  MessageSquare,
  ListPlus,
} from "lucide-react";

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

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const slug = params.slug as string;

  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Rating state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStatsType | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);

  // List state
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);

  useEffect(() => {
    loadGameDetails();
  }, [slug]);

  useEffect(() => {
    if (game && isAuthenticated) {
      loadRatings();
    }
  }, [game, isAuthenticated]);

  const loadGameDetails = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get(`/games/slug/${slug}`);
      setGame(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRatings = async () => {
    if (!game) return;

    setIsLoadingRatings(true);
    
    try {
      // Get user's rating if authenticated
      if (isAuthenticated) {
        try {
          const userRatingRes = await api.get(`/games/${game.slug}/rating/me`);
          if (userRatingRes.data.data) {
            setUserRating(userRatingRes.data.data.score);
          }
        } catch (err) {
          // User hasn't rated yet
          setUserRating(null);
        }
      }

      // Get rating stats
      const statsRes = await api.get(`/games/${game.slug}/rating/stats`);
      setRatingStats(statsRes.data.data);
    } catch (err) {
      // Silently fail - ratings might not exist yet
      console.log('No ratings found yet');
    } finally {
      setIsLoadingRatings(false);
    }
  };

  const handleRatingSubmit = async (score: number) => {
    if (!game) return;

    try {
      await api.post(`/games/${game.slug}/rating`, { score });
      setUserRating(score);
      setShowRatingDialog(false);
      
      // Reload stats
      await loadRatings();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !game) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "This game doesn't exist in our database."}
            </p>
            <Button onClick={() => router.back()}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {game.releaseDate && (
                  <div className="flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    {new Date(game.releaseDate).getFullYear()}
                  </div>
                )}
                {game.developer && (
                  <div className="flex items-center">
                    <Gamepad className="mr-1.5 h-4 w-4" />
                    {game.developer}
                  </div>
                )}
                {game.metacritic && (
                  <Badge variant="secondary">
                    Metacritic: {game.metacritic}
                  </Badge>
                )}
              </div>
            </div>

            {/* Platforms & Genres */}
            <div className="flex flex-wrap gap-2">
              {game.platforms.slice(0, 5).map((platform) => (
                <Badge key={platform} variant="outline">
                  {platform}
                </Badge>
              ))}
              {game.platforms.length > 5 && (
                <Badge variant="outline">+{game.platforms.length - 5} more</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <Badge key={genre}>{genre}</Badge>
              ))}
            </div>

            <Separator />

            {/* Tabs for Overview and Reviews */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reviews">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Description */}
                {game.description && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {game.description}
                    </p>
                  </div>
                )}

                {/* Game Details */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Game Details</h3>
                    <div className="space-y-3">
                      {game.developer && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Developer</span>
                          <span className="font-medium">{game.developer}</span>
                        </div>
                      )}
                      {game.publisher && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Publisher</span>
                          <span className="font-medium">{game.publisher}</span>
                        </div>
                      )}
                      {game.releaseDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Release Date</span>
                          <span className="font-medium">
                            {new Date(game.releaseDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <ReviewList gameId={game.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Cover & Actions */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-muted">
              {game.coverImage ? (
                <Image
                  src={game.coverImage}
                  alt={game.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Rating Section */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Your Rating</h3>
                
                {isAuthenticated ? (
                  <>
                    {userRating ? (
                      <div className="text-center p-4 bg-accent rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Star className="h-5 w-5 fill-primary text-primary" />
                          <span className="text-3xl font-bold">{userRating}</span>
                          <span className="text-muted-foreground">/10</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRatingDialog(true)}
                          className="mt-2"
                        >
                          Update Rating
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => setShowRatingDialog(true)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Rate This Game
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Sign in to rate this game
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/login")}
                    >
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Rating Stats */}
                {ratingStats && (
                  <>
                    <Separator />
                    <RatingStats stats={ratingStats} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Add to List Button */}
            {isAuthenticated && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAddToListDialog(true)}
              >
                <ListPlus className="mr-2 h-4 w-4" />
                Add to List
              </Button>
            )}

            {/* Quick Reviews Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setActiveTab("reviews")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View All Reviews
            </Button>
          </div>
        </div>

        {/* Rating Dialog */}
        <RatingDialog
            gameName={ game.title }
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          onSubmit={handleRatingSubmit}
          currentRating={userRating || undefined}
        />

        {/* Add to List Dialog */}
        {game && (
          <AddToListDialog
            open={showAddToListDialog}
            onOpenChange={setShowAddToListDialog}
            gameId={game.id}
            gameTitle={game.title}
          />
        )}
      </div>
    </MainLayout>
  );
}
