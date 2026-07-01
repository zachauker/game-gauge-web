"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import {
  ChevronLeft,
  Plus,
  Globe,
  Lock,
  Loader2,
  Trash2,
  Edit,
  Search,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/lib/api";
import type { GameList, GameListItem } from "@/lib/api";
import {
  getList,
  deleteList,
  removeGameFromList,
  updateListItem,
  updateList,
  reorderListItems,
} from "@/lib/lists";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { AddGameToListDialog } from "@/components/lists/add-game-dialog";
import { ProgressEditDialog } from "@/components/lists/progress-edit-dialog";
import { CompleteGameDialog } from "@/components/lists/complete-game-dialog";
import { SteamWishlistImportDialog } from "@/components/lists/steam-wishlist-import-dialog";
import { ListToolbar } from "@/components/lists/list-toolbar";
import { ListItemRow } from "@/components/lists/list-item-row";
import {
  sortListItems,
  filterListItems,
  DEFAULT_LIST_FILTER_STATE,
  type SortBy,
  type SortDir,
  type ListFilterState,
} from "@/lib/list-sort-filter";
import { syncAchievements } from "@/lib/lists";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressEditState {
  gameId: string;
  gameTitle: string;
  currentPct: number | null | undefined;
  currentNote: string | null | undefined;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const listId = params.id as string;

  const [list, setList] = useState<GameList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [progressEdit, setProgressEdit] = useState<ProgressEditState | null>(null);
  const [completeTarget, setCompleteTarget] = useState<{ gameId: string; gameTitle: string } | null>(null);
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [syncingAchievementsFor, setSyncingAchievementsFor] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListFilterState>(DEFAULT_LIST_FILTER_STATE);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isOwner       = isAuthenticated && user?.id === list?.userId;
  const isPlayingList = list?.listType === "playing";
  const isWishlist    = list?.listType === "wishlist" && list?.isDefault;
  const hasSteam      = Boolean(user?.steamId);
  const showSteamImportButton = isOwner && isWishlist && hasSteam;
  const existingGameIds = new Set((list?.items ?? []).map((item) => item.gameId));

  const sortBy = (list?.sortBy ?? "custom") as SortBy;
  const sortDir = (list?.sortDir ?? "asc") as SortDir;
  const dragEnabled = isOwner && sortBy === "custom";

  const sortedItems = useMemo(
    () => (list ? sortListItems(list.items ?? [], sortBy, sortDir) : []),
    [list, sortBy, sortDir]
  );
  const visibleItems = useMemo(() => filterListItems(sortedItems, filters), [sortedItems, filters]);

  const availableGenres = useMemo(
    () => Array.from(new Set((list?.items ?? []).flatMap((i) => i.game?.genres ?? []))).sort(),
    [list]
  );
  const availablePlatforms = useMemo(
    () => Array.from(new Set((list?.items ?? []).flatMap((i) => i.game?.platforms ?? []))).sort(),
    [list]
  );
  const hasProgressData = (list?.items ?? []).some((i) => i.progressPct !== null && i.progressPct !== undefined);

  useEffect(() => {
    if (listId) loadList();
  }, [listId]);

  const loadList = async () => {
    setIsLoading(true);
    setError("");
    try {
      setList(await getList(listId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateList = async (data: { name: string; description?: string; isPublic: boolean }) => {
    try {
      const { api } = await import("@/lib/api");
      await api.patch(`/lists/${listId}`, data);
      await loadList();
      setShowEditDialog(false);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleDeleteList = async () => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    try {
      await deleteList(listId);
      router.push("/lists");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    if (!confirm("Remove this game from the list?")) return;
    try {
      await removeGameFromList(listId, gameId);
      await loadList();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAddGame = async (gameId: string, notes?: string) => {
    try {
      const { api } = await import("@/lib/api");
      await api.post(`/lists/${listId}/games`, { gameId, notes });
      await loadList();
      setShowAddGameDialog(false);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleProgressSave = async (pct: number, note: string) => {
    if (!progressEdit) return;
    await updateListItem(listId, progressEdit.gameId, {
      progressPct: pct,
      progressNote: note || undefined,
    });
    toast.success("Progress updated");
    await loadList();
  };

  const handleSyncAchievements = async (gameId: string) => {
    setSyncingAchievementsFor(gameId);
    try {
      await syncAchievements(listId, gameId);
      await loadList();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSyncingAchievementsFor(null);
    }
  };

  const handleSortChange = async (newSortBy: SortBy, newSortDir: SortDir) => {
    if (!list) return;
    const previous = list;
    setList({ ...list, sortBy: newSortBy, sortDir: newSortDir });
    try {
      await updateList(listId, { sortBy: newSortBy, sortDir: newSortDir });
    } catch (err) {
      setList(previous);
      toast.error(getErrorMessage(err));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!list || !over || active.id === over.id) return;

    const oldVisibleIndex = visibleItems.findIndex((i) => i.id === active.id);
    const newVisibleIndex = visibleItems.findIndex((i) => i.id === over.id);
    if (oldVisibleIndex === -1 || newVisibleIndex === -1) return;

    const reorderedVisible = arrayMove(visibleItems, oldVisibleIndex, newVisibleIndex);

    // Merge the reordered visible subsequence back into the full sorted list,
    // preserving the relative position of items currently hidden by filters.
    const visibleIds = new Set(visibleItems.map((i) => i.id));
    let visibleCursor = 0;
    const merged = sortedItems.map((item) =>
      visibleIds.has(item.id) ? reorderedVisible[visibleCursor++] : item
    );

    const reordered = merged.map((item, index) => ({ ...item, order: index }));
    const previous = list;
    setList({ ...list, items: reordered });

    try {
      await reorderListItems(
        listId,
        reordered.map((item) => ({ id: item.id, order: item.order }))
      );
    } catch (err) {
      setList(previous);
      toast.error(getErrorMessage(err));
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
        </div>
      </MainLayout>
    );
  }

  if (error || !list) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="rounded-lg bg-brand-red/5 border border-brand-red/20 px-4 py-3 text-[13px] text-brand-red mb-4">
            {error || "List not found"}
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-[13px] text-foreground/40 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">

        {/* ── Back link ── */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-1 text-[12px] text-foreground/35 hover:text-foreground/70 mb-7 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          My Lists
        </Link>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-medium tracking-tight text-foreground truncate">
                {list.name}
              </h1>
              {list.isDefault && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/15 text-foreground/40">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[12px] text-foreground/40 flex-wrap">
              {list.isPublic ? (
                <span className="inline-flex items-center gap-1 text-brand-teal">
                  <Globe className="h-3 w-3" /> Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
              <span>{list.items?.length ?? 0} games</span>
            </div>
            {list.description && (
              <p className="text-[13px] text-foreground/40 mt-2 leading-relaxed">
                {list.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showSteamImportButton && (
              <button
                onClick={() => setShowSteamImport(true)}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground/60 hover:text-foreground border border-brand-purple/20 hover:border-brand-purple/40 rounded-lg transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
                </svg>
                Import Wishlist
              </button>
            )}
            {isOwner && !list.isDefault && (
              <>
                <button
                  onClick={() => setShowEditDialog(true)}
                  className="p-2 rounded-lg border border-brand-purple/20 hover:border-brand-purple/40 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Edit list"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDeleteList}
                  className="p-2 rounded-lg border border-brand-purple/20 hover:border-brand-red/30 text-foreground/40 hover:text-brand-red transition-colors"
                  aria-label="Delete list"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={() => setShowAddGameDialog(true)}
                className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/80 text-foreground text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Game
              </button>
            )}
          </div>
        </div>

        {/* ── Inline error ── */}
        {error && (
          <div className="rounded-lg bg-brand-red/5 border border-brand-red/20 px-4 py-3 text-[12px] text-brand-red mb-6">
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {(!list.items || list.items.length === 0) && (
          <div className="rounded-lg border border-dashed border-brand-purple/20 bg-card py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-foreground/20 mb-3" />
            <p className="text-[13px] text-foreground/40 mb-4">
              {isOwner ? "Add your first game to get started" : "This list has no games yet"}
            </p>
            {isOwner && (
              <button
                onClick={() => setShowAddGameDialog(true)}
                className="inline-flex items-center gap-1.5 text-[12px] text-brand-purple hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a game
              </button>
            )}
          </div>
        )}

        {/* ── Toolbar ── */}
        {list.items && list.items.length > 0 && (
          <ListToolbar
            search={filters.search}
            onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            availableGenres={availableGenres}
            availablePlatforms={availablePlatforms}
            selectedGenres={filters.genres}
            onGenresChange={(genres) => setFilters((f) => ({ ...f, genres }))}
            selectedPlatforms={filters.platforms}
            onPlatformsChange={(platforms) => setFilters((f) => ({ ...f, platforms }))}
            showStatusFilter={hasProgressData}
            status={filters.status}
            onStatusChange={(status) => setFilters((f) => ({ ...f, status }))}
          />
        )}

        {/* ── No results from filters ── */}
        {list.items && list.items.length > 0 && visibleItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-brand-purple/20 bg-card py-14 text-center">
            <Search className="mx-auto h-8 w-8 text-foreground/20 mb-3" />
            <p className="text-[13px] text-foreground/40">No games match your search/filters.</p>
          </div>
        )}

        {/* ── Game list ── */}
        {visibleItems.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {visibleItems.map((item: GameListItem) => (
                  <ListItemRow
                    key={item.id}
                    item={item}
                    isOwner={isOwner}
                    isPlayingList={isPlayingList}
                    dragEnabled={dragEnabled}
                    syncingAchievements={syncingAchievementsFor === item.gameId}
                    hasSteam={Boolean(user?.steamId)}
                    onRemove={handleRemoveGame}
                    onProgressEditClick={() =>
                      setProgressEdit({
                        gameId: item.gameId,
                        gameTitle: item.game?.title ?? "",
                        currentPct: item.progressPct,
                        currentNote: item.progressNote,
                      })
                    }
                    onSyncAchievements={() => handleSyncAchievements(item.gameId)}
                    onCompleteClick={() =>
                      setCompleteTarget({ gameId: item.gameId, gameTitle: item.game?.title ?? "" })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* ── Dialogs ── */}
        <CreateListDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={handleUpdateList}
          initialData={{
            name: list.name,
            description: list.description ?? undefined,
            isPublic: list.isPublic,
          }}
        />
        <AddGameToListDialog
          open={showAddGameDialog}
          onOpenChange={setShowAddGameDialog}
          onSubmit={handleAddGame}
        />
        <ProgressEditDialog
          open={progressEdit !== null}
          onOpenChange={(open) => { if (!open) setProgressEdit(null); }}
          gameTitle={progressEdit?.gameTitle ?? ""}
          currentPct={progressEdit?.currentPct}
          currentNote={progressEdit?.currentNote}
          onSubmit={handleProgressSave}
        />
        <CompleteGameDialog
          open={completeTarget !== null}
          onOpenChange={(open) => { if (!open) setCompleteTarget(null); }}
          gameId={completeTarget?.gameId ?? ""}
          gameTitle={completeTarget?.gameTitle ?? ""}
          onCompleted={loadList}
        />
        <SteamWishlistImportDialog
          open={showSteamImport}
          onOpenChange={setShowSteamImport}
          wishlistId={listId}
          existingGameIds={existingGameIds}
          onImported={loadList}
        />
      </div>
    </MainLayout>
  );
}
