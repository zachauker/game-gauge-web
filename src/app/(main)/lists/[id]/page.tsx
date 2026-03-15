"use client";

import {useState, useEffect} from "react";
import {useParams, useRouter} from "next/navigation";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
    ChevronLeft,
    Plus,
    Globe,
    Lock,
    Loader2,
    Trash2,
    Edit,
    Search,
    Trophy,
    CheckCircle2,
} from "lucide-react";
import {useAuthStore} from "@/store/auth";
import {getErrorMessage} from "@/lib/api";
import type {GameList, GameListItem} from "@/lib/api";
import {
    getList,
    deleteList,
    removeGameFromList,
    updateListItem,
} from "@/lib/lists";
import Link from "next/link";
import Image from "next/image";
import {CreateListDialog} from "@/components/lists/create-list-dialog";
import {AddGameToListDialog} from "@/components/lists/add-game-dialog";
import {ProgressBar} from "@/components/lists/progress-bar";
import {ProgressEditDialog} from "@/components/lists/progress-edit-dialog";
import {toast} from "sonner";
import {CompleteGameDialog} from "@/components/lists/complete-game-dialog";
import {SteamWishlistImportDialog} from "@/components/lists/steam-wishlist-import-dialog";

interface ProgressEditState {
    gameId: string;
    gameTitle: string;
    currentPct: number | null | undefined;
    currentNote: string | null | undefined;
}

export default function ListDetailPage() {
    const params = useParams();
    const router = useRouter();
    const {user, isAuthenticated} = useAuthStore();
    const listId = params.id as string;

    const [list, setList] = useState<GameList | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showAddGameDialog, setShowAddGameDialog] = useState(false);
    const [progressEdit, setProgressEdit] = useState<ProgressEditState | null>(null);

    const isOwner = isAuthenticated && user?.id === list?.userId;
    const isPlayingList = list?.listType === "playing";

    const [completeTarget, setCompleteTarget] = useState<{
        gameId: string;
        gameTitle: string;
    } | null>(null);

    const [showSteamImport, setShowSteamImport] = useState(false);
    const isWishlist = list?.listType === "wishlist" && list?.isDefault;
    const hasSteam = Boolean(user?.steamId);
    const showSteamImportButton = isOwner && isWishlist && hasSteam;
    const existingGameIds = new Set(
        (list?.items ?? []).map((item) => item.gameId)
    );


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

    const handleUpdateList = async (data: {
        name: string;
        description?: string;
        isPublic: boolean;
    }) => {
        try {
            const {api} = await import("@/lib/api");
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
            const {api} = await import("@/lib/api");
            await api.post(`/lists/${listId}/games`, {gameId, notes});
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

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>
            </MainLayout>
        );
    }

    if (error || !list) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
                        {error || "List not found"}
                    </div>
                    <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
                        <ChevronLeft className="mr-2 h-4 w-4"/>
                        Go Back
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back link */}
                <Link
                    href="/lists"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ChevronLeft className="mr-1 h-4 w-4"/>
                    My Lists
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h1 className="text-3xl font-bold truncate">{list.name}</h1>
                            {list.isDefault && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    Default
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <Badge variant={list.isPublic ? "default" : "secondary"}>
                                {list.isPublic ? (
                                    <><Globe className="mr-1 h-3 w-3"/>Public</>
                                ) : (
                                    <><Lock className="mr-1 h-3 w-3"/>Private</>
                                )}
                            </Badge>
                            <span>{list.items?.length ?? 0} games</span>
                        </div>
                        {list.description && (
                            <p className="text-muted-foreground mt-2">{list.description}</p>
                        )}
                    </div>

                    {showSteamImportButton && (
                        <Button
                            variant="outline"
                            onClick={() => setShowSteamImport(true)}
                        >
                            {/* Steam logo SVG — same inline one used in the dialog */}
                            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4">
                                <path
                                    d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
                            </svg>
                            Import from Steam
                        </Button>
                    )}

                    {isOwner && (
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Only allow editing/deleting non-default lists */}
                            {!list.isDefault && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowEditDialog(true)}
                                    >
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleDeleteList}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </>
                            )}
                            <Button onClick={() => setShowAddGameDialog(true)}>
                                <Plus className="mr-2 h-4 w-4"/>
                                Add Game
                            </Button>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {(!list.items || list.items.length === 0) && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
                                <h3 className="text-lg font-semibold mb-2">No games yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    {isOwner
                                        ? "Add your first game to get started"
                                        : "This list has no games yet"}
                                </p>
                                {isOwner && (
                                    <Button onClick={() => setShowAddGameDialog(true)}>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Add Game
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Game list */}
                {list.items && list.items.length > 0 && (
                    <div className="space-y-3">
                        {list.items.map((item: GameListItem) => {
                            const isAt100 =
                                isPlayingList && (item.progressPct ?? 0) === 100;

                            return (
                                <Card
                                    key={item.id}
                                    className={isAt100 ? "border-green-500/40" : undefined}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Cover */}
                                            <div
                                                className="w-12 h-16 relative rounded overflow-hidden bg-muted shrink-0">
                                                {item.game?.coverImage ? (
                                                    <Image
                                                        src={item.game.coverImage}
                                                        alt={item.game.title ?? ""}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                                        No art
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/games/${item.game?.slug}`}
                                                            className="font-semibold hover:text-primary transition-colors line-clamp-1"
                                                        >
                                                            {item.game?.title}
                                                        </Link>
                                                        {item.notes && (
                                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isOwner && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                handleRemoveGame(item.gameId)
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5"/>
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Progress section — Currently Playing only */}
                                                {isPlayingList && (
                                                    <div className="mt-3 space-y-1.5">
                                                        <ProgressBar
                                                            value={item.progressPct}
                                                            editable={isOwner}
                                                            onClick={() =>
                                                                setProgressEdit({
                                                                    gameId: item.gameId,
                                                                    gameTitle: item.game?.title ?? "",
                                                                    currentPct: item.progressPct,
                                                                    currentNote: item.progressNote,
                                                                })
                                                            }
                                                        />
                                                        {item.progressNote && (
                                                            <p className="text-xs text-muted-foreground italic">
                                                                {item.progressNote}
                                                            </p>
                                                        )}

                                                        {/* 100% nudge */}
                                                        {isAt100 && (
                                                            <div
                                                                className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-600 dark:text-green-400">
                                                                <CheckCircle2 className="h-4 w-4 shrink-0"/>
                                                                <span className="flex-1">
                                  You&apos;re at 100% — ready to mark this complete?
                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs border-green-500/40 hover:bg-green-500/10"
                                                                    onClick={() =>
                                                                        setCompleteTarget({
                                                                            gameId: item.gameId,
                                                                            gameTitle: item.game?.title ?? "",
                                                                        })
                                                                    }
                                                                >
                                                                    <Trophy className="mr-1 h-3 w-3"/>
                                                                    Complete
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Dialogs */}
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
                    onOpenChange={(open) => {
                        if (!open) setProgressEdit(null);
                    }}
                    gameTitle={progressEdit?.gameTitle ?? ""}
                    currentPct={progressEdit?.currentPct}
                    currentNote={progressEdit?.currentNote}
                    onSubmit={handleProgressSave}
                />
            </div>
            <CompleteGameDialog
                open={completeTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setCompleteTarget(null);
                }}
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
        </MainLayout>
    );
}