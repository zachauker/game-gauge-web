"use client";

import { useState, useCallback } from "react";
import { followUser, unfollowUser } from "@/lib/social";
import { getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

interface UseFollowOptions {
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  username: string;
}

export function useFollow({
  initialIsFollowing,
  initialFollowerCount,
  username,
}: UseFollowOptions) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? c - 1 : c + 1));

    try {
      const result = wasFollowing
        ? await unfollowUser(username)
        : await followUser(username);

      // Sync with server truth
      setIsFollowing(result.isFollowing ?? !wasFollowing);
      setFollowerCount(result.followerCount);
    } catch (err) {
      // Roll back on failure
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : c - 1));
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [isFollowing, isLoading, username]);

  return { isFollowing, followerCount, isLoading, toggle };
}
