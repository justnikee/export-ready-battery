# OpenDesign Prompt — ExportReady Landing Page & Brand Identity

## Project Context

**ExportReady** is an AI-powered compliance platform that helps Indian battery and textile exporters navigate EU regulations. The product generates QR-coded Battery Passports, tracks certificate expiry, and automates compliance documentation.

**Existing codebase:** Next.js 15 + Tailwind v4 + Framer Motion. Illustrations already built in `apps/marketing-web/components/illustrations/` (SVG, animated). This prompt is for the **visual design layer** — you are designing the look and feel that our dev team will implement.

---

## Part 1: Brand Identity

### Brand Essence
"Regulatory confidence meets Silicon Valley polish." We handle the compliance headache so Indian manufacturers can focus on growth. Not a government website. Not crypto-bro. Think **Linear.app × Stripe × Bloomberg Green**.

### Logo Design

**Primary Logo:** Wordmark "ExportReady" — custom or heavily modified geometric sans-serif. The "E" and "R" should feel slightly industrial/technical (subtle angularity). The word "Ready" should feel approachable and modern.

**Logo Variants Needed:**
- Full horizontal wordmark (for navbar, headers)
- Stacked version (icon + wordmark for square contexts)
- Icon-only mark (favicon, app icon, social avatars) — abstract geometric "E" formed by two overlapping shapes suggesting a passport stamp + checkmark

**Color treatments:**
- Navy version (for light backgrounds)
- White version (for dark backgrounds)
- Emerald accent version (for special contexts)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| **Navy** | `#0F172A` | Primary text, headers, dark sections, navbar text |
| **Navy Light** | `#1E293B` | Hover states, secondary dark elements |
| **Emerald** | `#10B981` | Primary CTA, success states, compliance badges, accent highlights |
| **Emerald Light** | `#D1FAE5` | Subtle backgrounds, hover tints, progress bar fills |
| **Amber** | `#F59E0B` | Warnings, alerts, secondary accents |
| **Coral** | `#F87171` | Errors, urgent actions |
| **Off-White** | `#FAFBFC` | Section backgrounds (alternating with pure white) |
| **Pure White** | `#FFFFFF` | Cards, primary background |

**Gradient treatments:**
- Hero background: `from-slate-50 via-white to-emerald-50/30` — extremely subtle, almost imperceptible
- Card accents (large bento cards): `from-slate-50 to-emerald-50/30` or reversed
- Dark section (final CTA): solid navy with subtle grid/dot texture overlay at 5% opacity

### Typography

**Headlines:** Inter Tight or Geist — bold weight (700), tight letter-spacing (-0.02em), sizes 48px–72px for hero, 32px–40px for section headers. Should feel confident and modern.

**Body:** Inter or Geist — regular weight (400), 18px base size, line-height 1.6, color gray-600. Readable and warm.

**Mono:** JetBrains Mono — for data displays, certificate numbers, stats. 14px, used sparingly.

**Labels/Tags:** All caps, 11px, letter-spacing 0.05em, medium weight. Used for category labels, plan badges, regulation tags.

### Visual Motifs & Iconography Style

1. **Checkmark/Certificate Badge** — Rounded square with checkmark inside. Subtle pulse animation on active states.
2. **QR Code** — Clean, modern QR representations. Not pixelated. Should feel like a scannable tech element.
3. **Map Trajectory** — Dotted curved line showing India → Europe. Animated traveling dot.
4. **Shield/Lock** — For security/trust messaging. Rounded, friendly, not aggressive.
5. **Document → Digital** — Paper morphing into glowing digital card. For transformation narrative.
6. **Corner-square decorations** (from dashboard design language) — Small 4px squares at card corners. Brutalist-meets-refined aesthetic.

---

## Part 2: Landing Page Design — Desktop (1440px)

### Section 1: Navbar

**Layout:** Fixed top, full width, height 64px, `bg-white/80 backdrop-blur-md`, border-bottom 1px gray-100.

**Content:**
- Left: ExportReady wordmark (navy, font-bold, text-xl)
- Center: Features | Pricing | Compliance | Blog (hidden on mobile)
- Right: "Get Started" button (navy bg, white text, rounded-lg, px-5 py-2.5)

**Scroll behavior:** Add subtle shadow `shadow-sm` after scrolling 20px.

**Design note:** Navbar should feel weightless — no heavy borders. The blur creates separation without a visible line.

---

### Section 2: Hero

**Layout:** Full viewport height (100vh). Two-column grid: 55% text / 45% visual. Padding top 128px (accounts for navbar).

**Background:** Subtle animated gradient mesh or geometric pattern. Very light — `from-slate-50 via-white to-emerald-50/30`. Should feel airy, not busy.

**Left Column — Text:**
- **Headline:** "Ship to Europe Without the Compliance Nightmare"
  - Size: 56px desktop, 72px large screens
  - Weight: 700, tight tracking
  - Color: Navy
  - Max-width: 600px
- **Subheadline:** "AI-powered Battery Passports, QR-code verification, and automated compliance tracking — built specifically for Indian battery and textile exporters."
  - Size: 18px, color gray-600
  - Max-width: 560px
  - mt-6
- **CTAs:**
  - Primary: "Request Demo" — emerald bg, white text, rounded-lg, px-8 py-4, font-semibold, text-lg. Hover: scale 1.02, darker emerald.
  - Secondary: "Watch How It Works (2 min)" — navy text, play circle icon (Lucide), no bg. Hover: emerald text.
- **Trust bar:** "Trusted by 150+ Indian exporters" + 5–6 company logo silhouettes (grayscale, 50% opacity) + "Compliance with EU Battery Regulation 2023/1542 & India BWM Rules 2022"

**Right Column — Visual:**
- Product mockup: Floating dashboard screenshot with 3D perspective (`rotateY(-5deg) rotateX(5deg)`)
- Screenshot shows: Batch with "EU Compliant ✅" badge + QR code + certificate timeline
- Subtle floating animation (translateY 10px, 6s loop)
- Behind the screenshot: soft blurred emerald orb glow + subtle grid pattern

**Animation (design for, dev will implement with Framer Motion):**
- Headline: fade in + translateY(30px→0), 0.6s
- Subheadline: same, delay 0.15s
- CTAs: same, delay 0.3s
- Visual: fade in + translateX(50px→0), delay 0.3s

---

### Section 3: The Problem (Pain Amplification)

**Background:** Off-white `#FAFBFC`
**Padding:** 120px vertical

**Heading (centered):** "Exporting to Europe Shouldn't Feel Impossible"
- Size: 36px, navy, font-bold
- mb-16

**3-Card Grid (gap-8):**

**Card 1 — Regulations:**
- Icon: Stack of documents with warning triangle (48×48, in red-50 rounded-xl container)
- Title: "200-Page Regulations" — 20px, navy, semibold
- Body: "EU Battery Regulation, India BWM Rules, REACH, BIS — every market has its own 200-page rulebook. Reading them all is a full-time job." — 16px, gray-600

**Card 2 — Shipments Held:**
- Icon: Container ship with stop sign and clock
- Title: "Shipments Held at Port"
- Body: "A missing carbon footprint declaration or expired BIS certificate means your shipment sits at Rotterdam for 3 weeks. Every day of delay costs ₹50,000+."

**Card 3 — Consultant Costs:**
- Icon: Coins with down arrow, wallet draining
- Title: "Consultant Costs Add Up"
- Body: "Compliance consultants charge ₹2–5L per audit. For a mid-size exporter doing 4 audits a year, that's ₹20L — enough to hire 2 engineers."

**Card Style:**
- bg-white, rounded-xl, p-8, border 1px gray-100, shadow-sm
- Hover: shadow-md, translateY(-4px), transition 300ms

**Transition line (below cards, centered):**
"It doesn't have to be this hard." — 18px, emerald, font-medium, mt-12

---

### Section 4: The Solution

**Background:** White
**Padding:** 120px vertical

**Heading (centered):** "One Platform. Every Regulation. Zero Headaches."
- 36px, navy, bold

**Subheading (centered):** "ExportReady reads your certificates, auto-fills compliance forms, generates QR-coded product passports, and alerts you before anything expires."
- 18px, gray-600, max-w-3xl, mx-auto, mt-4

**Product Visual (centered, mt-16):**
- Large rounded-2xl container (24px radius)
- Border: 1px gray-200
- Background: gradient `from-gray-50 to-emerald-50/30`
- Inner padding: 32px
- Contains: Upload-to-AI-to-Passport workflow illustration (document upload cloud → AI brain sparkles → passport document with QR)

**3 Value Prop Cards (horizontal, mt-16, gap-6):**

**Card 1 — AI Data Entry:**
- Icon: Document with AI sparkle badge (w-12 h-12, emerald-50 bg, emerald icon)
- Title: "AI-Powered Data Entry" — 18px semibold navy
- Body: "Upload any certificate PDF — BIS, EPR, UN38.3, IEC 62133. Our AI extracts 40+ fields automatically. No more copying data into spreadsheets at 11 PM."

**Card 2 — QR Passports:**
- Icon: QR code with scan frame
- Title: "QR-Coded Product Passports"
- Body: "Every battery gets a unique QR code. European buyers scan it and see the full Battery Passport — carbon footprint, chemistry, recycling instructions. Instant trust."

**Card 3 — Alerts:**
- Icon: Bell with warning triangle
- Title: "Proactive Compliance Alerts"
- Body: "Never miss a deadline again. Get 30-day warnings before BIS certificates expire, carbon footprint reports are due, or compliance scores drop below 70%."

**Card Style:** bg-off-white, rounded-xl, p-8. No border. Clean.

---

### Section 5: How It Works

**Background:** Off-white
**Padding:** 120px vertical

**Heading (centered):** "From Certificate to Compliance in 4 Steps"
- 36px, navy, bold, mb-16

**4-Step Horizontal Timeline (desktop):**

**Step 1 — Upload:**
- Large number: "01" — 48px, emerald at 20% opacity, bold
- Title: "Upload Your Documents" — 18px semibold
- Body: "Drag and drop your BIS, EPR, UN38.3, IEC 62133, and MSDS certificates. Our AI reads them in seconds."
- Illustration: Cloud upload with floating docs

**Step 2 — AI Processing:**
- "02"
- Title: "AI Fills Everything"
- Body: "The platform auto-populates 40+ compliance fields — carbon footprint, battery chemistry, manufacturer details. You just review and confirm."
- Illustration: Circuit brain with sparkles

**Step 3 — Generate:**
- "03"
- Title: "Generate Passports"
- Body: "Create EU-compliant Battery Passports in one click. Each product gets a unique QR code for instant buyer verification."
- Illustration: Passport doc with phone scan

**Step 4 — Ship:**
- "04"
- Title: "Ship with Confidence"
- Body: "Track certificate expiry, compliance scores, and batch status from one dashboard. Get alerts before anything becomes a problem."
- Illustration: India → EU route with flying package

**Connector:** Horizontal dashed line (2px, gray-200) connecting all 4 steps. Animated drawing effect.

**Step container:** Each step in a column, text centered below icon/illustration.

---

### Section 6: Features (Bento Grid)

**Background:** White
**Padding:** 120px vertical

**Heading (centered):** "Everything You Need to Export Compliantly"
- 36px, navy, bold, mb-16

**Bento Grid:** 3-column CSS grid, gap-6

| Position | Size | Card | Background |
|----------|------|------|------------|
| Top-left | Large (span 2 cols) | **Batch Management** — "Create and manage production batches with full traceability. Track every unit from factory floor to European warehouse." | Gradient: slate-50 → emerald-50/30 |
| Top-right | Small | **AI Certificate Parsing** — "Extract data from any PDF — BIS, EPR, UN38.3, IEC 62133, MSDS, DoC. 40+ fields recognized automatically." | White, 1px gray-100 border |
| Middle-left | Small | **Certificate Expiry Tracking** — "Never miss a deadline. Visual timeline shows exactly when each certificate expires. 30-day, 7-day, and day-of alerts." | White, 1px gray-100 border |
| Middle-center | Large (span 2 cols) | **EU Battery Passport** — "Generate fully compliant Battery Passports per EU Regulation 2023/1542. Includes carbon footprint, chemistry, recycling info, and due diligence." | Gradient: emerald-50/30 → slate-50 |
| Middle-right | Small | **Blockchain Anchoring** — "Anchor certificates to the Bitcoin blockchain via OpenTimestamps. Buyers verify document integrity instantly. Free — no crypto wallet needed." | White, 1px gray-100 border |
| Bottom-left | Small | **Team Collaboration** — "Invite your compliance officer, factory manager, and logistics lead. Role-based access ensures everyone sees what they need." | White, 1px gray-100 border |
| Bottom-center | Small | **Audit-Ready Reports** — "Generate PDF audit trails, event logs, and compliance reports in one click. Be inspection-ready in 5 minutes." | White, 1px gray-100 border |
| Bottom-right | Small | **Public Passport Pages** — "Anyone can scan your product QR code and see a consumer-safe Battery Passport. No login required. Builds buyer trust instantly." | White, 1px gray-100 border |

**Card hover:** Lift 4px, shadow intensifies, border shifts to emerald-200.

**Icons:** Each card has a 40×40 icon in top-left, emerald-50 rounded-lg container.

---

### Section 7: Compliance Coverage

**Background:** Off-white
**Padding:** 120px vertical

**Heading:** "Compliance Coverage That Actually Covers You"
- 36px, navy, bold, mb-12

**Two-column layout:**

**Left Column — Regulation Lists:**

**India (Domestic)** — label: 12px, emerald, uppercase, tracking-wide, semibold
- CheckCircle2 icon (emerald, 20px) + "BIS Certification (IS 16046)"
- CheckCircle2 + "EPR Registration (CPCB)"
- CheckCircle2 + "BWM Rules 2022 Compliance"
- CheckCircle2 + "PLI Phase II Documentation"
- CheckCircle2 + "AIS-156 / AIS-038 Testing"

**European Union** — same label style
- CheckCircle2 + "EU Battery Regulation 2023/1542"
- CheckCircle2 + "CE Marking & DoC"
- CheckCircle2 + "Carbon Footprint Declaration (Annex II)"
- CheckCircle2 + "Due Diligence Policy (Art. 48)"
- CheckCircle2 + "Recycling & Recycled Content (Art. 8)"
- CheckCircle2 + "Battery Passport (Art. 77)"

**Textile-Specific** — same label style
- CheckCircle2 + "EU REACH Compliance"
- CheckCircle2 + "OEKO-TEX Documentation"
- CheckCircle2 + "GOTS Certification Tracking"
- CheckCircle2 + "Fiber Composition Reporting"

**List item style:** flex items-center gap-3, py-2, text-gray-700

**Right Column — Visual:**
- Minimalist stylized map
- India on left, Europe on right
- Dotted curved route connecting them
- Small checkpoint markers (emerald circles) along the route
- Subtle animated dot traveling the route
- Background: gradient from slate-50 to emerald-50/20, rounded-2xl

---

### Section 8: Social Proof

**Background:** White
**Padding:** 120px vertical

**Heading (centered):** "Trusted by Exporters Who Ship to Europe Every Day"
- 36px, navy, bold, mb-16

**Quote Card:**
- Container: bg-off-white, rounded-2xl, p-10 (desktop p-12), left border 4px emerald
- Quote text: 20px (desktop 24px), navy, italic, leading-relaxed
- Content: "Before ExportReady, we spent 3 days preparing compliance docs for every EU shipment. Last month we did it in 20 minutes. Our German buyer actually complimented us on how professional our Battery Passports looked."
- Attribution: mt-6, gray-600, font-medium — "— Export Manager, Gujarat Battery Works"

**Stats Row (4-column grid, mt-16):**

| Number | Label |
|--------|-------|
| 150+ | Indian Exporters Onboarded |
| 2,400+ | Batches Compliantly Shipped |
| 85% | Faster Documentation |
| ₹20L+/yr | Avg Consultant Cost Saved |

**Stat style:** Number = 40px, emerald, bold. Label = 14px, gray-600.

**Logo Row (below stats, mt-12):**
- Text: "Trusted by teams at" — 14px, gray-500
- 5–6 gray logo placeholder rectangles (grayscale, 50% opacity, hover 100%)

---

### Section 9: Pricing

**Background:** Off-white
**Padding:** 120px vertical

**Heading (centered):** "Simple Pricing. No Hidden Fees."
- 36px, navy, bold, mb-4

**Toggle:** Monthly | Annual (Save 20%)
- Centered, mt-6
- Pill-shaped toggle switch, gray-200 bg, sliding emerald circle

**3-Card Grid (gap-8, mt-12):**

**Starter Card:**
- Header: "Free" — 32px, navy, bold
- Subtitle: "For first-time exporters" — 14px, gray-500
- Features list (check icons, emerald):
  - 1 user
  - 3 batches/month
  - Basic Battery Passport
  - QR Code generation
  - Email support (48h)
- CTA: "Start Free" — full width, border-2 gray-200, navy text, rounded-lg, py-3. Hover: border-navy.

**Growth Card (highlighted):**
- Badge: "Most Popular" — absolute, -top-3, centered, emerald bg, white text, 12px bold, px-4 py-1, rounded-full
- Top border: 4px emerald
- Header: "₹4,999/mo" — 32px, navy, bold
- Subtitle: "For growing manufacturers"
- Features:
  - 5 users
  - 50 batches/month
  - AI Certificate Parsing
  - Compliance gap analysis
  - Certificate expiry alerts
  - Blockchain anchoring
  - Priority support (24h)
- CTA: "Start 14-Day Trial" — full width, emerald bg, white text, rounded-lg, py-3, font-semibold. Hover: darker emerald.
- Elevation: shadow-lg, scale 1.02

**Enterprise Card:**
- Header: "Custom" — 32px, navy, bold
- Subtitle: "For large-scale operations"
- Features:
  - Unlimited users
  - Unlimited batches
  - Dedicated account manager
  - Custom integrations
  - SLA + phone support
  - On-premise deployment option
  - Audit assistance
- CTA: "Contact Sales" — full width, border-2 navy, navy text, rounded-lg, py-3. Hover: navy bg, white text.

**Fine print (below cards, mt-8):**
"All plans include: EU Battery Passport generation, QR codes, public passport pages, and basic compliance tracking." — 14px, gray-500, centered.

---

### Section 10: FAQ

**Background:** White
**Padding:** 120px vertical

**Heading (centered):** "Questions? We've Got Answers."
- 36px, navy, bold, mb-16

**Accordion List (max-w-4xl, mx-auto):**

**Q1:** "Is my certificate data secure?"
**A1:** "Absolutely. We use AES-256 encryption at rest and TLS 1.3 in transit. Your data never leaves Indian servers (AWS Mumbai) unless you explicitly choose EU storage. We're GDPR-compliant and working towards ISO 27001 certification."

**Q2:** "Do I need a compliance team to use this?"
**A2:** "No. ExportReady is built for teams of one. Our AI handles the heavy lifting — you just upload certificates and review the output. Most customers are fully operational within 2 hours of signup."

**Q3:** "What if EU regulations change?"
**A3:** "We track regulatory changes in real-time. When the EU updates the Battery Regulation or adds new requirements, we update the platform automatically. You'll get a notification and a clear checklist of what's new."

**Q4:** "Can my European buyers verify the passports?"
**A4:** "Yes — and they don't need an account. Every QR code links to a public passport page that shows compliance status, certificate validity, and blockchain proof. Buyers can verify in 10 seconds."

**Q5:** "What certificates do I need to start?"
**A5:** "At minimum: BIS certification, EPR registration, and UN38.3 test report for batteries. Don't have them? The platform shows you exactly which ones you're missing and how to get them."

**Q6:** "Is there a setup fee or lock-in period?"
**A6:** "No setup fee. No lock-in. Cancel anytime. We offer a 14-day free trial on Growth plans so you can verify it works for your exact use case before paying."

**Accordion style:**
- Question row: flex justify-between, py-5, border-bottom 1px gray-100
- Question text: 16px (desktop 18px), navy, medium weight
- Toggle icon: Plus/Minus (20px, gray-400)
- Answer: 16px, gray-600, leading-relaxed, pb-5
- Expanded state: left border 2px emerald on the answer area

---

### Section 11: Final CTA

**Background:** Navy `#0F172A`
**Padding:** 120px vertical

**Content (centered, max-w-4xl):**

**Heading:** "Stop Worrying About Compliance. Start Shipping to Europe."
- 40px (desktop 48px), white, bold, text-center

**Subheading:** "Join 150+ Indian exporters who've simplified their compliance workflow. Free for small exporters. 14-day trial for growing teams."
- 18px, gray-300, text-center, max-w-2xl, mx-auto, mt-6

**CTAs (flex, gap-4, justify-center, mt-10):**
- Primary: "Request Demo" — emerald bg, white text, rounded-lg, px-8 py-4, font-semibold, text-lg
- Secondary: "Start Free" — border-2 white/30, white text, rounded-lg, px-8 py-4, font-semibold, text-lg

**Background texture:**
- Subtle dot grid pattern at 5% opacity (white dots on navy)
- OR: very faint world map outline (India and Europe visible)
- No animation that distracts from the CTAs

---

### Section 12: Footer

**Background:** Navy (continuous from CTA section)
**Padding:** 64px top, 32px bottom
**Border top:** 1px white/10

**4-Column Grid:**

**Column 1 — Product:**
- Header: "Product" — 12px, white, semibold, uppercase, tracking-wide
- Links: Features, Pricing, Compliance Coverage, API Docs, Changelog
- Link style: 14px, gray-400, hover white

**Column 2 — Company:**
- About Us, Careers, Contact, Blog, Press Kit

**Column 3 — Resources:**
- EU Battery Regulation Guide, India BWM Rules Checklist, Webinar: First Export to EU, Compliance Calculator, Help Center

**Column 4 — Legal:**
- Privacy Policy, Terms of Service, Cookie Policy, Security, GDPR Compliance

**Bottom Bar (flex, justify-between, mt-16, pt-8, border-top white/10):**
- Left: "ExportReady" wordmark, white, font-bold
- Center: "© 2026 ExportReady. Built in India for Indian exporters. 🇮🇳" — 14px, gray-500
- Right: LinkedIn, Twitter/X, YouTube icons — 20px, gray-500, hover white

---

## Part 3: Responsive Behavior

### Tablet (768px–1024px)
- Hero: Single column, text centered, visual below
- Problem cards: 2-column grid (3rd card spans full width)
- Bento grid: 2-column
- Pricing: 2-column (Starter + Growth), Enterprise below full-width
- Footer: 2×2 grid

### Mobile (< 768px)
- Hero: Single column, text centered, visual hidden or simplified
- All grids: Single column
- How It Works: Vertical timeline with left connector line
- Pricing: Cards stacked, Growth first (most popular)
- FAQ: Single column accordion
- Footer: Single column, stacked

---

## Part 4: Dark Mode (Automatic)

When `prefers-color-scheme: dark`:
- Backgrounds: Navy `#0F172A` instead of white
- Cards: Navy-light `#1E293B` with 1px white/10 border
- Text: White/gray-200 for primary, gray-400 for secondary
- Emerald accent: Slightly desaturated `#34D399`
- Off-white sections: `#0F172A` with subtle texture
- White sections: `#1E293B`

---

## Part 5: Deliverables Needed

Please generate:

1. **Brand Identity Board**
   - Logo in all 3 variants (horizontal, stacked, icon-only) + color treatments
   - Color palette swatches with hex codes
   - Typography specimens (headline, body, mono)
   - Iconography style guide (6 motifs)

2. **Desktop Landing Page Design (1440px)**
   - Full page mockup showing all 12 sections
   - Scroll state: Hero fully visible

3. **Mobile Landing Page Design (375px)**
   - Key screens: Hero, Features Bento, Pricing, Final CTA

4. **Component Design Specs**
   - Button states (primary, secondary, ghost)
   - Card variants (default, gradient, highlighted)
   - Form inputs (for demo request)
   - Badge/tag styles
   - Accordion open/closed states

5. **Hero Illustration Direction**
   - Concept sketch or reference for the 3D dashboard mockup + floating elements
   - Color treatment matching the palette

---

## Design References

- **Linear.app** — Clean SaaS confidence, generous spacing, subtle interactions
- **Stripe.com** — Persuasive section flow, card layouts, trust signals
- **Vercel.com** — Developer-friendly clarity, bold headlines
- **Notion.so** — Approachable team messaging
- **Carbonable.xyz** — Sustainability green-tech aesthetic

---

*This prompt is designed for OpenDesign or similar AI design tools. The output should be a comprehensive visual design system + landing page mockups that a Next.js development team can implement directly.*
