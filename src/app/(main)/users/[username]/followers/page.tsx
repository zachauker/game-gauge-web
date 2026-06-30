"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { FollowUserRow } from "@/components/profile/follow-user-row";
import { useAuthStore } from "@/store/auth";
import { getFollowers, FollowUser } from "@/lib/social";
import { ChevronLeft, Users, Loader2 } from "lucide-react";

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const result = await getFollowers(username, { page: pageNum, limit: 20 });
        setFollowers((prev) =>
          pageNum === 1 ? result.users : [...prev, ...result.users]
        );
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch {
        // leave existing list in place
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        loadPage(page + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadPage]);

  const isOwnProfile = currentUser?.username === username;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          @{username}
        </button>

        <h1 className="text-[18px] font-medium tracking-tight text-foreground mb-6">
          Followers
        </h1>

        {!loading && followers.length === 0 ? (
          <div className="py-14 text-center">
            <Users className="h-7 w-7 text-foreground/10 mx-auto mb-3" />
            <p className="text-[13px] text-foreground/35">No followers yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {followers.map((user) => (
              <FollowUserRow
                key={user.id}
                user={user}
                showFollowButton={!isOwnProfile && currentUser?.username !== user.username}
              />
            ))}
            <div ref={sentinelRef} className="flex justify-center py-4">
              {loading && (
                <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
