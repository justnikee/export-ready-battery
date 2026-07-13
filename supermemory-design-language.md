# Supermemory.ai — Design Language

> Extracted directly from supermemory.ai production CSS + HTML (Astro + Tailwind v4).
> Captures tokens, typography, layout, motion, and per-component specs as actually shipped.

---

## 1. Brand & Identity Overview

- **Product:** "The context cloud for agents" — memory / RAG / profiles / connectors / extractors infrastructure for AI agents.
- **Personality:** Technical, precise, confident, slightly playful. Developer-tool credibility with a "second brain / memory" metaphor.
- **Signature motif:** A cyan **dithered brain** (pixelated, retro-scanline feel) standing in for the word "agents" inside the hero headline.
- **Tone of voice in UI:** Plain, declarative, no hype words. Headlines use periods ("Bring your data. We build understanding. Your agent just knows.").
- **Logo:** Wordmark "Supermemory" + a small mark (favicon.svg). Customer logos rendered as wordmarks, inverted via `brightness(0) invert(1)` where needed.
- **Numbers as proof:** Live counters ("TOTAL MEMORIES SAVED 1,505,650,017"), "28.3K stars", "<300ms", "100B+ tokens/month", "#1 on every bench".

---

## 2. Tech Stack & Architecture

- **Framework:** Astro (scoped component CSS via `data-astro-cid-*` attributes).
- **Styling:** Tailwind CSS v4 (utility classes in HTML + `@theme` design tokens in CSS).
- **Fonts:** Self-hosted via Google Fonts (`fonts.gstatic.com` preloads): **Space Grotesk**, **DM Sans**, **DM Mono**.
- **Layout approach:** Utility-first for structure + scoped component CSS for complex/animated pieces. Heavy use of CSS Grid, `clamp()`, and `color-mix()`.
- **Delivery:** Two external stylesheets — a page-scoped CSS and a shared `Footer.*.css` containing the Tailwind theme/utilities.

---

## 3. Color System

The palette is a **light, near-white blue-tinted canvas** with a single dominant **electric blue** brand color, an **ink-near-black** text color, and **dark immersive inserts** (code blocks, video strips, stat bands) for contrast.

### 3.1 Brand Blue (primary accent)

| Token | Value | Use |
|---|---|---|
| `--color-blue` | `#0562ef` | Primary brand, CTAs, active states, links, highlights, focus rings |
| `--color-blue-light` | `#1e78ff` | Lighter blue variant |
| `--color-blue-hover` | `#3782f2` | Hover state for blue CTAs/links |
| `--color-blue-tint` | `#eaf2ff` | Tinted highlight backgrounds (FAQ open row, pricing highlight) |
| `--color-blue-paper` | `#f3f6fd` | Very subtle blue paper bg |
| `--color-card-blue` | `#ddebff` | Blue card surfaces |
| `--color-paper-blue` | `#f6f8fc` | Subtle blue paper |

### 3.2 Backgrounds & Paper

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f5f9ff` | Page/canvas background (cool off-white) |
| `--color-bg-alt` | `#f4f8ff` | Alternate surface (hover bg for secondary buttons) |
| `--color-paper` | `#fafafa` | Neutral paper surface (cards, code wrappers, testimonials) |
| `--color-mem-panel` | `#fbfcfe` | Memory panel surface |
| `--color-mem-panel-border` | `#e4ecf9` | Memory panel border |
| `--color-mem-strip` | `#fafafa` | Memory strip surface |
| `--color-white` | `#fff` | Pure white |

### 3.3 Text

| Token | Value | Use |
|---|---|---|
| `--color-text` | `#0b1015` | Primary text — deep ink, near-black with cool tint |
| `--color-text-muted` | `#0b101599` | Secondary text (60% ink) |
| `--color-text-dim` | `#888e94` | Tertiary/label text, eyebrows, disabled marks |

### 3.4 Borders

Two border systems exist — a **default hairline set** (used on `main`) and an **alternate crisper set**:

| Token | Default | Alternate |
|---|---|---|
| `--color-border` | `rgba(15, 46, 92, .1)` | `#c5dbf2` |
| `--color-border-light` | `rgba(15, 46, 92, .055)` | `#4794e04d` |
| `--color-border-strong` | `rgba(15, 46, 92, .16)` | `#9bc1ea` |
| `--color-border-dashed` | `#0b101529` | — |
| `--color-grid` | `#0b101529` | Dot/line grid ink |
| `--cf-stroke` | `var(--color-border)` | Comparison-table strokes |

Border base is `rgba(15, 46, 92, …)` — a deep navy at low opacity, never pure gray. This keeps borders cool and on-brand.

### 3.5 Dark / Immersive Surfaces

| Usage | Value |
|---|---|
| Code editor body | `#0b1015` |
| Code titlebar | `#13191f` |
| Code internal border | `#1F2933` |
| "Hands" video strip bg | `#001745` (deep navy) |
| Hands edge fade gradients | `#0562ef` at `f2 / a6 / 40 / 00` alpha |
| Testimonial stat band gradient | `linear-gradient(160deg, #00C2D8 0%, #0562ef 48%, #0015FF 100%)` — **cyan → blue → ultramarine** |
| Token stat panel | `#0263ef` / `#0562ef` over `blue-noise.png` |

### 3.6 Code Syntax Highlighting (dark theme)

| Token class | Color | Meaning |
|---|---|---|
| `.hiw-c-com` | `#6b7480` | Comments |
| `.hiw-c-kw` | `#7cb7ff` | Keywords |
| `.hiw-c-fn` | `#ff9f5a` | Functions |
| `.hiw-c-str` | `#f5a88b` | Strings |
| `.hiw-c-class` | `#a0e0ff` | Classes/types |
| code text | `#f5f9ff` | Default code |
| gutter numbers | `#3a4554` | Line numbers |

macOS traffic-light dots: red `#ff5f57`, yellow `#febc2e`, green `#28c840`.

### 3.7 Status / Semantic Colors

| Meaning | Value |
|---|---|
| Partial / "has but limited" | text `#b45309` on `#f59e0b1a` bg, border `rgba(245,158,11,.35)` (amber) |
| Copied / success | text `#047857`, border `#10b9818c` (green) |
| Missing feature | `var(--color-text-dim)` at `opacity:.3`, rendered as a thin `1.5px` dash |
| Win / best | `var(--color-blue)` filled circle with blue glow ring |

### 3.8 Tailwind defaults still in use

`slate-400` `oklch(70.4% .04 256.788)`, `slate-500` `oklch(55.4% .046 257.417)`, `slate-800` `oklch(27.9% .041 260.031)`, `blue-400` `oklch(70.7% .165 254.624)`.

### 3.9 Opacity via `color-mix()`

Instead of many alpha tokens, the site mixes on the fly, e.g.:
- `color-mix(in srgb, var(--color-text) 6%, transparent)` — sticky-header shadow
- `color-mix(in srgb, var(--color-text) 18%, transparent)`
- `color-mix(in srgb, var(--color-text) 60%, transparent)` — strikethrough color
- `color-mix(in srgb, var(--color-blue) 80%, var(--color-text))` — hover number
- `color-mix(in srgb, var(--color-blue) 16%, transparent)` — badge inset ring

---

## 4. Typography

### 4.1 Font Families

| Token | Stack | Role |
|---|---|---|
| `--font-heading` | `"Space Grotesk", sans-serif` | Display/headings, big stats, lead quotes, logo wordmarks, chart numerals |
| `--font-body` | `"DM Sans", sans-serif` | Body copy, UI labels, buttons, nav, descriptions |
| `--font-mono` | `"DM Mono", monospace` | Code, eyebrows/overlines, small uppercase labels, stat labels, company tags |
| `--font-sans` | system stack + emoji fallbacks | Fallback sans |

### 4.2 Font Weights

`300 light · 400 normal · 500 medium · 600 semibold · 700 bold`.
Headings overwhelmingly use **500 (medium)** — not bold — for a refined, modern look. 600 is reserved for active/emphasis states (e.g. open FAQ question). Wordmark logos use 600.

### 4.3 Type Scale (observed)

| Element | Size | Notes |
|---|---|---|
| Final CTA title (`.pc-title`) | `clamp(34px, 4.6vw, 60px)` | max 22ch, balance |
| HIW headline title | 56px → 44px(@1024) → 34px(@768) | tracking -.04em, leading 1.02 |
| Catalog heading title | 44px → 36px(@1280) → 28px(@768) | tracking -.04em, leading 1.05 |
| Catalog text title | 38px → 32px → 26px | tracking -.035em, leading 1.06 |
| Section H3 (use cases/enterprise) | ~40–44px desktop → 32px mobile | tracking -.035em |
| Hero headline | `text-[40px]` → 32px(lg) → 24px(md) | tracking -.04em, leading 1.05 |
| Hero subhead | `text-base` (~16px) | leading 1.7 |
| Stat value (testimonial) | `clamp(56px, 6.4vw, 88px)` | tracking -.04em, leading .9, tabular-nums |
| Stat label | `clamp(22px, 2.2vw, 30px)` | tracking -.02em |
| Token count | `clamp(36px, 6.2vw, 80px)` | tabular-nums |
| Lead quote (`.ts-lead`) | `clamp(22px, 2.1vw, 28px)` | tracking -.022em, leading 1.18, balance |
| Body / descriptions | 15–16.5px | leading 1.55–1.65 |
| Nav links | 15px | tracking -.01em, leading 140% |
| Dropdown items | 14px | medium |
| Button labels | 14.5px | tracking -.005em |
| Secondary/personal links | 13px | tracking -.005em |
| npx pill | 12.5px (mono) | |
| Code body / gutter | 11px (mono) | leading 20px |
| Code tab labels | 11.5px | |
| Eyebrows / overlines | 10.5–11px (mono) | uppercase, wide tracking |
| Badges | 9–10px (mono) | uppercase, tracking .1–.22em |

### 4.4 Letter-spacing (tracking)

- **Headings: tight/negative** — `-.04em`, `-.035em`, `-.028em`, `-.022em`, `-.015em`, `-.01em`, `-.005em`, `-.003em` (tighter as size grows).
- **Mono labels: wide/positive** — `.06em`, `.1em`, `.14em`, `.16em`, `.18em`, `.22em` (caps overlines).

### 4.5 Line-height

- Headings: `1.02`–`1.1` (display), `1.05` common.
- Body: `1.4` (nav), `1.55`–`1.65` (descriptions), `1.7` (hero subhead).
- Buttons/labels: ~`1`.

### 4.6 Text-wrapping

- `text-wrap: balance` on all headings & lead quotes.
- `text-wrap: pretty` on body paragraphs.
- `font-variant-numeric: tabular-nums` on all stats/counts/chart axes.

---

## 5. Layout & Spacing

### 5.1 Nav & Structure

- **Nav height:** `56px` (`--nav-height`); sticky section headers sit at `top: calc(var(--nav-height) - 1px)`.
- Site is a **9-section vertical scroll story**, each prefixed with an overline + index `[1/9]`…`[9/9]` and a scroll-progress indicator.

### 5.2 Breakpoints (Tailwind + custom)

Primary semantic breakpoints:
- `1280px` — large desktop reductions
- `1024px` — tablet / grid collapses to single column
- `768px` — mobile typography & layout shifts
- `640px` — small mobile padding/spacing
- `420px` — extra-small tweaks
- `360px` — narrowest refinements (CTA widths, tab padding)
- Also used: `880px`, `520px` for specific components (testimonials).

### 5.3 Horizontal Padding (section gutgets)

- Desktop: `32px` (some sections `48px`/`56px`)
- `@1024`: `24px`
- `@768`: `20px` (or `16px`)
- `@640`: `16px`–`20px`

### 5.4 Vertical Section Padding

- Large sections: `56px` top / `112px` bottom (catalog), `72px`/`80px` (final CTA).
- Mobile: `40px`–`48px` top / `28px`–`64px` bottom.

### 5.5 Gaps

Common flex/grid gaps: `64px`, `48px`, `28px`, `24px`, `22px`, `20px`, `18px`, `16px`, `14px`, `8px`, `7px`, `6px`.

### 5.6 Fluid Spacing with `clamp()`

Spacing is fluid, e.g.:
- `margin-top: clamp(20px, 3vw, 32px)` (headline)
- `margin-top: clamp(14px, 1.8vw, 22px)` (subhead)
- `margin-top: clamp(24px, 3.2vw, 36px)` (CTA group)

### 5.7 Content Measure (max-widths)

Text columns capped for readability: `22ch`, `340px`, `360px`, `440px`, `560px`, `620px` (62ch quotes), `660px` (headline).

### 5.8 Grid Patterns

- **Catalog:** `grid-template-columns: minmax(320px, 34%) 1fr` → collapses to `1fr` @1024.
- **Testimonial card:** `320px 1fr` portrait + quote (reverses order on `--reversed`).
- **Bench scoreboard:** `minmax(0,1fr) repeat(3, var(--vendor-col))` (vendor col 168px → 132px → 72px).
- **Stat band:** `1.45fr 1fr`.
- **Final CTA stats:** `minmax(0,1fr) 280px`.

---

## 6. Borders & Radius

### 6.1 Border Style

- Default: `1px solid var(--color-border)` (cool navy hairline).
- Dividers/accents: `1px dashed var(--color-border)` (FAQ rows, price zones, testimonial attribution, personal link underline).
- Emphasis chips: `1.5px solid #0263EF` (agent chip, github stars card).
- Active highlight borders use blue.

### 6.2 Radius Scale

The design is **predominantly sharp / low-radius** — rarely rounded, leaning technical/geometric:

| Radius | Use |
|---|---|
| `0` | Many card edges (square corners) |
| `2px` | Mono badges, tab icons, pills |
| `3px` | Small badges |
| `4px` | Focus outlines, ticker links |
| `5px` | Small logo marks, icon stacks |
| `10px` | Code editor top corners (`10px 10px 0 0`) |
| `12px` | Chart bar tops, scoreboard radius (`--sm-radius`) |
| `14px` | Some cards |
| `clamp(14px, 1.5vw, 30px)` | Nav pill / large rounded element |
| `50%` / `rounded-full` | Dots, status circles, traffic-light dots |

Tailwind radius utilities also present: `rounded-sm/md/lg/xl/2xl/3xl`, `rounded-[3px]`, `rounded-[9px]`, `rounded-[20px]`.

---

## 7. Shadows & Elevation

Elevation is **subtle and blue-tinted**, never heavy gray drop-shadows:

| Shadow | Use |
|---|---|
| `0 1px 2px #0519502e, 0 8px 18px -8px #0562ef80` | Highlighted pricing CTA (blue glow) |
| `0 32px 64px -24px #0b101547, 0 8px 16px -4px #0b10151a, 0 0 0 1px #0b10150a` | Floating code editor |
| `0 -12px 28px -12px #0562ef38, 0 -2px 6px -2px #0562ef1a` | Bench SM column top glow |
| `0 16px 28px -12px #0562ef38, 0 4px 8px -2px #0562ef1a` | Bench SM column bottom glow |
| `0 0 0 4px #0562ef1a, 0 4px 10px -3px #0562ef66` | "Win" mark ring |
| `0 4px 10px -3px #0562ef73` | Bench badge |
| `0 1px color-mix(text 6%, transparent), 0 6px 16px -10px color-mix(text 18%, transparent)` | Pinned sticky header |

Inset rings also act as elevation: `inset 1px 0 0 var(--sm-ring)` on the highlighted scoreboard column.

---

## 8. Motion & Animation

### 8.1 Easing Tokens

| Token | Curve |
|---|---|
| `--ease-out-strong` | `cubic-bezier(.23, 1, .32, 1)` |
| `--ease-out-expo` | `cubic-bezier(.16, 1, .3, 1)` |
| `--ease-out` | `cubic-bezier(0, 0, .2, 1)` |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` |
| (workhorse, unnamed) | `cubic-bezier(.22, 1, .36, 1)` — used most |
| (pricing ladder) | `cubic-bezier(.45, 0, .25, 1)` |

### 8.2 Durations

- **Micro:** `0.12s` (press/active), `0.18s` (hover bg/border), `0.2s` (arrow translate), `0.22s` (opacity).
- **Small:** `0.24s` (toggle/label), `0.25–0.28s` (card filters), `0.36s` (FAQ row bg).
- **Medium:** `0.5s–0.7s` (catalog card crossfade/scale/blur).
- **Large:** `0.8s` (chart bars grow), `0.9s` (illustration float-in), `1s` (SVG path draw), `1.1s` (hands blur-in), `1.8s` (video crossfade).
- **Loop:** `36s linear infinite` (logo marquee).

### 8.3 Keyframes

- `hero-ticker-scroll` — translateX `-50%` marquee loop.
- `hero-hands-in` — `blur(14px) → 0`, opacity in.
- `hero-step-in` — staggered `translateY(n) → 0` + opacity.
- `catalog-float-in` — `translateY(8px) scale(.96) → 0/1`.
- `pt-pill-in` — `translateY(2px) scale(.9) → none`.
- `seam-draw` — SVG `stroke-dashoffset 92 → 0`, then `fill-opacity 0 → 1` (self-drawing logo seams).
- `logo-draw` / `logo-redraw`, `footer-mark-draw` / `footer-mark-redraw` — self-drawing SVG marks.

### 8.4 Entrance Choreography (hero)

- Hands strip blurs in first (`1.1s`, 60ms delay).
- Hero center children stagger in with individual delays: `0.28s`, `0.38s`, `0.56s`, `0.68s`, `0.98s`; sub-children at `0.76/0.84/0.92s`.
- Each step starts at `opacity:0; transform:translateY(6–14px)`.

### 8.5 Hover Micro-interactions

- Arrow icons translate `+2px` (or `translate(2px,-2px)` for diagonal github arrow) on hover.
- Active press: `transform: scale(.985)` on all buttons/cards.
- Portraits: `grayscale(100%) contrast(1.04) → grayscale(0) + scale(1.015)` on card hover.
- Catalog spine: number/title colorize, a 6px blue dot scales in, a progress fill grows.

### 8.6 Scroll-driven / Intersection

- Components toggle classes (`is-in`, `is-highlight`, `aria-current`, `data-open`) via IntersectionObserver to trigger transitions, dither canvases, and SVG draws.

### 8.7 Reduced Motion

`@media (prefers-reduced-motion: reduce)` is **fully supported everywhere**:
- All `animation: none`, `transition: none`.
- States forced to `opacity:1; transform:none; filter:none`.
- Ticker marquee stops and `justify-content:center` instead.
- SVG path-draw falls back to filled mark.

---

## 9. Buttons & CTAs

### 9.1 Primary Button (`.btn-primary`)

- Height `44px`, full-width, `display:flex`.
- `background: var(--color-blue)`, `color:#fff`, `border:1px solid var(--color-blue)`.
- Split layout: **label** (flex:1, padding `0 20px`) + **arrow** (44px square) separated by a `1px solid rgba(255,255,255,.18)` divider.
- Label: `DM Sans` 14.5px / 500 / tracking -.005em.
- Hover: arrow `translateX(2px)`. Active: `scale(.985)`. Focus: `2px solid blue` outline, offset 2px.
- Mobile: centers label+arrow, removes divider.

### 9.2 Secondary Button (`.btn-secondary`)

- Height 44px, `background: var(--color-paper)`, `border:1px solid var(--color-border-light)`, `color: var(--color-text)`.
- Hover: `background: var(--color-bg-alt)`, `border-color: var(--color-text)`.
- Same 14.5px label, active `scale(.985)`, blue focus ring.

### 9.3 npx Install Pill (`.npx-pill`)

- Height 36px, mono 12.5px, `background: var(--color-paper)`, `1px dashed rgba(11,16,21,.2)`.
- Clipboard ↔ check icon swap (opacity/scale/blur crossfade). Copied state: solid green border `#10b9818c`, text `#047857`.

### 9.4 Use-case CTA (`.uc-cta`) & Stat-band CTA (`.ts-cta`)

- Same 44px split-button pattern. Inverse variant: white bg + blue text.
- Stat-band CTA: translucent `background: #ffffff1a`, `border: rgba(255,255,255,.55)`, hover → solid white bg + blue text.

### 9.5 Final CTA (`.pc-cta`)

- Height 56px (larger), `background:#0263ef`, 15px label, arrow `translateX(2px)` hover, `scale(.985)` active.

### 9.6 Universal CTA affordances

- Arrow nudge on hover, slight scale-down on press, blue focus ring — consistent across every CTA variant.

---

## 10. Components — Detailed Specs

### 10.1 Sticky Section Header

- `position: sticky; top: calc(56px - 1px); z-index:20`.
- `border-bottom: 1px solid var(--color-border)`, `background: var(--color-bg)`.
- When pinned (`data-pinned`): soft shadow `0 1px …6%, 0 6px 16px -10px …18%`.
- Contains mono overline (`11px`, `tracking .18em`/`.06em`, uppercase, `text-text-dim`) + section index `[n/9]`.

### 10.2 Hero

- **Eyebrow ticker:** auto-scrolling logo marquee, `gap:28px`, `36s linear infinite`.
- Edge fade via `mask-image: linear-gradient(to right, transparent 0, black 64px, …)` (28px mobile).
- Logo wordmarks height `22px` (20px mobile), name `22px`/`19px` Space Grotesk 500, tracking `-.05em`.
- **Headline:** inline **brain image** (`aspect-ratio: 242/363`, `image-rendering: pixelated`) replacing a word; vertical-aligned within the text line.
- **hero-dots** background layer (opacity `.45` mobile).
- **hands-strip:** full-bleed video (`100vw`, `aspect-ratio: 4.2`, max-height 320px), blue edge gradients, center 72px mark, slow/fast video crossfade.

### 10.3 Product Catalog

- **Two-column:** sticky spine list (left) + stage (right).
- **Spine items:** `grid-template-columns: 36px 1fr auto`, numbered `01–07`, `padding:18px 4px`, hairline top borders.
- Active item: number + title → blue/bold, 6px blue dot scales in, bottom progress fill (`background: blue`, origin left).
- **Stage card (plinth):** `aspect-ratio: 1560/958`, `background-color: blue` layered with `plinth-grid.png` + `halftone-cmyk.png`, illustration `68%` width, `catalog-float-in` animation.
- **Text card:** `background: var(--color-paper)`, `border:1px solid border`, `padding:40px 48px`, crossfades with `translateY(6px)` + opacity.

### 10.4 Code Block (How It Works)

- Dark `#0b1015` editor, top corners `10px 10px 0 0`, floating shadow stack.
- **Titlebar:** `#13191f`, traffic-light dots (11px), centered mono filename (`11px #6b7480`).
- **Tabs:** TS / PY / cURL. Active tab: `bg #7cb7ff14`, `border-bottom:2px solid #7CB7FF`.
- Tab icon chips (15px, radius 2px): TS `#7cb7ff`, PY `#ffd667`, cURL `#6b7480`.
- **Body:** gutter (line numbers `#3a4554`) + code lines (`#f5f9ff`), mono 11px / leading 20px, token-colored spans.
- Surrounding **dot grid**: `radial-gradient(circle, rgba(124,183,255,.35) 1px, transparent 1.4px)` at 16px, masked with a radial ellipse fade.

### 10.5 Benchmarks Scoreboard (comparison table)

- Card: `1px dashed var(--color-blue)` with **corner ticks** (14px blue squares at each corner, offset `-7px`).
- Grid: label column + 3 vendor columns (`--vendor-col`).
- **Supermemory column highlighted:** `--sm-tint:#EDF3FF` bg, `--sm-ring: rgba(5,98,239,.28)` inset rings, top/bottom rounded `--sm-radius:12px`, blue glow shadows, floating "BEST" badge (mono 9px, blue, radius 3px).
- **Status marks:** win = blue filled circle (22px) with glow ring; has = 22px outline icon (`#6b7480`); miss = 18px × 1.5px dim dash; partial = amber mono pill.
- Feature header: 6px blue dot with `0 0 0 4px #0562ef1a` ring + uppercase label + count.
- Research strip: `halftone-cmyk.png` at `mix-blend-mode:multiply`, opacity `.1`.

### 10.6 Use Cases

- Horizontal **scroll-snap card row** with hidden scrollbar (`::-webkit-scrollbar{display:none}`).
- Cards `min(360px, calc(100vw - 40px))` on mobile.
- Eyebrow: 10.5px mono, tracking `.18em`, uppercase, with a 6px colored dot.
- "In production at" logo row: wordmarks (`--uc-logo-ink:18px`/16px), invert filter for dark logos.

### 10.7 Enterprise

- **Bracket marks:** 16px L-shaped corner accents (`::before`/`::after` 1px lines) at panel corners.
- Runtime cells (on-prem / VPC / local) + SOC2 / GDPR cells.
- Footer link: blue on hover, arrow nudge.

### 10.8 Testimonials

- Card: `320px 1fr` grid (portrait + quote), `background: var(--color-paper)`, top+bottom hairlines.
- **Portrait:** `grayscale(100%) contrast(1.04)` → full color + `scale(1.015)` on hover; fallback = 56px Space Grotesk initial on `#dde4ed`.
- **Quote lead:** Space Grotesk 500, `clamp(22–28px)`, tracking -.022em, leading 1.18, balance.
- **Attribution:** `border-top:1px dashed`, company in **mono 11px blue uppercase** (tracking .16em), name in DM Sans 13.5px.
- Scattered **crosshair marks** (`+` shapes, 11px, opacity .45) as decorative pinpoints.
- **Stat band:** `linear-gradient(160deg, #00C2D8, blue, #0015FF)` + `halftone-cmyk.png` overlay (`mix-blend-mode:overlay`, opacity .55). Bar chart: white "Memory" bar vs **glassmorphic** RAG bar (`backdrop-filter: blur(10px) saturate(140%)`). Giant stat `clamp(56–88px)`.
- Embedded YouTube videos in bordered frames.

### 10.9 Pricing

- Cards on white; **highlighted tier** toggles `.is-highlight` → `background: var(--color-blue-tint)` with an animated **dither canvas** (`pt-dither`).
- **Price zone:** `border-top:1px dashed`, usage badge (`color-mix(text 5.5%)` → on highlight: white bg + blue text + inset ring).
- **Pill badge:** DM Mono 10px, blue bg, radius 2px, `pt-pill-in` animation.
- Feature list rows: `border-top:1px solid border-light`, 15px blue check icons.
- CTA ladder transition (`--ladder-dur:.56s`, `--ladder-ease`): highlighted CTA → blue bg + blue glow shadow `0 8px 18px -8px #0562ef80`; hover → `--color-blue-hover`.
- Enterprise block: 40px icon boxes (`bg-alt`, border, radius 10px), blue checks, blue icon accents.

### 10.10 FAQ Accordion

- Filter chips: selected → `background: blue; color:#fff`.
- Rows separated by hairlines; open row → `background: var(--color-blue-tint)`.
- Question number + text → blue + 600 weight when open.
- **+ / − toggle:** vertical bar (`faq-toggle-v`) scales to `0` on open.
- Answer expand: `grid-template-rows: 0fr → 1fr` (`0.36s`) + inner `translateY(-4px)→0` + opacity.
- Filtered-out rows: `display:none` (`data-hidden`).

### 10.11 Final CTA Section (`.pc-wrap`)

- Padding `72px 32px 80px`.
- **Title** with a rotating **agent-word chip**: `1.5px solid #0263EF`, `bg #fffc`, 6px blue dot, words cycle (`.is-active`/`.is-leaving`) via translateY + opacity.
- Blue CTA (56px).
- **Tokens stat panel:** `#0263ef` bg + `blue-noise.png` cover, count `clamp(36–80px)`, label 11.5px mono uppercase.
- **GitHub stars card:** white bg, `1.5px solid #0263EF`, blue text, 28px GH icon, diagonal arrow on hover.

### 10.12 Footer

- Self-drawing SVG marks (`footer-mark-draw` / `footer-mark-redraw`) using stroke-dashoffset.
- Seam marks fill blue via `seam__mark path { fill: var(--color-blue) }`.

---

## 11. Imagery, Texture & Visual Motifs

| Asset / Technique | Where | Treatment |
|---|---|---|
| **Dithered brain** (`Brain Dither.png`) | Benchmarks section | Cyan, `image-rendering: pixelated`, retro dither |
| **Brain-head** (`brain-head.png`) | Inline in hero headline | Pixelated, sized to text line |
| **halftone-cmyk.png** | Plinths, research strips, stat bands | `mix-blend-mode: multiply/overlay`, opacity `.1–.55` |
| **plinth-grid.png** | Catalog card plinths | Over blue bg, `100% 100%` |
| **blue-noise.png** | Token stat panel | `cover` over blue |
| **Dot grid** (CSS) | How-it-works scene | `radial-gradient` 16px dots, radial-ellipse mask |
| **Edge fade mask** | Logo ticker | `linear-gradient` transparent→black→transparent |
| **Corner ticks / brackets / crosshairs** | Bench, enterprise, testimonials | 1px line `::before/::after` decorations |
| **Glassmorphism** | RAG chart bar | `backdrop-filter: blur(10px) saturate(140%)` + inset white ring |
| **Scanline / dither canvas** | Highlighted pricing card | Animated JS dither on blue-tint bg |

Overall texture language: **retro-computer dithering + halftone + technical drafting marks** (ticks, brackets, crosshairs, dashed lines) layered over clean Swiss-style typography.

---

## 12. Iconography

- Predominantly **inline SVG**, minimal/line style, stroke-based.
- Logos as wordmarks or masked icons (`mask-image`), inverted via `filter: brightness(0) invert(1)`.
- Icon sizes: `12–22px` typical; container boxes `22px`/`40px` with `bg-alt` + border + `10px` radius.
- Tab/filetype chips use solid color blocks (TS blue, PY yellow, cURL gray).
- Check marks and arrows inherit `var(--color-blue)`.

---

## 13. Accessibility

- **Focus:** `:focus-visible { outline: 2px solid var(--color-blue); outline-offset: 2px }` (buttons) / `offset: 4px` (links) / `offset: -2px` (inset for FAQ questions). Portrait focus uses `outline-offset: -4px`.
- **Reduced motion:** comprehensively disables animation/transition/blur/scale; marquee centers; SVG draws snap to filled state.
- **Semantics:** `aria-current`, `aria-expanded`, `aria-hidden`, `aria-selected`, `data-open`, `data-copied`, `data-pinned` drive state.
- **Numerics:** `tabular-nums` for all stats to prevent digit jitter.
- **Text wrapping:** `balance`/`pretty` for legible ragging.
- Hidden scrollbars (`display:none`) on horizontal scrollers.

---

## 14. Design Principles (synthesized)

1. **One blue, used with restraint.** `#0562ef` is the only chromatic hero; everything else is ink-on-paper or dark immersive navy.
2. **Cool, never gray.** Borders, shadows, and backgrounds carry a blue/navy tint (`rgba(15,46,92,…)`).
3. **Sharp geometry.** Low radii, hairline borders, corner ticks/brackets — an engineering-drawing aesthetic.
4. **Medium-weight display type.** Space Grotesk 500 (not bold), tightly tracked, balanced wrapping.
5. **Numbers as authority.** Big tabular-nums stats, live counters, benchmark "BEST" badges.
6. **Texture over gradient shine.** Dither, halftone, and noise instead of glossy glass — a retro-tech material language.
7. **Motion is quick and decisive.** Fast micro-interactions (`~0.12–0.24s`), arrow nudges, `scale(.985)` presses; longer reveals only for entrances/data viz.
8. **Dark inserts for contrast.** Code blocks and stat bands break the light canvas with deep navy + neon-cyan gradients.
9. **Progressive disclosure.** Sticky headers, scrolling spine nav, accordions, and intersection-triggered reveals pace the story.
10. **Accessibility built-in.** Blue focus rings and full reduced-motion support are defaults, not add-ons.
