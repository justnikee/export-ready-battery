# Anviora — Figma Component Checklist

**For:** Design Team  
**Status:** Production-ready build specifications  
**Last Updated:** May 2026

> This document is a step-by-step build guide for every Figma component needed to ship Anviora. Each component includes exact specs, variants, properties, and auto-layout rules.

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Atoms](#2-atoms)
3. [Molecules](#3-molecules)
4. [Organisms](#4-organisms)
5. [Marketing Components](#5-marketing-components)
6. [Dashboard Components](#6-dashboard-components)
7. [Responsive Behavior](#7-responsive-behavior)
8. [Dark Mode](#8-dark-mode)
9. [Build Order & Priority](#9-build-order--priority)

---

## 1. Design Tokens

### 1.1 Colors

Create a Figma **Color Styles** library with these exact names and values:

#### Primitives

| Style Name | Hex | Usage |
|---|---|---|
| `color/white` | `#FFFFFF` | Card bg, page bg |
| `color/black` | `#09090B` | Hero bg, dark sidebar |
| `color/slate-50` | `#F8FAFC` | Section alt bg |
| `color/slate-100` | `#F1F5F9` | Hover bg, subtle fill |
| `color/slate-200` | `#E2E8F0` | Borders, dividers |
| `color/slate-300` | `#CBD5E1` | Disabled borders |
| `color/slate-400` | `#94A3B8` | Placeholder text |
| `color/slate-500` | `#64748B` | Secondary text |
| `color/slate-600` | `#475569` | Secondary text dark |
| `color/slate-700` | `#334155` | Emphasis text |
| `color/slate-800` | `#1E293B` | Dark card bg |
| `color/slate-900` | `#0F172A` | Primary text, dark elements |

#### Semantic

| Style Name | Hex | Usage |
|---|---|---|
| `color/primary` | `#4F46E5` | Buttons, links, active states |
| `color/primary-hover` | `#4338CA` | Button hover |
| `color/primary-subtle` | `#EEF2FF` | Primary bg tint |
| `color/success` | `#10B981` | Success states, checkmarks |
| `color/success-subtle` | `#D1FAE5` | Success bg tint |
| `color/warning` | `#F59E0B` | Warnings, expiry alerts |
| `color/warning-subtle` | `#FEF3C7` | Warning bg tint |
| `color/danger` | `#EF4444` | Errors, blocked, critical |
| `color/danger-subtle` | `#FEE2E2` | Danger bg tint |
| `color/info` | `#0EA5E9` | Info alerts, tips |
| `color/info-subtle` | `#E0F2FE` | Info bg tint |

#### Dark Mode

| Style Name | Hex | Usage |
|---|---|---|
| `color/dark-bg` | `#0F0F10` | Dark mode page bg |
| `color/dark-surface` | `#18181B` | Dark mode card bg |
| `color/dark-border` | `#27272A` | Dark mode borders |
| `color/dark-text` | `#FAFAFA` | Dark mode primary text |
| `color/dark-text-secondary` | `#A1A1AA` | Dark mode secondary text |

### 1.2 Typography

Create a Figma **Text Styles** library. Use Geist for UI, Geist Mono for data.

| Style Name | Font | Size | Weight | Line-Height | Letter-Spacing |
|---|---|---|---|---|---|
| `text/display` | Geist | 120px | 700 | 1.0 | -0.03em |
| `text/h1` | Geist | 96px | 700 | 1.1 | -0.02em |
| `text/h2` | Geist | 72px | 700 | 1.1 | -0.02em |
| `text/h3` | Geist | 48px | 600 | 1.2 | -0.01em |
| `text/h4` | Geist | 32px | 600 | 1.2 | -0.01em |
| `text/h5` | Geist | 24px | 600 | 1.3 | 0 |
| `text/h6` | Geist | 20px | 600 | 1.3 | 0 |
| `text/body-lg` | Geist | 20px | 400 | 1.6 | 0 |
| `text/body` | Geist | 18px | 400 | 1.6 | 0 |
| `text/body-sm` | Geist | 16px | 400 | 1.5 | 0 |
| `text/caption` | Geist | 14px | 400 | 1.4 | 0 |
| `text/caption-sm` | Geist | 12px | 400 | 1.4 | 0.01em |
| `text/mono-lg` | Geist Mono | 16px | 400 | 1.4 | 0 |
| `text/mono` | Geist Mono | 14px | 400 | 1.4 | 0 |
| `text/mono-sm` | Geist Mono | 12px | 400 | 1.4 | 0.01em |
| `text/button` | Geist | 14px | 500 | 1.0 | 0 |
| `text/button-lg` | Geist | 16px | 500 | 1.0 | 0 |

### 1.3 Spacing Scale

Create Figma **Spacing** variables (for Auto Layout padding/gaps):

| Token | Value | Usage |
|---|---|---|
| `space/0` | 0px | — |
| `space/1` | 4px | Tight icon gaps |
| `space/2` | 8px | Inline spacing |
| `space/3` | 12px | Small padding |
| `space/4` | 16px | Default padding, card gap |
| `space/5` | 20px | Medium padding |
| `space/6` | 24px | Card padding |
| `space/8` | 32px | Section internal spacing |
| `space/10` | 40px | Large internal spacing |
| `space/12` | 48px | Section padding |
| `space/16` | 64px | Major section gaps |
| `space/20` | 80px | Page section gaps |
| `space/24` | 96px | Hero spacing |
| `space/32` | 128px | Major section breaks |
| `space/40` | 160px | Hero section padding |

### 1.4 Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow/none` | none | Flat elements |
| `shadow/sm` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle depth |
| `shadow/md` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Card default |
| `shadow/lg` | `0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)` | Card hover |
| `shadow/xl` | `0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.04)` | Modals, dropdowns |

### 1.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius/none` | 0px | Tables, data grids |
| `radius/sm` | 4px | Small tags, badges |
| `radius/md` | 8px | Buttons, inputs |
| `radius/lg` | 12px | Cards, panels |
| `radius/xl` | 16px | Large cards, modals |
| `radius/2xl` | 24px | Feature containers |
| `radius/full` | 9999px | Pills, avatars |

---

## 2. Atoms

### 2.1 Icon

**Component Name:** `Icon`

**Base:** Use Lucide icons. Do not draw custom icons.

**Properties:**
- `Size`: 12 / 16 / 20 / 24 / 32 / 40
- `Stroke`: 1.5px (locked)
- `Color`: Inherit from parent text color

**Variants:**
- Default: `currentColor`
- Primary: `color/primary`
- Success: `color/success`
- Warning: `color/warning`
- Danger: `color/danger`
- Muted: `color/slate-400`

**Figma Setup:**
- Create as Instance Swappable component
- Each size is a separate frame with the icon vector scaled proportionally
- Use `Union` not `Outline` to preserve stroke editing

**Required Icon Set (minimum):**
- Navigation: Home, LayoutDashboard, FileText, Settings, Users, Bell, Search, Menu, X
- Actions: Plus, Trash2, Edit3, Copy, Download, Upload, ChevronRight, ChevronDown, ArrowRight, ExternalLink
- Status: CheckCircle2, AlertTriangle, AlertCircle, XCircle, Info, Clock, RefreshCw
- Objects: Battery, QrCode, Shield, Lock, Globe, Factory, Truck, Recycle, FileCheck
- Communication: Mail, MessageSquare, Phone

### 2.2 Button

**Component Name:** `Button`

**Structure:**
- Auto Layout: Horizontal, Hug contents
- Gap: 8px (between icon and text)
- Padding: 10px 16px (default), 12px 24px (lg), 8px 12px (sm)
- Border Radius: `radius/md` (8px)
- Font: `text/button` or `text/button-lg`

**Variants (Figma Properties):**

| Property | Options |
|---|---|
| `Variant` | Primary / Secondary / Tertiary / Ghost / Danger |
| `Size` | Sm / Default / Lg / Icon |
| `State` | Default / Hover / Active / Disabled / Loading |
| `Icon` | None / Leading / Trailing |
| `Width` | Hug / Full |

**Variant Specs:**

**Primary:**
- Background: `color/primary`
- Text: `color/white`
- Hover: `color/primary-hover`
- Active: `color/primary` at 90% opacity + inset shadow
- Disabled: `color/slate-200` bg, `color/slate-400` text

**Secondary:**
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Text: `color/slate-900`
- Hover: `color/slate-50` bg
- Active: `color/slate-100` bg

**Tertiary:**
- Background: transparent
- Text: `color/primary`
- Hover: `color/primary-subtle` bg

**Ghost:**
- Background: transparent
- Text: `color/slate-600`
- Hover: `color/slate-100` bg

**Danger:**
- Background: `color/danger`
- Text: `color/white`
- Hover: `#DC2626`

**Loading State:**
- Replace text with `Loader2` icon (animated spin in production)
- Reduce opacity to 70%
- Disable pointer events

**Icon Button (Size = Icon):**
- Square aspect ratio
- Padding: 8px (sm), 10px (default), 12px (lg)
- Contains only icon, no text

**Figma Auto Layout:**
- Direction: Horizontal
- Align: Center / Center
- Padding: As per size
- Gap: 8px
- Resizing: Hug / Hug (default), Fill Container / Hug (full width)

### 2.3 Input

**Component Name:** `Input`

**Structure:**
- Auto Layout: Vertical (label + input container + helper text)
- Input container: Horizontal, Hug contents, padding 0

**Variants:**

| Property | Options |
|---|---|
| `Size` | Sm / Default / Lg |
| `State` | Default / Hover / Focus / Error / Disabled / Read-only |
| `Type` | Text / Password / Number / Date / Search / Textarea |
| `Width` | Hug / Full |
| `Label` | True / False |
| `Helper` | True / False |
| `Icon Leading` | True / False |
| `Icon Trailing` | True / False |
| `Required` | True / False |

**Input Container Specs:**
- Height: 36px (sm), 40px (default), 48px (lg)
- Padding: 0px 12px
- Border: 1px solid `color/slate-200`
- Border Radius: `radius/md` (8px)
- Background: `color/white`
- Font: `text/body-sm` (sm), `text/body` (default/lg)

**States:**
- **Default:** Border `color/slate-200`
- **Hover:** Border `color/slate-300`
- **Focus:** Border `color/primary`, box-shadow `0 0 0 3px color/primary-subtle`
- **Error:** Border `color/danger`, box-shadow `0 0 0 3px color/danger-subtle`
- **Disabled:** Background `color/slate-50`, text `color/slate-400`
- **Read-only:** Background `color/slate-50`, border `color/slate-200`

**Label Specs:**
- Font: `text/caption-sm`
- Weight: 500
- Color: `color/slate-700`
- Margin bottom: 6px

**Required Indicator:**
- Color: `color/danger`
- Content: `*`
- Position: After label text, no space

**Helper Text Specs:**
- Font: `text/caption-sm`
- Color: `color/slate-500` (default), `color/danger` (error state)
- Margin top: 6px

**Leading/Trailing Icon:**
- Size: 16px
- Color: `color/slate-400`
- Container: 36–48px wide, centered icon
- Trailing icon often used for: Calendar (date), Eye (password), Search (search), Chevron (select)

**Textarea Variant:**
- Min-height: 80px
- Padding: 12px
- Resize: vertical (in CSS)

**Figma Setup:**
- Main component: Vertical Auto Layout, Hug contents
- Input row: Horizontal Auto Layout, Fixed height, Fill container width
- Place label, input container, helper as separate child frames
- Use boolean properties for label, helper, leading icon, trailing icon

### 2.4 Select / Dropdown

**Component Name:** `Select`

Inherits from `Input` component structure.

**Additional Specs:**
- Trailing icon: `ChevronDown` (16px)
- Trailing icon rotates 180° when open (animated in production)
- Dropdown panel: Separate component `Select/Dropdown`

**Dropdown Panel:**
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Border Radius: `radius-lg` (12px)
- Shadow: `shadow-xl`
- Padding: 4px
- Max-height: 320px
- Overflow: scroll

**Dropdown Item:**
- Height: 36px
- Padding: 0px 12px
- Border Radius: `radius-sm` (4px)
- Hover: `color/slate-50`
- Selected: `color/primary-subtle` + `Check` icon (16px, `color/primary`)
- Disabled: `color/slate-300` text

**Figma Setup:**
- Select component: Boolean `Open` to show/hide dropdown
- Dropdown: Instance of `Select/Dropdown`
- Dropdown item: Reusable component with `Selected` boolean

### 2.5 Checkbox

**Component Name:** `Checkbox`

**Structure:**
- Horizontal Auto Layout
- Gap: 10px
- Checkbox box + Label text

**Checkbox Box:**
- Size: 16px × 16px
- Border: 1.5px solid `color/slate-300`
- Border Radius: `radius-sm` (4px)
- Background: `color/white`

**States:**

| State | Box Style | Icon |
|---|---|---|
| Unchecked | Border `color/slate-300`, bg `color/white` | None |
| Hover (unchecked) | Border `color/slate-400` | None |
| Checked | Border `color/primary`, bg `color/primary` | `Check` (12px, white) |
| Indeterminate | Border `color/primary`, bg `color/primary` | `Minus` (12px, white) |
| Disabled (unchecked) | Border `color/slate-200`, bg `color/slate-50` | None |
| Disabled (checked) | Border `color/slate-300`, bg `color/slate-200` | `Check` (12px, `color/slate-400`) |
| Error | Border `color/danger` | None |

**Label:**
- Font: `text/body-sm`
- Color: `color/slate-900`
- Disabled: `color/slate-400`

**Figma Properties:**
- `State`: Unchecked / Checked / Indeterminate
- `Disabled`: True / False
- `Error`: True / False
- `Label`: True / False

### 2.6 Radio

**Component Name:** `Radio`

**Structure:** Same as Checkbox but circular.

**Radio Circle:**
- Size: 16px × 16px
- Border: 1.5px solid `color/slate-300`
- Border Radius: `radius/full`

**States:**

| State | Circle Style | Inner Dot |
|---|---|---|
| Unchecked | Border `color/slate-300`, bg `color/white` | None |
| Checked | Border `color/primary`, bg `color/white` | 8px circle, `color/primary` |
| Disabled (unchecked) | Border `color/slate-200`, bg `color/slate-50` | None |
| Disabled (checked) | Border `color/slate-300`, bg `color/white` | 8px circle, `color/slate-300` |

**Figma Properties:**
- `State`: Unchecked / Checked
- `Disabled`: True / False
- `Label`: True / False

### 2.7 Switch / Toggle

**Component Name:** `Switch`

**Structure:**
- Track: 40px × 22px
- Border Radius: `radius/full`
- Thumb: 18px × 18px circle

**States:**

| State | Track | Thumb |
|---|---|---|
| Off | `color/slate-200` | `color/white`, positioned left (2px padding) |
| On | `color/primary` | `color/white`, positioned right (2px padding) |
| Disabled Off | `color/slate-100` | `color/slate-50` |
| Disabled On | `color/primary` at 50% opacity | `color/white` at 70% opacity |

**Figma Properties:**
- `State`: On / Off
- `Disabled`: True / False
- `Label`: True / False
- `Label Position`: Left / Right

### 2.8 Badge / Tag

**Component Name:** `Badge`

**Structure:**
- Horizontal Auto Layout
- Padding: 4px 10px (sm), 6px 12px (default)
- Border Radius: `radius-full` (pill) or `radius-sm` (square)
- Gap: 4px (if icon present)

**Variants:**

| Property | Options |
|---|---|
| `Variant` | Default / Primary / Success / Warning / Danger / Info |
| `Style` | Solid / Subtle / Outline |
| `Size` | Sm / Default |
| `Icon` | None / Leading / Trailing |
| `Dismissible` | True / False |

**Color Matrix:**

| Variant | Solid BG | Solid Text | Subtle BG | Subtle Text | Outline Border | Outline Text |
|---|---|---|---|---|---|---|
| Default | `color/slate-900` | `color/white` | `color/slate-100` | `color/slate-700` | `color/slate-200` | `color/slate-700` |
| Primary | `color/primary` | `color/white` | `color/primary-subtle` | `color/primary` | `color/primary` at 30% | `color/primary` |
| Success | `color/success` | `color/white` | `color/success-subtle` | `color/success` | `color/success` at 30% | `color/success` |
| Warning | `color/warning` | `color/white` | `color/warning-subtle` | `color/warning` | `color/warning` at 30% | `color/warning` |
| Danger | `color/danger` | `color/white` | `color/danger-subtle` | `color/danger` | `color/danger` at 30% | `color/danger` |
| Info | `color/info` | `color/white` | `color/info-subtle` | `color/info` | `color/info` at 30% | `color/info` |

**Dismissible:**
- X icon (14px) on right
- Hover: text color darkens

**Figma Setup:**
- Use component properties for all variants
- Icon is instance-swappable
- Dismissible adds boolean + X icon instance

### 2.9 Avatar

**Component Name:** `Avatar`

**Variants:**

| Property | Options |
|---|---|
| `Size` | Xs (24px) / Sm (32px) / Default (40px) / Lg (48px) / Xl (64px) / 2xl (80px) |
| `Type` | Image / Initials / Icon |
| `Shape` | Circle / Square |
| `Status` | None / Online / Offline / Busy / Away |
| `Border` | True / False |

**Specs:**
- Image: Object-fit cover
- Initials: `color/white` text, background from deterministic color hash (or `color/primary`)
- Icon: `User` icon, `color/slate-400`
- Border: 2px solid `color/white`

**Status Indicator:**
- Size: 8px (xs–default), 10px (lg+), 12px (2xl)
- Position: Bottom-right, -2px offset
- Colors: Online `#22C55E`, Offline `color/slate-300`, Busy `color/danger`, Away `color/warning`
- Border: 2px solid `color/white`

### 2.10 Tooltip

**Component Name:** `Tooltip`

**Structure:**
- Background: `color/slate-900`
- Text: `color/white`, `text/caption-sm`
- Padding: 8px 12px
- Border Radius: `radius-md` (8px)
- Max-width: 240px
- Arrow: 6px triangle, same bg color

**Positions:** Top / Bottom / Left / Right

**Figma Setup:**
- Component with arrow variant in 4 directions
- Wrap target element with Tooltip component using Auto Layout

### 2.11 Progress Bar

**Component Name:** `Progress`

**Variants:**

| Property | Options |
|---|---|
| `Size` | Sm (4px) / Default (8px) / Lg (12px) |
| `Variant` | Default / Primary / Success / Warning / Danger |
| `Label` | True / False (shows % text) |
| `Indeterminate` | True / False |

**Track:**
- Background: `color/slate-100`
- Border Radius: `radius-full`

**Fill:**
- Height: matches size
- Border Radius: `radius-full`
- Color: matches variant
- Width: controlled by percentage variable

**Indeterminate:**
- Animated sliding segment (represented in Figma as a 30% width segment positioned at 35%)

### 2.12 Spinner / Loader

**Component Name:** `Spinner`

**Variants:**

| Property | Options |
|---|---|
| `Size` | Sm (16px) / Default (24px) / Lg (32px) / Xl (48px) |
| `Color` | Primary / White / Slate |

**Specs:**
- Circular arc: 3/4 circle
- Stroke: 2px
- Border Radius: `radius-full`
- Animated rotation in production (not in Figma)

### 2.13 Divider

**Component Name:** `Divider`

**Variants:**

| Property | Options |
|---|---|
| `Orientation` | Horizontal / Vertical |
| `Style` | Solid / Dashed |
| `Label` | None / Left / Center / Right |

**Specs:**
- Color: `color/slate-200`
- Thickness: 1px (horizontal), 1px (vertical)
- Label: `text/caption-sm`, `color/slate-400`

### 2.14 Skeleton

**Component Name:** `Skeleton`

**Variants:**

| Property | Options |
|---|---|
| `Shape` | Text / Circle / Rectangle / Card |
| `Width` | Sm / Default / Lg / Full / Custom |
| `Height` | Sm / Default / Lg / Custom |

**Specs:**
- Background: `color/slate-100`
- Border Radius: `radius-sm` (text), `radius-full` (circle), `radius-lg` (card)
- Shimmer animation in production (gradient sweep)

---

## 3. Molecules

### 3.1 Alert / Banner

**Component Name:** `Alert`

**Structure:**
- Horizontal Auto Layout
- Gap: 12px
- Padding: 16px
- Border Radius: `radius-lg` (12px)
- Icon (24px) + Content + Actions

**Content:**
- Title: `text/h6` (20px, weight 600)
- Description: `text/body-sm`

**Variants:**

| Property | Options |
|---|---|
| `Variant` | Info / Success / Warning / Error |
| `Style` | Solid / Subtle / Outline |
| `Icon` | True / False |
| `Dismissible` | True / False |
| `Actions` | None / Single / Double |

**Color Matrix:**

| Variant | Solid BG | Solid Text | Subtle BG | Subtle Border | Icon |
|---|---|---|---|---|---|
| Info | `color/info` | `color/white` | `color/info-subtle` | `color/info` at 20% | `Info` icon |
| Success | `color/success` | `color/white` | `color/success-subtle` | `color/success` at 20% | `CheckCircle2` |
| Warning | `color/warning` | `color/white` | `color/warning-subtle` | `color/warning` at 20% | `AlertTriangle` |
| Error | `color/danger` | `color/white` | `color/danger-subtle` | `color/danger` at 20% | `AlertCircle` |

**Actions:**
- Text button (tertiary style) or Link style
- Position: Right side or bottom (stacked on mobile)

**Dismissible:**
- X icon (16px) top-right
- Hover: `color/slate-500`

**Figma Setup:**
- Vertical Auto Layout for content stack
- Horizontal Auto Layout for main row
- Boolean for dismiss icon
- Instance swap for action buttons

### 3.2 Toast / Notification

**Component Name:** `Toast`

**Structure:** Similar to Alert but floating.

**Specs:**
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Border Radius: `radius-lg` (12px)
- Shadow: `shadow-xl`
- Padding: 16px
- Min-width: 360px, Max-width: 480px

**Content:**
- Icon (variant-colored) + Title + Description + Close X
- Optional: Action link

**Positions:** Top-right, Top-center, Bottom-right, Bottom-center

**Figma Setup:**
- Same variants as Alert
- Add `Position` property for placement guides

### 3.3 Modal / Dialog

**Component Name:** `Modal`

**Structure:**
- Overlay: `color/black` at 50% opacity
- Panel: Centered
- Background: `color/white`
- Border Radius: `radius-xl` (16px)
- Shadow: `shadow-xl`
- Max-width: 480px (sm), 560px (default), 720px (lg), 960px (xl)
- Padding: 0 (internal sections have padding)

**Internal Sections:**
1. **Header:** 24px padding, Title (`text/h5`) + Close X icon
2. **Body:** 24px padding, scrollable if content exceeds 60vh
3. **Footer:** 24px padding, action buttons (right-aligned, gap 12px)

**Variants:**

| Property | Options |
|---|---|
| `Size` | Sm / Default / Lg / Xl / Fullscreen |
| `Header` | True / False |
| `Footer` | True / False |
| `Close Button` | True / False |

**Figma Setup:**
- Modal overlay as a frame with fill
- Panel as separate component with sections
- Use boolean properties for header/footer
- Content area: Instance swap placeholder

### 3.4 Card

**Component Name:** `Card`

**Structure:**
- Vertical Auto Layout
- Padding: 24px
- Border Radius: `radius-xl` (16px)
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Shadow: `shadow-sm`

**Sections:**
1. **Header (optional):** Title (`text/h6`) + Action icon/button
2. **Media (optional):** Image or illustration, full width, 16px top radius
3. **Body:** Content, gap 16px
4. **Footer (optional):** Actions or metadata

**Variants:**

| Property | Options |
|---|---|
| `Padding` | None / Default (24px) / Lg (32px) |
| `Shadow` | None / Sm / Md / Lg |
| `Border` | True / False |
| `Hover` | True / False (lifts 2px + shadow-lg) |
| `Header` | True / False |
| `Footer` | True / False |
| `Media` | True / False |

**Figma Setup:**
- Vertical Auto Layout, Hug contents
- Sections as separate frames with boolean visibility
- Hover variant: translateY -2px, shadow-lg

### 3.5 Table Row

**Component Name:** `Table/Row`

**Structure:**
- Horizontal Auto Layout
- Height: 48px (default), 40px (compact), 56px (relaxed)
- Padding: 0px 16px
- Border-bottom: 1px solid `color/slate-200`
- Gap: 16px between cells

**Cell Types:**
- **Text:** `text/body-sm`, left-aligned
- **Number:** `text/mono`, right-aligned
- **Badge:** Instance of `Badge` component
- **Avatar + Text:** Avatar (sm) + Name + Email below
- **Actions:** Icon buttons (Edit, Delete, More)
- **Checkbox:** First cell, 32px width

**States:**
- Default: `color/white` bg
- Hover: `color/slate-50` bg
- Selected: `color/primary-subtle` bg
- Active/Current: Left border 2px `color/primary`

**Figma Setup:**
- Horizontal Auto Layout, Fill container width
- Cells as separate frames with fixed or fill width
- Use instance swap for cell content types

### 3.6 Table Header

**Component Name:** `Table/Header`

**Structure:**
- Horizontal Auto Layout
- Height: 40px
- Padding: 0px 16px
- Background: `color/slate-50`
- Border-bottom: 1px solid `color/slate-200`

**Cell:**
- Font: `text/caption-sm`, weight 500
- Color: `color/slate-500`
- Uppercase optional

**Sortable Column:**
- Icon: `ArrowUpDown` (16px) right of text
- Active sort: Icon changes to `ArrowUp` or `ArrowDown`, text color `color/slate-900`

### 3.7 List Item

**Component Name:** `List/Item`

**Structure:**
- Horizontal Auto Layout
- Height: 48px
- Padding: 0px 16px
- Gap: 12px
- Border-bottom: 1px solid `color/slate-100`

**Content Patterns:**
- Icon (24px) + Title + Description (below title) + Meta (right)
- Avatar + Title + Meta
- Checkbox + Title + Meta

**States:** Default, Hover (`color/slate-50`), Active (`color/primary-subtle`)

### 3.8 Navigation Item

**Component Name:** `Nav/Item`

**Structure:**
- Horizontal Auto Layout
- Height: 40px
- Padding: 0px 12px
- Gap: 12px
- Border Radius: `radius-md` (8px)

**Content:** Icon (20px) + Label (`text/body-sm`)

**States:**
- Default: Text `color/slate-400`, Icon `color/slate-400`
- Hover: Text `color/slate-200`, Icon `color/slate-200`, bg `color/white` at 5%
- Active: Text `color/white`, Icon `color/white`, bg `color/white` at 10%

**Badge:**
- Small pill right-aligned
- Number or dot

### 3.9 Breadcrumb

**Component Name:** `Breadcrumb`

**Structure:**
- Horizontal Auto Layout
- Gap: 8px
- Items separated by `ChevronRight` (14px, `color/slate-400`)

**Item:**
- Default: `text/body-sm`, `color/slate-500`
- Hover: `color/slate-700`, underline
- Current: `text/body-sm`, `color/slate-900`, no link

### 3.10 Pagination

**Component Name:** `Pagination`

**Structure:**
- Horizontal Auto Layout
- Gap: 4px

**Items:**
- Previous button (icon `ChevronLeft`)
- Page numbers (1, 2, 3, ..., 10)
- Next button (icon `ChevronRight`)

**Page Button:**
- Size: 36px × 36px
- Border Radius: `radius-md`
- Default: `color/white`, text `color/slate-700`
- Hover: `color/slate-50`
- Active: `color/white`, bg `color/primary`, text `color/white`
- Disabled: `color/slate-300`

### 3.11 Stepper / Wizard Step

**Component Name:** `Stepper/Step`

**Structure:**
- Horizontal item with: Number circle / Icon → Label → Connector line

**Step Circle:**
- Size: 32px
- Border Radius: `radius-full`

**States:**
- Pending: Border `color/slate-300`, text `color/slate-400`, bg `color/white`
- Current: Border `color/primary`, text `color/primary`, bg `color/primary-subtle`
- Completed: Border `color/primary`, bg `color/primary`, icon `Check` white

**Connector:**
- Height: 2px
- Pending: `color/slate-200`
- Completed: `color/primary`

**Label:**
- Below circle, centered
- `text/caption-sm`

### 3.12 Empty State

**Component Name:** `EmptyState`

**Structure:**
- Vertical Auto Layout, center-aligned
- Gap: 16px
- Padding: 48px 24px

**Elements:**
1. Icon (48px) or Illustration (120px)
2. Title: `text/h5`, `color/slate-900`
3. Description: `text/body-sm`, `color/slate-500`, max-width 400px
4. Action: Button (optional)

**Variants:**
- `Type`: No data / No results / No access / Error / Coming soon
- `Size`: Sm / Default / Lg

### 3.13 File Upload

**Component Name:** `FileUpload`

**Structure:**
- Vertical Auto Layout
- Border: 2px dashed `color/slate-300`
- Border Radius: `radius-xl`
- Background: `color/slate-50`
- Padding: 32px
- Center-aligned content

**Content:**
- Upload icon (32px, `color/slate-400`)
- Title: "Click to upload or drag and drop"
- Subtitle: File types, max size

**States:**
- Default: Dashed border
- Hover: Border `color/primary`, bg `color/primary-subtle`
- Active (dragging): Border `color/primary`, bg `color/primary-subtle`
- Error: Border `color/danger`

**File List (below dropzone):**
- Instance of `FileItem` component

### 3.14 File Item

**Component Name:** `FileItem`

**Structure:**
- Horizontal Auto Layout
- Gap: 12px
- Padding: 12px
- Border Radius: `radius-lg`
- Background: `color/white`
- Border: 1px solid `color/slate-200`

**Content:**
- File icon (24px)
- File name: `text/body-sm`
- File size: `text/caption-sm`, `color/slate-400`
- Progress bar (if uploading)
- Delete action (X icon)

**States:** Default, Uploading (progress bar), Error, Success

---

## 4. Organisms

### 4.1 Navigation Bar

**Component Name:** `Nav/Navbar`

**Structure:**
- Horizontal Auto Layout
- Height: 72px
- Padding: 0px 24px (desktop), 0px 16px (mobile)
- Background: `color/white` with `backdrop-blur-md`
- Border-bottom: 1px solid `color/slate-200` (when scrolled)
- Position: Fixed top

**Content:**
- Left: Logo (Anviora wordmark, height 28px)
- Center: Nav items (Products, Industries, Pricing, Resources) — hidden on mobile
- Right: CTA "Book Demo" + Mobile menu icon (hamburger)

**Scroll Behavior:**
- Top: No shadow, no border
- Scrolled (>20px): `shadow-sm`, border visible

**Figma Setup:**
- Create "Scrolled" boolean variant
- Nav items as instances of `Nav/Link`
- Mobile: Show hamburger, hide center nav

### 4.2 Sidebar Navigation

**Component Name:** `Nav/Sidebar`

**Structure:**
- Vertical Auto Layout
- Width: 256px (expanded), 72px (collapsed)
- Background: `color/black` (`#09090B`)
- Padding: 16px 12px
- Gap: 4px between items

**Sections:**
1. **Logo:** Top, centered, 40px height
2. **Main Nav:** Dashboard, Batches, Passports, Analytics, Suppliers
3. **Secondary Nav:** Settings, Help
4. **User Profile:** Bottom, Avatar + Name + Dropdown

**Nav Item:** Instance of `Nav/Item`

**Collapsed State:**
- Only icons visible
- Labels hidden
- Tooltips on hover

**Figma Setup:**
- `State`: Expanded / Collapsed
- Use boolean for each section visibility
- Instance swap for nav items

### 4.3 Data Table

**Component Name:** `Table`

**Structure:**
- Vertical Auto Layout
- Header: `Table/Header` instance
- Rows: Multiple `Table/Row` instances
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Border Radius: `radius-xl` (16px)

**Features:**
- Sortable columns
- Selectable rows (checkbox)
- Row actions (hover-reveal)
- Pagination below
- Empty state (instance of `EmptyState`)

**States:**
- Default
- Loading (skeleton rows)
- Empty
- Error

**Figma Setup:**
- Header and rows as separate components
- Table wraps them with vertical Auto Layout
- Add "Loading" boolean to show skeleton

### 4.4 Stats Card

**Component Name:** `Card/Stats`

**Structure:** Instance of `Card` with specific content.

**Content:**
- Label: `text/caption-sm`, `color/slate-500`
- Value: `text/h3` or `text/h4`, `color/slate-900`
- Change indicator: Badge (success/danger) + percentage
- Sparkline chart (optional)

**Layout:**
- Vertical stack
- Gap: 8px

**Figma Setup:**
- Inherit from `Card` component
- Add `Trend` property: Up / Down / Neutral
- Add `Chart` boolean

### 4.5 Chart Card

**Component Name:** `Card/Chart`

**Structure:** Instance of `Card`.

**Content:**
- Header: Title + Time range selector + Export action
- Chart area: Placeholder for chart (line, bar, area, donut)
- Legend: Below chart

**Chart Placeholders:**
- Line chart: Smooth curve, `color/primary` stroke, `color/primary-subtle` fill
- Bar chart: `color/primary` bars, `radius-sm` on top corners
- Area chart: Gradient fill from `color/primary` to transparent
- Donut chart: 2–4 segments, center label

**Figma Setup:**
- Use vector shapes for placeholder charts
- Add `Type` property: Line / Bar / Area / Donut
- Add `Data` variant: With data / Empty

### 4.6 Filter Bar

**Component Name:** `FilterBar`

**Structure:**
- Horizontal Auto Layout
- Gap: 12px
- Padding: 16px 0px

**Content:**
- Search input (with `Search` icon)
- Filter dropdowns (Status, Date, Region, etc.)
- Active filter pills (Badge with dismiss)
- Clear all link
- View toggle (List / Grid)

### 4.7 Page Header

**Component Name:** `PageHeader`

**Structure:**
- Vertical Auto Layout
- Gap: 16px
- Padding: 0px 0px 24px 0px
- Border-bottom: 1px solid `color/slate-200`

**Content:**
- Breadcrumb: Instance of `Breadcrumb`
- Title: `text/h3`
- Description: `text/body`, `color/slate-500`
- Actions: Buttons (right-aligned)

**Variants:**
- `Size`: Default (with description) / Compact (title + actions only)
- `Actions`: None / Single / Multiple

### 4.8 Form Section

**Component Name:** `Form/Section`

**Structure:**
- Vertical Auto Layout
- Gap: 24px

**Content:**
- Section title: `text/h5`
- Section description: `text/body-sm`, `color/slate-500`
- Fields: Grid or vertical stack of inputs

**Layout:**
- 1 column (mobile), 2 columns (tablet+), 3 columns (desktop)
- Field gap: 16px vertical, 24px horizontal

### 4.9 Batch Card

**Component Name:** `Card/Batch`

**Structure:** Instance of `Card`.

**Content:**
- Header: Batch ID (`text/mono`) + Status badge
- Title: Battery model name
- Meta: Quantity, Date, Region
- Compliance score: Progress bar 0–100%
- Footer: Actions (View, Edit, Generate Passport)

**States:**
- Default
- Hover (lift)
- Selected (border `color/primary`)

### 4.10 Passport Viewer

**Component Name:** `Passport/Viewer`

**Structure:**
- Vertical Auto Layout
- Max-width: 800px
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Border Radius: `radius-xl`

**Sections:**
1. **Header:** QR code + Passport ID + Issue date + Status
2. **Product Info:** Model, Chemistry, Capacity, Voltage
3. **Manufacturer:** Name, Address, BIS number
4. **Compliance:** Checklist with checkmarks
5. **Carbon Footprint:** Value + Performance class badge
6. **Blockchain:** Anchor status + Verify link
7. **Footer:** Print / Download / Share actions

**Public vs. Restricted:**
- Public: Shows Tier 1 data only
- Restricted: Shows all tiers with auth

---

## 5. Marketing Components

### 5.1 Hero Section

**Component Name:** `Marketing/Hero`

**Structure:**
- Full viewport height (100vh)
- Background: `color/black` (`#09090B`) or gradient
- Content centered or left-aligned (55%)

**Content:**
- Eyebrow text: `text/caption-sm`, uppercase, `color/primary`, tracking wide
- Headline: `text/h1` or `text/h2`, `color/white`
- Subheadline: `text/body-lg`, `color/slate-400`
- CTAs: Primary button + Secondary button (gap 16px)
- Trust bar: Logos + "Trusted by X exporters"

**Right side (if 2-column):**
- Product screenshot or stylized render
- Floating cards (passport, QR, certificate)

**Figma Setup:**
- Create desktop, tablet, mobile variants
- Use `text/h1` for desktop, `text/h2` for mobile
- Background: Solid or gradient instance

### 5.2 Feature Grid (Bento)

**Component Name:** `Marketing/FeatureGrid`

**Structure:**
- CSS Grid: 3 columns desktop, 2 tablet, 1 mobile
- Gap: 24px

**Cards:**
- Large cards: Span 2 columns
- Small cards: 1 column
- Border Radius: `radius-xl`
- Padding: 32px

**Content per card:**
- Icon (32px, `color/primary`)
- Title: `text/h6`
- Description: `text/body-sm`
- Link: "Learn more →"

### 5.3 Logo Cloud

**Component Name:** `Marketing/LogoCloud`

**Structure:**
- Horizontal Auto Layout or Grid
- Gap: 32px
- Grayscale logos
- Opacity: 50%, hover: 100%

### 5.4 Testimonial Card

**Component Name:** `Marketing/Testimonial`

**Structure:**
- Vertical Auto Layout
- Border Radius: `radius-xl`
- Padding: 32px
- Background: `color/slate-50`
- Left border: 4px `color/primary`

**Content:**
- Quote: `text/body-lg`, italic
- Author: Avatar (sm) + Name + Title + Company

### 5.5 Pricing Card

**Component Name:** `Marketing/PricingCard`

**Structure:**
- Vertical Auto Layout
- Border Radius: `radius-xl`
- Padding: 32px
- Border: 1px solid `color/slate-200`

**Content:**
- Plan name: `text/caption-sm`, uppercase, `color/primary`
- Price: `text/h2` + "/month"
- Description: `text/body-sm`
- Feature list: Check icon + text
- CTA button: Full width

**Highlight variant (Growth):**
- Top border: 4px `color/primary`
- Badge: "Most Popular"
- Slight scale: 1.02

### 5.6 FAQ Item

**Component Name:** `Marketing/FAQItem`

**Structure:**
- Vertical Auto Layout
- Border-bottom: 1px solid `color/slate-200`
- Padding: 20px 0px

**Content:**
- Question: `text/body`, weight 500, `color/slate-900`
- Toggle icon: `Plus` / `Minus` (right-aligned)
- Answer: `text/body`, `color/slate-500`, padding-top 12px

**States:**
- Collapsed: Answer hidden, Plus icon
- Expanded: Answer visible, Minus icon

### 5.7 CTA Section

**Component Name:** `Marketing/CTA`

**Structure:**
- Full-width section
- Background: `color/primary` or `color/slate-900`
- Padding: 96px 24px
- Center-aligned content

**Content:**
- Headline: `text/h3`, `color/white`
- Subheadline: `text/body-lg`, `color/primary-subtle`
- CTAs: 2 buttons (primary light + ghost)

---

## 6. Dashboard Components

### 6.1 Dashboard Shell

**Component Name:** `Dashboard/Shell`

**Structure:**
- Full viewport
- Left: Sidebar (256px)
- Right: Content area (fill)
  - Top: Page header area
  - Main: Scrollable content

**States:**
- Sidebar expanded
- Sidebar collapsed
- Mobile (sidebar becomes drawer)

### 6.2 Stat Grid

**Component Name:** `Dashboard/StatGrid`

**Structure:**
- Grid: 4 columns desktop, 2 tablet, 1 mobile
- Gap: 24px

**Items:** Instance of `Card/Stats`

### 6.3 Recent Activity Feed

**Component Name:** `Dashboard/ActivityFeed`

**Structure:** Instance of `Card`.

**Content:**
- Title: "Recent Activity"
- List: Timestamp + Icon + Description + Link
- Scrollable, max-height 400px

### 6.4 Alert Bell / Notifications

**Component Name:** `Dashboard/AlertBell`

**Structure:**
- Trigger: Bell icon button with badge
- Dropdown: Panel with notification list

**Panel:**
- Width: 384px
- Header: "Notifications" + "Mark all read"
- List: Alert items with severity color
- Footer: "View all"

**Alert Item:**
- Icon (severity-colored, 20px)
- Title: `text/body-sm`, weight 500
- Description: `text/caption-sm`
- Time: `text/caption-sm`, `color/slate-400`
- Unread: Left border 2px `color/primary`

### 6.5 Command Palette

**Component Name:** `Dashboard/CommandPalette`

**Structure:**
- Modal overlay
- Centered panel: 640px wide
- Background: `color/white`
- Border Radius: `radius-xl`
- Shadow: `shadow-xl`

**Content:**
- Search input: Full width, `Search` icon, placeholder "Type a command or search..."
- Sections: Recent, Navigation, Actions
- Items: Icon + Label + Shortcut
- Selected: `color/primary-subtle` bg

**Figma Setup:**
- Similar to Modal but specific styling
- Add keyboard shortcut badges (e.g., "⌘K")

### 6.6 Onboarding Step

**Component Name:** `Onboarding/Step`

**Structure:**
- Full-screen or modal
- Progress indicator (Stepper)
- Content area
- Navigation: Back + Next/Finish

**Content:**
- Illustration (optional)
- Title: `text/h4`
- Description: `text/body`
- Form fields or interactive element

---

## 7. Responsive Behavior

### 7.1 Breakpoints

Create Figma frames at these widths:

| Name | Width | Usage |
|---|---|---|
| Mobile | 375px | Primary mobile reference |
| Mobile Lg | 428px | Large phones |
| Tablet | 768px | iPad Mini, portrait |
| Laptop | 1024px | Small laptops, iPad landscape |
| Desktop | 1440px | Primary desktop reference |
| Wide | 1920px | Large monitors |

### 7.2 Responsive Rules

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navbar | Hamburger menu | Hamburger menu | Full nav |
| Sidebar | Drawer overlay | Collapsed icon-only | Expanded 256px |
| Hero | Stacked, full-width | Stacked or 2-col | 55/45 split |
| Feature Grid | 1 column | 2 columns | 3 columns |
| Stats Grid | 1 column | 2 columns | 4 columns |
| Data Table | Horizontal scroll | Full table | Full table |
| Cards | Full width | 2 per row | 3–4 per row |
| Forms | 1 column | 2 columns | 2–3 columns |
| Page Header | Stacked | Inline | Inline |

---

## 8. Dark Mode

### 8.1 Mapping

| Light Token | Dark Token |
|---|---|
| `color/white` (bg) | `color/dark-bg` |
| `color/slate-50` | `color/dark-surface` |
| `color/slate-100` | `color/dark-border` |
| `color/slate-200` | `color/dark-border` |
| `color/slate-400` | `color/dark-text-secondary` |
| `color/slate-500` | `color/dark-text-secondary` |
| `color/slate-700` | `color/dark-text` |
| `color/slate-900` | `color/dark-text` |

### 8.2 Exceptions

- Primary accent (`#4F46E5`): Stays the same or slightly brighter
- Success/Warning/Danger/Info: Maintain hue, adjust saturation/brightness for dark bg
- Shadows: Use `rgba(0,0,0,0.3)` instead of `rgba(0,0,0,0.04)`

### 8.3 Figma Setup

- Create a "Dark" variant for every component
- Use Figma variables to swap color libraries
- Or duplicate components with dark color overrides

---

## 9. Build Order & Priority

### Phase 1: Tokens & Primitives (Week 1)

- [ ] Color styles (all primitives + semantic)
- [ ] Text styles (all 18 styles)
- [ ] Spacing variables
- [ ] Shadow styles
- [ ] Radius variables
- [ ] Icon set (40+ Lucide icons)

### Phase 2: Atoms (Week 2)

- [ ] Button (all variants)
- [ ] Input (all types)
- [ ] Select / Dropdown
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Badge
- [ ] Avatar
- [ ] Tooltip
- [ ] Progress
- [ ] Spinner
- [ ] Divider
- [ ] Skeleton

### Phase 3: Molecules (Week 3)

- [ ] Alert / Banner
- [ ] Toast
- [ ] Modal / Dialog
- [ ] Card
- [ ] Table Row
- [ ] Table Header
- [ ] List Item
- [ ] Navigation Item
- [ ] Breadcrumb
- [ ] Pagination
- [ ] Stepper Step
- [ ] Empty State
- [ ] File Upload
- [ ] File Item

### Phase 4: Organisms (Week 4)

- [ ] Navigation Bar
- [ ] Sidebar Navigation
- [ ] Data Table
- [ ] Stats Card
- [ ] Chart Card
- [ ] Filter Bar
- [ ] Page Header
- [ ] Form Section
- [ ] Batch Card
- [ ] Passport Viewer

### Phase 5: Marketing Components (Week 5)

- [ ] Hero Section
- [ ] Feature Grid (Bento)
- [ ] Logo Cloud
- [ ] Testimonial Card
- [ ] Pricing Card
- [ ] FAQ Item
- [ ] CTA Section

### Phase 6: Dashboard Components (Week 6)

- [ ] Dashboard Shell
- [ ] Stat Grid
- [ ] Activity Feed
- [ ] Alert Bell
- [ ] Command Palette
- [ ] Onboarding Step

### Phase 7: Dark Mode & Responsive (Week 7)

- [ ] Dark mode variants for all components
- [ ] Responsive variants (mobile/tablet/desktop)
- [ ] Final review and consistency audit

---

## Appendix: Figma Best Practices

### Naming Convention

```
Category / Component / Variant / State

Examples:
- Button / Primary / Default
- Button / Primary / Hover
- Input / Text / Focus
- Card / Stats / With Chart
- Marketing / Hero / Dark / Desktop
```

### Component Properties Checklist

For every component, ask:
- [ ] Is this a boolean property (true/false)?
- [ ] Is this an instance swap (icon, image, nested component)?
- [ ] Is this a text property (editable label)?
- [ ] Is this a variant property (size, state, style)?
- [ ] Are all properties named clearly and consistently?

### Auto Layout Checklist

For every component, verify:
- [ ] Direction: Horizontal or Vertical?
- [ ] Distribution: Packed or Space Between?
- [ ] Alignment: Top, Center, Bottom, Left, Right?
- [ ] Resizing: Hug, Fixed, or Fill Container?
- [ ] Padding: Top, Right, Bottom, Left?
- [ ] Gap: Between items?

### Documentation in Figma

Add description text to each component page:
- Component purpose
- When to use / When NOT to use
- Related components
- Accessibility notes

---

*End of checklist. Questions? Reach out on `#design-anviora`.*
