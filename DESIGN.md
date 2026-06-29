---
name: Game Gauge
description: A personal gaming journal — track, rate, and review the games that matter to you.
colors:
  deep-ink: "#090B11"
  surface-card: "#161A27"
  surface-muted: "#212531"
  border-subtle: "#242B42"
  brand-purple: "#4D4075"
  primary-purple: "#7E92CE"
  score-amber: "#FBB94B"
  social-rose: "#F170A9"
  progress-teal: "#6AC8CA"
  destructive-red: "#E30613"
  muted-slate: "#4E5558"
  foreground-blush: "#FEF3F9"
typography:
  display:
    fontFamily: "Flexing Regular, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    letterSpacing: "0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary-purple}"
    textColor: "{colors.foreground-blush}"
    rounded: "{rounded.md}"
    padding: "6px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-purple}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary-purple}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-default:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground-blush}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  game-cover-card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
---

# Design System: Game Gauge

## 1. Overview

**Creative North Star: "The Player's Journal"**

Game Gauge is a dark, personal, journal-like interface for the games you've played. The surface feels like a well-kept notebook: deep purple-navy backgrounds, purple-tinted borders at low opacity, and a single amber accent that carries the weight of scoring, greeting, and action. Game cover art does the visual work; the interface steps back so the games themselves fill the screen.

The emotional register is private and deliberate — closer to a shelf of annotated books than to a storefront or a social feed. Interactions are quiet: borders shift opacity on hover, surfaces layer tonally, and the amber score badge is the loudest thing on any card. Nothing shouts. The system earns attention by being useful, not by demanding it.

This system explicitly rejects: the loud headline energy of IGN and GameSpot, the transactional grid of the Steam store, the engagement-bait rhythms of generic social apps (infinite scroll, notification overload, algorithmic amplification), and the overwrought gaming aesthetic of neon-on-pitch-black with dragon logos and aggressive typography.

**Key Characteristics:**
- Dark-first by design — not because tools look dark, but because games are played in dim rooms at night
- Single chromatic accent (amber) used only where it earns its place: scores, greetings, primary CTAs
- Depth through tonal layering, never through shadows
- Cover art as the hero — the UI is the frame, the games are the content
- Consistent, predictable product vocabulary — the same button, same card, same input across every screen

## 2. Colors: The Deep Ink Palette

A dark palette anchored in purple-navy, with amber as the only chromatic signal.

### Primary
- **Primary Purple** (#7E92CE — dark mode; #4D4075 light mode): Interactive color — nav active states, button backgrounds, focus rings, border-hover treatments. In dark mode, this is a muted lavender that reads as restrained rather than loud. Used at 10–60% opacity for borders and surface tints; full saturation only for interactive targets (buttons, focused inputs, active nav links).

### Secondary
- **Score Amber** (#FBB94B): The single warm signal in the system. Appears on: star icons and numeric scores, the greeting kicker in the authenticated hero, primary CTA buttons, and active nav-link highlights. If amber is on more than ~10% of a given screen's surface area, it has been overused.

### Tertiary
- **Social Rose** (#F170A9): Social and relational moments — followed-user activity events, tag/badge highlights, relationship indicators. Rare; never decorative.
- **Progress Teal** (#6AC8CA): Completion, success, and info states — "Added" badges on game cards, Steam integration prompts, success toasts, and the connected-account indicator.
- **Destructive Red** (#E30613): Destructive actions and error states only. Sign-out buttons, form validation errors, alert states.

### Neutral
- **Deep Ink** (#090B11): Primary background — the canvas every screen is painted on. Dark without being pitch-black; the purple undertone keeps it from feeling like a generic dark mode.
- **Surface Card** (#161A27): Elevated card and panel surfaces. Approximately 7 lightness steps above deep-ink, same purple hue. Used for stat cards, activity containers, dropdown menus.
- **Surface Muted** (#212531): Secondary surfaces — muted sections, input backgrounds, skeleton placeholders. One step above surface-card.
- **Border Subtle** (#242B42): Default border color. Appears at full value on active/focused elements; in practice, most borders use `brand-purple` at 10–30% opacity for a softer tonal treatment.
- **Foreground Blush** (#FEF3F9): Primary text. A barely-perceptible blush tint against the deep-ink bg; avoid `white` pure for body text.
- **Muted Slate** (#4E5558): Secondary and tertiary text — labels, timestamps, meta info. Slightly cool to contrast the purple-warm surfaces.

### Named Rules
**The Amber Signal Rule.** Amber appears only where it earns its place: a score, a CTA, a greeting, an active nav item. Any use that is purely decorative is prohibited. If amber is more than 10% of a screen's surface area, something has been misused.

**The Tinted Border Rule.** Borders are not lines — they are the purple tint at reduced opacity. Use `border-brand-purple/15` at rest, `border-brand-purple/50` on hover/focus. Hard gray or white borders are foreign to this system.

## 3. Typography

**Display Font:** Flexing Regular (local), variable `--font-flexing` (fallback: sans-serif)
**Body + UI Font:** Inter (Google Fonts), system-ui, sans-serif

**Character:** Inter carries every UI surface: labels, buttons, metadata, body copy, data. Flexing is a custom display face used exclusively for the logo wordmark — its personality gives the brand a voice without bleeding into the interface.

### Hierarchy
- **Display** (Flexing Regular, 400 weight, 17px, tracking 0.02em): Logo wordmark only — the "Game·Gauge" logotype in the navbar. Never appears in UI copy, headings, or buttons.
- **Headline** (Inter, 500 weight, 24–36px, line-height 1.2): Major page titles and hero headings. Used sparingly — typically one per page, in the hero area.
- **Title** (Inter, 500 weight, 18–20px, line-height 1.3): Section and card titles. The authenticated hero uses this weight for the username greeting.
- **Body** (Inter, 400 weight, 13–14px, line-height 1.5): Primary reading text, descriptions, review content. Cap line length at 65ch for prose contexts.
- **Label** (Inter, 500 weight, 11–12px, letter-spacing 0.05–0.10em, uppercase): Section markers, badges, meta chips, timestamps. Use sparingly; an interface where every section has a small uppercase label above it is AI grammar, not brand voice.

### Named Rules
**The Flexing Fence Rule.** Flexing Regular is the logo's voice, not the interface's. It never appears in labels, buttons, data tables, review text, or navigation items. Violating this makes the app feel like a gaming media brand rather than a quiet journal.

**The Label Restraint Rule.** Small uppercase tracked labels are a legitimate affordance — but only when the label carries information the heading alone cannot. One deliberate kicker is voice; a kicker above every section is scaffolding. Each use should justify itself.

## 4. Elevation

This is a **flat-by-default, tonal-layering system.** There are no box-shadows in the ambient or structural sense. Depth is conveyed by stacking surface colors: deep-ink → surface-card → surface-muted → white/blush. Each layer is 6–10 lightness points above the last, same purple hue.

The one exception is state-responsive elevation: the sticky navbar gains a purple-tinted shadow on scroll (`box-shadow: 0 1px 12px 0 rgba(77, 64, 117, 0.2)`), signaling its elevation above the page. This is earned by user interaction, not ambient decoration.

### Named Rules
**The Tonal Stacking Rule.** If you reach for a shadow to separate two elements, you have missed a tonal layer. Add a surface step instead. Shadows in this system are state signals, not hierarchy signals.

## 5. Components

### Buttons
Warm and precise — slightly rounded edges, amber or purple fills, 150ms transitions.

- **Shape:** Gently curved (6px radius / `rounded-md`)
- **Primary (dark mode):** Background `#7E92CE` (light lavender), text `#FEF3F9`, padding `py-1.5 px-4`. Hover reduces to 80% opacity. Used for sign-up, primary search submit.
- **Primary (light mode):** Background `#4D4075` (brand purple), text white.
- **Ghost / text-link style:** No background, text `foreground/50–70`, hover brings text to `foreground/80–100`. Used for secondary actions and nav links.
- **Destructive:** Background `#E30613`, white text. Reserved for irreversible actions.
- **Focus:** `ring-2 ring-brand-purple/60 ring-offset-2` outline, visible to keyboard users.
- **Disabled:** `opacity-50 cursor-not-allowed`. Never hidden, always present in the DOM.

### Cards / Containers
The workhorse surface: game cards, stat cards, activity containers, settings panels.

- **Corner style:** Gently curved (8px radius / `rounded-lg`)
- **Background:** `surface-card` (#161A27 dark mode)
- **Border:** `border-brand-purple/15` at rest — a barely-visible purple tint, not a line
- **Shadow strategy:** None (see Elevation). The border alone defines the boundary.
- **Internal padding:** 16px (`p-4`)
- **Hover (interactive cards):** Border shifts to `border-brand-purple/50` over 200ms

### Game Cover Card (Signature Component)
The visual anchor of every grid. Portrait poster format with cover art as the primary content, UI layered beneath.

- **Aspect ratio:** 3:4 (portrait — matches game cover art dimensions)
- **Image treatment:** `object-cover`, subtle scale on hover (`scale-[1.03]`, 300ms)
- **Overlay:** Gradient `from-black/70 via-black/10 to-transparent`, bottom-up. Always present; 80% opacity at rest, 100% on hover, for badge legibility.
- **Rating badge:** `bg-black/60 backdrop-blur-sm`, top-right, amber star + amber score in 11px Inter 500
- **Title:** 13px Inter 500, white, pinned to bottom of cover, 2-line clamp
- **Meta:** 11px Inter 400, `white/50`, release year + platform abbreviation

### Inputs / Fields
- **Style:** `bg-brand-purple/10 border border-brand-purple/25`, rounded-lg (8px), 13–15px Inter
- **Focus:** Border shifts to `border-brand-purple/60`, consistent with button focus color
- **Placeholder:** `text-foreground/25` — ensure it reads at 4.5:1 against the field bg
- **Search overlay variant:** Full-width, centered, `border-brand-purple/40` with a subtle `shadow-[0_0_0_4px_hsl(var(--brand-purple)/0.1)]` focus ring

### Navigation
Sticky top bar, `bg-background/95 backdrop-blur-md`, 56px tall.

- **Default border:** `border-brand-purple/20` (1px)
- **Scrolled border:** `border-brand-purple/30` + scroll shadow (the only non-tonal shadow in the system, 200ms transition)
- **Nav links:** 13px Inter, `text-foreground/50` at rest, `text-foreground/80` hover
- **Active state:** `text-brand-amber font-medium` — amber marks the current page throughout
- **Mobile:** Collapses to hamburger + slide-down drawer. Same tonal surface (`bg-background`), same amber active state.

### Activity Item
Compact row: avatar initials circle + text description + timestamp.

- **Avatar:** 28px circle, `bg-brand-purple/30`, 10px Inter 500 initials, `text-foreground/60`
- **Body:** 12px Inter, `text-foreground/50` base, key nouns at `text-foreground/80 font-medium`
- **Scores:** `text-brand-amber font-medium` — the one chromatic signal in activity text
- **Divider:** `border-b border-brand-purple/10`, dropped on the last item

## 6. Do's and Don'ts

### Do:
- **Do** use `border-brand-purple/15` for card borders at rest and `border-brand-purple/50` on hover/focus — never gray or white borders.
- **Do** use amber (`#FBB94B`) exclusively for scores, primary CTAs, active nav links, and greeting kickers. Reserve it; its rarity gives it signal.
- **Do** convey depth by adding a tonal layer (surface-muted → surface-card → deep-ink) rather than adding a shadow.
- **Do** keep the Flexing display font inside the logo. Inter handles all UI labels, buttons, and body text.
- **Do** use game cover art as the hero on grid and detail pages — the interface is the frame, the art is the content.
- **Do** apply `@media (prefers-reduced-motion: reduce)` on all transitions. The 200ms border-color transitions and 300ms cover-scale are the primary motion vocabulary; both need reduced-motion alternatives.
- **Do** target WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text and interactive components. Verify contrast when purple surfaces carry text.

### Don't:
- **Don't** add neon accents, pitch-black backgrounds (#000), aggressive typography, or dragon-logo energy. Game Gauge is a quiet journal, not a gaming-chair brand — the "overwrought gaming aesthetic" is a named anti-reference.
- **Don't** structure pages like IGN or GameSpot: flashy banner headlines, editorial hype copy, loud section dividers. The register is personal and subdued.
- **Don't** introduce infinite-scroll feeds, engagement-bait notification badges, or algorithmic "You might also like" interruptions. Generic social-media patterns are a named anti-reference; they conflict with the journal-first principle.
- **Don't** replicate the Steam store's transactional, commerce-first layout — no "Buy Now" CTAs, no storefront grid templates, no price-oriented information hierarchy.
- **Don't** use `border-left` greater than 1px as a colored stripe on cards or callouts. Use a full border, background tint, or nothing.
- **Don't** apply gradient text (`background-clip: text` + gradient background). Scores and headings use solid amber or foreground-blush.
- **Don't** use glassmorphism as a default surface treatment. The one legitimate use is the rating badge on cover cards (`bg-black/60 backdrop-blur-sm`) — it is purposeful and scoped to overlaying cover art. Everywhere else, use a tonal surface.
- **Don't** put uppercase tracked labels above every section by reflex. Each `text-[11–13px] uppercase tracking-[0.08em]` label should justify its presence. The pattern is a known AI generation tell when applied indiscriminately.
- **Don't** use `box-shadow` for ambient or structural depth. The scroll-shadow on the sticky navbar is the system's only structural shadow, and it is earned by a scroll state, not applied at rest.
