"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth";
import { SteamLibraryCard } from "@/components/steam/steam-library-card";
import { SyncButton, SyncStatusBar } from "@/components/steam/sync-button";
import {
  SteamLibraryEntry,
  SteamSyncStatus,
  SteamSyncResult,
  getSteamLibrary,
  getRecentlyPlayed,
  formatPlaytimeCompact,
} from "@/lib/steam";
import {
  Loader2,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  Library,
  Clock,
  Gamepad2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type SortBy = "playtimeForever" | "playtimeRecent" | "name" | "lastPlayed";
type ViewMode = "grid" | "list";

export default function SteamLibraryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Library data
  const [entries, setEntries] = useState<SteamLibraryEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<SteamLibraryEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<SteamSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecentLoading, setIsRecentLoading] = useState(true);

  // Controls
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("playtimeForever");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState("library");
  const [syncTrigger, setSyncTrigger] = useState(0);

  // Wait for hydration before checking auth
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect if not authenticated (only after hydration)
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // Load library data
  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    let cancelled = false;

    const loadLibrary = async () => {
      try {
        setIsLoading(true);
        const result = await getSteamLibrary({
          page,
          limit: viewMode === "grid" ? 30 : 25,
          sortBy,
          sortOrder,
          matchedOnly,
        });

        if (cancelled) return;

        setEntries(result.data || []);
        setSyncStatus(result.syncStatus || null);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotal(result.pagination?.total || 0);
      } catch (error: any) {
        if (cancelled) return;
        const message =
          error.response?.data?.error?.message || "Failed to load Steam library";
        if (message.includes("No Steam account linked")) {
          setSyncStatus(null);
        } else {
          toast.error(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadLibrary();

    return () => { cancelled = true; };
  }, [hydrated, isAuthenticated, page, sortBy, sortOrder, matchedOnly, viewMode, syncTrigger]);

  // Load recent games separately (once)
  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    let cancelled = false;

    const loadRecent = async () => {
      try {
        setIsRecentLoading(true);
        const result = await getRecentlyPlayed(20);
        if (!cancelled) setRecentEntries(result || []);
      } catch {
        // Silent fail — recent is supplementary
      } finally {
        if (!cancelled) setIsRecentLoading(false);
      }
    };

    loadRecent();

    return () => { cancelled = true; };
  }, [hydrated, isAuthenticated, syncTrigger]);

  // Re-fetch after a sync completes
  const handleSyncComplete = (_result: SteamSyncResult) => {
    setPage(1);
    setSyncTrigger((prev) => prev + 1);
  };

  // Sort change resets to page 1
  const handleSortChange = (value: string) => {
    setSortBy(value as SortBy);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setMatchedOnly(value === "matched");
    setPage(1);
  };

  // Compute aggregate stats from sync status
  const totalPlaytime = syncStatus
    ? entries.reduce((sum, e) => sum + e.playtimeForever, 0)
    : 0;

  // ── No Steam linked state ──
  if (!isLoading && syncStatus === null) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <Gamepad2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Connect Your Steam Account</h1>
            <p className="text-muted-foreground mb-8">
              Link your Steam account to sync your game library, track playtime,
              and see your games matched to Game Gauge.
            </p>
            <Button onClick={() => router.push("/settings")} size="lg">
              Go to Settings
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Empty library (linked but never synced) ──
  if (!isLoading && syncStatus && syncStatus.totalGames === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <Library className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Sync Your Steam Library</h1>
            <p className="text-muted-foreground mb-8">
              Your Steam account is linked! Sync your library to see your games
              here with playtime tracking and Game Gauge integration.
            </p>
            <SyncButton
              syncStatus={syncStatus}
              onSyncComplete={handleSyncComplete}
              variant="full"
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Library className="h-8 w-8 text-primary" />
                Steam Library
              </h1>
              {syncStatus && (
                <div className="mt-2">
                  <SyncStatusBar syncStatus={syncStatus} />
                </div>
              )}
            </div>

            {/* Sync buttons */}
            <div className="flex items-center gap-2">
              <SyncButton
                syncStatus={syncStatus}
                onSyncComplete={handleSyncComplete}
                variant="recent"
              />
              <SyncButton
                syncStatus={syncStatus}
                onSyncComplete={handleSyncComplete}
                variant="full"
              />
            </div>
          </div>
        </div>

        {/* Tabs: Library / Recently Played */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Full Library
              {total > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {total.toLocaleString()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recently Played
              {recentEntries.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {recentEntries.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Full Library Tab ── */}
          <TabsContent value="library">
            {/* Controls bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playtimeForever">Most Played</SelectItem>
                    <SelectItem value="playtimeRecent">Recently Active</SelectItem>
                    <SelectItem value="name">Alphabetical</SelectItem>
                    <SelectItem value="lastPlayed">Last Played</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter */}
                <Select
                  value={matchedOnly ? "matched" : "all"}
                  onValueChange={handleFilterChange}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="matched">Linked Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort order toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortOrder === "desc" ? "↓" : "↑"}
                </Button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">
                    {matchedOnly
                      ? "No linked games found. Try syncing your library or showing all games."
                      : "No games found."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid view */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {entries.map((entry) => (
                      <SteamLibraryCard
                        key={entry.id}
                        entry={entry}
                        view="grid"
                      />
                    ))}
                  </div>
                )}

                {/* List view */}
                {viewMode === "list" && (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <SteamLibraryCard
                        key={entry.id}
                        entry={entry}
                        view="list"
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Recently Played Tab ── */}
          <TabsContent value="recent">
            {isRecentLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : recentEntries.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    No recently played games found.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Games you&apos;ve played in the last 2 weeks will appear here after syncing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recentEntries.map((entry) => (
                  <SteamLibraryCard
                    key={entry.id}
                    entry={entry}
                    view="grid"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}