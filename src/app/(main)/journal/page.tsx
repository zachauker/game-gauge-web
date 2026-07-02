"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { ActivityFeed } from "@/components/social/activity-feed";
import { useAuthStore } from "@/store/auth";
import { Search } from "lucide-react";

export default function JournalPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/login?redirect=/journal");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated || !user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="mx-auto max-w-2xl">

          {/* ── Header ── */}
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/60 mb-1">
              Journal
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              {user.username}
            </h1>
            <p className="text-[13px] text-foreground/60 mt-1">
              Everything you've logged, in order.
            </p>
          </div>

          {/* ── Personal activity timeline ── */}
          <ActivityFeed
            mode="user"
            username={user.username}
            isOwnActivity
            emptyMessage="Your journal is empty. Start by rating or reviewing a game."
            emptyAction={
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 mt-4 text-[12px] text-brand-purple hover:text-foreground transition-colors motion-reduce:transition-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                Find a game to log
              </Link>
            }
          />

        </div>
      </div>
    </MainLayout>
  );
}
