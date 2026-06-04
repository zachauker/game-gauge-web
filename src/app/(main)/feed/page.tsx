"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { ActivityFeed } from "@/components/social/activity-feed";
import { SuggestedUsers } from "@/components/social/suggested-users";
import { useAuthStore } from "@/store/auth";

export default function FeedPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/login?redirect=/feed");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="mx-auto max-w-5xl">

          {/* ── Header ── */}
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40 mb-1">
              Feed
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Friend activity
            </h1>
            <p className="text-[13px] text-foreground/40 mt-1">
              What the people you follow are playing and reviewing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">

            {/* ── Activity feed ── */}
            <div className="min-w-0">
              <ActivityFeed
                mode="personal"
                emptyMessage="Follow other players to see their activity here."
              />
            </div>

            {/* ── Sidebar: suggested users ── */}
            <aside className="hidden lg:flex lg:flex-col lg:gap-4">
              <SuggestedUsers />
            </aside>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
