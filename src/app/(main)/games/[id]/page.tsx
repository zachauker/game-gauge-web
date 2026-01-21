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
import { 
  getIGDBGame, 
  getIGDBImageUrl, 
  formatIGDBDate,
  importGame 
} from "@/lib/search";
import { api, IGDBGame, getErrorMessage } from "@/lib/api";
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

  useEffect(() => {
    loadGameDetails();
  }, [igdbId]);

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
      
      // Check if game is already in our database
      if (gameData.inDatabase) {
        // TODO: Fetch internal game ID from backend
        // For now, we'll set it based on IGDB ID
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportGame = async () => {
    if (!game) return;

    setIsImporting(true);
    try {
      const importedGame = await importGame(game.id);
      
      if (importedGame) {
        setInternalGameId(importedGame.id);
        // Update game state to show it's now in database
        setGame({ ...game, inDatabase: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsImporting(false);
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
                  <Button size="lg" disabled={!isAuthenticated}>
                    <Star className="mr-2 h-4 w-4" />
                    Rate Game
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
          <TabsContent value="ratings">
            {game.inDatabase ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Ratings and reviews will appear here</p>
                    <p className="text-sm mt-2">Be the first to rate this game!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <p>Add this game to Game Gauge to see ratings and reviews</p>
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
      </div>
    </MainLayout>
  );
}
