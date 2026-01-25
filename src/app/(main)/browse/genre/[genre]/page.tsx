"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
  metacritic: number | null;
  _count: {
    ratings: number;
    reviews: number;
  };
}

export default function GenreBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const genre = decodeURIComponent(params.genre as string);

  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");

  useEffect(() => {
    loadGames();
  }, [genre, page, sortBy]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.get(
        `/games/genre/${encodeURIComponent(genre)}?page=${page}&limit=24&sortBy=${sortBy}&sortOrder=desc`
      );

      setGames(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      toast.error("Failed to load games");
      console.error("Failed to load games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1); // Reset to first page when sorting changes
  };

  const formatGenreName = (genre: string) => {
    // Convert genre slug to readable name
    return genre
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/browse")}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {formatGenreName(genre)} Games
              </h1>
              <p className="text-muted-foreground">
                Discover the best {formatGenreName(genre).toLowerCase()} games
              </p>
            </div>

            {/* Sort Control */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Recently Added</SelectItem>
                <SelectItem value="releaseDate">Release Date</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : games.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground mb-4">
                No {formatGenreName(genre).toLowerCase()} games found
              </p>
              <Button onClick={() => router.push("/browse")}>
                Browse All Genres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Games Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => router.push(`/games/${game.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image */}
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

                    {/* Game Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                        {game.title}
                      </h3>

                      {/* Stats */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {game._count.ratings > 0 && (
                          <span>{game._count.ratings} ratings</span>
                        )}
                        {game._count.reviews > 0 && (
                          <>
                            {game._count.ratings > 0 && <span>•</span>}
                            <span>{game._count.reviews} reviews</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
