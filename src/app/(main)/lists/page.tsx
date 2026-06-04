"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Plus,
  Lock,
  Globe,
  Loader2,
  Trash2,
  Heart,
  Gamepad2,
  Trophy,
  List,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/lib/api";
import type { GameList } from "@/lib/api";
import { getMyLists, deleteList, createList } from "@/lib/lists";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { toast } from "sonner";

// ─── Default list display config ──────────────────────────────────────────────

const DEFAULT_LIST_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; description: string }
> = {
  wishlist: {
    label: "Wishlist",
    icon: <Heart className="h-5 w-5 text-brand-pink" />,
    description: "Games you want to play",
  },
  playing: {
    label: "Currently Playing",
    icon: <Gamepad2 className="h-5 w-5 text-brand-purple" />,
    description: "Games you're actively playing",
  },
  completed: {
    label: "Completed",
    icon: <Trophy className="h-5 w-5 text-brand-amber" />,
    description: "Games you've finished",
  },
};

// ─── Visibility pill ──────────────────────────────────────────────────────────

function VisibilityPill({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal">
      <Globe className="h-2.5 w-2.5" />
      Public
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-foreground/50">
      <Lock className="h-2.5 w-2.5" />
      Private
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const defaultLists = lists.filter((l) => l.isDefault);
  const customLists  = lists.filter((l) => !l.isDefault);

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 lg:px-8 py-20 text-center">
          <List className="h-8 w-8 text-foreground/20 mx-auto mb-4" />
          <p className="text-[14px] text-foreground/40 mb-6">
            Sign in to manage your game lists.
          </p>
          <Link
            href="/login"
            className="inline-block bg-brand-purple hover:bg-brand-purple/80 text-foreground text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40 mb-1">
              Library
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              My Lists
            </h1>
            <p className="text-[13px] text-foreground/40 mt-1">
              Track and organise your game library.
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/80 text-foreground text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New List
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-lg bg-brand-red/5 border border-brand-red/20 px-4 py-3 text-[12px] text-brand-red mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
          </div>
        ) : (
          <>
            {/* ── Default lists ── */}
            <section className="mb-10">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/40 mb-4">
                Your Library
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {defaultLists.map((list) => {
                  const config = DEFAULT_LIST_CONFIG[list.listType] ?? null;
                  return (
                    <Link
                      key={list.id}
                      href={`/lists/${list.id}`}
                      className="flex items-center gap-4 bg-card border border-brand-purple/15 hover:border-brand-purple/35 rounded-lg p-4 transition-colors group"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center">
                        {config?.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-foreground leading-tight truncate group-hover:text-brand-purple transition-colors">
                          {config?.label ?? list.name}
                        </p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">
                          {list._count?.items ?? 0} game{list._count?.items !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* ── Divider ── */}
            <div className="h-px bg-brand-purple/15 mb-10" />

            {/* ── Custom lists ── */}
            <section>
              <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/40 mb-4">
                Custom Lists
              </h2>

              {customLists.length === 0 ? (
                <div className="rounded-lg border border-dashed border-brand-purple/20 bg-card py-14 text-center">
                  <p className="text-[13px] text-foreground/40 mb-4">
                    No custom lists yet. Create one to get started.
                  </p>
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="inline-flex items-center gap-2 text-[12px] text-brand-purple hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create a list
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customLists.map((list) => (
                    <div
                      key={list.id}
                      className="bg-card border border-brand-purple/15 hover:border-brand-purple/30 rounded-lg p-4 flex flex-col gap-3 transition-colors"
                    >
                      {/* Title + visibility */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/lists/${list.id}`}
                          className="text-[15px] font-medium text-foreground hover:text-brand-purple transition-colors leading-snug line-clamp-1"
                        >
                          {list.name}
                        </Link>
                        <VisibilityPill isPublic={list.isPublic} />
                      </div>

                      {/* Description */}
                      {list.description && (
                        <p className="text-[12px] text-foreground/40 leading-relaxed line-clamp-2">
                          {list.description}
                        </p>
                      )}

                      {/* Footer: count + actions */}
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className="text-[12px] text-foreground/35">
                          {list._count?.items ?? 0} games
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/lists/${list.id}`}
                            className="text-[12px] text-foreground/50 hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-brand-purple/10"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteList(list.id)}
                            className="p-1.5 rounded text-foreground/30 hover:text-brand-red hover:bg-brand-red/5 transition-colors"
                            aria-label="Delete list"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
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
