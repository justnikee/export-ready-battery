# ExportReady Battery — Design System

> **Precision v4.0** — April 2026
> Clean Enterprise Compliance · Zinc Neutrals · Emerald Accent · Inter + JetBrains Mono

---

**Project:** ExportReady Battery — Digital Battery Passport Platform
**Category:** B2B Compliance SaaS
**Inspired by:** Linear, Vercel Dashboard, Vanta, Stripe

---

## Philosophy

> **Color is earned, not decorative.**

The UI is predominantly neutral. Color appears only for:
1. **Compliance status** (verified/pending/rejected/info/draft)
2. **Brand accent** (emerald — sparingly)
3. **Interactive elements** (focus rings, links)

---

## Typography

| Role | Family | Weights | CSS Variable |
|------|--------|---------|-------------|
| Body + Headings | Inter | 400, 500, 600 | `--font-sans` |
| Data / Code | JetBrains Mono | 400, 500 | `--font-mono` |

**Loading:** `next/font/google` only (no @fontsource).

### Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| page-title | 24px | 600 | 1.2 | -0.025em | h1 — Page titles |
| section-title | 18px | 600 | 1.3 | -0.02em | h2 — Section headings |
| card-title | 16px | 500 | 1.4 | -0.01em | h3 — Card/panel headings |
| subtitle | 14px | 500 | 1.4 | normal | h4 — Subtitles, nav items |
| body | 14px | 400 | 1.5 | normal | Default body text |
| body-sm | 13px | 400 | 1.125 | normal | Compact descriptions |
| caption | 12px | 500 | 1.333 | normal | Captions, timestamps |
| label | 11px | 500 | 1.27 | 0.05em uppercase | Form labels, table headers |
| data | 13px | 400 | 1.38 | normal | JetBrains Mono — IDs, codes |

**Base font size:** 14px (enterprise standard).

---

## Color Palette

### Neutrals — Zinc Scale (the backbone)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Page background | `#FAFAFA` | `zinc-50` | Body bg, page bg |
| Surface | `#FFFFFF` | `white` | Cards, inputs, panels |
| Surface alt | `#F4F4F5` | `zinc-100` | Table headers, hover, secondary |
| Border | `#E4E4E7` | `zinc-200` | Default borders |
| Border strong | `#D4D4D8` | `zinc-300` | Emphasized borders |
| Text faint | `#A1A1AA` | `zinc-400` | Placeholders, disabled |
| Text muted | `#71717A` | `zinc-500` | Captions, secondary text |
| Text secondary | `#52525B` | `zinc-600` | Descriptions |
| Text body | `#3F3F46` | `zinc-700` | Default body text (p tags) |
| Text strong | `#27272A` | `zinc-800` | Emphasized text |
| Text primary | `#18181B` | `zinc-900` | Headings, primary buttons |
| Text contrast | `#09090B` | `zinc-950` | Maximum contrast |

### Brand

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| Primary | `--primary` | `#18181B` (zinc-900) | Buttons, CTAs, focus rings |
| Accent | `--accent` | `#F4F4F5` (zinc-100) | Hover backgrounds (shadcn) |
| Brand emerald | — | `#10B981` (emerald-500) | Links, active nav, brand highlights |
| Brand emerald hover | — | `#059669` (emerald-600) | Emerald hover states |

### Compliance Status Colors

| Status | Foreground | Background | Border | Usage |
|--------|-----------|------------|--------|-------|
| Verified / Compliant | `emerald-600` | `emerald-50` | `emerald-200` | BIS verified, EPR compliant |
| Pending / In Review | `amber-600` | `amber-50` | `amber-200` | Under review |
| Rejected / Error | `red-600` | `red-50` | `red-200` | Non-compliant, failed |
| Info / Processing | `blue-600` | `blue-50` | `blue-200` | In progress |
| Draft / Inactive | `zinc-500` | `zinc-100` | `zinc-200` | Draft, archived |

### Chart Colors

| Slot | Hex | Color | CSS Variable |
|------|-----|-------|-------------|
| 1 | `#10B981` | Emerald | `--chart-1` |
| 2 | `#3B82F6` | Blue | `--chart-2` |
| 3 | `#F59E0B` | Amber | `--chart-3` |
| 4 | `#8B5CF6` | Violet | `--chart-4` |
| 5 | `#EF4444` | Red | `--chart-5` |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Inline chips |
| `--radius-sm` | 6px | Buttons, inputs, badges |
| `--radius-md` | 8px | Cards, panels |
| `--radius-lg` | 12px | Modals, sheets, popovers |
| `--radius-xl` | 16px | Large containers |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Buttons |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Dropdowns |
| `shadow-md` | `0 4px 8px -2px rgba(0,0,0,0.08)` | Popovers |
| `shadow-lg` | `0 12px 24px -4px rgba(0,0,0,0.12)` | Modals, sheets |

**Cards use NO shadow — border only.**

---

## Spacing

8px base grid. Use Tailwind spacing scale.

| Context | Value | Tailwind |
|---------|-------|----------|
| Page padding | 24px | `p-6` |
| Card content | 20px | `p-5` |
| Card header | 16px × 20px | `py-4 px-5` |
| Section gap | 24px | `gap-6` |
| Component gap | 16px | `gap-4` |
| Tight gap | 8px | `gap-2` |
| Inline gap | 4px | `gap-1` |

---

## Component Specs

### Buttons

| Variant | Background | Text | Hover | Usage |
|---------|-----------|------|-------|-------|
| `default` | zinc-900 | white | zinc-900/90 | Primary actions |
| `outline` | white | zinc-700 | zinc-50 | Secondary actions |
| `secondary` | zinc-100 | zinc-900 | zinc-100/80 | Tertiary actions |
| `ghost` | transparent | zinc-600 | zinc-100 | Subtle actions |
| `accent` | emerald-600 | white | emerald-700 | Brand actions (use sparingly) |
| `destructive` | red-600 | white | red-600/90 | Danger actions |
| `link` | transparent | emerald-600 | underline | Inline links |

**Sizes:** sm=h-8, default=h-9, lg=h-10. All `rounded-md` (6px).

### Cards

- `bg-white border border-zinc-200 rounded-lg shadow-none`
- Header: `px-5 py-4 border-b border-zinc-100`
- Content: `p-5`

### Badges

- `rounded-md` (6px) — NOT rounded-full (technical, not playful)
- `px-2 py-0.5 text-xs font-medium`
- Use compliance status colors for status badges

### Inputs

- `h-9 border-zinc-200 rounded-md bg-white`
- Focus: `ring-[3px] ring-zinc-900/50 border-zinc-900`
- Placeholder: `text-zinc-500`

### Tables

- Header: `bg-zinc-50 text-[11px] uppercase text-zinc-500 tracking-wider`
- Row: `border-b border-zinc-100 hover:bg-zinc-50`
- Cell: `text-sm text-zinc-700 py-3 px-4`

### Sidebar

- `bg-white border-r border-zinc-200`
- Active: `bg-zinc-100 text-zinc-900 font-medium`
- Inactive: `text-zinc-600 hover:bg-zinc-50`
- Section label: `text-[11px] uppercase text-zinc-400`

---

## Transitions

| Element | Duration | Easing |
|---------|----------|--------|
| Buttons, links, inputs | 150ms | ease |
| Sheets, dialogs | 300ms | ease-in-out |
| Focus rings | instant | — |

---

## Anti-Patterns (Do NOT Use)

- ❌ `slate-*` classes — use `zinc-*` exclusively
- ❌ `rounded-full` on badges — use `rounded-md`
- ❌ Shadows on cards — use borders
- ❌ Hardcoded hex for Tailwind colors — use Tailwind classes
- ❌ Playful/candy colors — keep it professional
- ❌ Emojis as icons — use Lucide React icons
- ❌ Multiple font families for body text — Inter only
- ❌ AI purple/pink gradients
- ❌ Dark mode toggles (enterprise: light-only)
- ❌ `@fontsource` imports (use `next/font/google`)

---

## Pre-Delivery Checklist

- [ ] No `slate-*` Tailwind classes (zinc only)
- [ ] No hardcoded slate hex values
- [ ] All icons from Lucide React
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover states with 150ms transitions
- [ ] Focus states visible (ring-[3px])
- [ ] Text contrast ≥ 4.5:1
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
