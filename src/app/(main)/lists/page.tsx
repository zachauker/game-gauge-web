"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Lock,
  Globe,
  Loader2,
  Trash2,
  Heart,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/lib/api";
import type { GameList } from "@/lib/api";
import { getMyLists, deleteList } from "@/lib/lists";
import Link from "next/link";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { createList } from "@/lib/lists";
import { toast } from "sonner";

// ─── Default list display config ──────────────────────────────────────────

const DEFAULT_LIST_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; description: string }
> = {
  wishlist: {
    label: "Wishlist",
    icon: <Heart className="h-5 w-5 text-pink-500" />,
    description: "Games you want to play",
  },
  playing: {
    label: "Currently Playing",
    icon: <Gamepad2 className="h-5 w-5 text-blue-500" />,
    description: "Games you're actively playing",
  },
  completed: {
    label: "Completed",
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
    description: "Games you've finished",
  },
};

export default function ListsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [lists, setLists] = useState<GameList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) loadLists();
  }, [isAuthenticated, user]);

  const loadLists = async () => {
    setIsLoading(true);
    setError("");
    try {
      setLists(await getMyLists());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    await createList(data);
    await loadLists();
    setShowCreateDialog(false);
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    try {
      await deleteList(listId);
      toast.success("List deleted");
      await loadLists();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Split into default (pinned) and custom lists
  const defaultLists = lists.filter((l) => l.isDefault);
  const customLists = lists.filter((l) => !l.isDefault);

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">My Lists</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to manage your game lists.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Lists</h1>
            <p className="text-muted-foreground mt-1">
              Track and organise your game library
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New List
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ── Default lists (pinned) ─────────────────────── */}
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Your Library
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {defaultLists.map((list) => {
                  const config =
                    DEFAULT_LIST_CONFIG[list.listType] ?? null;

                  return (
                    <Link key={list.id} href={`/lists/${list.id}`}>
                      <Card className="hover:shadow-md hover:border-primary/30 transition-all h-full">
                        <CardContent className="p-5 flex items-center gap-4 h-full">
                          <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {config?.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight truncate">
                              {config?.label ?? list.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {list._count?.items ?? 0} game
                              {list._count?.items !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* ── Custom lists ───────────────────────────────── */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Custom Lists
              </h2>

              {customLists.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      No custom lists yet. Create one to get started.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create a List
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customLists.map((list) => (
                    <Card
                      key={list.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl mb-1">
                              <Link
                                href={`/lists/${list.id}`}
                                className="hover:text-primary transition-colors"
                              >
                                {list.name}
                              </Link>
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {list.description || "No description"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{list._count?.items ?? 0} games</span>
                            <span>•</span>
                            <Badge
                              variant={
                                list.isPublic ? "default" : "secondary"
                              }
                            >
                              {list.isPublic ? (
                                <>
                                  <Globe className="mr-1 h-3 w-3" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-1 h-3 w-3" />
                                  Private
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link href={`/lists/${list.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View List
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteList(list.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <CreateListDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateList}
        />
      </div>
    </MainLayout>
  );
}