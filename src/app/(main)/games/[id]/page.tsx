"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RatingDialog } from "@/components/games/rating-dialog";
import { RatingStats } from "@/components/games/rating-stats";
import { 
  getIGDBGame, 
  getIGDBImageUrl, 
  formatIGDBDate,
  importGame 
} from "@/lib/search";
import { api, IGDBGame, getErrorMessage, RatingStats as RatingStatsType } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  Star,
  Calendar,
  Users,
  Gamepad,
  Download,
  Loader2,
  ChevronLeft,
  Plus,
  MessageSquare,
  List,
} from "lucide-react";

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const igdbId = params.id as string;

  const [game, setGame] = useState<IGDBGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>("");
  const [internalGameId, setInternalGameId] = useState<string | null>(null);
  
  // Rating state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStatsType | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);

  useEffect(() => {
    loadGameDetails();
  }, [igdbId]);

  useEffect(() => {
    // Load ratings when game is imported and we have internal ID
    if (internalGameId && isAuthenticated) {
      loadRatings();
    }
  }, [internalGameId, isAuthenticated]);

  const loadGameDetails = async () => {
    setIsLoading(true);
    setError("");

    try {
      const gameData = await getIGDBGame(parseInt(igdbId));
      
      if (!gameData) {
        setError("Game not found");
        return;
      }

      setGame(gameData);
      
      // Check if game exists in our database and get internal ID
      await checkGameInDatabase();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const checkGameInDatabase = async () => {
    try {
      // Search our database for game with this IGDB ID
      // Use a large limit to get all games, or search by slug
      const response = await api.get(`/games`, {
        params: { limit: 100 }
      });
      
      console.log('Checking for game with IGDB ID:', igdbId);
      console.log('Total games in database:', response.data.data?.length || 0);
      
      const games = response.data.data || [];
      
      // Find game with matching IGDB ID
      const matchingGame = games.find((g: any) => {
        console.log('Game:', g.title, 'IGDB ID:', g.igdbId);
        return g.igdbId === parseInt(igdbId);
      });
      
      if (matchingGame) {
        console.log('Found matching game:', matchingGame.title, 'UUID:', matchingGame.id);
        setInternalGameId(matchingGame.id);
        if (game) {
          setGame({ ...game, inDatabase: true });
        }
      } else {
        console.log('Game not found in database - needs to be imported');
      }
    } catch (err) {
      console.error("Failed to check game in database:", err);
    }
  };

  const loadRatings = async () => {
    if (!internalGameId) {
      console.log('No internal game ID - skipping rating load');
      return;
    }

    // Don't try to load ratings if we have a temp ID
    if (internalGameId.startsWith('temp-')) {
      console.log('Temp ID detected - skipping rating load');
      return;
    }

    console.log('Loading ratings for game UUID:', internalGameId);
    setIsLoadingRatings(true);
    
    try {
      // Get user's rating
      const userRatingRes = await api.get(`/games/${internalGameId}/rating/me`);
      if (userRatingRes.data.data) {
        console.log('User rating found:', userRatingRes.data.data.score);
        setUserRating(userRatingRes.data.data.score);
      }

      // Get rating stats
      const statsRes = await api.get(`/games/${internalGameId}/rating/stats`);
      console.log('Rating stats:', statsRes.data.data);
      setRatingStats(statsRes.data.data);
    } catch (err) {
      // Silently fail - ratings might not exist yet
      console.log('No ratings found yet (this is OK for new games)');
    } finally {
      setIsLoadingRatings(false);
    }
  };

  const handleImportGame = async () => {
    if (!game) return;

    setIsImporting(true);
    setError("");
    
    try {
      console.log('Importing game from IGDB ID:', game.id);
      const importedGame = await importGame(game.id);
      
      if (importedGame) {
        console.log('Game imported successfully! UUID:', importedGame.id);
        setInternalGameId(importedGame.id);
        
        // Update game state to show it's now in database
        setGame({ ...game, inDatabase: true });
        
        // Load ratings for the newly imported game
        if (isAuthenticated) {
          console.log('Loading ratings for newly imported game...');
          await loadRatings();
        }
      } else {
        setError('Failed to import game');
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      console.error('Import failed:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRateGame = async (rating: number) => {
    if (!internalGameId) return;

    try {
      await api.post(`/games/${internalGameId}/rating`, { score: rating });
      setUserRating(rating);
      
      // Reload rating stats
      await loadRatings();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !game) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/search")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const coverUrl = game.cover?.image_id
    ? getIGDBImageUrl(game.cover.image_id, "cover_big")
    : "/placeholder-game.svg";

  const rating = game.rating ? Math.round(game.rating / 10) : null;

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

        {/* Game Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Cover Image */}
          <div className="md:col-span-1">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
              <Image
                src={coverUrl}
                alt={game.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Game Info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{game.name}</h1>
              
              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {game.first_release_date && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatIGDBDate(game.first_release_date)}
                  </div>
                )}
                
                {rating && (
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 fill-primary text-primary" />
                    {rating}/10 IGDB Rating
                  </div>
                )}
              </div>
            </div>

            {/* Platforms */}
            {game.platforms && game.platforms.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Gamepad className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Platforms</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map((platform, index) => (
                    <Badge key={index} variant="secondary">
                      {platform.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!game.inDatabase ? (
                <Button
                  onClick={handleImportGame}
                  disabled={isImporting || !isAuthenticated}
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Add to Game Gauge
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    disabled={!isAuthenticated}
                    onClick={() => setShowRatingDialog(true)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {userRating ? "Update Rating" : "Rate Game"}
                  </Button>
                  <Button variant="outline" size="lg" disabled={!isAuthenticated}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Write Review
                  </Button>
                  <Button variant="outline" size="lg" disabled={!isAuthenticated}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to List
                  </Button>
                </>
              )}
            </div>

            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                <Button
                  variant="link"
                  className="px-0"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </Button>{" "}
                to rate, review, and add games to your lists
              </p>
            )}

            {/* Import Notice */}
            {!game.inDatabase && isAuthenticated && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    This game isn't in Game Gauge yet. Click "Add to Game Gauge" to import it and start rating, reviewing, and adding it to your lists!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            {/* Summary */}
            {game.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {game.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Storyline */}
            {game.storyline && (
              <Card>
                <CardHeader>
                  <CardTitle>Storyline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {game.storyline}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.genres && game.genres.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Genres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {game.genres.map((genre, index) => (
                        <Badge key={index}>{genre.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {game.game_modes && game.game_modes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Game Modes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {game.game_modes.map((mode, index) => (
                        <Badge key={index} variant="secondary">
                          {mode.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Ratings & Reviews Tab */}
          <TabsContent value="ratings" className="space-y-6">
            {game.inDatabase ? (
              <>
                {isLoadingRatings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : ratingStats && ratingStats.totalRatings > 0 ? (
                  <RatingStats stats={ratingStats} userRating={userRating || undefined} />
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">
                        <Star className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No ratings yet</p>
                        <p className="text-sm mt-2">Be the first to rate this game!</p>
                        <Button
                          className="mt-4"
                          onClick={() => setShowRatingDialog(true)}
                          disabled={!isAuthenticated}
                        >
                          Rate Game
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <p>Add this game to Game Gauge to see ratings</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lists Tab */}
          <TabsContent value="lists">
            {game.inDatabase ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <List className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Lists containing this game will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <p>Add this game to Game Gauge to see lists</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Rating Dialog */}
        {game && (
          <RatingDialog
            open={showRatingDialog}
            onOpenChange={setShowRatingDialog}
            gameName={game.name}
            currentRating={userRating || undefined}
            onSubmit={handleRateGame}
          />
        )}
      </div>
    </MainLayout>
  );
}
