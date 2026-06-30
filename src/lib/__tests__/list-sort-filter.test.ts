import { describe, it, expect } from "vitest";
import {
  sortListItems,
  filterListItems,
  DEFAULT_LIST_FILTER_STATE,
} from "../list-sort-filter";
import type { GameListItem } from "@/lib/api";

function makeItem(overrides: Partial<GameListItem>): GameListItem {
  return {
    id: overrides.id ?? "item-1",
    listId: "list-1",
    gameId: overrides.gameId ?? "game-1",
    order: overrides.order ?? 0,
    progressPct: overrides.progressPct,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    game: {
      id: overrides.gameId ?? "game-1",
      title: "Untitled",
      slug: "untitled",
      genres: [],
      platforms: [],
      ratings: [],
      ...overrides.game,
    },
    ...overrides,
  };
}

describe("sortListItems", () => {
  it("sorts by custom order ascending by item.order", () => {
    const items = [
      makeItem({ id: "a", order: 2 }),
      makeItem({ id: "b", order: 0 }),
      makeItem({ id: "c", order: 1 }),
    ];
    const result = sortListItems(items, "custom", "asc");
    expect(result.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by title A-Z", () => {
    const items = [
      makeItem({ id: "a", game: { id: "g1", title: "Zelda", slug: "z", genres: [], platforms: [] } }),
      makeItem({ id: "b", game: { id: "g2", title: "Alan Wake", slug: "a", genres: [], platforms: [] } }),
    ];
    const result = sortListItems(items, "title", "asc");
    expect(result.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("sorts by progress descending", () => {
    const items = [
      makeItem({ id: "a", progressPct: 20 }),
      makeItem({ id: "b", progressPct: 90 }),
      makeItem({ id: "c", progressPct: 50 }),
    ];
    const result = sortListItems(items, "progress", "desc");
    expect(result.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by your rating, treating missing ratings as 0", () => {
    const items = [
      makeItem({ id: "a", game: { id: "g1", title: "A", slug: "a", genres: [], platforms: [], ratings: [{ score: 7 }] } }),
      makeItem({ id: "b", game: { id: "g2", title: "B", slug: "b", genres: [], platforms: [], ratings: [] } }),
      makeItem({ id: "c", game: { id: "g3", title: "C", slug: "c", genres: [], platforms: [], ratings: [{ score: 9 }] } }),
    ];
    const result = sortListItems(items, "rating", "desc");
    expect(result.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by release date ascending, treating missing dates as earliest", () => {
    const items = [
      makeItem({ id: "a", game: { id: "g1", title: "A", slug: "a", genres: [], platforms: [], releaseDate: "2020-01-01" } }),
      makeItem({ id: "b", game: { id: "g2", title: "B", slug: "b", genres: [], platforms: [] } }),
      makeItem({ id: "c", game: { id: "g3", title: "C", slug: "c", genres: [], platforms: [], releaseDate: "2010-01-01" } }),
    ];
    const result = sortListItems(items, "releaseDate", "asc");
    expect(result.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
});

describe("filterListItems", () => {
  const items = [
    makeItem({
      id: "a",
      progressPct: 0,
      game: { id: "g1", title: "Hollow Knight", slug: "hk", genres: ["Metroidvania"], platforms: ["PC"] },
    }),
    makeItem({
      id: "b",
      progressPct: 100,
      game: { id: "g2", title: "Hades", slug: "hades", genres: ["Roguelike"], platforms: ["PC", "Switch"] },
    }),
    makeItem({
      id: "c",
      progressPct: 50,
      game: { id: "g3", title: "Celeste", slug: "celeste", genres: ["Platformer"], platforms: ["Switch"] },
    }),
  ];

  it("returns everything when filters are at default", () => {
    expect(filterListItems(items, DEFAULT_LIST_FILTER_STATE)).toHaveLength(3);
  });

  it("filters by case-insensitive title search", () => {
    const result = filterListItems(items, { ...DEFAULT_LIST_FILTER_STATE, search: "hol" });
    expect(result.map((i) => i.id)).toEqual(["a"]);
  });

  it("filters by genre (any match)", () => {
    const result = filterListItems(items, { ...DEFAULT_LIST_FILTER_STATE, genres: ["Roguelike"] });
    expect(result.map((i) => i.id)).toEqual(["b"]);
  });

  it("filters by platform (any match)", () => {
    const result = filterListItems(items, { ...DEFAULT_LIST_FILTER_STATE, platforms: ["Switch"] });
    expect(result.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("filters by completion status", () => {
    expect(
      filterListItems(items, { ...DEFAULT_LIST_FILTER_STATE, status: "completed" }).map((i) => i.id)
    ).toEqual(["b"]);
    expect(
      filterListItems(items, { ...DEFAULT_LIST_FILTER_STATE, status: "not_started" }).map((i) => i.id)
    ).toEqual(["a"]);
    expect(
      filterListItems(items, { ...DEFAULT_LIST_FILTER_STATE, status: "in_progress" }).map((i) => i.id)
    ).toEqual(["c"]);
  });

  it("combines search and genre filters", () => {
    const result = filterListItems(items, {
      ...DEFAULT_LIST_FILTER_STATE,
      search: "ce",
      genres: ["Platformer"],
    });
    expect(result.map((i) => i.id)).toEqual(["c"]);
  });
});
