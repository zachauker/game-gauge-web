"use client";

import Image from "next/image";
import Link from "next/link";
import { IGDBGame } from "@/lib/api";
import { getIGDBImageUrl, formatIGDBDate } from "@/lib/search";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star, Calendar, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  game: IGDBGame;
  onClick?: (e: React.MouseEvent) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const coverUrl = game.cover?.image_id 
    ? getIGDBImageUrl(game.cover.image_id, 'cover_big')
    : '/placeholder-game.svg';

  const rating = game.rating ? Math.round(game.rating / 10) : null;

  const content = (
    <>
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={coverUrl}
          alt={game.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* In Database Badge */}
        {game.inDatabase && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-green-500/90 text-white">
              <CheckCircle className="mr-1 h-3 w-3" />
              Added
            </Badge>
          </div>
        )}

        {/* Rating Badge */}
        {rating && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              <Star className="mr-1 h-3 w-3 fill-current" />
              {rating}/10
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {game.name}
        </h3>

        {game.first_release_date && (
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {formatIGDBDate(game.first_release_date)}
          </div>
        )}
      </CardContent>

      {game.platforms && game.platforms.length > 0 && (
        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap gap-1">
            {game.platforms.slice(0, 3).map((platform, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {platform.abbreviation || platform.name}
              </Badge>
            ))}
            {game.platforms.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{game.platforms.length - 3}
              </Badge>
            )}
          </div>
        </CardFooter>
      )}
    </>
  );

  // If onClick is provided, render as clickable card
  if (onClick) {
    return (
      <Card 
        className="group h-full overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer" 
        onClick={onClick}
      >
        {content}
      </Card>
    );
  }

  // Default: wrap in Link
  return (
    <Link href={`/games/${game.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
        {content}
      </Card>
    </Link>
  );
}
