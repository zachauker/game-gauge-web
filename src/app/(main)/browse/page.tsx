"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Loader2, TrendingUp, Star, MessageSquare, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Game {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  releaseDate: string | null;
  genres: string[];
  platforms: string[];
  _count?: {
    ratings: number;
    reviews: number;
  };
  averageRating?: number;
  ratingCount?: number;
  activityCount?: number;
}

export default function BrowsePage() {
  const router = useRouter();

  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [topRated, setTopRated] = useState<Game[]>([]);
  const [trending, setTrending] = useState<Game[]>([]);
  const [recentlyReviewed, setRecentlyReviewed] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrowseData();
  }, []);

  const loadBrowseData = async () => {
    try {
      setIsLoading(true);

      // Load all browse data in parallel
      const [genresRes, platformsRes, topRatedRes, trendingRes, recentlyReviewedRes] = await Promise.all([
        api.get("/games/genres"),
        api.get("/games/platforms"),
        api.get("/games/top-rated?limit=12"),
        api.get("/games/trending?limit=12"),
        api.get("/games/recently-reviewed?limit=12"),
      ]);

      setGenres(genresRes.data.data || []);
      setPlatforms(platformsRes.data.data || []);
      setTopRated(topRatedRes.data.data || []);
      setTrending(trendingRes.data.data || []);
      setRecentlyReviewed(recentlyReviewedRes.data.data || []);
    } catch (error: any) {
      toast.error("Failed to load browse data");
      console.error("Failed to load browse data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatGenreName = (genre: string) => {
    return genre
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const GameCard = ({ game }: { game: Game }) => (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => router.push(`/games/${game.slug}`)}
    >
      <CardContent className="p-0">
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg bg-muted">
          {game.coverImage ? (
            <Image
              src={game.coverImage}
              alt={game.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No Image
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 min-h-[2.5rem]">
            {game.title}
          </h3>
          {game.averageRating !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{game.averageRating.toFixed(1)}</span>
              <span>({game.ratingCount})</span>
            </div>
          )}
          {game._count && (
            <div className="text-xs text-muted-foreground">
              {game._count.ratings} ratings • {game._count.reviews} reviews
            </div>
          )}
          {game.activityCount !== undefined && (
            <div className="text-xs text-muted-foreground">
              {game.activityCount} recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Games</h1>
          <p className="text-muted-foreground">
            Discover games by genre, see what's trending, and find your next favorite
          </p>
        </div>

        {/* Featured Sections */}
        <Tabs defaultValue="top-rated" className="mb-12">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="top-rated">
              <Star className="h-4 w-4 mr-2" />
              Top Rated
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recently-reviewed">
              <MessageSquare className="h-4 w-4 mr-2" />
              Recently Reviewed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-rated" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topRated.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {trending.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recently-reviewed" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {recentlyReviewed.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Browse by Genre */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Gamepad2 className="h-6 w-6 mr-2" />
            Browse by Genre
          </h2>
          
          {genres.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No genres available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant="outline"
                  className="h-auto py-6 text-left justify-start"
                  onClick={() => router.push(`/browse/genre/${encodeURIComponent(genre)}`)}
                >
                  <div>
                    <div className="font-semibold">{formatGenreName(genre)}</div>
                    <div className="text-xs text-muted-foreground">Explore →</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Browse by Platform */}
        {platforms.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Browse by Platform</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {platforms.map((platform) => (
                <Button
                  key={platform}
                  variant="outline"
                  className="h-auto py-6 text-left justify-start"
                  onClick={() => router.push(`/search?platform=${encodeURIComponent(platform)}`)}
                >
                  <div>
                    <div className="font-semibold">{platform}</div>
                    <div className="text-xs text-muted-foreground">Explore →</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
