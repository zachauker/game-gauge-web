"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewCard } from "./review-card";
import { WriteReviewDialog } from "./write-review-dialog";
import { Loader2, MessageSquare } from "lucide-react";
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
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  rating?: {
    id: string;
    score: number;
  } | null;
  _count?: {
    helpfulVotes: number;
  };
}

interface ReviewListProps {
  gameId: string;
}

type SortOption = "helpfulCount" | "createdAt" | "updatedAt";

export function ReviewList({ gameId }: ReviewListProps) {
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

  const limit = 10;

  // Fetch reviews
  useEffect(() => {
    fetchReviews();
  }, [gameId, sortBy, page]);

  // Fetch user's review if logged in
  useEffect(() => {
    if (user) {
      fetchUserReview();
    }
  }, [gameId, user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/games/${gameId}/reviews?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=desc`
      );
      
      // Safely handle the response - ensure reviews is always an array
      const reviewsData = response.data.data || [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setTotalPages(response.data.pagination?.totalPages || 1);

      // Extract helpful votes if user is logged in and data exists
      if (user && response.data.helpfulVotes) {
        setHelpfulVotes(new Set(response.data.helpfulVotes));
      }
    } catch (error: any) {
      console.error("Failed to fetch reviews:", error);
      // Don't show error toast if it's just an empty result
      if (error.response?.status !== 404) {
        toast.error("Failed to load reviews");
      }
      // Set to empty array on error
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async () => {
    try {
      const response = await api.get(`/games/${gameId}/reviews/me`);
      const reviewData = response.data.data;
      
      // Only set the review if it has user data
      if (reviewData && reviewData.user) {
        setUserReview(reviewData);
      } else {
        console.warn("User review fetched but missing user data:", reviewData);
        setUserReview(null);
      }
    } catch (error: any) {
      // User hasn't reviewed yet - this is fine
      if (error.response?.status !== 404) {
        console.error("Failed to fetch user review:", error);
      }
      setUserReview(null);
    }
  };

  const handleCreateReview = async (data: {
    content: string;
    spoilers: boolean;
  }) => {
    try {
      await api.post(`/games/${gameId}/reviews`, data);
      toast.success("Review posted successfully!");
      
      // Re-fetch user review to get full data with user object
      await fetchUserReview();
      
      // Refresh the reviews list
      fetchReviews();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Failed to post review";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdateReview = async (data: {
    content: string;
    spoilers: boolean;
  }) => {
    if (!editingReview) return;

    try {
      await api.patch(`/reviews/${editingReview.id}`, data);
      setEditingReview(null);
      toast.success("Review updated successfully!");
      
      // Re-fetch user review to get full data with user object
      await fetchUserReview();
      
      // Refresh the reviews list
      fetchReviews();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Failed to update review";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      setUserReview(null);
      toast.success("Review deleted successfully!");
      fetchReviews(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Failed to delete review";
      toast.error(errorMessage);
    }
  };

  const handleToggleHelpful = async (reviewId: string) => {
    if (!user) return;

    const hasVoted = helpfulVotes.has(reviewId);

    try {
      // Optimistic update
      setHelpfulVotes((prev) => {
        const newSet = new Set(prev);
        if (hasVoted) {
          newSet.delete(reviewId);
        } else {
          newSet.add(reviewId);
        }
        return newSet;
      });

      // Update review count optimistically
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpfulCount: hasVoted
                  ? review.helpfulCount - 1
                  : review.helpfulCount + 1,
              }
            : review
        )
      );

      if (hasVoted) {
        await api.delete(`/reviews/${reviewId}/helpful`);
      } else {
        await api.post(`/reviews/${reviewId}/helpful`, {});
      }
    } catch (error: any) {
      // Revert on error
      setHelpfulVotes((prev) => {
        const newSet = new Set(prev);
        if (hasVoted) {
          newSet.add(reviewId);
        } else {
          newSet.delete(reviewId);
        }
        return newSet;
      });

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpfulCount: hasVoted
                  ? review.helpfulCount + 1
                  : review.helpfulCount - 1,
              }
            : review
        )
      );

      const errorMessage = error.response?.data?.error?.message || "Failed to update vote";
      toast.error(errorMessage);
    }
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1); // Reset to first page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {user && !userReview && (
          <Button onClick={() => setShowWriteDialog(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* User's Review (if exists) */}
      {userReview && userReview.user && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Your Review</h3>
          <ReviewCard
            review={userReview}
            currentUserId={user?.id}
            hasVotedHelpful={false}
            onEdit={() => setEditingReview(userReview)}
            onDelete={() => handleDeleteReview(userReview.id)}
          />
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="helpfulCount">Most Helpful</SelectItem>
            <SelectItem value="createdAt">Most Recent</SelectItem>
            <SelectItem value="updatedAt">Recently Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to share your thoughts about this game!
          </p>
          {user && !userReview && (
            <Button onClick={() => setShowWriteDialog(true)}>
              Write the First Review
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews
            .filter(review => review.user) // Filter out reviews without user data
            .map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              hasVotedHelpful={helpfulVotes.has(review.id)}
              onEdit={
                review.user.id === user?.id
                  ? () => setEditingReview(review)
                  : undefined
              }
              onDelete={
                review.user.id === user?.id
                  ? () => handleDeleteReview(review.id)
                  : undefined
              }
              onToggleHelpful={
                user && review.user.id !== user.id
                  ? () => handleToggleHelpful(review.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Write Review Dialog */}
      <WriteReviewDialog
        open={showWriteDialog}
        onOpenChange={setShowWriteDialog}
        onSubmit={handleCreateReview}
        mode="create"
      />

      {/* Edit Review Dialog */}
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
