# Game Search & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate `/search` and `/browse` pages with a unified `/discover` page featuring filter chips, curated browse rows (Top Rated, Trending, New Releases), and IGDB-powered text search with community rating overlays.

**Architecture:** Browse mode (no query) fetches community data from the local DB and renders three named curated rows; activating any filter chip collapses these into a flat paginated grid from the DB. Search mode (query present) fetches IGDB results and overlays community ratings for games already in the DB. The active genre chip carries through to IGDB search; platform and sort chips are disabled in search mode.

**Tech Stack:** Node.js/Express/Prisma (API), Next.js 14 App Router/TypeScript/Tailwind (web), IGDB Apicalypse query language, PostgreSQL raw queries via `prisma.$queryRaw`.

---

## File Structure

**Backend (`game-gauge/game-gauge-api/src/`):**
- Modify: `repositories/game.repository.ts` — add `genre` param to `getTopRated`/`getTrending`, add `findByIgdbIds`, add `averageRating` to `findAll` sort
- Modify: `services/game.service.ts` — propagate `genre` param, add `findByIgdbIds`
- Modify: `controllers/game.controller.ts` — update `getTopRated`/`getTrending`, add `getByIgdbIds`
- Modify: `routes/game.routes.ts` — add `/by-igdb-ids` route (must be before `/:id`)
- Modify: `validators/game.validator.ts` — add `averageRating` to `sortBy` enum, add `SearchOptions` type update
- Modify: `services/igdb.service.ts` — add optional `genreId` to `searchGames`
- Modify: `controllers/igdb.controller.ts` — parse `genre` query param, map to IGDB genre ID, pass to service
- Create: `__tests__/services/discover.service.test.ts` — tests for new genre-filtered methods

**Frontend (`game-gauge-web/src/`):**
- Create: `lib/igdb-genres.ts` — static map of genre name → IGDB genre ID
- Modify: `lib/search.ts` — add `genreId` to `searchIGDB`, add `getBatchCommunityData`, add `getTopRatedGames`/`getTrendingGames` wrappers
- Create: `components/discover/GameGrid.tsx` — shared grid shell with skeleton support
- Create: `components/discover/DiscoverGameCard.tsx` — card with optional community rating badge overlay
- Create: `components/discover/FilterChips.tsx` — genre/platform/sort chip dropdowns
- Create: `components/discover/CuratedRows.tsx` — Top Rated, Trending, New Releases sections
- Create: `app/(main)/discover/page.tsx` — unified discover page
- Modify: `app/(main)/search/page.tsx` — redirect to `/discover`
- Modify: `app/(main)/browse/page.tsx` — redirect to `/discover`
- Modify: `app/(main)/browse/genre/[genre]/page.tsx` — redirect to `/discover?genre=[genre]`
- Modify: `components/layout/navbar.tsx` — update nav links + search overlay target from `/search` to `/discover`

---

## Task 1: Add genre filter to `getTopRated` and `getTrending` in repository

**Files:**
- Modify: `game-gauge/game-gauge-api/src/repositories/game.repository.ts`
- Create: `game-gauge/game-gauge-api/src/__tests__/services/discover.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/services/discover.service.test.ts`:

```typescript
import { GameRepository } from '../../repositories/game.repository';
import { prisma } from '../../config/database';

describe('GameRepository — genre-filtered browse', () => {
  let repo: GameRepository;

  beforeEach(() => {
    repo = new GameRepository();
  });

  describe('getTopRated', () => {
    it('calls $queryRaw with genre WHERE clause when genre is provided', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      await repo.getTopRated(6, 'Role-playing (RPG)');
      expect(prisma.$queryRaw as jest.Mock).toHaveBeenCalled();
      const call = (prisma.$queryRaw as jest.Mock).mock.calls[0][0];
      // Prisma.sql template produces a TemplateStringsArray-based object
      expect(JSON.stringify(call)).toContain('Role-playing (RPG)');
    });

    it('calls $queryRaw without genre clause when genre is omitted', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      await repo.getTopRated(6);
      expect(prisma.$queryRaw as jest.Mock).toHaveBeenCalled();
    });
  });

  describe('getTrending', () => {
    it('calls $queryRaw with genre filter when genre provided', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      await repo.getTrending(7, 6, 'Action');
      expect(prisma.$queryRaw as jest.Mock).toHaveBeenCalled();
    });
  });

  describe('findByIgdbIds', () => {
    it('returns empty array when no ids provided', async () => {
      const result = await repo.findByIgdbIds([]);
      expect(result).toEqual([]);
    });

    it('calls $queryRaw with provided igdb ids', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { igdbId: 1234, slug: 'game-one', averageRating: 8.5, ratingCount: 10 },
      ]);
      const result = await repo.findByIgdbIds([1234, 5678]);
      expect(result).toHaveLength(1);
      expect(result[0].igdbId).toBe(1234);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
npx jest --testPathPattern=discover.service.test --no-coverage
```

Expected: FAIL — `getTopRated` does not accept a `genre` argument yet.

- [ ] **Step 3: Update `getTopRated` and `getTrending` in game.repository.ts**

In `src/repositories/game.repository.ts`, add `import { Prisma } from '@prisma/client';` at the top (alongside the existing import), then replace the `getTopRated` and `getTrending` methods:

```typescript
async getTopRated(
  limit: number = 20,
  genre?: string
): Promise<Array<Game & { averageRating: number; ratingCount: number }>> {
  const genreFilter = genre
    ? Prisma.sql`AND g.genres @> ARRAY[${genre}]::text[]`
    : Prisma.empty;

  return prisma.$queryRaw<Array<Game & { averageRating: number; ratingCount: number }>>(
    Prisma.sql`
      SELECT
        g.*,
        COALESCE(AVG(r.score), 0) as "averageRating",
        COUNT(r.id)::int as "ratingCount"
      FROM "Game" g
      LEFT JOIN "Rating" r ON r."gameId" = g.id
      WHERE 1=1 ${genreFilter}
      GROUP BY g.id
      HAVING COUNT(r.id) >= 3
      ORDER BY AVG(r.score) DESC, COUNT(r.id) DESC
      LIMIT ${limit}
    `
  );
}

async getTrending(
  days: number = 7,
  limit: number = 20,
  genre?: string
): Promise<Array<Game & { activityCount: number }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const genreFilter = genre
    ? Prisma.sql`AND g.genres @> ARRAY[${genre}]::text[]`
    : Prisma.empty;

  return prisma.$queryRaw<Array<Game & { activityCount: number }>>(
    Prisma.sql`
      SELECT
        g.*,
        (
          (SELECT COUNT(*)::int FROM "Rating" WHERE "gameId" = g.id AND "createdAt" >= ${cutoffDate}) +
          (SELECT COUNT(*)::int FROM "Review" WHERE "gameId" = g.id AND "createdAt" >= ${cutoffDate})
        ) as "activityCount"
      FROM "Game" g
      WHERE (
        (SELECT COUNT(*) FROM "Rating" WHERE "gameId" = g.id AND "createdAt" >= ${cutoffDate}) +
        (SELECT COUNT(*) FROM "Review" WHERE "gameId" = g.id AND "createdAt" >= ${cutoffDate})
      ) > 0 ${genreFilter}
      ORDER BY "activityCount" DESC
      LIMIT ${limit}
    `
  );
}
```

Also add `findByIgdbIds` method to `GameRepository` class (before the closing `}`):

```typescript
async findByIgdbIds(
  igdbIds: number[]
): Promise<Array<{ igdbId: number; averageRating: number; ratingCount: number; slug: string }>> {
  if (igdbIds.length === 0) return [];

  return prisma.$queryRaw<
    Array<{ igdbId: number; averageRating: number; ratingCount: number; slug: string }>
  >(
    Prisma.sql`
      SELECT
        g."igdbId",
        g.slug,
        COALESCE(AVG(r.score), 0) as "averageRating",
        COUNT(r.id)::int as "ratingCount"
      FROM "Game" g
      LEFT JOIN "Rating" r ON r."gameId" = g.id
      WHERE g."igdbId" = ANY(${igdbIds}::int[])
      GROUP BY g."igdbId", g.slug
    `
  );
}
```

Also update the `SearchOptions` interface at the top of the file:

```typescript
export interface SearchOptions {
  search?: string;
  genre?: string;
  platform?: string;
  sortBy?: 'title' | 'releaseDate' | 'createdAt' | 'metacritic' | 'averageRating';
  sortOrder?: 'asc' | 'desc';
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
npx jest --testPathPattern=discover.service.test --no-coverage
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
git add src/repositories/game.repository.ts src/__tests__/services/discover.service.test.ts
git commit -m "feat(discover): add genre filter to getTopRated/getTrending, add findByIgdbIds"
```

---

## Task 2: Update `findAll` to support `averageRating` sort

**Files:**
- Modify: `game-gauge/game-gauge-api/src/repositories/game.repository.ts`
- Modify: `game-gauge/game-gauge-api/src/validators/game.validator.ts`

- [ ] **Step 1: Write failing test** (add to `discover.service.test.ts`)

Add a new `describe` block inside the existing test file:

```typescript
describe('GameRepository — findAll with averageRating sort', () => {
  let repo: GameRepository;

  beforeEach(() => {
    repo = new GameRepository();
  });

  it('orders by ratings._avg when sortBy is averageRating', async () => {
    (prisma.game.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.game.count as jest.Mock).mockResolvedValue(0);

    await repo.findAll({
      page: 1,
      limit: 24,
      sortBy: 'averageRating',
      sortOrder: 'desc',
    });

    const findManyCall = (prisma.game.findMany as jest.Mock).mock.calls[0][0];
    expect(findManyCall.orderBy).toEqual({ ratings: { _avg: { score: 'desc' } } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
npx jest --testPathPattern=discover.service.test --no-coverage
```

Expected: FAIL — `averageRating` is not a valid `sortBy` value yet and the orderBy won't match.

- [ ] **Step 3: Update validator and repository**

In `src/validators/game.validator.ts`, update the `sortBy` enum in `listGamesQuerySchema`:

```typescript
sortBy: z
  .enum(['title', 'releaseDate', 'createdAt', 'metacritic', 'averageRating'])
  .optional()
  .default('createdAt'),
```

Also update the type export at the bottom (it's inferred so no change needed there).

In `src/repositories/game.repository.ts`, update the `findAll` method's orderBy logic. Replace the existing `const orderBy` line:

```typescript
// Replace this line:
const orderBy: Prisma.GameOrderByWithRelationInput = {
  [sortBy]: sortOrder,
};

// With this:
const orderBy: Prisma.GameOrderByWithRelationInput =
  sortBy === 'averageRating'
    ? { ratings: { _avg: { score: sortOrder } } }
    : { [sortBy]: sortOrder };
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
npx jest --testPathPattern=discover.service.test --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
git add src/repositories/game.repository.ts src/validators/game.validator.ts
git commit -m "feat(discover): add averageRating sort to findAll"
```

---

## Task 3: Update service + controller for genre-filtered top-rated/trending, add `getByIgdbIds`

**Files:**
- Modify: `game-gauge/game-gauge-api/src/services/game.service.ts`
- Modify: `game-gauge/game-gauge-api/src/controllers/game.controller.ts`
- Modify: `game-gauge/game-gauge-api/src/routes/game.routes.ts`

- [ ] **Step 1: Update `game.service.ts`**

Update `getTopRated`, `getTrending`, and add `findByIgdbIds`:

```typescript
async getTopRated(limit: number = 20, genre?: string) {
  return gameRepository.getTopRated(limit, genre);
}

async getTrending(days: number = 7, limit: number = 20, genre?: string) {
  return gameRepository.getTrending(days, limit, genre);
}

async findByIgdbIds(igdbIds: number[]) {
  return gameRepository.findByIgdbIds(igdbIds);
}
```

- [ ] **Step 2: Update `game.controller.ts`**

Update `getTopRated` and `getTrending` to pass the optional `genre` query param, and add `getByIgdbIds`:

```typescript
async getTopRated(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const genre = req.query.genre as string | undefined;
    const games = await gameService.getTopRated(limit, genre);
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    next(error);
  }
}

async getTrending(req: Request, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const genre = req.query.genre as string | undefined;
    const games = await gameService.getTrending(days, limit, genre);
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    next(error);
  }
}

async getByIgdbIds(req: Request, res: Response, next: NextFunction) {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      return res.status(200).json({ success: true, data: [] });
    }
    const igdbIds = idsParam
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
    const games = await gameService.findByIgdbIds(igdbIds);
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    next(error);
  }
}
```

- [ ] **Step 3: Register route in `game.routes.ts`**

Add this route **before** the existing `router.get('/', ...)` line (and before `/:id`):

```typescript
/**
 * @route   GET /api/games/by-igdb-ids
 * @desc    Get community data for games by IGDB IDs (batch)
 * @access  Public
 * @query   ids - comma-separated IGDB IDs
 * @note    Must be before /:id route
 */
router.get('/by-igdb-ids', gameController.getByIgdbIds.bind(gameController));
```

- [ ] **Step 4: Verify with curl (with the API server running)**

```bash
curl "http://localhost:3000/api/games/top-rated?limit=3&genre=Role-playing%20(RPG)"
# Expected: { success: true, data: [...] } — array of RPG games
curl "http://localhost:3000/api/games/by-igdb-ids?ids=1234,5678"
# Expected: { success: true, data: [...] } — empty or matched games
```

- [ ] **Step 5: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
git add src/services/game.service.ts src/controllers/game.controller.ts src/routes/game.routes.ts
git commit -m "feat(discover): genre filter on top-rated/trending, add by-igdb-ids endpoint"
```

---

## Task 4: Add genre passthrough to IGDB search

**Files:**
- Modify: `game-gauge/game-gauge-api/src/services/igdb.service.ts`
- Modify: `game-gauge/game-gauge-api/src/controllers/igdb.controller.ts`

- [ ] **Step 1: Update `igdb.service.ts` `searchGames` to accept `genreId`**

Replace the existing `searchGames` method:

```typescript
async searchGames(query: string, limit: number = 10, genreId?: number): Promise<IGDBSearchResult[]> {
  const genreClause = genreId ? `where genres = (${genreId});` : '';

  const apicalypseQuery = `
    search "${query}";
    fields name, cover.url, cover.image_id, first_release_date, rating, platforms.name, platforms.abbreviation, genres.name;
    ${genreClause}
    limit ${limit};
  `;

  const results = await this.request<IGDBGame[]>('/games', apicalypseQuery.trim());

  return results.map((game) => ({
    id: game.id,
    name: game.name,
    cover: game.cover
      ? {
          url: this.getImageUrl(game.cover.image_id, 'cover_big'),
          image_id: game.cover.image_id,
        }
      : undefined,
    first_release_date: game.first_release_date,
    rating: game.rating,
    platforms: game.platforms,
    genres: game.genres,
  }));
}
```

- [ ] **Step 2: Update `igdb.controller.ts` `search` method**

Replace the `search` method body to parse and pass `genreId`:

```typescript
async search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, limit } = searchQuerySchema.parse(req.query);
    const genreId = req.query.genreId
      ? parseInt(req.query.genreId as string, 10)
      : undefined;

    const results = await igdbService.searchGames(
      q,
      limit,
      !genreId || isNaN(genreId) ? undefined : genreId
    );

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}
```

- [ ] **Step 3: Verify with curl (API running)**

```bash
# Without genre filter
curl "http://localhost:3000/api/igdb/search?q=zelda&limit=5"
# With genre filter (12 = RPG)
curl "http://localhost:3000/api/igdb/search?q=zelda&limit=5&genreId=12"
```

Expected: second call returns only RPG Zelda games.

- [ ] **Step 4: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge/game-gauge-api
git add src/services/igdb.service.ts src/controllers/igdb.controller.ts
git commit -m "feat(discover): add genre passthrough to IGDB search"
```

---

## Task 5: Create IGDB genre lookup table (frontend)

**Files:**
- Create: `game-gauge-web/src/lib/igdb-genres.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/igdb-genres.ts`:

```typescript
// Maps genre names (as stored in Game Gauge DB, sourced from IGDB) to IGDB genre IDs.
// Used to pass genre filters to the IGDB search API.
export const IGDB_GENRE_IDS: Record<string, number> = {
  'Point-and-click': 2,
  'Fighting': 4,
  'Shooter': 5,
  'Music': 7,
  'Platform': 8,
  'Puzzle': 9,
  'Racing': 10,
  'Real Time Strategy (RTS)': 11,
  'Role-playing (RPG)': 12,
  'Simulator': 13,
  'Sport': 14,
  'Strategy': 15,
  'Turn-based strategy (TBS)': 16,
  'Tactical': 24,
  'Hack and slash/Beat \'em up': 25,
  'Quiz/Trivia': 26,
  'Card & Board Game': 28,
  'MOBA': 29,
  'Adventure': 31,
  'Indie': 32,
  'Arcade': 33,
  'Visual Novel': 34,
};

export function getIgdbGenreId(genreName: string): number | undefined {
  return IGDB_GENRE_IDS[genreName];
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/lib/igdb-genres.ts
git commit -m "feat(discover): add IGDB genre ID lookup table"
```

---

## Task 6: Extend `search.ts` with discover API wrappers

**Files:**
- Modify: `game-gauge-web/src/lib/search.ts`

- [ ] **Step 1: Update `searchIGDB` and add new helpers**

Replace the entire contents of `src/lib/search.ts`:

```typescript
import { api, IGDBGame, Game } from './api';
import { getIgdbGenreId } from './igdb-genres';

export interface SearchFilters {
  query?: string;
  sort?: 'relevance' | 'rating' | 'date';
  page?: number;
  limit?: number;
  genre?: string;
}

export interface SearchResponse {
  games: IGDBGame[];
  total: number;
}

export interface CommunityData {
  igdbId: number;
  slug: string;
  averageRating: number;
  ratingCount: number;
}

export async function searchIGDB(filters: SearchFilters): Promise<SearchResponse> {
  const { query = '', limit = 50, genre } = filters;

  try {
    const params: Record<string, string | number> = { q: query, limit };
    if (genre) {
      const genreId = getIgdbGenreId(genre);
      if (genreId) params.genreId = genreId;
    }

    const response = await api.get('/igdb/search', { params });
    const games = response.data.data || [];
    return { games, total: games.length };
  } catch (error) {
    console.error('IGDB search error:', error);
    return { games: [], total: 0 };
  }
}

export async function getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
  try {
    const response = await api.get('/igdb/popular', { params: { limit } });
    return response.data.data || [];
  } catch (error) {
    console.error('Get popular games error:', error);
    return [];
  }
}

export async function getRecentGames(limit: number = 20): Promise<IGDBGame[]> {
  try {
    const response = await api.get('/igdb/recent', { params: { limit } });
    return response.data.data || [];
  } catch (error) {
    console.error('Get recent games error:', error);
    return [];
  }
}

export async function getIGDBGame(igdbId: number): Promise<IGDBGame | null> {
  try {
    const response = await api.get(`/igdb/games/${igdbId}`);
    return response.data.data;
  } catch (error) {
    console.error('Get IGDB game error:', error);
    return null;
  }
}

export async function importGame(igdbId: number): Promise<Game | null> {
  try {
    const response = await api.post('/igdb/import', { igdbId });
    return response.data.data;
  } catch (error) {
    console.error('Import game error:', error);
    return null;
  }
}

// Returns community data (rating, slug) for IGDB games that are already in the DB.
export async function getBatchCommunityData(igdbIds: number[]): Promise<Map<number, CommunityData>> {
  if (igdbIds.length === 0) return new Map();
  try {
    const response = await api.get('/games/by-igdb-ids', {
      params: { ids: igdbIds.join(',') },
    });
    const data: CommunityData[] = response.data.data || [];
    return new Map(data.map((d) => [d.igdbId, d]));
  } catch (error) {
    console.error('Batch community data error:', error);
    return new Map();
  }
}

export async function getTopRatedGames(
  limit: number = 6,
  genre?: string
): Promise<Array<{ id: string; title: string; slug: string; coverImage: string | null; averageRating: number; ratingCount: number }>> {
  try {
    const params: Record<string, string | number> = { limit };
    if (genre) params.genre = genre;
    const response = await api.get('/games/top-rated', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Get top rated games error:', error);
    return [];
  }
}

export async function getTrendingGames(
  limit: number = 6,
  genre?: string
): Promise<Array<{ id: string; title: string; slug: string; coverImage: string | null; activityCount: number }>> {
  try {
    const params: Record<string, string | number> = { limit };
    if (genre) params.genre = genre;
    const response = await api.get('/games/trending', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Get trending games error:', error);
    return [];
  }
}

export function getIGDBImageUrl(
  imageId: string,
  size: 'thumb' | 'cover_small' | 'cover_big' | 'screenshot_big' = 'cover_big'
): string {
  if (!imageId) return '/placeholder-game.svg';
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export function formatIGDBDate(timestamp?: number): string {
  if (!timestamp) return 'TBA';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/lib/search.ts
git commit -m "feat(discover): extend search.ts with discover API wrappers"
```

---

## Task 7: Create `GameGrid` component

**Files:**
- Create: `game-gauge-web/src/components/discover/GameGrid.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/discover/GameGrid.tsx`:

```tsx
interface GameGridProps {
  children: React.ReactNode;
  skeleton?: number;
}

function GameGridSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-lg bg-card border border-brand-purple/10 animate-pulse"
        />
      ))}
    </>
  );
}

export function GameGrid({ children, skeleton }: GameGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3">
      {skeleton !== undefined ? <GameGridSkeleton count={skeleton} /> : children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/components/discover/GameGrid.tsx
git commit -m "feat(discover): add GameGrid component"
```

---

## Task 8: Create `DiscoverGameCard` component

This card handles two data shapes: DB games (with `averageRating`) and IGDB games (with optional community overlay via `communityData` prop).

**Files:**
- Create: `game-gauge-web/src/components/discover/DiscoverGameCard.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/discover/DiscoverGameCard.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { CommunityData } from "@/lib/search";

// Shape for DB-backed games (browse mode)
export interface DbGame {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  averageRating?: number;
  ratingCount?: number;
  activityCount?: number;
}

// Shape for IGDB games (search mode)
export interface IgdbGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  first_release_date?: number;
}

interface DiscoverGameCardDbProps {
  mode: "db";
  game: DbGame;
  onClick?: never;
}

interface DiscoverGameCardIgdbProps {
  mode: "igdb";
  game: IgdbGame;
  communityData?: CommunityData;
  onClick?: (e: React.MouseEvent) => void;
}

type DiscoverGameCardProps = DiscoverGameCardDbProps | DiscoverGameCardIgdbProps;

export function DiscoverGameCard(props: DiscoverGameCardProps) {
  const { mode } = props;

  if (mode === "db") {
    const { game } = props;
    return (
      <Link
        href={`/games/${game.slug}`}
        className="group flex flex-col bg-card border border-brand-purple/15 hover:border-brand-purple/40 rounded-lg overflow-hidden transition-colors"
      >
        <div className="aspect-[3/4] relative overflow-hidden bg-brand-purple/10 shrink-0">
          {game.coverImage ? (
            <Image
              src={game.coverImage}
              alt={game.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground/20 text-[11px]">
              No image
            </div>
          )}
          {game.averageRating !== undefined && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
              <Star className="h-2.5 w-2.5 fill-brand-amber text-brand-amber" />
              <span className="text-[10px] font-medium text-brand-amber leading-none">
                {game.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <h3 className="text-[12px] font-medium text-foreground line-clamp-2 leading-snug">
            {game.title}
          </h3>
        </div>
      </Link>
    );
  }

  // IGDB mode
  const { game, communityData, onClick } = props;
  const coverUrl = game.cover?.image_id
    ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
    : null;

  const cardContent = (
    <div className="group flex flex-col bg-card border border-brand-purple/15 hover:border-brand-purple/40 rounded-lg overflow-hidden transition-colors cursor-pointer h-full">
      <div className="aspect-[3/4] relative overflow-hidden bg-brand-purple/10 shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={game.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-[11px]">
            No image
          </div>
        )}
        {communityData && communityData.averageRating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Star className="h-2.5 w-2.5 fill-brand-amber text-brand-amber" />
            <span className="text-[10px] font-medium text-brand-amber leading-none">
              {communityData.averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="text-[12px] font-medium text-foreground line-clamp-2 leading-snug">
          {game.name}
        </h3>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="h-full w-full text-left bg-transparent border-0 p-0 block">
        {cardContent}
      </button>
    );
  }

  const href = communityData ? `/games/${communityData.slug}` : `/games/igdb/${game.id}`;
  return (
    <Link href={href} className="h-full block">
      {cardContent}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/components/discover/DiscoverGameCard.tsx
git commit -m "feat(discover): add DiscoverGameCard component"
```

---

## Task 9: Create `FilterChips` component

**Files:**
- Create: `game-gauge-web/src/components/discover/FilterChips.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/discover/FilterChips.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export type SortOption = "top-rated" | "trending" | "release-date" | "a-z";

const SORT_LABELS: Record<SortOption, string> = {
  "top-rated": "Top Rated",
  "trending": "Trending",
  "release-date": "Release Date",
  "a-z": "A–Z",
};

interface FilterChipsProps {
  genres: string[];
  platforms: string[];
  activeGenre: string | null;
  activePlatform: string | null;
  activeSort: SortOption;
  searchMode: boolean;
  onGenreChange: (genre: string | null) => void;
  onPlatformChange: (platform: string | null) => void;
  onSortChange: (sort: SortOption) => void;
}

function ChipDropdown({
  label,
  activeValue,
  options,
  disabled,
  disabledTitle,
  onSelect,
  onClear,
}: {
  label: string;
  activeValue: string | null;
  options: string[];
  disabled?: boolean;
  disabledTitle?: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (disabled) {
    return (
      <span
        title={disabledTitle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-brand-purple/5 border border-brand-purple/10 text-foreground/25 cursor-not-allowed select-none"
      >
        {label}
        <ChevronDown className="h-3 w-3" />
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {activeValue ? (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-brand-amber/15 border border-brand-amber/40 text-brand-amber hover:border-brand-amber/60 transition-colors"
        >
          {activeValue}
          <X className="h-3 w-3" />
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-brand-purple/10 border border-brand-purple/30 text-brand-purple/80 hover:border-brand-purple/50 transition-colors"
        >
          {label}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {open && !activeValue && (
        <div className="absolute top-full left-0 mt-1.5 z-30 bg-background border border-brand-purple/20 rounded-lg shadow-lg py-1 min-w-[160px] max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-foreground/70 hover:text-foreground hover:bg-brand-purple/10 transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortChip({
  activeSort,
  disabled,
  onSortChange,
}: {
  activeSort: SortOption;
  disabled?: boolean;
  onSortChange: (sort: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (disabled) {
    return (
      <span
        title="Sort not available in search mode"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-brand-purple/5 border border-brand-purple/10 text-foreground/25 cursor-not-allowed select-none"
      >
        Sort: {SORT_LABELS[activeSort]}
        <ChevronDown className="h-3 w-3" />
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-brand-purple/10 border border-brand-purple/30 text-brand-purple/80 hover:border-brand-purple/50 transition-colors"
      >
        Sort: {SORT_LABELS[activeSort]}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-30 bg-background border border-brand-purple/20 rounded-lg shadow-lg py-1 min-w-[140px]">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { onSortChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                activeSort === opt
                  ? "text-brand-amber bg-brand-amber/5"
                  : "text-foreground/70 hover:text-foreground hover:bg-brand-purple/10"
              }`}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterChips({
  genres,
  platforms,
  activeGenre,
  activePlatform,
  activeSort,
  searchMode,
  onGenreChange,
  onPlatformChange,
  onSortChange,
}: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <ChipDropdown
        label="Genre"
        activeValue={activeGenre}
        options={genres}
        onSelect={onGenreChange}
        onClear={() => onGenreChange(null)}
      />
      <ChipDropdown
        label="Platform"
        activeValue={activePlatform}
        options={platforms}
        disabled={searchMode}
        disabledTitle="Platform filter not available in search mode"
        onSelect={onPlatformChange}
        onClear={() => onPlatformChange(null)}
      />
      <SortChip
        activeSort={activeSort}
        disabled={searchMode}
        onSortChange={onSortChange}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/components/discover/FilterChips.tsx
git commit -m "feat(discover): add FilterChips component"
```

---

## Task 10: Create `CuratedRows` component

**Files:**
- Create: `game-gauge-web/src/components/discover/CuratedRows.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/discover/CuratedRows.tsx`:

```tsx
import Link from "next/link";
import { Star, TrendingUp, Clock } from "lucide-react";
import { GameGrid } from "./GameGrid";
import { DiscoverGameCard, DbGame } from "./DiscoverGameCard";

interface CuratedRowsProps {
  topRated: DbGame[];
  trending: DbGame[];
  newReleases: Array<{ id: number; name: string; cover?: { image_id: string }; first_release_date?: number }>;
  isLoading: boolean;
  onSeeAllTopRated: () => void;
  onSeeAllTrending: () => void;
  onSeeAllNew: () => void;
}

function SectionHeader({
  icon,
  label,
  onSeeAll,
}: {
  icon: React.ReactNode;
  label: string;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.09em] text-foreground/40">
          {label}
        </span>
      </div>
      <button
        onClick={onSeeAll}
        className="text-[11px] text-brand-purple/60 hover:text-brand-purple transition-colors"
      >
        See all →
      </button>
    </div>
  );
}

export function CuratedRows({
  topRated,
  trending,
  newReleases,
  isLoading,
  onSeeAllTopRated,
  onSeeAllTrending,
  onSeeAllNew,
}: CuratedRowsProps) {
  return (
    <div className="flex flex-col gap-10">
      {/* Top Rated */}
      <section>
        <SectionHeader
          icon={<Star className="h-3.5 w-3.5 text-brand-amber" />}
          label="Top Rated on Game Gauge"
          onSeeAll={onSeeAllTopRated}
        />
        <GameGrid skeleton={isLoading ? 6 : undefined}>
          {topRated.map((game) => (
            <DiscoverGameCard key={game.id} mode="db" game={game} />
          ))}
        </GameGrid>
      </section>

      {/* Divider */}
      <div className="h-px bg-brand-purple/10" />

      {/* Trending */}
      <section>
        <SectionHeader
          icon={<TrendingUp className="h-3.5 w-3.5 text-foreground/40" />}
          label="Trending This Week"
          onSeeAll={onSeeAllTrending}
        />
        <GameGrid skeleton={isLoading ? 6 : undefined}>
          {trending.map((game) => (
            <DiscoverGameCard key={game.id} mode="db" game={game} />
          ))}
        </GameGrid>
      </section>

      {/* Divider */}
      <div className="h-px bg-brand-purple/10" />

      {/* New Releases (IGDB) */}
      <section>
        <SectionHeader
          icon={<Clock className="h-3.5 w-3.5 text-foreground/40" />}
          label="New Releases"
          onSeeAll={onSeeAllNew}
        />
        <GameGrid skeleton={isLoading ? 6 : undefined}>
          {newReleases.map((game) => (
            <DiscoverGameCard
              key={game.id}
              mode="igdb"
              game={game}
            />
          ))}
        </GameGrid>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/components/discover/CuratedRows.tsx
git commit -m "feat(discover): add CuratedRows component"
```

---

## Task 11: Create the `/discover` page — browse mode

**Files:**
- Create: `game-gauge-web/src/app/(main)/discover/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(main)/discover/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { FilterChips, SortOption } from "@/components/discover/FilterChips";
import { CuratedRows } from "@/components/discover/CuratedRows";
import { GameGrid } from "@/components/discover/GameGrid";
import { DiscoverGameCard, DbGame } from "@/components/discover/DiscoverGameCard";
import { AutoImportGameCard } from "@/components/games/auto-import-game-card";
import {
  searchIGDB,
  getRecentGames,
  getTopRatedGames,
  getTrendingGames,
  getBatchCommunityData,
  CommunityData,
} from "@/lib/search";
import { api, IGDBGame } from "@/lib/api";

const SORT_TO_API: Record<SortOption, { sortBy: string; sortOrder: string }> = {
  "top-rated":    { sortBy: "averageRating", sortOrder: "desc" },
  "trending":     { sortBy: "createdAt",     sortOrder: "desc" }, // trending has own endpoint
  "release-date": { sortBy: "releaseDate",   sortOrder: "desc" },
  "a-z":          { sortBy: "title",         sortOrder: "asc"  },
};

function DiscoverPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const [activeGenre, setActiveGenre] = useState<string | null>(searchParams.get("genre"));
  const [activePlatform, setActivePlatform] = useState<string | null>(searchParams.get("platform"));
  const [activeSort, setActiveSort] = useState<SortOption>("top-rated");

  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Browse mode state
  const [topRated, setTopRated] = useState<DbGame[]>([]);
  const [trending, setTrending] = useState<DbGame[]>([]);
  const [newReleases, setNewReleases] = useState<IGDBGame[]>([]);
  const [flatGames, setFlatGames] = useState<DbGame[]>([]);
  const [flatPage, setFlatPage] = useState(1);
  const [flatTotalPages, setFlatTotalPages] = useState(1);

  // Search mode state
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([]);
  const [communityMap, setCommunityMap] = useState<Map<number, CommunityData>>(new Map());

  const [showFlat, setShowFlat] = useState(false);
  const [isBrowseLoading, setIsBrowseLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isFlatLoading, setIsFlatLoading] = useState(false);

  const searchMode = query.trim().length > 0;
  // filterMode = show flat grid instead of curated rows (filters active OR "See all" clicked)
  const filterMode = !searchMode && (showFlat || activeGenre !== null || activePlatform !== null);

  // Load genres + platforms once
  useEffect(() => {
    Promise.all([api.get("/games/genres"), api.get("/games/platforms")]).then(
      ([g, p]) => {
        setGenres(g.data.data || []);
        setPlatforms(p.data.data || []);
      }
    );
  }, []);

  // Load curated rows (only when not in filter/search mode)
  useEffect(() => {
    if (filterMode || searchMode) return;
    setIsBrowseLoading(true);
    Promise.all([
      getTopRatedGames(6, activeGenre ?? undefined),
      getTrendingGames(6, activeGenre ?? undefined),
      getRecentGames(6),
    ]).then(([tr, td, nr]) => {
      setTopRated(tr as DbGame[]);
      setTrending(td as DbGame[]);
      setNewReleases(nr);
      setIsBrowseLoading(false);
    });
  }, [activeGenre, filterMode, searchMode]);

  // Load flat grid when filters are active (browse mode, no query)
  const loadFlatGrid = useCallback(async () => {
    if (searchMode) return;
    if (!activeGenre && !activePlatform) return;

    setIsFlatLoading(true);
    try {
      if (activeSort === "trending") {
        const res = await getTrendingGames(24, activeGenre ?? undefined);
        setFlatGames(res as DbGame[]);
        setFlatTotalPages(1);
      } else {
        const { sortBy, sortOrder } = SORT_TO_API[activeSort];
        const params: Record<string, string | number> = {
          page: flatPage,
          limit: 24,
          sortBy,
          sortOrder,
        };
        if (activeGenre) params.genre = activeGenre;
        if (activePlatform) params.platform = activePlatform;
        const res = await api.get("/games", { params });
        setFlatGames(res.data.data || []);
        setFlatTotalPages(res.data.pagination?.totalPages ?? 1);
      }
    } finally {
      setIsFlatLoading(false);
    }
  }, [activeGenre, activePlatform, activeSort, flatPage, searchMode]);

  useEffect(() => {
    loadFlatGrid();
  }, [loadFlatGrid]);

  // Run IGDB search
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const { games } = await searchIGDB({ query: q, genre: activeGenre ?? undefined });
      setSearchResults(games);
      if (games.length > 0) {
        const ids = games.map((g) => g.id);
        const cMap = await getBatchCommunityData(ids);
        setCommunityMap(cMap);
      }
    } finally {
      setIsSearching(false);
    }
  }, [activeGenre]);

  // Debounced search on query change
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    setQuery(q);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeGenre) params.set("genre", activeGenre);
    router.replace(`/discover?${params.toString()}`);
  };

  const handleClear = () => {
    setInputValue("");
    setQuery("");
    setSearchResults([]);
    router.replace("/discover");
  };

  const handleGenreChange = (genre: string | null) => {
    setActiveGenre(genre);
    setFlatPage(1);
    if (!genre && !activePlatform) setShowFlat(false);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    if (activePlatform) params.set("platform", activePlatform);
    router.replace(`/discover?${params.toString()}`);
  };

  const handlePlatformChange = (platform: string | null) => {
    setActivePlatform(platform);
    setFlatPage(1);
    if (!platform && !activeGenre) setShowFlat(false);
  };

  const handleSortChange = (sort: SortOption) => {
    setActiveSort(sort);
    setFlatPage(1);
  };

  // "See all" handlers pre-apply the corresponding sort and collapse to flat grid
  const seeAllTopRated = () => { setShowFlat(true); handleSortChange("top-rated"); };
  const seeAllTrending = () => { setShowFlat(true); handleSortChange("trending"); };
  const seeAllNew = () => { setShowFlat(true); handleSortChange("release-date"); };

  const resultLabel = searchMode
    ? `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${query}"${activeGenre ? ` in ${activeGenre}` : ""} · via IGDB`
    : flatGames.length > 0
    ? `${flatGames.length}${flatTotalPages > 1 ? "+" : ""} games${activeGenre ? ` in ${activeGenre}` : ""}${activePlatform ? ` on ${activePlatform}` : ""}`
    : "";

  return (
    <MainLayout>
      {/* Header */}
      <div className="border-b border-brand-purple/20 px-4 lg:px-8 py-8">
        <div className="container mx-auto">
          <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/30 mb-1">Discover</p>
          <h1 className="text-[22px] font-medium tracking-tight text-foreground mb-5">Games</h1>
          <p className="text-[12px] text-foreground/30 mb-5">200,000+ titles · powered by IGDB</p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mb-5">
            <div className="flex items-center gap-2 bg-card border border-brand-purple/25 hover:border-brand-purple/45 focus-within:border-brand-purple/60 rounded-xl px-4 py-3 transition-colors">
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-foreground/30 shrink-0 animate-spin" />
              ) : (
                <span className="text-foreground/30 shrink-0 text-sm">🔍</span>
              )}
              <input
                type="text"
                placeholder="Search by title, developer…"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (!e.target.value.trim()) handleClear();
                  else { setQuery(e.target.value); }
                }}
                autoComplete="off"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/25 outline-none"
              />
              {inputValue && (
                <button type="button" onClick={handleClear} className="text-foreground/25 hover:text-foreground/60 transition-colors shrink-0 text-sm">
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Filter chips */}
          <FilterChips
            genres={genres}
            platforms={platforms}
            activeGenre={activeGenre}
            activePlatform={activePlatform}
            activeSort={activeSort}
            searchMode={searchMode}
            onGenreChange={handleGenreChange}
            onPlatformChange={handlePlatformChange}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 lg:px-8 py-8">

        {/* Search mode */}
        {searchMode && (
          <>
            {resultLabel && (
              <p className="text-[12px] text-foreground/30 mb-5">{resultLabel}</p>
            )}
            {isSearching ? (
              <GameGrid skeleton={12} />
            ) : searchResults.length > 0 ? (
              <GameGrid>
                {searchResults.map((game) => {
                  const community = communityMap.get(game.id);
                  if (community) {
                    return (
                      <DiscoverGameCard key={game.id} mode="igdb" game={game} communityData={community} />
                    );
                  }
                  return <AutoImportGameCard key={game.id} game={game} />;
                })}
              </GameGrid>
            ) : query ? (
              <div className="py-20 text-center">
                <p className="text-[14px] text-foreground/40 mb-1">No results for "{query}"</p>
                <p className="text-[12px] text-foreground/25">Try different keywords or check spelling</p>
                <button onClick={handleClear} className="mt-5 text-[12px] text-brand-purple hover:text-foreground/70 transition-colors">
                  Clear search
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Browse filter mode (filters active, no search) */}
        {filterMode && !searchMode && (
          <>
            {resultLabel && (
              <p className="text-[12px] text-foreground/30 mb-5">{resultLabel}</p>
            )}
            <GameGrid skeleton={isFlatLoading ? 24 : undefined}>
              {flatGames.map((game) => (
                <DiscoverGameCard key={game.id} mode="db" game={game} />
              ))}
            </GameGrid>

            {flatTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFlatPage((p) => Math.max(1, p - 1))}
                  disabled={flatPage === 1}
                  className="px-4 py-1.5 text-[13px] text-foreground/50 border border-brand-purple/20 rounded-lg hover:border-brand-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-[12px] text-foreground/30">
                  {flatPage} / {flatTotalPages}
                </span>
                <button
                  onClick={() => setFlatPage((p) => Math.min(flatTotalPages, p + 1))}
                  disabled={flatPage === flatTotalPages}
                  className="px-4 py-1.5 text-[13px] text-foreground/50 border border-brand-purple/20 rounded-lg hover:border-brand-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Default browse mode (no filters, no search) */}
        {!filterMode && !searchMode && (
          <CuratedRows
            topRated={topRated}
            trending={trending}
            newReleases={newReleases}
            isLoading={isBrowseLoading}
            onSeeAllTopRated={seeAllTopRated}
            onSeeAllTrending={seeAllTrending}
            onSeeAllNew={seeAllNew}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-7 w-7 animate-spin text-foreground/20" />
          </div>
        </MainLayout>
      }
    >
      <DiscoverPageInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Start dev server and verify the page loads**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
npm run dev
```

Open http://localhost:3001/discover (or whatever port Next.js starts on). Verify:
- Page loads without errors
- Three curated rows appear (may be empty if DB has few games)
- Filter chip dropdowns open and close
- Typing in the search bar triggers IGDB search after 300ms

- [ ] **Step 3: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/app/(main)/discover/page.tsx
git commit -m "feat(discover): add unified /discover page"
```

---

## Task 12: Add redirects from retired routes + update navbar

**Files:**
- Modify: `game-gauge-web/src/app/(main)/search/page.tsx`
- Modify: `game-gauge-web/src/app/(main)/browse/page.tsx`
- Modify: `game-gauge-web/src/app/(main)/browse/genre/[genre]/page.tsx`
- Modify: `game-gauge-web/src/components/layout/navbar.tsx`

- [ ] **Step 1: Replace `search/page.tsx` with a redirect**

Replace the entire contents of `src/app/(main)/search/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q;
  redirect(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
}
```

- [ ] **Step 2: Replace `browse/page.tsx` with a redirect**

Replace the entire contents of `src/app/(main)/browse/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function BrowsePage() {
  redirect("/discover");
}
```

- [ ] **Step 3: Replace `browse/genre/[genre]/page.tsx` with a redirect**

Replace the entire contents of `src/app/(main)/browse/genre/[genre]/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function GenreBrowsePage({ params }: { params: { genre: string } }) {
  redirect(`/discover?genre=${encodeURIComponent(params.genre)}`);
}
```

- [ ] **Step 4: Update navbar**

In `src/components/layout/navbar.tsx`, make two changes:

**4a.** Update the `navLinks` array — change `/search` to `/discover`:

```typescript
const navLinks = isAuthenticated
  ? [
      { href: "/", label: "Home" },
      { href: "/discover", label: "Games" },
      { href: "/lists", label: "Lists" },
      { href: "/journal", label: "Journal" },
      ...(hasSteam ? [{ href: "/steam/library", label: "Steam" }] : []),
    ]
  : [
      { href: "/", label: "Home" },
      { href: "/discover", label: "Browse Games" },
    ];
```

**4b.** Update `handleSearchSubmit` to route to `/discover`:

```typescript
const handleSearchSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (searchQuery.trim()) {
    router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
    setSearchOpen(false);
  }
};
```

- [ ] **Step 5: Verify redirects**

With the dev server running, visit:
- http://localhost:3001/search → should redirect to /discover
- http://localhost:3001/search?q=zelda → should redirect to /discover?q=zelda
- http://localhost:3001/browse → should redirect to /discover
- http://localhost:3001/browse/genre/Action → should redirect to /discover?genre=Action
- Navbar "Games" link should point to /discover

- [ ] **Step 6: Commit**

```bash
cd /Users/zacharyauker/Development/game-gauge-web
git add src/app/(main)/search/page.tsx \
        src/app/(main)/browse/page.tsx \
        "src/app/(main)/browse/genre/[genre]/page.tsx" \
        src/components/layout/navbar.tsx
git commit -m "feat(discover): redirect /search and /browse to /discover, update navbar"
```

---

## Self-Review Checklist

After completing all tasks, verify:

- [ ] `GET /api/games/top-rated?genre=Role-playing%20(RPG)` returns only RPG games
- [ ] `GET /api/games/trending?genre=Action` returns only Action games
- [ ] `GET /api/games/by-igdb-ids?ids=1234` route resolves before the `/:id` catch-all
- [ ] `GET /api/games?sortBy=averageRating&sortOrder=desc` returns games ordered by avg rating
- [ ] `GET /api/igdb/search?q=witcher&genreId=12` returns only RPG results
- [ ] `/discover` loads curated rows with no filters active
- [ ] Selecting a genre chip collapses rows to flat grid
- [ ] Typing a search activates IGDB mode; genre chip carries through
- [ ] Platform and sort chips are visually disabled in search mode
- [ ] Visiting `/search`, `/browse`, `/browse/genre/action` all redirect correctly
- [ ] Navbar "Games" link goes to `/discover`
- [ ] Navbar search overlay routes to `/discover?q=...`
