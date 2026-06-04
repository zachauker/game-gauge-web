# GameGauge — Polish Pass Spec
**Date:** 2026-06-04  
**Scope:** Visual consistency, bug fixes, and UX cleanup  
**Approach:** Backend-first where applicable; no new feature development  

---

## Executive Summary

A comprehensive audit of the codebase revealed one critical infrastructure bug (brand colors not rendering) plus several visual inconsistency and UX issues across pages. This spec addresses them in a logical commit order so each change is self-contained and testable.

---

## Commit Plan (ordered by dependency)

### Commit 1 — Fix Tailwind brand color namespace *(standalone, foundational)*

**Problem:**  
Every component uses `brand-*` Tailwind classes (`bg-brand-purple/20`, `text-brand-amber`, `border-brand-teal/20`, etc.), but `tailwind.config.js` only defines shadcn/ui semantic tokens. Tailwind's JIT silently drops unknown classes — meaning every brand-color utility in the entire app produces zero CSS. The visual design system is effectively invisible.

**Fix:**  
Add a `brand` color namespace to `tailwind.config.js` mapping each CSS variable using the `hsl(var(--x) / <alpha-value>)` pattern, which enables opacity modifiers (`/20`, `/50`, etc.) to work correctly.

**File:** `tailwind.config.js`  
**Change:** Extend `theme.extend.colors` with:

```js
brand: {
  purple: "hsl(var(--brand-purple) / <alpha-value>)",
  pink:   "hsl(var(--brand-pink)   / <alpha-value>)",
  red:    "hsl(var(--brand-red)    / <alpha-value>)",
  amber:  "hsl(var(--brand-amber)  / <alpha-value>)",
  teal:   "hsl(var(--brand-teal)   / <alpha-value>)",
  blush:  "hsl(var(--brand-blush)  / <alpha-value>)",
  slate:  "hsl(var(--brand-slate)  / <alpha-value>)",
  black:  "hsl(var(--brand-black)  / <alpha-value>)",
},
```

**Impact:** Unlocks all existing `brand-*` classes across the entire application simultaneously. No component changes required — they're all already written correctly, they just had no CSS to render.

**Risk:** Low. Purely additive to Tailwind config; existing classes that happened to fall back on other styles may shift visually in a positive direction (i.e., they'll now show their intended design).

---

### Commit 2 — Fix `listId` missing from activity event meta *(backend bug fix)*

**Problem:**  
In `list.service.ts`, `ADDED_TO_LIST`, `STARTED_GAME`, and `CREATED_LIST` activity events are recorded without `listId` in the meta payload. The frontend `getEventLink()` helper (`src/lib/social.ts:205–212`) reads `meta.listId` to build deep links. Without it, those event cards link to nothing.

**Files:**
- `game-gauge-api/src/services/list.service.ts`

**Changes:**

In `addGameToList()` (line ~154), add `listId` to the meta:
```ts
// Before
meta: { gameTitle: game.title },

// After
meta: { gameTitle: game.title, listId, listName: list.name },
```

In `createList()` (line ~43), add `listId` to the CREATED_LIST event:
```ts
// Before
meta: { listName: data.name, isPublic: data.isPublic },

// After
meta: { listName: data.name, isPublic: data.isPublic, listId: list.id },
```

**Risk:** Low. Pure data addition to the meta JSON field — no schema change, no breaking change.

---

### Commit 3 — Simplify `/feed` page and apply brand design language

**Problem:**  
The `/feed` page uses shadcn `Tabs`, generic `text-muted-foreground`, and a two-tab "Following / All Activity" split that doesn't match the rest of the app's visual vocabulary. Per product direction, the global activity tab is being removed in favour of the home page sidebar handling that context. The page header also doesn't match the terse, typographically-restrained style used on all other pages.

**Files:**
- `src/app/(main)/feed/page.tsx`

**Changes:**
- Remove `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` imports and usage
- Remove the "All Activity" (`mode="global"`) tab entirely — `ActivityFeed` will default to `mode="personal"` only
- Replace the shadcn `<h1 className="text-2xl font-bold">` header with the brand-style terse header (`text-[13px] uppercase tracking-[0.08em] text-foreground/40`) matching the pattern used on home, search, and profile pages
- Retain `SuggestedUsers` sidebar — it's valuable discovery context on the feed page specifically

---

### Commit 4 — Fix dead `/journal` nav link

**Problem:**  
The navbar lists "Journal" for authenticated users pointing to `/journal`, but no page exists at that route. Clicking it produces a Next.js 404.

**Solution:**  
Create a minimal `/journal` route that renders the authenticated user's own activity timeline — their personal history of ratings, reviews, and list changes in reverse-chronological order. This is the correct product intent (per Zach's clarification) and surfaces an already-existing API endpoint (`/users/:username/activity`).

**Files:**
- `src/app/(main)/journal/page.tsx` *(new file)*

**What it renders:**
- Terse brand-style page header ("Your journal" / "Everything you've logged, in order")
- The authenticated user's own activity feed using the existing `ActivityFeed` component with `mode="personal"` filtered to the current user (may need a `userId` prop added to `ActivityFeed`)
- Empty state if they haven't logged anything yet, with a CTA to rate or review a game
- Auth guard: redirect to `/login?redirect=/journal` if unauthenticated (same pattern as `/feed`)

**Note:** This is a lightweight scaffold — just enough to un-break the nav link. The Journal page can be enriched in a later feature pass (filtering by type, date grouping, export, etc.).

---

### Commit 5 — Swap hardcoded palette colors for brand tokens in `activity-event-card.tsx`

**Problem:**  
Event type icon colours in `activity-event-card.tsx` use raw Tailwind palette classes (`text-yellow-500`, `text-blue-500`, `text-green-500`, `text-orange-500`, `text-indigo-500`, `text-pink-500`) that are unrelated to the brand palette. After Commit 1 lands, these will visually clash with the now-rendering brand colors on all surrounding elements.

**File:** `src/components/social/activity-event-card.tsx`

**Mapping:**

| Event type      | Current               | Replacement           | Rationale                        |
|-----------------|-----------------------|-----------------------|----------------------------------|
| `RATED_GAME`    | `text-yellow-500`     | `text-brand-amber`    | Amber = ratings throughout app   |
| `REVIEWED_GAME` | `text-blue-500`       | `text-brand-teal`     | Teal = info / content actions    |
| `COMPLETED_GAME`| `text-green-500`      | `text-brand-teal`     | Teal = success / progress        |
| `STARTED_GAME`  | `text-purple-500`     | `text-brand-purple`   | Purple = primary brand           |
| `ADDED_TO_LIST` | `text-orange-500`     | `text-brand-amber/70` | Amber variant — softer than rate |
| `CREATED_LIST`  | `text-indigo-500`     | `text-brand-purple/70`| Purple variant                   |
| `FOLLOWED_USER` | `text-pink-500`       | `text-brand-pink`     | Pink = social / relationship     |

---

### Commit 6 — Audit and fix visual inconsistencies in lists pages

**Problem:**  
`lists/page.tsx` and `lists/[id]/page.tsx` use shadcn `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, and `Button` components with default shadcn styling that doesn't match the brand design vocabulary. Specific issues:

- `DEFAULT_LIST_CONFIG` icon colours use `text-pink-500`, `text-blue-500`, `text-yellow-500` (same problem as Commit 5)
- `Card` wrappers render with default shadcn border/background rather than `bg-card border border-brand-purple/15 rounded-lg`
- `Badge` component uses shadcn defaults rather than brand pill styles
- shadcn `Button` used in several places where plain Tailwind buttons exist elsewhere in the app

**Files:**
- `src/app/(main)/lists/page.tsx`
- `src/app/(main)/lists/[id]/page.tsx`

**Changes:**
- Replace `Card`/`CardContent`/`CardHeader`/`CardTitle` with plain `div` + brand border/bg classes matching the game detail and profile pages
- Replace `Badge` for public/private status with inline pill spans using brand tokens
- Fix icon color classes in `DEFAULT_LIST_CONFIG` to brand equivalents:
  - Wishlist heart: `text-brand-pink`
  - Playing controller: `text-brand-purple`
  - Completed trophy: `text-brand-amber`
- Replace shadcn `Button` instances with the plain Tailwind button pattern established in the game detail page (`ActionButton` style)

---

### Commit 7 — Audit and fix visual inconsistencies in browse page

**Problem:**  
`browse/page.tsx` uses `Card`, `CardContent`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, and `Button` from shadcn. It also imports but doesn't use the `AutoImportGameCard` component — instead it renders its own ad-hoc game grid with `Image` and router navigation, diverging from the established `AutoImportGameCard` pattern.

**Files:**
- `src/app/(main)/browse/page.tsx`

**Changes:**
- Replace shadcn `Tabs` with plain tab buttons matching the brand tab style (the same pattern used in the game detail page's overview/reviews tab)
- Replace `Card`/`CardContent` with plain brand-bordered `div` containers
- Replace the ad-hoc game image grid with `AutoImportGameCard` for consistent hover, rating, and link behaviour
- Replace shadcn `Button` instances with plain brand button pattern

---

## What is NOT changing in this pass

- The overall layout and information architecture of any page
- Backend routes or API contracts (other than the meta field addition in Commit 2)
- Game detail page — already well-designed and consistent
- Search page — already consistent
- Auth pages (login/register) — already consistent
- Navbar — already consistent
- Home page — already consistent

---

## Architectural principles being maintained

- **No new shadcn components introduced** — already-used ones are being phased out of pages that have diverged from the brand system
- **CSS variable → Tailwind token chain preserved** — `globals.css` vars → `tailwind.config.js` namespace → component classes. No hardcoded hex values in components.
- **Opacity modifiers on brand colors** — using the `<alpha-value>` pattern in config so `/20`, `/50` modifiers work natively
- **No utility comments** — comments only where the WHY is non-obvious (e.g., the Tailwind alpha-value pattern explanation)

---

## Testing checklist (after all commits)

- [ ] Build passes with no Tailwind purge warnings
- [ ] Brand purple borders and backgrounds visible on game cards, stat cards, and containers (Commit 1 validation)
- [ ] Clicking an `ADDED_TO_LIST` activity event card navigates to the correct list (Commit 2 validation)
- [ ] `/feed` page shows following feed only, no tab UI, matches brand style
- [ ] `/journal` link in navbar navigates successfully, shows activity timeline
- [ ] Activity event type icons use brand colors throughout
- [ ] Lists index and list detail pages match game detail / profile visual language
- [ ] Browse page tabs and cards match brand design system
- [ ] Dark mode: all brand colors render correctly in both light and dark themes
