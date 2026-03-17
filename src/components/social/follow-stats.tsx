"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";
import { FollowUser, getFollowers, getFollowing } from "@/lib/social";
import { useAuthStore } from "@/store/auth";

// ─── FollowStats ───────────────────────────────────────────────────────────

interface FollowStatsProps {
  username: string;
  followerCount: number;
  followingCount: number;
}

export function FollowStats({
  username,
  followerCount,
  followingCount,
}: FollowStatsProps) {
  const [modal, setModal] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => setModal("followers")}
          className="hover:text-primary transition-colors"
        >
          <span className="font-semibold text-foreground">{followerCount}</span>
          <span className="text-muted-foreground ml-1">
            {followerCount === 1 ? "follower" : "followers"}
          </span>
        </button>
        <button
          onClick={() => setModal("following")}
          className="hover:text-primary transition-colors"
        >
          <span className="font-semibold text-foreground">{followingCount}</span>
          <span className="text-muted-foreground ml-1">following</span>
        </button>
      </div>

      <FollowListModal
        username={username}
        mode={modal ?? "followers"}
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
      />
    </>
  );
}

// ─── FollowListModal ───────────────────────────────────────────────────────

interface FollowListModalProps {
  username: string;
  mode: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FollowListModal({
  username,
  mode,
  open,
  onOpenChange,
}: FollowListModalProps) {
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Load on open (or when mode changes)
  const modeKey = `${username}-${mode}`;
  if (open && loadedFor !== modeKey && !isLoading) {
    setIsLoading(true);
    setUsers([]);
    setPage(1);
    const fetcher = mode === "followers" ? getFollowers : getFollowing;
    fetcher(username, { page: 1, limit: 20 })
      .then((result) => {
        setUsers(result.users);
        setHasMore(result.hasMore);
        setLoadedFor(modeKey);
      })
      .finally(() => setIsLoading(false));
  }

  const loadMore = async () => {
    const fetcher = mode === "followers" ? getFollowers : getFollowing;
    const result = await fetcher(username, { page: page + 1, limit: 20 });
    setUsers((prev) => [...prev, ...result.users]);
    setHasMore(result.hasMore);
    setPage((p) => p + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{mode}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="flex flex-col gap-3 pr-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Link
                    href={`/users/${u.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {u.avatar && <AvatarImage src={u.avatar} alt={u.username} />}
                      <AvatarFallback>
                        {u.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.username}</p>
                      {u.bio && (
                        <p className="truncate text-xs text-muted-foreground">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {isAuthenticated && currentUser?.username !== u.username && (
                    <FollowButton
                      username={u.username}
                      initialIsFollowing={u.isFollowing ?? false}
                      initialFollowerCount={0}
                      size="sm"
                    />
                  )}
                </div>
              ))}

              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1"
                  onClick={loadMore}
                >
                  Load more
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
