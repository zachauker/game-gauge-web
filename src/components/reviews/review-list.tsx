"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "./review-card";
import { WriteReviewDialog } from "./write-review-dialog";
import { Loader2, MessageSquare, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Review {
  id: string;
  content: string;
  spoilers: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; avatar: string | null };
  rating?: { id: string; score: number } | null;
  _count?: { helpfulVotes: number };
}

type SortOption = "helpfulCount" | "createdAt" | "updatedAt";

const SORT_LABELS: Record<SortOption, string> = {
  helpfulCount: "Most helpful",
  createdAt: "Newest",
  updatedAt: "Recently edited",
};

export function ReviewList({ gameId }: { gameId: string }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("helpfulCount");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showWriteDialog, setShowWriteDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const LIMIT = 10;

  useEffect(() => { fetchReviews(); }, [gameId, sortBy, page]);
  useEffect(() => { if (user) fetchUserReview(); }, [gameId, user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/games/${gameId}/reviews?page=${page}&limit=${LIMIT}&sortBy=${sortBy}&sortOrder=desc`
      );
      const data = res.data.data || [];
      setReviews(Array.isArray(data) ? data : []);
      const pagination = res.data.pagination;
      if (pagination) setTotalPages(pagination.totalPages || 1);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async () => {
    try {
      const res = await api.get(`/games/${gameId}/reviews/me`);
      setUserReview(res.data.data || null);
    } catch {
      setUserReview(null);
    }
  };

  const handleCreateReview = async (data: { content: string; spoilers: boolean }) => {
    await api.post(`/games/${gameId}/reviews`, data);
    toast.success("Review published");
    await fetchReviews();
    await fetchUserReview();
  };

  const handleUpdateReview = async (data: { content: string; spoilers: boolean }) => {
    if (!editingReview) return;
    await api.patch(`/reviews/${editingReview.id}`, data);
    toast.success("Review updated");
    setEditingReview(null);
    await fetchReviews();
    await fetchUserReview();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review? This can't be undone.")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted");
      await fetchReviews();
      await fetchUserReview();
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const handleToggleHelpful = async (reviewId: string) => {
    const voted = helpfulVotes.has(reviewId);
    setHelpfulVotes((prev) => {
      const next = new Set(prev);
      voted ? next.delete(reviewId) : next.add(reviewId);
      return next;
    });
    try {
      voted
        ? await api.delete(`/reviews/${reviewId}/helpful`)
        : await api.post(`/reviews/${reviewId}/helpful`);
    } catch {
      // Revert optimistic update
      setHelpfulVotes((prev) => {
        const next = new Set(prev);
        voted ? next.add(reviewId) : next.delete(reviewId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Write / Your review button */}
        {user && !userReview && (
          <button
            onClick={() => setShowWriteDialog(true)}
            className="flex items-center gap-2 text-[13px] font-medium text-foreground/60 hover:text-foreground/90 bg-card border border-brand-purple/20 hover:border-brand-purple/40 rounded-lg px-3.5 py-2 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            Write a review
          </button>
        )}
        {user && userReview && (
          <p className="text-[12px] text-foreground/35 italic">
            You've reviewed this game
          </p>
        )}
        {!user && <div />}

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { setSortBy(opt); setPage(1); }}
              className={`text-[11px] px-2.5 py-1.5 rounded-md transition-colors ${
                sortBy === opt
                  ? "bg-brand-purple/20 text-foreground/80"
                  : "text-foreground/35 hover:text-foreground/60"
              }`}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Your review pinned at top */}
      {userReview && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.07em] text-foreground/30 mb-2">
            Your review
          </p>
          <ReviewCard
            review={userReview}
            currentUserId={user?.id}
            hasVotedHelpful={helpfulVotes.has(userReview.id)}
            onEdit={() => setEditingReview(userReview)}
            onDelete={() => handleDeleteReview(userReview.id)}
          />
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/20" />
        </div>
      ) : reviews.filter((r) => r.user && r.id !== userReview?.id).length === 0 ? (
        <div className="text-center py-14">
          <MessageSquare className="h-8 w-8 text-foreground/10 mx-auto mb-3" />
          <p className="text-[13px] text-foreground/35 mb-1">No reviews yet</p>
          <p className="text-[12px] text-foreground/25">
            Be the first to share your thoughts
          </p>
          {user && !userReview && (
            <button
              onClick={() => setShowWriteDialog(true)}
              className="mt-4 text-[12px] text-brand-purple hover:text-foreground/80 transition-colors"
            >
              Write the first review →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews
            .filter((r) => r.user && r.id !== userReview?.id)
            .map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={user?.id}
                hasVotedHelpful={helpfulVotes.has(review.id)}
                onEdit={review.user.id === user?.id ? () => setEditingReview(review) : undefined}
                onDelete={review.user.id === user?.id ? () => handleDeleteReview(review.id) : undefined}
                onToggleHelpful={user && review.user.id !== user.id ? () => handleToggleHelpful(review.id) : undefined}
              />
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 text-[12px] text-foreground/40 hover:text-foreground/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="text-[12px] text-foreground/30">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 text-[12px] text-foreground/40 hover:text-foreground/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Dialogs */}
      <WriteReviewDialog
        open={showWriteDialog}
        onOpenChange={setShowWriteDialog}
        onSubmit={handleCreateReview}
        mode="create"
      />
      {editingReview && (
        <WriteReviewDialog
          open={!!editingReview}
          onOpenChange={(open) => !open && setEditingReview(null)}
          onSubmit={handleUpdateReview}
          initialContent={editingReview.content}
          initialSpoilers={editingReview.spoilers}
          mode="edit"
        />
      )}
    </div>
  );
}