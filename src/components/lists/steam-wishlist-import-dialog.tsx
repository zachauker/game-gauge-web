"use client";

/**
 * src/components/lists/steam-wishlist-import-dialog.tsx
 *
 * Fetches the user's Steam wishlist, shows matched vs unmatched games,
 * and bulk-adds selected matched games to the Wishlist default list.
 */

import {useState, useEffect, useCallback} from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Loader2, ExternalLink, Check, AlertCircle, Download} from "lucide-react";
import {cn} from "@/lib/utils";
import {getSteamWishlist, type SteamWishlistItem} from "@/lib/steam";
import {addGameToList} from "@/lib/lists";
import {toast} from "sonner";

// Lucide doesn't ship a Steam icon — use a simple inline SVG instead
function SteamLogo({className}: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
        </svg>
    );
}

interface SteamWishlistImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The Wishlist default list ID to import into */
    wishlistId: string;
    /** Game IDs already in the Wishlist list (to avoid re-importing) */
    existingGameIds: Set<string>;
    onImported: () => void;
}

export function SteamWishlistImportDialog({
                                              open,
                                              onOpenChange,
                                              wishlistId,
                                              existingGameIds,
                                              onImported,
                                          }: SteamWishlistImportDialogProps) {
    const [items, setItems] = useState<SteamWishlistItem[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
    const [error, setError] = useState("");

    const matchedItems = items.filter(
        (i) => i.matched && i.gameId && !existingGameIds.has(i.gameId)
    );
    const alreadyImported = items.filter(
        (i) => i.matched && i.gameId && existingGameIds.has(i.gameId)
    );
    const unmatchedItems = items.filter((i) => !i.matched);

    const fetchWishlist = useCallback(async () => {
        setIsLoading(true);
        setError("");
        setSelected(new Set());
        try {
            const data = await getSteamWishlist();
            setItems(data);
            // Read existingGameIds directly here rather than from closure
            setSelected(
                new Set(
                    data
                        .filter((i) => i.matched && i.gameId)
                        .map((i) => i.gameId!)
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch Steam wishlist");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchWishlist();
    }, [open, fetchWishlist]);

    const toggleSelect = (gameId: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(gameId) ? next.delete(gameId) : next.add(gameId);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === matchedItems.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(matchedItems.map((i) => i.gameId!)));
        }
    };

    const handleImport = async () => {
        if (selected.size === 0) return;
        setIsImporting(true);
        setImportProgress({done: 0, total: selected.size});

        const gameIds = Array.from(selected);
        let successCount = 0;

        for (const gameId of gameIds) {
            try {
                await addGameToList(wishlistId, gameId);
                successCount++;
            } catch {
                // Skip duplicates / errors silently — we'll report the summary
            }
            setImportProgress((p) => p && {...p, done: p.done + 1});
        }

        setIsImporting(false);
        setImportProgress(null);

        if (successCount > 0) {
            toast.success(
                `${successCount} game${successCount !== 1 ? "s" : ""} added to your Wishlist`
            );
            onImported();
            onOpenChange(false);
        } else {
            toast.error("No games were imported — they may already be in your Wishlist");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <SteamLogo className="h-5 w-5"/>
                        Import Steam Wishlist
                    </DialogTitle>
                    <DialogDescription>
                        Select matched games to add to your Game Gauge Wishlist.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin"/>
                            <span className="text-sm">Fetching your Steam wishlist…</span>
                        </div>
                    ) : error ? (
                        <div
                            className="flex items-start gap-3 bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/>
                            <div>
                                <p className="font-medium">Couldn't load wishlist</p>
                                <p className="mt-0.5 opacity-80">{error}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 text-destructive hover:text-destructive"
                                    onClick={fetchWishlist}
                                >
                                    Try again
                                </Button>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="font-medium">Your Steam wishlist is empty</p>
                            <p className="text-sm mt-1">Add games on Steam then come back.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Matched games ──────────────────────────────── */}
                            {matchedItems.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500"/>
                                            In Game Gauge
                                            <Badge variant="secondary">{matchedItems.length}</Badge>
                                        </h3>
                                        <button
                                            onClick={toggleAll}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {selected.size === matchedItems.length ? "Deselect all" : "Select all"}
                                        </button>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {matchedItems.map((item) => {
                                            const isSelected = selected.has(item.gameId!);
                                            return (
                                                <li key={item.steamAppId}>
                                                    <label
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                                                            "hover:border-primary/40 hover:bg-accent",
                                                            isSelected ? "border-primary/50 bg-primary/5" : "border-border"
                                                        )}
                                                    >
                                                        {/* Real checkbox — handles all click/keyboard interaction */}
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(item.gameId!)}
                                                            className="h-4 w-4 rounded accent-primary shrink-0"
                                                        />

                                                        {/* Steam header image */}
                                                        <img
                                                            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.steamAppId}/header.jpg`}
                                                            alt=""
                                                            className="w-16 h-6 object-cover rounded shrink-0 bg-muted"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = "none";
                                                            }}
                                                        />

                                                        <span className="flex-1 text-sm font-medium truncate">
          {item.name}
        </span>
                                                    </label>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            )}

                            {/* ── Already imported ───────────────────────────── */}
                            {alreadyImported.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                        Already in Wishlist
                                        <Badge variant="outline">{alreadyImported.length}</Badge>
                                    </h3>
                                    <ul className="space-y-1">
                                        {alreadyImported.map((item) => (
                                            <li
                                                key={item.steamAppId}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 opacity-60"
                                            >
                                                <Check className="h-4 w-4 text-green-500 shrink-0"/>
                                                <span className="text-sm truncate">{item.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* ── Unmatched ──────────────────────────────────── */}
                            {unmatchedItems.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                        Not yet in Game Gauge
                                        <Badge variant="outline">{unmatchedItems.length}</Badge>
                                    </h3>
                                    <ul className="space-y-1">
                                        {unmatchedItems.map((item) => (
                                            <li
                                                key={item.steamAppId}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30"
                                            >
                        <span className="flex-1 text-sm text-muted-foreground truncate">
                          {item.name}
                        </span>
                                                <a
                                                    href={item.storeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                                    title="View on Steam"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5"/>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isImporting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={
                            isLoading || isImporting || selected.size === 0
                        }
                        className="min-w-[140px]"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                {importProgress
                                    ? `${importProgress.done} / ${importProgress.total}`
                                    : "Importing…"}
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4"/>
                                Import {selected.size > 0 ? `${selected.size} ` : ""}
                                {selected.size === 1 ? "game" : "games"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
