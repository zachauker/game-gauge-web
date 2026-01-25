"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Review {
  id: string;
  content: string;
  spoilers: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  _count?: {
    helpfulVotes: number;
  };
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  hasVotedHelpful?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleHelpful?: () => void;
}

export function ReviewCard({
  review,
  currentUserId,
  hasVotedHelpful = false,
  onEdit,
  onDelete,
  onToggleHelpful,
}: ReviewCardProps) {
  const [showSpoilers, setShowSpoilers] = useState(false);
  
  // Safely handle missing user data
  if (!review.user) {
    console.error("ReviewCard: review.user is undefined", review);
    return null;
  }
  
  const isOwner = currentUserId === review.user.id;
  const helpfulCount = review._count?.helpfulVotes ?? review.helpfulCount;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {review.user.avatar ? (
                <img
                  src={review.user.avatar}
                  alt={review.user.username}
                  className="object-cover"
                />
              ) : (
                <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full">
                  {review.user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div>
              <p className="font-semibold">{review.user.username}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(review.createdAt)}
                {review.updatedAt !== review.createdAt && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {/* Actions Menu (for owner) */}
          {isOwner && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Review
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Spoiler Warning */}
        {review.spoilers && !showSpoilers && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-600">
                Spoiler Warning
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              This review contains spoilers. Click below to reveal.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSpoilers(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Show Spoilers
            </Button>
          </div>
        )}

        {/* Review Content */}
        {(!review.spoilers || showSpoilers) && (
          <>
            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
              <p className="whitespace-pre-wrap">{review.content}</p>
            </div>

            {/* Hide Spoilers Button */}
            {review.spoilers && showSpoilers && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSpoilers(false)}
                className="gap-2 mb-4"
              >
                <EyeOff className="h-4 w-4" />
                Hide Spoilers
              </Button>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          {/* Helpful Button */}
          {currentUserId && !isOwner && onToggleHelpful && (
            <Button
              variant={hasVotedHelpful ? "default" : "outline"}
              size="sm"
              onClick={onToggleHelpful}
              className="gap-2"
            >
              <ThumbsUp className={`h-4 w-4 ${hasVotedHelpful ? "fill-current" : ""}`} />
              Helpful {helpfulCount > 0 && `(${helpfulCount})`}
            </Button>
          )}

          {/* Helpful Count (for non-logged-in or owner) */}
          {(!currentUserId || isOwner) && helpfulCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              {helpfulCount} {helpfulCount === 1 ? "person" : "people"} found this
              helpful
            </div>
          )}

          {/* Spoiler Badge (if spoilers are hidden) */}
          {review.spoilers && (
            <Badge variant="secondary" className="ml-auto">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Spoilers
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
