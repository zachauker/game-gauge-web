"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ThumbsUp, Edit, Trash2, EyeOff, Eye, MoreHorizontal } from "lucide-react";
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
  rating?: { id: string; score: number } | null;
  _count?: { helpfulVotes: number };
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  hasVotedHelpful?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleHelpful?: () => void;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
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

  if (!review.user) return null;

  const isOwner = currentUserId === review.user.id;
  const helpfulCount = review._count?.helpfulVotes ?? review.helpfulCount ?? 0;
  const initials = review.user.username.substring(0, 2).toUpperCase();
  const score = review.rating?.score;

  return (
    <div className="bg-card border border-brand-purple/15 rounded-lg p-4 hover:border-brand-purple/25 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-brand-purple/25 flex items-center justify-center shrink-0 overflow-hidden">
            {review.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.user.avatar}
                alt={review.user.username}
                className="h-8 w-8 object-cover"
              />
            ) : (
              <span className="text-[10px] font-medium text-foreground/60">
                {initials}
              </span>
            )}
          </div>

          <div>
            <Link
              href={`/users/${review.user.username}`}
              className="text-[13px] font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {review.user.username}
            </Link>
            <p className="text-[11px] text-foreground/30 mt-0.5">
              {timeAgo(review.createdAt)}
              {review.updatedAt !== review.createdAt && " · edited"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Score badge */}
          {score && (
            <div className="flex items-center gap-1 bg-brand-amber/10 border border-brand-amber/20 rounded px-2 py-0.5">
              <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
              <span className="text-[12px] font-medium text-brand-amber">
                {score}/10
              </span>
            </div>
          )}

          {/* Owner menu */}
          {isOwner && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-foreground/25 hover:text-foreground/60 transition-colors p-0.5">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-background border-brand-purple/20 text-[13px] min-w-[140px]"
              >
                {onEdit && (
                  <DropdownMenuItem
                    onClick={onEdit}
                    className="cursor-pointer gap-2 text-foreground/60 focus:text-foreground"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit review
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="cursor-pointer gap-2 text-brand-red focus:text-brand-red focus:bg-brand-red/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Spoiler gate */}
      {review.spoilers && !showSpoilers ? (
        <div className="rounded-lg bg-brand-amber/5 border border-brand-amber/15 px-4 py-3 flex items-center justify-between gap-3 mb-3">
          <p className="text-[12px] text-foreground/40">
            This review contains spoilers.
          </p>
          <button
            onClick={() => setShowSpoilers(true)}
            className="flex items-center gap-1.5 text-[12px] text-brand-amber hover:text-brand-amber/80 transition-colors shrink-0"
          >
            <Eye className="h-3.5 w-3.5" />
            Reveal
          </button>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-foreground/60 leading-relaxed whitespace-pre-wrap mb-3">
            {review.content}
          </p>
          {review.spoilers && (
            <button
              onClick={() => setShowSpoilers(false)}
              className="flex items-center gap-1.5 text-[11px] text-foreground/25 hover:text-foreground/50 transition-colors mb-3"
            >
              <EyeOff className="h-3 w-3" />
              Hide spoilers
            </button>
          )}
        </>
      )}

      {/* Footer */}
      {onToggleHelpful && (
        <div className="flex items-center gap-2 pt-2 border-t border-brand-purple/10">
          <button
            onClick={onToggleHelpful}
            className={`flex items-center gap-1.5 text-[12px] transition-colors ${
              hasVotedHelpful
                ? "text-brand-teal"
                : "text-foreground/30 hover:text-foreground/60"
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Helpful
            {helpfulCount > 0 && (
              <span className="text-foreground/30">({helpfulCount})</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}