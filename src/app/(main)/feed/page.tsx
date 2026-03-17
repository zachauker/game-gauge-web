"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/social/activity-feed";
import { SuggestedUsers } from "@/components/social/suggested-users";
import { useAuthStore } from "@/store/auth";
import { Rss, Globe } from "lucide-react";

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
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
            <p className="text-sm text-muted-foreground mt-1">
              See what your friends are playing and reviewing
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            {/* Feed */}
            <div className="min-w-0">
              <Tabs defaultValue="following">
                <TabsList className="mb-4 w-full justify-start">
                  <TabsTrigger value="following" className="gap-2">
                    <Rss className="h-4 w-4" />
                    Following
                  </TabsTrigger>
                  <TabsTrigger value="global" className="gap-2">
                    <Globe className="h-4 w-4" />
                    All Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="following">
                  <ActivityFeed
                    mode="personal"
                    emptyMessage="Follow other users to see their activity here."
                  />
                </TabsContent>

                <TabsContent value="global">
                  <ActivityFeed
                    mode="global"
                    emptyMessage="No recent activity on the platform yet."
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:gap-4">
              <SuggestedUsers />
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
