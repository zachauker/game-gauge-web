# Game Search & Discovery — Design Spec

**Date:** 2026-06-30  
**Status:** Approved

---

## Overview

Replace the current split `/search` (IGDB text search) and `/browse` (DB browse) pages with a single unified `/discover` page. The page has two modes that share the same URL and filter chip UI:

- **Browse mode** (no active query): three curated rows powered by community data — Top Rated, Trending, Recent Releases. Filter chips collapse the rows into a flat paginated grid.
- **Search mode** (query active): IGDB text search results in a flat grid. Genre chip carries through to IGDB; platform and sort chips are disabled.

---

## Routes

| Old route | New behavior |
|---|---|
| `/search` | Redirect → `/discover` |
| `/browse` | Redirect → `/discover` |
| `/browse/genre/[genre]` | Redirect → `/discover?genre=[genre]` |
| `/discover` | New unified page |

---

## Page Structure

### Header
- Eyebrow: "Discover"
- Title: "Games"
- Subtitle: "200,000+ titles · powered by IGDB"

### Search bar
Full-width input. On keystroke debounce (300ms) or Enter, activates search mode. Clear (×) button resets to browse mode.

### Filter chips row
Three chips, always visible regardless of mode:

| Chip | Browse mode | Search mode |
|---|---|---|
| Genre | Single-select dropdown; filters DB queries + passes genre ID to IGDB search | Active (passes genre to IGDB) |
| Platform | Single-select dropdown; filters DB queries | Disabled (greyed, tooltip: "not available in search") |
| Sort | Dropdown: Top Rated / Trending / New Releases / Release Date / A–Z | Disabled |

Active filter values appear as amber dismissible pills (e.g. `RPG ×`). Clearing all chips and the search bar returns to the default browse view.

### Browse mode body
Three named sections stacked vertically, each with a "See all →" link:

1. **⭐ Top Rated on Game Gauge** — `GET /api/games/top-rated?limit=6[&genre=]`
2. **🔥 Trending This Week** — `GET /api/games/trending?limit=6[&genre=]`
3. **🆕 New Releases** — `GET /api/igdb/recent?limit=6` (IGDB; no genre filter — IGDB's recent endpoint doesn't support it. When a genre chip is active, this row is hidden as part of the flat-grid collapse anyway.)

When any filter chip is active, the three rows collapse into a single flat paginated grid:
`GET /api/games?genre=&platform=&sortBy=averageRating&page=1&limit=24`

### Search mode body
Flat IGDB result grid. Community rating badge (amber ★ score) shown on cards already in DB. Cards not in DB show existing import-on-click flow (`AutoImportGameCard`).

Result line: `N results for "query" in [Genre] · via IGDB`

---

## Data Flow

### Browse mode — no filters

```
page load → Promise.all([
  GET /api/games/top-rated?limit=6,
  GET /api/games/trending?limit=6,
  GET /api/igdb/recent?limit=6,
])
→ render three CuratedRow sections
```

### Browse mode — filters active

```
filter chip change → collapse to flat grid
GET /api/games?genre=&platform=&sortBy={sort}&page=1&limit=24
→ render GameGrid with pagination
```

The `sortBy` mapping:
- Sort chip "Top Rated" → `averageRating desc`
- Sort chip "Trending" → `activityCount desc`
- Sort chip "New Releases" / "Release Date" → `releaseDate desc`
- Sort chip "A–Z" → `title asc`

### Search mode

```
query input (debounced 300ms) →
GET /api/igdb/search?q={query}&limit=50[&genre={activeIgdbGenreId}]
→ render flat IGDB result grid (all results, no pagination — IGDB caps at 50)
→ extract igdbIds from results →
  GET /api/games/by-igdb-ids?ids={csv}
  → build a Map<igdbId, {averageRating, slug}>
  → overlay community rating badge on matching cards
```

The `igdbIds` batch lookup is a new lightweight endpoint (see API changes).

**Genre passthrough:** The active genre chip value (e.g. "RPG") maps to an IGDB genre ID via a static lookup table in `src/lib/igdb-genres.ts` (e.g. `RPG → 12`, `Action → 31`, `Strategy → 15`). Only genres already present in Game Gauge's DB are in the table — unknown genres are passed as-is and IGDB silently ignores unrecognised IDs.

---

## Components

### New: `app/(main)/discover/page.tsx`
Top-level page. Manages mode state (`browse` | `search`), filter state, and data fetching. Uses `useSearchParams` for shareable URLs (`/discover?genre=rpg&q=witcher`).

### New: `components/discover/FilterChips.tsx`
Renders the three chip dropdowns. Emits `onGenreChange`, `onPlatformChange`, `onSortChange`. Handles disabled state in search mode.

### New: `components/discover/CuratedRows.tsx`
Renders the three named browse sections. Accepts pre-fetched data for each row. "See all →" links fire the corresponding sort chip (e.g. clicking "See all" under Top Rated sets Sort = "Top Rated" and collapses to flat grid).

### New: `components/discover/DiscoverGameCard.tsx`
Extends `BrowseGameCard` with an optional community rating badge overlay. Used for both browse grid and IGDB search results (rating badge only shown when `averageRating` is present).

### Existing: `AutoImportGameCard`
Reused as-is for IGDB results that are not yet in DB.

### New: `components/discover/GameGrid.tsx`
Shared grid shell: `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6`. Accepts `children`, optional skeleton count, optional pagination props.

---

## API Changes

### Backend (`game-gauge-api`)

**1. Add `averageRating` sort to `GET /api/games`**

In `game.validator.ts`, extend `sortBy` enum:
```
sortBy: z.enum(['title', 'releaseDate', 'createdAt', 'metacritic', 'averageRating', 'activityCount'])
```

In `game.service.ts` `findAll`, when `sortBy === 'averageRating'`, order by the `_avg` of the `ratings` relation (Prisma `orderBy` with relation aggregation).

**2. Add `genre` filter to top-rated and trending endpoints**

`GET /api/games/top-rated?limit=6&genre=rpg`  
`GET /api/games/trending?limit=6&genre=rpg`

Both currently ignore genre. Add an optional `genre` query param and pass it into the where clause.

**3. Add batch igdbId lookup endpoint**

`GET /api/games/by-igdb-ids?ids=1234,5678,9012`

Returns `{ data: [{ igdbId, averageRating, ratingCount, slug }] }` — a minimal payload used by the search results to overlay community ratings. Returns only games that exist in DB.

This route must be registered in `game.routes.ts` **before** the `/:id` catch-all route to avoid `by-igdb-ids` being parsed as a game ID.

**4. Add `genre` passthrough to IGDB search**

`GET /api/igdb/search?q=witcher&genre=rpg`

In `igdb.service.ts`, when `genre` is provided, append a genre filter to the IGDB Apicalypse query (IGDB genre IDs will need a lookup table or a genres endpoint call).

### Frontend (`game-gauge-web`)

Extend `src/lib/search.ts`:
- `searchIGDB` accepts optional `genre` param
- Add `getBatchCommunityData(igdbIds: number[])` calling the new batch endpoint
- Add `getTopRated(limit, genre?)` and `getTrending(limit, genre?)` wrappers

---

## Error Handling

- IGDB search failure: show inline error state within the search results area, not a full-page error. Offer a "Try again" button.
- Browse data failure: failed sections show a subtle retry link; other sections still render.
- Batch igdbId lookup failure: silently skip rating overlays (non-critical path).
- All loading states use the existing skeleton pattern (`animate-pulse` grid).

---

## Testing

- Unit test `FilterChips` for disabled state in search mode and chip dismiss behavior.
- Unit test `game.service.findAll` with `sortBy=averageRating` to confirm ordering.
- Integration test: `GET /api/games/top-rated?genre=rpg` returns only RPG games.
- Integration test: `GET /api/games/by-igdb-ids?ids=...` returns correct subset.
- E2E smoke: land on `/discover`, verify three curated rows render; type a query, verify IGDB grid appears; apply genre chip, verify genre appears in result count label.
