"use client";

import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { Star, List, MessageSquare, TrendingUp } from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Track Your Gaming Journey with{" "}
              <span className="text-primary">Game Gauge</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Discover, rate, and review your favorite video games. Create custom
              lists, track your progress, and connect with other gamers.
            </p>

            {isAuthenticated && user ? (
              <div className="mt-10">
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <p className="text-2xl font-semibold mt-1">{user.username}!</p>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <Link href="/search">
                    <Button size="lg">
                      Browse Games
                    </Button>
                  </Link>
                  <Link href="/lists">
                    <Button variant="outline" size="lg">
                      My Lists
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" size="lg">
                    Browse Games
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to track your games
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features to help you manage and discover your next favorite game
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">Rate Games</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Rate games on a 1-10 scale and see community ratings
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">Write Reviews</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Share your thoughts with detailed reviews
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <List className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">Custom Lists</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create wishlists, favorites, and custom collections
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">Discover Games</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse 200,000+ games from IGDB
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="border-t bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Ready to start tracking?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join Game Gauge today and take control of your gaming library
              </p>
              <div className="mt-8">
                <Link href="/register">
                  <Button size="lg">Create your free account</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
