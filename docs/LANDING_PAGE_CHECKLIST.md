# ExportReady Landing Page — Build Checklist

**Status:** Ready to build  
**Framework:** Next.js 15 + Tailwind v4 + Framer Motion  
**File:** `apps/marketing-web/app/page.tsx` (+ sections as components)

> Work through this checklist top to bottom. Each section has:
> - ✅ Checkbox (check it off as you build)
> - 📋 Exact copy to use (copy-paste ready)
> - 🎨 Design specs (colors, spacing, typography)
> - 🔧 Technical notes (components, animations, files to create)

---

## Phase 0: Setup & Global Styles

### 0.1 Install Dependencies
```bash
cd apps/marketing-web
npm install framer-motion lucide-react
```

### 0.2 Illustrations Already Created
**Location:** `apps/marketing-web/components/illustrations/`

All premium SVG illustrations are already built for you:

| Illustration | File | Used In |
|-------------|------|---------|
| **Hero Globe** | `hero-illustration.tsx` | Hero section — animated globe with India→EU connection, floating docs, QR code, shield |
| **Regulations Stack** | `problem-illustrations.tsx` | Problem card 1 — stack of documents with warning icon |
| **Port Delay Ship** | `problem-illustrations.tsx` | Problem card 2 — container ship with stop sign, clock |
| **Draining Money** | `problem-illustrations.tsx` | Problem card 3 — coins with down arrow, wallet |
| **Upload Cloud** | `how-it-works-illustrations.tsx` | Step 1 — cloud upload with floating documents |
| **AI Brain** | `how-it-works-illustrations.tsx` | Step 2 — circuit brain with sparkles |
| **Passport + Phone** | `how-it-works-illustrations.tsx` | Step 3 — passport doc with phone scan animation |
| **Ship Package** | `how-it-works-illustrations.tsx` | Step 4 — India→EU route with flying package |
| **Batch Stack** | `feature-illustrations.tsx` | Bento card — stacked containers with checkmark |
| **AI Document** | `feature-illustrations.tsx` | Bento card — document with AI badge |
| **Blockchain Chain** | `feature-illustrations.tsx` | Bento card — chain links with lock |
| **Alert Bell** | `feature-illustrations.tsx` | Bento card — warning triangle with pulse ring |
| **Team Network** | `feature-illustrations.tsx` | Bento card — connected people icons |
| **Audit Checklist** | `feature-illustrations.tsx` | Bento card — document with checkmarks + PASS stamp |
| **QR Scanner** | `feature-illustrations.tsx` | Bento card — QR code with scan frame animation |
| **Grid Pattern** | `background-pattern.tsx` | Background texture for sections |
| **Floating Orbs** | `background-pattern.tsx` | Ambient gradient orbs |
| **Dot Grid** | `background-pattern.tsx` | Subtle dot pattern overlay |

**All illustrations are:**
- ✅ Pure SVG (crisp at any resolution)
- ✅ Animated with Framer Motion (floating, pulsing, drawing)
- ✅ Tiny file size (< 10KB each)
- ✅ Match your color palette (navy, emerald, amber)
- ✅ Dark mode compatible

### 0.2 Global CSS Variables
**File:** `apps/marketing-web/app/globals.css`

Add these CSS custom properties to your existing globals:
```css
:root {
  --navy: #0F172A;
  --navy-light: #1E293B;
  --emerald: #10B981;
  --emerald-light: #D1FAE5;
  --amber: #F59E0B;
  --coral: #F87171;
  --off-white: #FAFBFC;
  --radius-card: 12px;
  --radius-button: 8px;
  --radius-large: 24px;
}
```

### 0.3 Fonts
**File:** `apps/marketing-web/app/layout.tsx`

Use Inter from next/font:
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
```

Apply to body: `className={`${inter.variable} font-sans`}`

### 0.4 Metadata & SEO
**File:** `apps/marketing-web/app/layout.tsx`

```tsx
export const metadata = {
  title: 'ExportReady | AI-Powered Compliance for Indian Battery & Textile Exporters',
  description: 'Automate EU Battery Passport generation, certificate tracking, and QR-code verification. Built for Indian manufacturers exporting to Europe.',
  openGraph: {
    title: 'ExportReady — Ship to Europe Without the Compliance Nightmare',
    description: 'AI-powered Battery Passports, QR-code verification, and automated compliance tracking.',
    type: 'website',
  },
}
```

- [ ] 0.1 Dependencies installed
- [ ] 0.2 Illustrations reviewed
- [ ] 0.3 CSS variables added
- [ ] 0.4 Fonts configured
- [ ] 0.5 Metadata set

---

## Phase 1: Navigation Bar

**File to create:** `apps/marketing-web/components/navbar.tsx`

### Design Specs
- Position: `fixed top-0 w-full z-50`
- Background: `bg-white/80 backdrop-blur-md border-b border-gray-100`
- Height: `h-16` (64px)
- Max width: `max-w-7xl mx-auto px-6`

### Layout
- Left: Logo "ExportReady" (text logo, font-bold text-xl, text-navy)
- Center: Nav links (hidden on mobile, flex gap-8 on desktop)
- Right: CTA button + mobile menu icon

### Copy — Nav Links
```
Features
Pricing
Compliance
Blog
```

### Copy — CTA Button
```
[Get Started]
```
Button style: `bg-[var(--navy)] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[var(--navy-light)] transition-colors`

### Mobile Menu
- Hamburger icon (Lucide: `Menu`, `X`)
- Full-screen overlay on click
- Links stacked vertically, centered

### Scroll Behavior
- On scroll > 20px: Add subtle shadow `shadow-sm`
- Smooth transition

- [ ] 1.1 Navbar component created
- [ ] 1.2 Logo positioned left
- [ ] 1.3 Nav links centered (desktop)
- [ ] 1.4 CTA button right
- [ ] 1.5 Mobile hamburger menu works
- [ ] 1.6 Scroll shadow effect

---

## Phase 2: Hero Section

**File to create:** `apps/marketing-web/sections/hero.tsx`

### Design Specs
- Height: `min-h-screen` (100vh)
- Background: Gradient `from-slate-50 via-white to-emerald-50/30`
- Padding: `pt-32 pb-20 px-6` (accounts for fixed navbar)
- Max width: `max-w-7xl mx-auto`

### Layout
- Desktop: 2-column grid (55% text / 45% visual)
- Mobile: Single column, text first, visual below

### Copy — Headline
```
Ship to Europe Without the Compliance Nightmare
```
Style: `text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--navy)] leading-tight tracking-tight`

### Copy — Subheadline
```
AI-powered Battery Passports, QR-code verification, and automated compliance tracking — built specifically for Indian battery and textile exporters.
```
Style: `mt-6 text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed`

### Copy — CTAs
```
[Primary] Request Demo
[Secondary] Watch How It Works (2 min)
```

**Primary button style:**
`bg-[var(--emerald)] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all hover:scale-[1.02]`

**Secondary button style:**
`flex items-center gap-2 text-[var(--navy)] font-medium hover:text-[var(--emerald)] transition-colors`
Secondary has play icon (Lucide: `PlayCircle`) before text.

### Copy — Trust Bar (below CTAs, small text)
```
Trusted by 150+ Indian exporters
```
Style: `mt-12 flex items-center gap-4 text-sm text-gray-500`

Add 5-6 company logo placeholders (gray silhouettes) after this text.

### Visual — Right Side
Import and use the Hero Illustration:
```tsx
import { HeroIllustration } from "@/components/illustrations";
```

Place it in the right column:
```tsx
<motion.div
  className="relative"
  style={{ perspective: "1000px" }}
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, delay: 0.3 }}
>
  <div style={{ transform: "rotateY(-5deg) rotateX(5deg)" }}>
    <HeroIllustration />
  </div>
</motion.div>
```

The illustration includes:
- Animated globe with India → EU dotted connection line
- Floating document cards (certificates)
- QR code card
- Shield badge with checkmark
- Pulsing glow orbs
- Traveling dot animation along the route

### Animation
- Headline: Fade in + translateY from 30px, duration 0.6s
- Subheadline: Fade in + translateY, delay 0.15s
- CTAs: Fade in + translateY, delay 0.3s
- Trust bar: Fade in, delay 0.45s
- Visual: Fade in + translateX from 50px, delay 0.3s

Use Framer Motion:
```tsx
<motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
```

- [ ] 2.1 Hero section file created
- [ ] 2.2 Headline styled and animated
- [ ] 2.3 Subheadline styled and animated
- [ ] 2.4 Primary CTA button styled
- [ ] 2.5 Secondary CTA with play icon
- [ ] 2.6 Trust bar with logo placeholders
- [ ] 2.7 HeroIllustration component rendered
- [ ] 2.8 All entrance animations working

---

## Phase 3: Problem Section (Pain Amplification)

**File to create:** `apps/marketing-web/sections/problem.tsx`

### Design Specs
- Background: `bg-[var(--off-white)]`
- Padding: `py-24 px-6`
- Max width: `max-w-7xl mx-auto`

### Layout
- Top: Centered heading
- Below: 3-column grid (1 column on mobile)
- Gap: `gap-8`

### Copy — Section Heading
```
Exporting to Europe Shouldn't Feel Impossible
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)] mb-16`

### Copy — 3 Pain Points

**Card 1:**
- Illustration: `<RegulationsIllustration />` (48×48px container)
- Title: `200-Page Regulations`
- Body: `EU Battery Regulation, India BWM Rules, REACH, BIS — every market has its own 200-page rulebook. Reading them all is a full-time job.`

**Card 2:**
- Illustration: `<PortDelayIllustration />` (48×48px container)
- Title: `Shipments Held at Port`
- Body: `A missing carbon footprint declaration or expired BIS certificate means your shipment sits at Rotterdam for 3 weeks. Every day of delay costs ₹50,000+.`

**Card 3:**
- Illustration: `<CostIllustration />` (48×48px container)
- Title: `Consultant Costs Add Up`
- Body: `Compliance consultants charge ₹2-5L per audit. For a mid-size exporter doing 4 audits a year, that's ₹20L — enough to hire 2 engineers.`

### Card Style
- Background: `bg-white rounded-xl p-8 shadow-sm border border-gray-100`
- Hover: `hover:shadow-md hover:-translate-y-1 transition-all duration-300`
- Icon container: `w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-6`

### Transition to Solution
Below the cards, centered:
```
It doesn't have to be this hard.
```
Style: `text-center text-xl text-[var(--emerald)] font-medium mt-12`

### Animation
- Cards stagger in on scroll: each card fades in + translateY(30px), 0.15s stagger

- [ ] 3.1 Problem section file created
- [ ] 3.2 Section heading centered
- [ ] 3.3 Card 1 — Regulations (with RegulationsIllustration)
- [ ] 3.4 Card 2 — Shipments held (with PortDelayIllustration)
- [ ] 3.5 Card 3 — Consultant costs (with CostIllustration)
- [ ] 3.6 Card hover effects
- [ ] 3.7 Transition line
- [ ] 3.8 Scroll-triggered stagger animation

---

## Phase 4: Solution Section (Product Intro)

**File to create:** `apps/marketing-web/sections/solution.tsx`

### Design Specs
- Background: `bg-white`
- Padding: `py-24 px-6`
- Max width: `max-w-7xl mx-auto`

### Layout
- Top: Centered heading + subheading
- Middle: Large product visual/video placeholder
- Bottom: 3 value prop cards (horizontal on desktop)

### Copy — Heading
```
One Platform. Every Regulation. Zero Headaches.
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)]`

### Copy — Subheading
```
ExportReady reads your certificates, auto-fills compliance forms, generates QR-coded product passports, and alerts you before anything expires.
```
Style: `mt-4 text-lg text-gray-600 text-center max-w-3xl mx-auto`

### Product Visual
Replace the placeholder with the How It Works illustration set:
```tsx
import { UploadIllustration } from "@/components/illustrations";
```

Use UploadIllustration as the product visual — it shows the document upload → AI processing flow:
```tsx
<div className="mt-16 rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-emerald-50/30 p-8">
  <UploadIllustration />
</div>
```

### 3 Value Prop Cards

**Card 1 — AI-Powered Data Entry**
- Illustration: `<AIParsingIcon />` (48×48px)
- Title: `AI-Powered Data Entry`
- Body: `Upload any certificate PDF — BIS, EPR, UN38.3, IEC 62133. Our AI extracts 40+ fields automatically. No more copying data into spreadsheets at 11 PM.`

**Card 2 — QR-Coded Passports**
- Illustration: `<QRIcon />` (48×48px)
- Title: `QR-Coded Product Passports`
- Body: `Every battery gets a unique QR code. European buyers scan it and see the full Battery Passport — carbon footprint, chemistry, recycling instructions. Instant trust.`

**Card 3 — Proactive Alerts**
- Illustration: `<AlertIcon />` (48×48px)
- Title: `Proactive Compliance Alerts`
- Body: `Never miss a deadline again. Get 30-day warnings before BIS certificates expire, carbon footprint reports are due, or compliance scores drop below 70%.`

### Card Style
- Background: `bg-[var(--off-white)] rounded-xl p-8`
- Icon: `w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-[var(--emerald)]`
- Title: `text-xl font-semibold text-[var(--navy)] mt-4`
- Body: `text-gray-600 mt-2 leading-relaxed`

### Animation
- Heading: Fade in on scroll
- Product visual: Scale from 0.95 + fade in
- Cards: Stagger fade in from bottom

- [ ] 4.1 Solution section file created
- [ ] 4.2 Heading + subheading styled
- [ ] 4.3 Product visual placeholder
- [ ] 4.4 Value prop card 1 — AI Data Entry
- [ ] 4.5 Value prop card 2 — QR Passports
- [ ] 4.6 Value prop card 3 — Alerts
- [ ] 4.7 Scroll animations

---

## Phase 5: How It Works

**File to create:** `apps/marketing-web/sections/how-it-works.tsx`

### Design Specs
- Background: `bg-[var(--off-white)]`
- Padding: `py-24 px-6`
- Max width: `max-w-6xl mx-auto`

### Layout
- Top: Centered heading
- Below: 4-step horizontal timeline (vertical on mobile)

### Copy — Heading
```
From Certificate to Compliance in 4 Steps
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)] mb-16`

### 4 Steps

**Step 1 — Upload**
- Number: `01`
- Title: `Upload Your Documents`
- Body: `Drag and drop your BIS, EPR, UN38.3, IEC 62133, and MSDS certificates. Our AI reads them in seconds.`
- Illustration: `<UploadIllustration />` (placed above or beside the text)

**Step 2 — AI Processing**
- Number: `02`
- Title: `AI Fills Everything`
- Body: `The platform auto-populates 40+ compliance fields — carbon footprint, battery chemistry, manufacturer details. You just review and confirm.`
- Illustration: `<AIIllustration />`

**Step 3 — Generate**
- Number: `03`
- Title: `Generate Passports`
- Body: `Create EU-compliant Battery Passports in one click. Each product gets a unique QR code for instant buyer verification.`
- Illustration: `<PassportIllustration />`

**Step 4 — Ship**
- Number: `04`
- Title: `Ship with Confidence`
- Body: `Track certificate expiry, compliance scores, and batch status from one dashboard. Get alerts before anything becomes a problem.`
- Illustration: `<ShipIllustration />`

### Step Style
- Number: `text-5xl font-bold text-[var(--emerald)]/20` (large, faint)
- Title: `text-xl font-semibold text-[var(--navy)] mt-2`
- Body: `text-gray-600 mt-2`
- Icon: `w-10 h-10 text-[var(--emerald)]`

### Connecting Line
- Desktop: Horizontal dotted line connecting the 4 steps
- Color: `border-dashed border-t-2 border-gray-200`
- Mobile: Vertical line on the left

### Animation
- Each step fades in + translateY, staggered 0.2s
- Connecting line draws itself (width animates from 0 to 100%)

- [ ] 5.1 How It Works section created
- [ ] 5.2 Section heading styled
- [ ] 5.3 Step 1 — Upload
- [ ] 5.4 Step 2 — AI Processing
- [ ] 5.5 Step 3 — Generate
- [ ] 5.6 Step 4 — Ship
- [ ] 5.7 Connecting line (desktop)
- [ ] 5.8 Connecting line (mobile)
- [ ] 5.9 Stagger animation

---

## Phase 6: Features (Bento Grid)

**File to create:** `apps/marketing-web/sections/features.tsx`

### Design Specs
- Background: `bg-white`
- Padding: `py-24 px-6`
- Max width: `max-w-7xl mx-auto`

### Layout
- Top: Centered heading
- Below: CSS Grid — `grid-cols-1 md:grid-cols-3 gap-6`
- Large cards span 2 columns on desktop

### Copy — Heading
```
Everything You Need to Export Compliantly
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)] mb-16`

### Bento Grid Cards

**Large Card 1 (spans 2 cols):** `Batch Management`
- Illustration: `<BatchManagementIcon />` (placed top-right or top-left of card)
- Body: `Create and manage production batches with full traceability. Track every unit from factory floor to European warehouse.`
- Style: `bg-gradient-to-br from-slate-50 to-emerald-50/30`

**Small Card 1:** `AI Certificate Parsing`
- Illustration: `<AIParsingIcon />`
- Body: `Extract data from any PDF — BIS, EPR, UN38.3, IEC 62133, MSDS, DoC. 40+ fields recognized automatically.`

**Large Card 2 (spans 2 cols):** `EU Battery Passport`
- Illustration: `<QRIcon />`
- Body: `Generate fully compliant Battery Passports per EU Regulation 2023/1542. Includes carbon footprint, chemistry, recycling info, and due diligence.`
- Style: `bg-gradient-to-br from-emerald-50/30 to-slate-50`

**Small Card 2:** `Certificate Expiry Tracking`
- Illustration: `<AlertIcon />`
- Body: `Never miss a deadline. Visual timeline shows exactly when each certificate expires. 30-day, 7-day, and day-of alerts.`

**Small Card 3:** `Blockchain Anchoring`
- Illustration: `<BlockchainIcon />`
- Body: `Anchor certificates to the Bitcoin blockchain via OpenTimestamps. Buyers verify document integrity instantly. Free — no crypto wallet needed.`

**Small Card 4:** `Team Collaboration`
- Illustration: `<TeamIcon />`
- Body: `Invite your compliance officer, factory manager, and logistics lead. Role-based access ensures everyone sees what they need.`

**Small Card 5:** `Audit-Ready Reports`
- Illustration: `<AuditIcon />`
- Body: `Generate PDF audit trails, event logs, and compliance reports in one click. Be inspection-ready in 5 minutes.`

**Small Card 6:** `Public Passport Pages`
- Illustration: `<QRIcon />`
- Body: `Anyone can scan your product QR code and see a consumer-safe Battery Passport. No login required. Builds buyer trust instantly.`

### Card Styles
- Large cards: `rounded-2xl p-8` + gradient background
- Small cards: `rounded-2xl p-6 bg-white border border-gray-100`
- All cards hover: `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`
- Icon container: `w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[var(--emerald)]`

### Animation
- Cards stagger in on scroll (0.1s delay between each)

- [ ] 6.1 Features section created
- [ ] 6.2 Section heading styled
- [ ] 6.3 Bento grid layout (3-col)
- [ ] 6.4 Large card 1 — Batch Management
- [ ] 6.5 Small card 1 — AI Parsing
- [ ] 6.6 Large card 2 — EU Battery Passport
- [ ] 6.7 Small card 2 — Expiry Tracking
- [ ] 6.8 Small card 3 — Blockchain
- [ ] 6.9 Small card 4 — Team Collaboration
- [ ] 6.10 Small card 5 — Audit Reports
- [ ] 6.11 Small card 6 — Public Passports
- [ ] 6.12 Hover effects on all cards
- [ ] 6.13 Scroll stagger animation

---

## Phase 7: Compliance Coverage

**File to create:** `apps/marketing-web/sections/compliance.tsx`

### Design Specs
- Background: `bg-[var(--off-white)]`
- Padding: `py-24 px-6`
- Max width: `max-w-7xl mx-auto`

### Layout
- Desktop: 2-column (text left, visual right)
- Mobile: Stacked

### Copy — Heading
```
Compliance Coverage That Actually Covers You
```
Style: `text-3xl md:text-4xl font-bold text-[var(--navy)] mb-12`

### Left Column — Regulation Lists

**India (Domestic)** — Section label: `text-sm font-semibold text-[var(--emerald)] uppercase tracking-wide mb-4`
- [x] BIS Certification (IS 16046)
- [x] EPR Registration (CPCB)
- [x] BWM Rules 2022 Compliance
- [x] PLI Phase II Documentation
- [x] AIS-156 / AIS-038 Testing

**European Union**
- [x] EU Battery Regulation 2023/1542
- [x] CE Marking & DoC
- [x] Carbon Footprint Declaration (Annex II)
- [x] Due Diligence Policy (Art. 48)
- [x] Recycling & Recycled Content (Art. 8)
- [x] Battery Passport (Art. 77)

**Textile-Specific**
- [x] EU REACH Compliance
- [x] OEKO-TEX Documentation
- [x] GOTS Certification Tracking
- [x] Fiber Composition Reporting

### Checklist Item Style
- Check icon: `CheckCircle2` (Lucide) — `text-[var(--emerald)] w-5 h-5`
- Text: `text-gray-700`
- Container: `flex items-center gap-3 py-2`

### Right Column — Visual
- Placeholder: `bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl h-96 flex items-center justify-center`
- Text: "Compliance Map Visualization"

**Later:** Replace with a simple SVG map showing India → EU with dotted route and checkpoint markers.

### Animation
- Checklist items stagger in (0.05s each)
- Visual fades in from right

- [ ] 7.1 Compliance section created
- [ ] 7.2 Heading styled
- [ ] 7.3 India regulations list
- [ ] 7.4 EU regulations list
- [ ] 7.5 Textile regulations list
- [ ] 7.6 Check icons styled
- [ ] 7.7 Map visual placeholder
- [ ] 7.8 Scroll animations

---

## Phase 8: Social Proof

**File to create:** `apps/marketing-web/sections/testimonial.tsx`

### Design Specs
- Background: `bg-white`
- Padding: `py-24 px-6`
- Max width: `max-w-5xl mx-auto`

### Layout
- Centered content
- Quote card → Stats row → Logo row

### Copy — Heading
```
Trusted by Exporters Who Ship to Europe Every Day
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)] mb-16`

### Quote Card
- Container: `bg-[var(--off-white)] rounded-2xl p-10 md:p-12 relative`
- Left border: `border-l-4 border-[var(--emerald)]`

**Quote text:**
```
"Before ExportReady, we spent 3 days preparing compliance docs for every EU shipment. Last month we did it in 20 minutes. Our German buyer actually complimented us on how professional our Battery Passports looked."
```
Style: `text-xl md:text-2xl text-[var(--navy)] italic leading-relaxed`

**Attribution:**
```
— Name, Export Manager at [Battery Company]
```
Style: `mt-6 text-gray-600 font-medium`

**For now:** Use placeholder text. Replace with real testimonial when available.

### Stats Row
4-column grid (2×2 on mobile):

| Number | Label |
|--------|-------|
| 150+ | Indian Exporters Onboarded |
| 2,400+ | Batches Compliantly Shipped |
| 85% | Faster Documentation |
| ₹20L+/yr | Avg Consultant Cost Saved |

**Stat style:**
- Number: `text-4xl font-bold text-[var(--emerald)]`
- Label: `text-sm text-gray-600 mt-1`

### Logo Row
- Text: `Trusted by teams at`
- 5-6 gray placeholder rectangles (representing company logos)
- Style: `grayscale opacity-50 hover:opacity-100 transition-opacity`

### Animation
- Quote card: Fade in + scale from 0.98
- Stats: Count up animation when scrolled into view
- Logos: Fade in stagger

- [ ] 8.1 Testimonial section created
- [ ] 8.2 Section heading styled
- [ ] 8.3 Quote card with left border
- [ ] 8.4 Quote text styled
- [ ] 8.5 Attribution line
- [ ] 8.6 Stats grid (4 items)
- [ ] 8.7 Count-up animation on stats
- [ ] 8.8 Logo row placeholders

---

## Phase 9: Pricing

**File to create:** `apps/marketing-web/sections/pricing.tsx`

### Design Specs
- Background: `bg-[var(--off-white)]`
- Padding: `py-24 px-6`
- Max width: `max-w-6xl mx-auto`

### Layout
- Top: Centered heading + toggle
- Below: 3-column grid (1 column on mobile)

### Copy — Heading
```
Simple Pricing. No Hidden Fees.
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)] mb-4`

### Toggle (Monthly / Annual)
```
Monthly | Annual (Save 20%)
```
Style: `flex items-center justify-center gap-3 mt-6`
Toggle switch: `bg-gray-200 rounded-full w-14 h-8 relative` with sliding circle

### 3 Pricing Cards

**Starter Card:**
- Header: `Free`
- Subtitle: `For first-time exporters`
- Features:
  - 1 user
  - 3 batches/month
  - Basic Battery Passport
  - QR Code generation
  - Email support (48h)
- CTA: `[Start Free]` — `w-full py-3 rounded-lg border-2 border-gray-200 text-[var(--navy)] font-semibold hover:border-[var(--navy)] transition-colors`

**Growth Card (highlighted):**
- Badge: `Most Popular` — `absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--emerald)] text-white text-xs font-bold px-4 py-1 rounded-full`
- Top border: `border-t-4 border-[var(--emerald)]`
- Header: `₹4,999/mo`
- Subtitle: `For growing manufacturers`
- Features:
  - 5 users
  - 50 batches/month
  - AI Certificate Parsing
  - Compliance gap analysis
  - Certificate expiry alerts
  - Blockchain anchoring
  - Priority support (24h)
- CTA: `[Start 14-Day Trial]` — `w-full py-3 rounded-lg bg-[var(--emerald)] text-white font-semibold hover:bg-emerald-600 transition-colors`

**Enterprise Card:**
- Header: `Custom`
- Subtitle: `For large-scale operations`
- Features:
  - Unlimited users
  - Unlimited batches
  - Dedicated account manager
  - Custom integrations
  - SLA + phone support
  - On-premise deployment option
  - Audit assistance
- CTA: `[Contact Sales]` — `w-full py-3 rounded-lg border-2 border-[var(--navy)] text-[var(--navy)] font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors`

### Card Style
- Base: `bg-white rounded-2xl p-8 shadow-sm relative`
- Growth: slightly elevated `shadow-lg scale-[1.02]`

### Fine Print
Below cards:
```
All plans include: EU Battery Passport generation, QR codes, public passport pages, and basic compliance tracking.
```
Style: `text-center text-sm text-gray-500 mt-8`

### Animation
- Cards fade in + translateY, staggered

- [ ] 9.1 Pricing section created
- [ ] 9.2 Section heading styled
- [ ] 9.3 Monthly/Annual toggle
- [ ] 9.4 Starter card
- [ ] 9.5 Growth card (highlighted)
- [ ] 9.6 Enterprise card
- [ ] 9.7 Feature lists
- [ ] 9.8 CTA buttons styled
- [ ] 9.9 Fine print text
- [ ] 9.10 Scroll animation

---

## Phase 10: FAQ

**File to create:** `apps/marketing-web/sections/faq.tsx`

### Design Specs
- Background: `bg-white`
- Padding: `py-24 px-6`
- Max width: `max-w-4xl mx-auto`

### Layout
- Top: Centered heading
- Below: Accordion list (single column, full width)

### Copy — Heading
```
Questions? We've Got Answers.
```
Style: `text-3xl md:text-4xl font-bold text-center text-[var(--navy)] mb-16`

### FAQ Items

**Q1:** `Is my certificate data secure?`
**A1:** `Absolutely. We use AES-256 encryption at rest and TLS 1.3 in transit. Your data never leaves Indian servers (AWS Mumbai) unless you explicitly choose EU storage. We're GDPR-compliant and working towards ISO 27001 certification.`

**Q2:** `Do I need a compliance team to use this?`
**A2:** `No. ExportReady is built for teams of one. Our AI handles the heavy lifting — you just upload certificates and review the output. Most customers are fully operational within 2 hours of signup.`

**Q3:** `What if EU regulations change?`
**A3:** `We track regulatory changes in real-time. When the EU updates the Battery Regulation or adds new requirements, we update the platform automatically. You'll get a notification and a clear checklist of what's new.`

**Q4:** `Can my European buyers verify the passports?`
**A4:** `Yes — and they don't need an account. Every QR code links to a public passport page that shows compliance status, certificate validity, and blockchain proof. Buyers can verify in 10 seconds.`

**Q5:** `What certificates do I need to start?`
**A5:** `At minimum: BIS certification, EPR registration, and UN38.3 test report for batteries. Don't have them? The platform shows you exactly which ones you're missing and how to get them.`

**Q6:** `Is there a setup fee or lock-in period?`
**A6:** `No setup fee. No lock-in. Cancel anytime. We offer a 14-day free trial on Growth plans so you can verify it works for your exact use case before paying.`

### Accordion Style
- Question row: `flex items-center justify-between py-5 border-b border-gray-100 cursor-pointer`
- Question text: `text-lg font-medium text-[var(--navy)]`
- Toggle icon: `Plus` / `Minus` (Lucide) — `text-gray-400`
- Answer: `text-gray-600 pb-5 leading-relaxed`
- Expanded state: Answer visible, icon rotates to Minus

### Animation
- Smooth height transition on open/close
- Content fades in when expanded

- [ ] 10.1 FAQ section created
- [ ] 10.2 Section heading styled
- [ ] 10.3 Accordion component
- [ ] 10.4 FAQ item 1
- [ ] 10.5 FAQ item 2
- [ ] 10.6 FAQ item 3
- [ ] 10.7 FAQ item 4
- [ ] 10.8 FAQ item 5
- [ ] 10.9 FAQ item 6
- [ ] 10.10 Plus/minus toggle icons
- [ ] 10.11 Smooth expand/collapse animation

---

## Phase 11: Final CTA

**File to create:** `apps/marketing-web/sections/cta.tsx`

### Design Specs
- Background: `bg-[var(--navy)]`
- Padding: `py-24 px-6`
- Text color: White

### Layout
- Centered content
- Heading → Subheading → 2 CTAs

### Copy — Heading
```
Stop Worrying About Compliance. Start Shipping to Europe.
```
Style: `text-3xl md:text-5xl font-bold text-white text-center max-w-4xl mx-auto`

### Copy — Subheading
```
Join 150+ Indian exporters who've simplified their compliance workflow. Free for small exporters. 14-day trial for growing teams.
```
Style: `mt-6 text-lg text-gray-300 text-center max-w-2xl mx-auto`

### CTAs
```
[Request Demo]    [Start Free]
```

**Primary:** `bg-[var(--emerald)] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-colors`

**Secondary:** `border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors`

CTA container: `flex flex-col sm:flex-row gap-4 justify-center mt-10`

### Background Texture
Use the background pattern components:
```tsx
import { DotGrid } from "@/components/illustrations";
```

```tsx
<section className="relative bg-[var(--navy)] py-24 px-6 overflow-hidden">
  <DotGrid className="text-white opacity-30" />
  <div className="relative z-10 max-w-4xl mx-auto text-center">
    {/* Content */}
  </div>
</section>
```

### Animation
- Heading: Fade in + translateY
- Subheading: Fade in, delay 0.15s
- CTAs: Fade in, delay 0.3s

- [ ] 11.1 CTA section created
- [ ] 11.2 Navy background with grid texture
- [ ] 11.3 Heading styled (white)
- [ ] 11.4 Subheading styled
- [ ] 11.5 Primary CTA button
- [ ] 11.6 Secondary CTA button
- [ ] 11.7 Scroll animations

---

## Phase 12: Footer

**File to create:** `apps/marketing-web/components/footer.tsx`

### Design Specs
- Background: `bg-[var(--navy)]` (same as CTA, continuous)
- Padding: `pt-16 pb-8 px-6`
- Border top: `border-t border-white/10`

### Layout
- 4-column grid (2×2 on tablet, stacked on mobile)
- Below: Copyright bar

### Column 1 — Product
Header: `text-sm font-semibold text-white uppercase tracking-wide mb-4`
Links:
- Features
- Pricing
- Compliance Coverage
- API Docs
- Changelog

Link style: `text-gray-400 hover:text-white transition-colors block py-1`

### Column 2 — Company
- About Us
- Careers
- Contact
- Blog
- Press Kit

### Column 3 — Resources
- EU Battery Regulation Guide
- India BWM Rules Checklist
- Webinar: First Export to EU
- Compliance Calculator
- Help Center

### Column 4 — Legal
- Privacy Policy
- Terms of Service
- Cookie Policy
- Security
- GDPR Compliance

### Bottom Bar
Left: `ExportReady` logo text
Center: `© 2026 ExportReady. Built in India for Indian exporters.`
Right: Social icons (LinkedIn, Twitter/X, YouTube) — gray, hover white

Social icon style: `w-5 h-5 text-gray-500 hover:text-white transition-colors`

- [ ] 12.1 Footer component created
- [ ] 12.2 4-column grid layout
- [ ] 12.3 Product links column
- [ ] 12.4 Company links column
- [ ] 12.5 Resources links column
- [ ] 12.6 Legal links column
- [ ] 12.7 Bottom bar with copyright
- [ ] 12.8 Social icons

---

## Phase 13: Assembly

**File:** `apps/marketing-web/app/page.tsx`

### Import all sections
```tsx
import Navbar from '@/components/navbar'
import Hero from '@/sections/hero'
import Problem from '@/sections/problem'
import Solution from '@/sections/solution'
import HowItWorks from '@/sections/how-it-works'
import Features from '@/sections/features'
import Compliance from '@/sections/compliance'
import Testimonial from '@/sections/testimonial'
import Pricing from '@/sections/pricing'
import FAQ from '@/sections/faq'
import CTA from '@/sections/cta'
import Footer from '@/components/footer'
```

### Page structure
```tsx
export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Features />
      <Compliance />
      <Testimonial />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
```

- [ ] 13.1 All sections imported
- [ ] 13.2 Page structure assembled
- [ ] 13.3 Smooth scroll between sections
- [ ] 13.4 No layout shifts on load

---

## Phase 14: Polish & Launch Checklist

### Performance
- [ ] Lighthouse score 95+ (Performance, Accessibility, Best Practices, SEO)
- [ ] LCP < 2.5s
- [ ] Images optimized (WebP, lazy loaded)
- [ ] No render-blocking resources

### Responsive
- [ ] Looks perfect on 375px (iPhone SE)
- [ ] Looks perfect on 768px (iPad)
- [ ] Looks perfect on 1440px (desktop)
- [ ] Mobile menu works smoothly

### Accessibility
- [ ] All images have alt text
- [ ] Color contrast ratio 4.5:1 minimum
- [ ] Keyboard navigable (tab through all interactive elements)
- [ ] Focus visible styles
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] `prefers-reduced-motion` respected

### SEO
- [ ] Meta title and description set
- [ ] OG tags configured
- [ ] Structured data (Organization schema)
- [ ] Sitemap generated
- [ ] robots.txt allows indexing

### Analytics
- [ ] Plausible/PostHog script added
- [ ] CTA clicks tracked
- [ ] Scroll depth tracked
- [ ] Demo form submissions tracked

### Content
- [ ] 1 real testimonial obtained
- [ ] 3-5 real company logos obtained
- [ ] Product screenshots captured
- [ ] Demo video recorded (or removed)
- [ ] Pricing finalized
- [ ] Privacy policy page created
- [ ] Terms of service page created

### Testing
- [ ] All links work
- [ ] All CTAs lead to correct pages
- [ ] No console errors
- [ ] Build succeeds (`next build`)
- [ ] Deployed to Vercel

---

## File Structure

```
apps/marketing-web/
├── app/
│   ├── layout.tsx          ← Fonts, metadata
│   ├── page.tsx            ← Assembles all sections
│   └── globals.css         ← CSS variables
├── components/
│   ├── navbar.tsx          ← Fixed nav bar
│   └── footer.tsx          ← Site footer
├── sections/
│   ├── hero.tsx
│   ├── problem.tsx
│   ├── solution.tsx
│   ├── how-it-works.tsx
│   ├── features.tsx
│   ├── compliance.tsx
│   ├── testimonial.tsx
│   ├── pricing.tsx
│   ├── faq.tsx
│   └── cta.tsx
└── public/
    ├── images/
    │   └── (screenshots, logos, OG image)
    └── (other assets)
```

---

## Ready to Build?

Work through each phase in order. Check off boxes as you complete them. If you get stuck on any section, tell me the phase number and I'll build it for you.

**Start with Phase 0 (setup) and Phase 1 (navbar), then move to Phase 2 (hero).** The hero is the most important — get that right first.
