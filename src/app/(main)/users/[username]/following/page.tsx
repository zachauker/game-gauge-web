"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { FollowUserRow } from "@/components/profile/follow-user-row";
import { useAuthStore } from "@/store/auth";
import { getFollowing, FollowUser } from "@/lib/social";
import { ChevronLeft, Users, Loader2 } from "lucide-react";
import { useInfiniteList } from "@/hooks/useInfiniteList";

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const result = await getFollowing(username, { page: pageNum, limit: 20 });
      return { items: result.users, hasMore: result.hasMore };
    },
    [username]
  );
  const { items: following, loading, sentinelRef } = useInfiniteList<FollowUser>(fetchPage);

  const isOwnProfile = currentUser?.username === username;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-foreground/50 hover:text-foreground/80 transition-colors motion-reduce:transition-none mb-6 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          @{username}
        </button>

        <h1 className="text-[18px] font-medium tracking-tight text-foreground mb-6">
          Following
        </h1>

        {!loading && following.length === 0 ? (
          <div className="py-14 text-center">
            <Users className="h-7 w-7 text-foreground/30 mx-auto mb-3" aria-hidden="true" />
            <p className="text-[13px] text-foreground/60">Not following anyone yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {following.map((user) => (
              <FollowUserRow
                key={user.id}
                user={user}
                showFollowButton={!isOwnProfile && currentUser?.username !== user.username}
              />
            ))}
            <div ref={sentinelRef} className="flex justify-center py-4">
              {loading && (
                <Loader2 className="h-5 w-5 animate-spin text-foreground/30" aria-hidden="true" />
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
