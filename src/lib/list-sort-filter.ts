/**
 * src/lib/list-sort-filter.ts
 *
 * Pure client-side sort/filter helpers for list detail pages.
 * Sorting mirrors GameList.sortBy/sortDir (persisted server-side);
 * filtering is transient UI state, never sent to the server.
 */

import type { GameListItem } from "@/lib/api";
import type { ListSortBy, ListSortDir } from "@/lib/api";

export type SortBy = ListSortBy;
export type SortDir = ListSortDir;

export type ListStatusFilter = "all" | "not_started" | "in_progress" | "completed";

export interface ListFilterState {
  search: string;
  genres: string[];
  platforms: string[];
  status: ListStatusFilter;
}

export const DEFAULT_LIST_FILTER_STATE: ListFilterState = {
  search: "",
  genres: [],
  platforms: [],
  status: "all",
};

export function sortListItems(
  items: GameListItem[],
  sortBy: SortBy,
  sortDir: SortDir
): GameListItem[] {
  if (sortBy === "custom") {
    return [...items].sort((a, b) => a.order - b.order);
  }

  const dir = sortDir === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return (a.game?.title ?? "").localeCompare(b.game?.title ?? "") * dir;
      case "dateAdded":
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      case "progress":
        return ((a.progressPct ?? 0) - (b.progressPct ?? 0)) * dir;
      case "releaseDate": {
        const aTime = a.game?.releaseDate ? new Date(a.game.releaseDate).getTime() : 0;
        const bTime = b.game?.releaseDate ? new Date(b.game.releaseDate).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      case "rating": {
        const aScore = a.game?.ratings?.[0]?.score ?? 0;
        const bScore = b.game?.ratings?.[0]?.score ?? 0;
        return (aScore - bScore) * dir;
      }
      default:
        return 0;
    }
  });
}

export function filterListItems(
  items: GameListItem[],
  filters: ListFilterState
): GameListItem[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (search && !(item.game?.title ?? "").toLowerCase().includes(search)) {
      return false;
    }

    if (filters.genres.length > 0) {
      const itemGenres = item.game?.genres ?? [];
      if (!filters.genres.some((g) => itemGenres.includes(g))) return false;
    }

    if (filters.platforms.length > 0) {
      const itemPlatforms = item.game?.platforms ?? [];
      if (!filters.platforms.some((p) => itemPlatforms.includes(p))) return false;
    }

    if (filters.status !== "all") {
      const pct = item.progressPct ?? 0;
      if (filters.status === "not_started" && pct !== 0) return false;
      if (filters.status === "in_progress" && (pct === 0 || pct === 100)) return false;
      if (filters.status === "completed" && pct !== 100) return false;
    }

    return true;
  });
}
