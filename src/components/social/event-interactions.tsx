"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import {
  EventComment,
  toggleReaction,
  getComments,
  addComment,
  deleteComment,
} from "@/lib/social";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { timeAgo } from "@/lib/social";
import { cn } from "@/lib/utils";

interface EventInteractionsProps {
  eventId: string;
  initialLikeCount: number;
  initialCommentCount: number;
  initialHasLiked: boolean;
}

export function EventInteractions({
  eventId,
  initialLikeCount,
  initialCommentCount,
  initialHasLiked,
}: EventInteractionsProps) {
  const { user, isAuthenticated } = useAuthStore();

  // ── Like state ──────────────────────────────────────────────────────────────
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [likeLoading, setLikeLoading] = useState(false);

  // ── Comment state ───────────────────────────────────────────────────────────
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments when thread opens for the first time
  useEffect(() => {
    if (showComments && !commentsLoaded) {
      setCommentsLoading(true);
      getComments(eventId)
        .then((data) => {
          setComments(data);
          setCommentsLoaded(true);
        })
        .catch(() => toast.error("Failed to load comments"))
        .finally(() => setCommentsLoading(false));
    }
  }, [showComments, commentsLoaded, eventId]);

  // Focus textarea when thread opens
  useEffect(() => {
    if (showComments && isAuthenticated) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [showComments, isAuthenticated]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (!isAuthenticated || likeLoading) return;
    setLikeLoading(true);

    // Optimistic update
    const prev = hasLiked;
    setHasLiked(!prev);
    setLikeCount((c) => (prev ? c - 1 : c + 1));

    try {
      const result = await toggleReaction(eventId);
      setHasLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Roll back
      setHasLiked(prev);
      setLikeCount((c) => (prev ? c + 1 : c - 1));
      toast.error("Failed to update reaction");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const result = await addComment(eventId, trimmed);
      setComments((prev) => [...prev, result.comment]);
      setCommentCount(result.commentCount);
      setNewComment("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const result = await deleteComment(eventId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount(result.commentCount);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mt-2">
      {/* Action bar */}
      <div className="flex items-center gap-1">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={!isAuthenticated || likeLoading}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
            "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
            hasLiked
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={isAuthenticated ? (hasLiked ? "Unlike" : "Like") : "Sign in to like"}
        >
          <Heart
            className={cn("h-3.5 w-3.5", hasLiked && "fill-current")}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((s) => !s)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
            "hover:bg-accent text-muted-foreground hover:text-foreground",
            showComments && "text-primary"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {commentCount > 0 ? (
            <span>{commentCount} {commentCount === 1 ? "comment" : "comments"}</span>
          ) : (
            <span>Comment</span>
          )}
        </button>
      </div>

      {/* Comment thread */}
      {showComments && (
        <div className="mt-2 space-y-3 pl-2 border-l-2 border-border">
          {commentsLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading comments…
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 group">
                  <Link href={`/users/${comment.user.username}`} className="shrink-0 mt-0.5">
                    <Avatar className="h-6 w-6">
                      {comment.user.avatar && (
                        <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {comment.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <Link
                        href={`/users/${comment.user.username}`}
                        className="text-xs font-semibold hover:text-primary transition-colors"
                      >
                        {comment.user.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                  {user?.id === comment.user.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">
                  No comments yet. Be the first!
                </p>
              )}
            </>
          )}

          {/* Comment input */}
          {isAuthenticated && (
            <div className="flex gap-2 pt-1">
              <Avatar className="h-6 w-6 shrink-0 mt-1">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.username} />}
                <AvatarFallback className="text-[10px]">
                  {user?.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-1.5">
                <Textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment… (⌘↵ to send)"
                  className="min-h-[36px] h-9 resize-none py-1.5 text-xs leading-relaxed"
                  maxLength={500}
                />
                <Button
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
