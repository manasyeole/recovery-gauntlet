# Recovery Gauntlet — current UI design

A snapshot of the design system as it exists in code. Paste this into an AI and
ask for suggestions; every value below is real and greppable.

**What it is:** a private joke site for a friend recovering from leg surgery.
13 questions, one per screen, ending in a downloadable "Certificate of
Successful Suffering". Plus a password-gated admin page to read the answers.

**Stack:** Next.js 15 App Router · React 19 · Tailwind 3.4 · TypeScript ·
Prisma/Postgres · `canvas-confetti` · `html-to-image`. No UI library, no icon
library, no webfont (system fonts only, by choice).

---

## 1. Design position

- **Light-only, one committed palette.** No dark mode, no theme toggle. Stated
  as intent in `tailwind.config.ts` and `app/globals.css`.
- **Warm paper, not white.** Background is a warm off-white; cards are the only
  pure-white surface. Nothing is neutral grey.
- **Soft, chunky geometry.** Rounded display font, 1.5rem card radius, pill
  buttons, no hard corners anywhere.
- **Emoji as the entire illustration system.** One emoji per step, rendered in a
  tinted rounded square. No SVG, no images, no illustrations.
- **Mobile-first, one-handed.** Explicit assumption in the CSS: "the audience is
  one-handed on a couch." 44px minimum tap targets, swipe navigation.
- **Restrained motion, opt-out respected.** Three keyframes total; confetti and
  all animation are disabled under `prefers-reduced-motion`.

## 2. Color tokens

Defined as CSS custom properties on `:root` in `app/globals.css`, re-exported as
Tailwind color names in `tailwind.config.ts`. Re-skinning means editing the vars.

| Token | Tailwind | Hex | Role |
|---|---|---|---|
| `--paper` | `paper` | `#fbf7f2` | page background (warm off-white) |
| `--paper-tint` | `paper-tint` | `#f7efe8` | hover fill for quiet buttons |
| `--card` | `card` | `#ffffff` | card / field surface |
| `--ink` | `ink` | `#2a2422` | primary text (warm near-black) |
| `--ink-soft` | `ink-soft` | `#6f645e` | secondary text (`.muted`) |
| `--line` | `line` | `#ece4dc` | borders, progress track, slider track |
| `--clay-50` | `clay-50` | `#fdf3f0` | selected/hover tint, focus-ring glow |
| `--clay-100` | `clay-100` | `#f9e4de` | defined, currently unused |
| `--clay-300` | `clay-300` | `#efab9b` | field focus border, quote rule, song-line background |
| `--clay-500` | `clay-500` | `#dc6b52` | **the accent** — primary button, progress fill, slider, focus outline |
| `--clay-600` | `clay-600` | `#c55440` | primary hover, error/emphasis text |
| `--tint-sage` | `tint-sage` | `#f1f5ef` | pale panel tint |
| `--tint-sky` | `tint-sky` | `#eef3f7` | pale panel tint |
| `--tint-butter` | `tint-butter` | `#fbf5e8` | pale panel tint |

One accent (clay/terracotta) plus three pale tints. Tints are used *one per
surface* and cycled per step so consecutive screens feel distinct:
`["bg-clay-50", "bg-tint-sage", "bg-tint-sky", "bg-tint-butter"]`, indexed by step
number. `tintFor()` in `lib/steps.ts` is the single source, shared by the card's
emoji tile and the wash behind it.

Only exception to the palette: admin status pills use stock Tailwind
`emerald-100/800` (done) and `amber-100/800` (in progress).

## 3. Typography

- **Display** (`--font-display`, `font-display`, auto-applied to `h1/h2/h3`):
  `ui-rounded, "Segoe UI Rounded", "Hiragino Maru Gothic ProN", system-ui, sans-serif`
  — a *rounded* system font, with `letter-spacing: -0.02em`.
- **Body** (`--font-body`): `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- No webfont is loaded. `app/layout.tsx` keeps a commented-out `Baloo_2` import
  so builds never need network access.
- Weights in use: `font-bold` / `font-extrabold` for headings, `font-semibold`
  for buttons and labels, `font-medium` for answers.
- Sizes actually used: hero `text-[2.5rem]` → `sm:text-5xl`; step question
  `text-2xl` → `sm:text-[1.75rem]`; certificate name `text-4xl`; slider value
  `text-6xl`; body `text-lg`; hints and meta `text-sm`; eyebrow labels
  `text-[10px]` / `text-[11px]` uppercase with `tracking-widest`.
- `text-balance` on every headline. `tabular-nums` on every number that changes.

## 4. Shape, elevation, spacing

- Radii: `rounded-chunk` = **1.5rem** (cards); `rounded-2xl` (fields, choices,
  emoji tile, small panels); `rounded-full` (buttons, pills, progress, slider).
- Shadows — two, both warm-tinted, no dark variants:
  - `--shadow-soft`: `0 1px 2px rgb(42 36 34 / .04), 0 8px 24px -8px rgb(42 36 34 / .1)`
  - `--shadow-lift`: `0 2px 4px rgb(42 36 34 / .05), 0 18px 40px -14px rgb(42 36 34 / .16)`
  - `.card` uses `soft`. `lift` is defined but currently unused.
- Container widths: landing `max-w-xl`, wizard `max-w-xl`, certificate
  `max-w-xl`, admin `max-w-5xl`.
- Page padding: `px-4`/`px-5` → `sm:px-6`/`sm:px-8`; vertical `py-8` → `py-14`.
- Card padding: `p-6` → `sm:p-9` (certificate `p-7` → `sm:p-10`).
- `.screen` = `min-height: 100dvh` — dvh, so mobile browser chrome cannot clip.

## 5. Component classes

All in `@layer components` in `app/globals.css`. The whole system is 8 classes.

| Class | What it is |
|---|---|
| `.screen` | full-viewport-height page wrapper (`100dvh`) |
| `.card` | white surface, 1px `--line` border, `--shadow-soft` |
| `.muted` | `--ink-soft` text |
| `.tap` | `min-height: 44px` — composed into every interactive class |
| `.btn-primary` | pill, `clay-500` bg → `clay-600` hover, white semibold text, `px-7 py-3.5`, `active:scale-[0.98]`, `disabled:opacity-35` |
| `.btn-quiet` | pill, transparent → `paper-tint` hover, `ink-soft` → `ink` text, `px-5 py-3` |
| `.field` | full-width `rounded-2xl`, `text-lg`, white, `--line` border; on focus `clay-300` border + `0 0 0 4px var(--clay-50)` glow |
| `.choice` / `.choice-selected` | left-aligned tappable row, `--line` border → `clay-300` + `clay-50` on hover; selected = `clay-500` border + `clay-50` fill |

Focus: global `:focus-visible` = `2.5px solid var(--clay-500)`, `offset 3px`,
`border-radius .75rem`. `-webkit-tap-highlight-color: transparent` on `html`.

**`SongLines`** is the one non-class component in the system: a decorative
`absolute inset-0` layer holding a two-line couplet in the display face
(`text-[46px]` / `text-[32px]`, `clay-300` at `opacity-40` / `opacity-25`,
`-rotate-3` off `origin-bottom-left`, bleeding past the left edge) over a
half-height wash of the step's tint, masked to transparent. Every step carries
its own `song` couplet in `lib/steps.ts`; the landing and certificate have
`LANDING_SONG` and `CERTIFICATE_SONG`. It is `aria-hidden`, `select-none` and
`pointer-events-none`, and it deliberately uses the app's own display stack
rather than a webfont so builds still need no network access.

**Custom range slider** (~50 lines of CSS): 44px-tall hit area, 10px pill track
filled via a `--pct` custom property set inline from React, 28px white thumb
with a 4px `clay-500` ring. WebKit and Firefox pseudo-elements both handled.

## 6. Motion

Three keyframes in `tailwind.config.ts`, all on the same ease-out-back curve
`cubic-bezier(0.22, 1, 0.36, 1)`:

- `pop-in` — 0.32s, `translateY(10px)` + fade. Every card entrance.
- `nudge` — 0.3s × 2, ±5px shake. Validation failure, and the "you let go"
  hold-button message.
- `bounce-check` — 0.4s, scale 0.4 → 1.12 → 1. Confirmation checkmarks.

Plus `active:scale-[0.98]` on buttons, `transition-[width] duration-500 ease-out`
on the progress fill, and deliberate 240–650ms delays before auto-advancing so
the selected state is actually visible.

`@media (prefers-reduced-motion: reduce)` flattens all animation and transition
durations to `0.001ms`. Confetti (`canvas-confetti`, lazy-imported so it stays
out of the initial bundle) is skipped entirely — small burst at steps 4 and 8
and on flagged steps, three-shot big burst on the certificate.

## 7. Screens

**`/` — cover** (`app/page.tsx`). One line and one way in: a 🦵 emoji at
`text-5xl`, then **"END is the beginning"** at `text-[2.5rem]`, centred, where
the word *beginning* is itself the link to `/gauntlet` — clay-500, underlined
in `clay-300` at `decoration-[3px]` with `underline-offset-[6px]`, and a 44px
tap target. Below it one muted line of instruction and the days-until-follow-up
counter, over the song-line background. No nav, no name field, no footer.

The name is collected at step 1 instead, so `StartForm` is no longer mounted
anywhere — it is still in the tree if the landing ever wants a name field and a
start-over button back.

**`/gauntlet` — the wizard** (`GauntletWizard` + `StepCard`). One question per
screen, `max-w-xl` centered.

- `ProgressBar` on top: `n / 13` in muted tabular-nums above a 1.5px `--line`
  track with a `clay-500` fill.
- `StepCard`: tinted `h-14 w-14` rounded-square emoji tile → question `h2` →
  optional muted hint → the input → footer row with `Back` (btn-quiet,
  `disabled:invisible`) and `Continue` / `Get my certificate` (btn-primary).
- Self-advancing step types (`choice`, `yesno`, `confirm`, `hold`) hide the
  Continue button entirely.
- Navigation: tap, **← / → arrow keys** (suppressed while typing), and
  **horizontal swipe** (60px threshold, must beat vertical travel by 1.5×,
  ignored on sliders and text inputs). Progress and answers persist to
  localStorage, so the run resumes where it left off.

**9 input types**, each its own component in `components/inputs/`:

| Type | UI |
|---|---|
| `text` / `longtext` | `.field` input / 4-row textarea. Enter submits (Shift+Enter = newline). Autofocus on `pointer: fine` only — never on touch, so the keyboard cannot hide the question. |
| `number` | `−` / `+` 56px square buttons flanking a centered `text-3xl` display-font input, clamped to min/max |
| `slider` | Huge `text-6xl` clay-500 value above the custom range, min/max labels beneath; seeds itself to the midpoint |
| `choice` | Stacked `.choice` rows with a 20px circular check that fills clay-500 when selected; `role="radiogroup"`. A step carrying `reveal` skips the auto-advance and pops a `clay-50` punchline panel instead, keeping its Continue button. `forceAnswer` records and highlights a fixed option whichever one they tap — the lie is the joke |
| `yesno` | Two `py-7` display-font buttons in a 2-col grid. Honours `reveal` and `forceAnswer` as `choice` does |
| `guesses` | N `.field` inputs (default 3), Enter walking down them, with the `reveal` panel appearing — and Continue unblocking — only once every box is filled |
| `confirm` | One full-width `py-5 text-lg` primary button → "Logged ✓" with `bounce-check` |
| `hold` | 176px circle, `conic-gradient(clay-500 …deg, line 0)` ring driven by rAF off wall-clock time, live countdown in the center, 🧘 on success. Letting go early resets to zero and nudges "You let go. Back to zero." |

**`/results` — the certificate** (`Certificate.tsx`). A single white
`rounded-chunk` card designed to be exported as a PNG: `tracking-[0.3em]`
uppercase clay eyebrow → name at `text-4xl` → two stacked tinted panels
(Diagnosis on `clay-50`, Prognosis on `sage`) → an italic pull-quote with a 2px
`clay-300` left rule → up to 3 quoted answers above a `border-line` rule →
date + serial footer. Below the card: Download (primary), Share and Start over
(quiet), plus a transient toast in `clay-600`. Export via `html-to-image` at
`pixelRatio: 2` on `#ffffff`; Share uses the Web Share API with a clipboard
fallback.

**`/admin` and `/admin/login`** — same tokens, denser. `max-w-5xl`, a 2→4 column
grid of `rounded-2xl` stat cards, a filter/export/logout toolbar of `!py-2
!text-sm` overridden controls, and one collapsible `<details>` card per session
containing a `min-w-[540px]` horizontally scrolling answer table. Login is a
single `max-w-sm` card, grid-centered.

## 8. Accessibility as built

44px minimum tap targets everywhere · visible `clay-500` focus ring ·
`aria-label` on every unlabeled control · `role="progressbar"` with
valuemin/max/now · `role="radiogroup"` + `aria-checked` on choices ·
`aria-labelledby` linking each card to its question · `role="status"` on toasts
and the hold-button warning · `aria-hidden` on every decorative emoji ·
`prefers-reduced-motion` honored throughout · viewport allows zoom to 5×.

## 9. Known rough edges

Honest list, so suggestions can target real gaps.

1. **`--clay-100` and `--shadow-lift` are defined but never used** — the system
   has more range than the screens use. Nothing is ever "lifted."
2. **Only one accent.** No success/warning/error colors; errors reuse
   `clay-600`, and the admin pills are the one place stock Tailwind
   greens/ambers leak in.
3. **`app/layout.tsx` still declares a dark `themeColor`** (`#14100f`) in a
   light-only app, and its light value (`#fffaf5`) does not match `--paper`
   (`#fbf7f2`) — dead config left from an earlier dark-mode design.
4. **No empty/loading/error visual language.** Pre-hydration states render a
   blank `<div className="screen" />`; there is no skeleton, spinner, or
   inline-error pattern.
5. **The landing page is still sparse** — the song-line background gives it
   atmosphere, but there is no preview of what the 12 steps hold, no footer,
   nothing below the fold.
6. **The certificate is not print- or social-shaped.** It is a portrait web card
   exported at 2×; no fixed aspect ratio, no OG image, no landscape variant.
7. **Emoji is the only illustration.** Cross-platform rendering varies and there
   is no fallback if a glyph is missing.
8. **No page transitions** between wizard steps — the card `pop-in`s and the
   song lines re-enter, but nothing moves in the direction of travel, so the
   swipe gesture gets no visual echo.
9. **Admin is visually an afterthought** — same tokens, but reached with `!`
   important overrides rather than small-size component variants.
10. **No component variants at all.** One button size, one field size, one card.
    Every deviation is an inline override.

## 10. Prompt to hand to an AI

> Below is the complete design system of a small Next.js/Tailwind site (a
> 20-question joke quiz ending in a downloadable certificate). It is light-only,
> warm-paper, single clay accent, rounded system fonts, emoji-as-illustration,
> mobile-first with 44px tap targets, and deliberately minimal — 8 component
> classes and 3 keyframes total.
>
> Suggest concrete improvements that stay inside these constraints: no dark
> mode, no UI library, no downloaded webfont, no illustration assets. For each
> suggestion give me the exact tokens/classes/CSS to add, and say which of the
> "known rough edges" it addresses. Prioritise what would make the 20-step flow
> feel more delightful on a phone, and what would make the certificate more
> worth screenshotting.
