# Anviora — Marketing Pages Content

**Status:** Copy-complete, ready for design and development  
**Pages:** 8 core pages + 3 compliance guides  
**Tone:** Infrastructure-first, confident, precise, Indian-built, globally trusted  
**Last Updated:** May 2026

---

## Table of Contents

1. [Homepage](#1-homepage)
2. [Product: Anviora Battery](#2-product-anviora-battery)
3. [Product: Anviora Textile](#3-product-anviora-textile)
4. [Pricing](#4-pricing)
5. [About](#5-about)
6. [Compliance Hub: EU Battery Regulation](#6-compliance-hub-eu-battery-regulation)
7. [Compliance Hub: India BWM Rules](#7-compliance-hub-india-bwm-rules)
8. [Contact / Demo](#8-contact--demo)
9. [Blog / Resources Hub](#9-blog--resources-hub)
10. [Navigation & Footer](#10-navigation--footer)

---

## 1. Homepage

**URL:** `/`  
**Meta Title:** Anviora — The Digital Product Identity Platform for Indian Manufacturers  
**Meta Description:** Create digital product passports, verify authenticity, and meet global traceability requirements from a single platform. Built for battery and textile exporters.  
**OG Image:** Stylized passport dashboard screenshot with Anviora branding

---

### Section 1: Hero

**Layout:** Full viewport height (100vh), dark background (`#09090B`), centered or 55/45 split  
**Background:** Solid dark or very subtle animated gradient (no particles, no 3D)  
**Padding:** 160px top (accounting for 72px nav), 80px bottom

**Left Column (55%):**

**Eyebrow (caption, uppercase, tracking-wide, `color/primary`):**
> THE DIGITAL PRODUCT IDENTITY PLATFORM

**Headline (96px desktop, 48px mobile, `color/white`, weight 700, tight leading):**
> Every Product Needs an Identity.

**Subheadline (20px, `color/slate-400`, max-width 560px, line-height 1.6):**
> Create digital product passports, verify authenticity, and meet global traceability requirements — from a single platform built for Indian manufacturers.

**CTA Row (horizontal, gap 16px, margin-top 32px):**

- **Primary Button:** "Book Demo" → `/demo`
  - Style: `Button/Primary/Lg`
  - Icon: `Calendar` (leading)

- **Secondary Button:** "See Live Passport" → `/p/demo-battery-001` (opens in new tab)
  - Style: `Button/Ghost/Lg`
  - Icon: `ExternalLink` (trailing)

- **Tertiary Link:** "Watch Video (2 min)" → opens lightbox
  - Style: Text link with `PlayCircle` icon
  - Color: `color/slate-400`, hover `color/white`

**Trust Bar (margin-top 48px, horizontal, gap 32px):**

**Text (14px, `color/slate-500`):**
> Trusted by manufacturers shipping to

**Logos (grayscale, 50% opacity, hover 100%):**
- EU flag icon + "European Union"
- BIS logo
- CPCB reference
- 3–4 anonymized manufacturer silhouettes (until real logos secured)

**Right Column (45%):**

**Visual:** Product screenshot or stylized render  
- Floating at slight angle (perspective: 1000px, rotateY: -5deg)
- Subtle shadow
- Shows: Dashboard with batch list, compliance score, QR passport preview

**Alternative:** Animated sequence  
- Frame 1: Blank battery → Frame 2: QR code appears → Frame 3: Passport data populates → Frame 4: "Verified" badge

**Mobile:** Stacked. Screenshot below text, reduced to 80% width, centered.

---

### Section 2: Trusted By

**Layout:** Full width, `color/slate-50` background, centered  
**Padding:** 80px vertical

**Content (centered):**

**Label (14px, uppercase, tracking-wide, `color/slate-500`):**
> TRUSTED BY EXPORTERS, VERIFIED BY REGULATORS

**Logo Grid (horizontal, gap 48px, margin-top 32px):**

**Row 1 — Customer Logos:**
- 6 placeholder manufacturer logos (grayscale, max-height 32px)
- Tooltip on hover: "Battery manufacturer, Gujarat" etc.

**Row 2 — Compliance Standards (margin-top 24px):**
- EU Battery Regulation 2023/1542 badge
- BIS IS 16046 badge
- CE Marking badge
- EPR Registered badge
- UN38.3 badge

**Design Note:** Logos should feel editorial — not crammed. Generous breathing room between each. If real logos unavailable, use anonymized wordmarks in slate-300.

---

### Section 3: The Problem

**Layout:** Full width, `color/white` background, 3-column grid (1 column mobile)  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> THE COMPLIANCE REALITY

**Headline (48px, `color/slate-900`):**
> Exporting to Europe Shouldn't Feel Impossible.

**Subhead (20px, `color/slate-500`, max-width 640px, centered):**
> Indian manufacturers lose shipments, contracts, and credibility because of paperwork. The cost isn't just money — it's missed opportunity.

**Three Columns (gap 24px):**

**Column 1 — "200-Page Rulebooks"**
- Icon: `FileText` (32px, `color/danger`)
- Headline (24px): Regulations multiply faster than teams.
- Body (16px, `color/slate-500`): EU Battery Regulation. India BWM Rules. REACH. BIS. Each market has its own 200-page rulebook. Reading them all is a full-time job most manufacturers can't afford.
- Stat (48px, `color/slate-900`, weight 700): 200+
- Stat label (14px): Pages of EU Battery Regulation

**Column 2 — "Shipments Held at Port"**
- Icon: `AlertTriangle` (32px, `color/warning`)
- Headline (24px): One missing document costs everything.
- Body (16px): A missing carbon footprint declaration or expired BIS certificate means your shipment sits at Rotterdam for three weeks. Every day of delay costs ₹50,000+. And your buyer starts looking for another supplier.
- Stat (48px): ₹50,000+
- Stat label: Per day of port delay

**Column 3 — "Consultant Costs"**
- Icon: `TrendingUp` (32px, `color/primary`) — inverted, pointing down conceptually
- Headline (24px): Compliance shouldn't require a consultant retainer.
- Body (16px): Compliance consultants charge ₹2–5 lakh per audit. For a mid-size exporter doing four audits a year, that's ₹20 lakh — enough to hire two engineers. And you still have to do the paperwork yourself.
- Stat (48px): ₹20L+
- Stat label: Average annual consultant cost

**Transition Line (centered, margin-top 64px):**

**Text (20px, `color/primary`, italic):**
> It doesn't have to be this hard.

---

### Section 4: Product Overview (Lifecycle Flow)

**Layout:** Full width, `color/slate-50` background, centered  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 80px):**

**Label (14px, uppercase, `color/primary`):**
> HOW IT WORKS

**Headline (48px, `color/slate-900`):**
> From Factory Floor to European Warehouse.

**Subhead (20px, `color/slate-500`):**
> One platform. One record. Every step of the journey.

**Animated Flow (horizontal on desktop, vertical on mobile):**

**Step 1 — Manufacture**
- Number: "01" (72px, `color/primary`, weight 700, opacity 20%)
- Icon: `Factory` (24px)
- Title (20px, weight 600): Manufacture
- Body (16px, `color/slate-500`): Create production batches with unique serial IDs. Import from Tally, ERP, or enter manually.
- Connector: Dashed line to next step

**Step 2 — Identify**
- Number: "02"
- Icon: `Fingerprint` (24px)
- Title: Identify
- Body: Assign each product a digital passport. Auto-generate QR codes, GTINs, and EU-compliant identifiers.

**Step 3 — Verify**
- Number: "03"
- Icon: `ShieldCheck` (24px)
- Title: Verify
- Body: AI parses certificates. Blockchain anchors documents. Compliance scores update in real time.

**Step 4 — Track**
- Number: "04"
- Icon: `MapPin` (24px)
- Title: Track
- Body: Log every lifecycle event — shipment, inspection, repair, resale. Complete audit trail, immutable and exportable.

**Step 5 — Recycle**
- Number: "05"
- Icon: `Recycle` (24px)
- Title: Recycle
- Body: Document end-of-life for EPR compliance. Mass balance ledgers. Recycled content certificates. Circular economy, proven.

**Design Note:** Steps should animate on scroll. Each step fades in + translateY(20px), 150ms stagger. Connector line draws itself (width animates). On mobile: vertical timeline with left-aligned line.

---

### Section 5: Product Screenshots

**Layout:** Full width, `color/white` background, centered  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> SEE THE PLATFORM

**Headline (48px, `color/slate-900`):**
> This Is What Compliance Looks Like When It's Done Right.

**Subhead (20px, `color/slate-500`):**
> No tabs. No carousels. Just the product.

**Screenshots (vertical stack, gap 48px, max-width 1200px, centered):**

**Screenshot 1 — Dashboard Overview**
- Full-width browser mockup
- Shows: Stats cards, recent batches, compliance alerts, QR preview
- Caption below (14px, `color/slate-500`, centered): Your command center. Every batch, every passport, every alert.

**Screenshot 2 — Batch Detail**
- Shows: Product specs, certificate status, compliance score, carbon footprint
- Caption: One screen. Every detail. From chemistry to compliance.

**Screenshot 3 — Public Passport Page**
- Shows: QR code, verified badge, product data, blockchain proof
- Caption: Your buyer scans. They see trust. Not a PDF attachment.

**Design Note:** Screenshots should be stylized — not raw screenshots. Add subtle shadow, browser chrome, and idealized data. Use Anviora color tokens within the screenshots themselves.

---

### Section 6: Features (Bento Grid)

**Layout:** Full width, `color/slate-50` background  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> PLATFORM CAPABILITIES

**Headline (48px, `color/slate-900`):**
> Everything You Need. Nothing You Don't.

**Grid (3 columns desktop, 2 tablet, 1 mobile, gap 24px):**

**Large Card 1 (span 2 cols) — Digital Passports**
- Background: `color/white`, subtle gradient to `color/primary-subtle`
- Icon: `QrCode` (32px, `color/primary`)
- Title (24px): Digital Product Passports
- Body (16px): Generate EU-compliant Battery Passports per Regulation 2023/1542. QR-coded, machine-readable, and instantly verifiable by any buyer with a phone.
- Tag: "EU Regulation Ready"

**Small Card 1 — AI Certificate Parsing**
- Icon: `Sparkles` (32px)
- Title: AI-Powered Data Entry
- Body: Upload any PDF — BIS, EPR, UN38.3, IEC 62133. Our AI extracts 40+ fields automatically. No manual copying at 11 PM.

**Large Card 2 (span 2 cols) — Verification**
- Background: Gradient
- Icon: `ShieldCheck` (32px)
- Title: Blockchain Verification
- Body: Anchor certificates to the Bitcoin blockchain via OpenTimestamps. Buyers verify document integrity in seconds. Free. No crypto wallet needed.
- Tag: "Trust Tier: Anchored"

**Small Card 2 — Lifecycle Tracking**
- Icon: `GitBranch` (32px)
- Title: Lifecycle Tracking
- Body: Log manufacture, shipment, repair, resale, and recycling. Immutable audit trail with SHA-256 hash chain.

**Small Card 3 — Compliance Alerts**
- Icon: `Bell` (32px)
- Title: Proactive Alerts
- Body: 30-day warnings before BIS certificates expire. Compliance score drops below 70%. Carbon footprint reports due. Never miss a deadline.

**Small Card 4 — Carbon Footprint**
- Icon: `Leaf` (32px)
- Title: Carbon Calculator
- Body: Calculate kg CO₂e per kWh. Get A–G performance class. Ready for EU carbon footprint declarations.

**Small Card 5 — Analytics**
- Icon: `BarChart3` (32px)
- Title: Export Analytics
- Body: Compliance trends. Certificate expiry heatmaps. Batch status breakdown. Know where you stand before your buyer asks.

**Small Card 6 — Public Pages**
- Icon: `Globe` (32px)
- Title: Public Passport Viewer
- Body: Anyone scans your QR code. They see a consumer-safe product passport. No login. No friction. Instant trust.

**Card Hover:** Lift 2px, shadow intensifies to `shadow-lg`, border shifts to `color/primary` at 30% opacity.

---

### Section 7: Industries

**Layout:** Full width, `color/white` background  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> BUILT FOR YOUR INDUSTRY

**Headline (48px, `color/slate-900`):**
> One Platform. Multiple Verticals.

**Grid (2×2 on desktop, 1 col mobile, gap 24px, max-width 1000px, centered):**

**Card 1 — Battery**
- Icon: `Battery` (40px, `color/primary`)
- Title (24px): Battery Manufacturing
- Body: Li-ion, LiPo, EV packs, stationary BESS. BIS IS 16046. EU Battery Regulation 2023/1542. UN38.3. Carbon footprint. Recycled content.
- Link: "Explore Anviora Battery →"
- Tag: "Available Now"

**Card 2 — Textile**
- Icon: `Shirt` (40px) — or custom textile icon
- Title: Textile & Apparel
- Body: EU REACH. OEKO-TEX. GOTS. Fiber composition. Dye batch tracking. Export documentation for Tirupur to Europe.
- Link: "Explore Anviora Textile →"
- Tag: "Available Now"

**Card 3 — Electronics**
- Icon: `Cpu` (40px, `color/slate-400`)
- Title: Electronics
- Body: RoHS. WEEE. EPR registration. Component traceability. Coming Q4 2026.
- Link: "Join Waitlist →"
- Tag: "Coming Soon"
- Style: Muted opacity (60%)

**Card 4 — Automotive**
- Icon: `Car` (40px, `color/slate-400`)
- Title: Automotive
- Body: AIS-156. AIS-038. EV traction packs. ELV directives. Supply chain due diligence.
- Link: "Join Waitlist →"
- Tag: "Coming Soon"
- Style: Muted opacity (60%)

---

### Section 8: Developer Platform

**Layout:** Full width, `color/slate-900` background  
**Padding:** 120px vertical

**Section Header (centered, `color/white`):**

**Label (14px, uppercase, `color/primary`):**
> FOR DEVELOPERS & INTEGRATORS

**Headline (48px, `color/white`):**
> Build on Anviora.

**Subhead (20px, `color/slate-400`):**
> API-first architecture. Native integrations. Webhooks. SDKs. Connect your ERP, your warehouse, your entire stack.

**Features (horizontal, 4 columns, gap 32px):**

**Feature 1 — REST API**
- Icon: `Code2` (32px, `color/primary`)
- Title (20px, `color/white`): REST API
- Body (16px, `color/slate-400`): Create batches, generate passports, fetch compliance scores. Full CRUD. JSON responses. OpenAPI spec.
- Code snippet (mono, 14px):
  ```
  POST /v1/batches
  {
    "product_name": "Li-Ion Pack 48V",
    "quantity": 500,
    "compliance_market": "EU"
  }
  ```

**Feature 2 — ERP Integrations**
- Icon: `Plug` (32px)
- Title: ERP Integrations
- Body: Native Tally Prime connector. SAP RFC. Zoho Books. Extract bills of materials, supplier invoices, and GST-linked transactions automatically.

**Feature 3 — Webhooks**
- Icon: `Webhook` (32px)
- Title: Real-Time Webhooks
- Body: Get notified when certificates expire, compliance scores change, or passports are scanned. Build reactive workflows.

**Feature 4 — SDKs**
- Icon: `Package` (32px)
- Title: SDKs
- Body: Node.js. Python. Go. Drop-in libraries for passport generation, QR encoding, and verification.

**CTA (centered, margin-top 48px):**
- Button: "View API Documentation" → `/docs`
- Style: `Button/Secondary` on dark bg (white border, white text)

---

### Section 9: Testimonials

**Layout:** Full width, `color/slate-50` background  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> TRUSTED BY EXPORTERS

**Headline (48px, `color/slate-900`):**
> They Ship to Europe. We Handle the Paperwork.

**Testimonial Cards (horizontal scroll on mobile, 3-col grid desktop, gap 24px):**

**Card 1:**
- Quote (20px, italic): "Before Anviora, we spent 3 days preparing compliance docs for every EU shipment. Last month we did it in 20 minutes. Our German buyer actually complimented us on how professional our Battery Passports looked."
- Author: Rajesh Mehta
- Role: Export Manager
- Company: [Battery Manufacturer], Gujarat
- Avatar: Placeholder
- Stat: "85% faster documentation"

**Card 2:**
- Quote: "The BIS certificate expiry alerts alone saved us from a production halt. We renewed 48 hours before expiry. That single alert probably saved us ₹15 lakhs in delayed shipments."
- Author: Priya Krishnan
- Role: Compliance Officer
- Company: [Textile Exporter], Tamil Nadu
- Stat: "Zero missed deadlines since onboarding"

**Card 3:**
- Quote: "I had no idea what a Battery Passport was. Anviora walked us through it. We shipped our first order to the Netherlands last week. The buyer scanned the QR and saw everything. Instant credibility."
- Author: Arjun Patel
- Role: Founder
- Company: [Battery Startup], Hyderabad
- Stat: "First export in 14 days"

**Stats Row (centered, margin-top 64px, horizontal, gap 64px):**

| Stat | Label |
|---|---|
| 150+ | Indian Exporters Onboarded |
| 2,400+ | Passports Generated |
| 12 | European Markets Served |
| 85% | Faster Documentation |
| ₹20L+/yr | Avg Consultant Cost Saved |

**Stat style:** Number (48px, `color/primary`, weight 700) + Label (14px, `color/slate-500`)

---

### Section 10: Pricing Teaser

**Layout:** Full width, `color/white` background  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> PRICING

**Headline (48px, `color/slate-900`):**
> Simple Pricing. No Hidden Fees.

**Three Cards (gap 24px, max-width 1100px, centered):**

**Card 1 — Starter**
- Price: "Free"
- Subtitle: "For first-time exporters"
- Features:
  - 1 user
  - 3 batches/month
  - Basic product passport
  - QR code generation
  - Email support (48h)
- CTA: "Start Free" → `/signup`
- Style: Muted border

**Card 2 — Growth (Highlighted)**
- Badge: "Most Popular"
- Price: "₹4,999" + "/month"
- Subtitle: "For growing manufacturers"
- Features:
  - 5 users
  - 50 batches/month
  - AI certificate parsing
  - Compliance gap analysis
  - Certificate expiry alerts
  - Blockchain anchoring
  - Priority support (24h)
- CTA: "Start 14-Day Trial" → `/signup?plan=growth`
- Style: Top border 4px `color/primary`, slight scale, elevated shadow

**Card 3 — Enterprise**
- Price: "Custom"
- Subtitle: "For large-scale operations"
- Features:
  - Unlimited users
  - Unlimited batches
  - Dedicated account manager
  - Custom integrations
  - SLA + phone support
  - On-premise deployment option
  - Audit assistance
- CTA: "Contact Sales" → `/contact`
- Style: Navy border accent

**Below cards (centered, margin-top 32px):**

**Text (14px, `color/slate-500`):**
> All plans include: EU Battery Passport generation, QR codes, public passport pages, and basic compliance tracking. No setup fees. Cancel anytime.

**Link:** "See full pricing comparison →" → `/pricing`

---

### Section 11: FAQ

**Layout:** Full width, `color/slate-50` background  
**Padding:** 120px vertical

**Section Header (centered, margin-bottom 64px):**

**Label (14px, uppercase, `color/primary`):**
> QUESTIONS

**Headline (48px, `color/slate-900`):**
> We've Got Answers.

**FAQ Items (max-width 800px, centered, single column):**

**Q1: What exactly is a Digital Product Passport?**
> A Digital Product Passport (DPP) is a digital record containing sustainability, traceability, and compliance data for a product. Under EU Battery Regulation 2023/1542, every EV, LMT, and industrial battery above 2kWh sold in the EU must have one by February 2027. Anviora generates, hosts, and maintains these passports for you.

**Q2: Is my certificate data secure?**
> Absolutely. We use AES-256 encryption at rest and TLS 1.3 in transit. Your data is stored in AWS Mumbai by default. We're GDPR-compliant and working toward ISO 27001 certification. Your certificates never leave Indian servers unless you explicitly choose EU storage.

**Q3: Do I need a compliance team to use Anviora?**
> No. Anviora is built for teams of one. Our AI handles the heavy lifting — you upload certificates and review the output. Most customers are fully operational within 2 hours of signup. If you can use Zoho Books, you can use Anviora.

**Q4: What if EU regulations change?**
> We track regulatory changes in real-time. When the EU updates the Battery Regulation or adds new requirements, we update the platform automatically. You'll get a notification and a clear checklist of what's new. Your existing passports update too.

**Q5: Can my European buyers verify the passports?**
> Yes — and they don't need an account. Every QR code links to a public passport page that shows compliance status, certificate validity, and blockchain proof. Buyers can verify in 10 seconds with any phone camera.

**Q6: What certificates do I need to start?**
> At minimum: BIS certification, EPR registration, and UN38.3 test report for batteries. Don't have them? The platform shows you exactly which ones you're missing and how to get them. We'll even pre-fill the application forms.

**Q7: Is there a setup fee or lock-in period?**
> No setup fee. No lock-in. Cancel anytime. We offer a 14-day free trial on Growth plans so you can verify it works for your exact use case before paying.

**Q8: Does this work with Tally?**
> Yes. Our native Tally Prime connector extracts bills of materials, supplier invoices, and GST-linked transactions directly into Anviora. No manual data entry. This is a feature no global competitor offers.

**Design Note:** Accordion style. Plus/minus toggle. Smooth height transition. Expanded state has subtle left border in `color/primary`.

---

### Section 12: Final CTA

**Layout:** Full width, `color/slate-900` background  
**Padding:** 120px vertical  
**Background texture:** Very subtle dot grid pattern (white, 5% opacity)

**Content (centered, max-width 720px):**

**Headline (48px, `color/white`):**
> Ready to Digitize Your Products?

**Subhead (20px, `color/slate-400`):**
> Join 150+ Indian exporters who've simplified their compliance workflow. Free for small exporters. 14-day trial for growing teams.

**CTA Row (centered, gap 16px, margin-top 32px):**

- **Primary:** "Book a Demo" → `/demo`
  - Style: `Button/Primary/Lg` (indigo bg)

- **Secondary:** "Start Free" → `/signup`
  - Style: Ghost button, white border, white text

**Trust line (centered, margin-top 32px, 14px, `color/slate-500`):**
> No credit card required. Setup takes 10 minutes.

---

## 2. Product: Anviora Battery

**URL:** `/battery`  
**Meta Title:** Anviora Battery — Digital Product Passports for Battery Manufacturers  
**Meta Description:** Generate EU-compliant Battery Passports, track BIS certificates, and verify every cell from factory to recycler. Built for Indian battery exporters.

---

### Section 1: Hero

**Layout:** Full width, `color/slate-50` background  
**Padding:** 160px top, 80px bottom

**Eyebrow:**
> ANVIORA BATTERY

**Headline (72px):**
> The Identity Layer for Every Battery You Ship.

**Subhead (20px):**
> EU Battery Regulation 2023/1542. BIS IS 16046. UN38.3. Carbon footprint. One platform. One record. Zero paperwork anxiety.

**CTAs:**
- "Request Demo" (primary)
- "See Sample Passport" (secondary)

**Right visual:** Battery passport QR scan mockup — phone scanning a battery, passport data appearing

---

### Section 2: The Compliance Cliff

**Layout:** 2-column (text left, timeline right)  
**Padding:** 120px vertical

**Left:**

**Headline (48px):**
> February 2027. The Deadline That Won't Move.

**Body (18px):**
> The EU Battery Passport becomes mandatory on 18 February 2027. Batteries without a valid passport cannot legally enter the EU market. Your European buyers will demand upstream compliance documentation before placing purchase orders.

**Body:**
> Anviora Battery ensures you're ready — not scrambling.

**Right — Timeline:**

| Date | Milestone |
|---|---|
| Aug 2024 | CE marking mandatory on ALL batteries |
| Feb 2025 | Carbon footprint declaration (EV batteries) |
| Feb 2026 | Carbon footprint expands to industrial >2kWh |
| **Feb 2027** | **Battery Passport MANDATORY** |
| Aug 2027 | Due diligence obligations active |
| Aug 2028 | Recycled content disclosure mandatory |
| 2031 | Hard minimum recycled content targets |

**Timeline style:** Vertical line, dot markers. Current position highlighted. Feb 2027 in `color/danger` with pulsing ring.

---

### Section 3: Battery Passport Data

**Layout:** Full width, `color/white`  
**Padding:** 120px vertical

**Headline (centered):**
> What Goes Into a Battery Passport?

**4 Access Tiers (grid, 2×2):**

**Tier 1 — Public (QR Scan)**
- Manufacturer ID, battery chemistry
- Carbon footprint total
- Recycled content %
- Rated capacity, voltage ranges
- Warranty period
- EU Declaration of Conformity

**Tier 2 — Legitimate Interest**
- Cathode/anode/electrolyte composition
- Part numbers for replacement
- Dismantling diagrams
- Tools required, safety measures

**Tier 3 — Authorities**
- Complete test reports
- Notified body assessments
- Market surveillance data

**Tier 4 — Individual Battery**
- Real-time performance
- State of health (SoH)
- Lifecycle event log

**Design:** Each tier as a card. Tier 1 highlighted (most relevant to buyers). Visual: QR code icon → lock icon → shield icon → signal icon.

---

### Section 4: Features Deep Dive

**Layout:** Alternating left/right (image left, text right / text left, image right)  
**Padding:** 80px per feature block

**Feature 1 — AI Certificate Parsing**
- Headline: "Upload a PDF. Get 40+ Fields."
- Body: Drag and drop your BIS, EPR, UN38.3, IEC 62133, and MSDS certificates. Our AI reads them in seconds. Manufacturer details. Chemistry. Test dates. Hazardous substances. Auto-populated. You just review.
- Visual: Split-screen — PDF on left, parsed form on right

**Feature 2 — Carbon Footprint Calculator**
- Headline: "A–G Performance Class. Calculated Automatically."
- Body: Input your bill of materials. We calculate kg CO₂e per kWh using PEF methodology. Get your performance class. Ready for EU Annex II declarations. Third-party verification workflows built in.
- Visual: Gauge meter animation (A→G)

**Feature 3 — Certificate Expiry Tracking**
- Headline: "Never Miss a Renewal Again."
- Body: BIS IS 16046 (24 months). UN38.3 (24 months recency). IEC 62133 (36 months). MSDS (36 months). Visual timeline. 30-day, 7-day, and day-of alerts. Email + in-app.
- Visual: Timeline with colored markers (green → amber → red)

**Feature 4 — Blockchain Anchoring**
- Headline: "Prove It. Forever."
- Body: Hash your certificate PDF. Submit to OpenTimestamps. Store proof in our system. Buyers verify on the Bitcoin blockchain. Free. No wallet needed. Immutable trust.
- Visual: Certificate → hash → chain link → Bitcoin icon → verified badge

**Feature 5 — Mass Balance Ledger**
- Headline: "Track Every Gram of Recycled Content."
- Body: EU Article 8 requires book-and-claim accounting for recycled cobalt, lithium, nickel, and lead. Our ledger tracks incoming, allocated, and balance amounts. Audit-ready. Atomic updates. No negative balances.
- Visual: Scale/balance with material breakdown

---

### Section 5: India + EU Dual Compliance

**Layout:** 2-column comparison  
**Padding:** 120px vertical

**Headline (centered):**
> One Data Set. Two Regulatory Masters.

**Left Column — India Domestic**
- BIS Certification (IS 16046)
- EPR Registration (CPCB)
- BWM Rules 2022 Compliance
- PLI Phase II Documentation
- AIS-156 / AIS-038 Testing
- QR code traceability mandate

**Right Column — European Union**
- EU Battery Regulation 2023/1542
- CE Marking & Declaration of Conformity
- Carbon Footprint Declaration (Annex II)
- Due Diligence Policy (Art. 48)
- Recycling & Recycled Content (Art. 8)
- Battery Passport (Art. 77)

**Center bridge:**
> The same underlying data — carbon footprint, recycled content, supplier identities, mass balance — serves both regulatory masters. Enter it once. Stay compliant everywhere.

---

### Section 6: Integration

**Layout:** Full width, `color/slate-50`  
**Padding:** 120px vertical

**Headline:**
> Plays Nice With Your Stack.

**Logos (horizontal, grayscale):**
- Tally Prime
- SAP
- Zoho Books
- Supabase
- AWS

**Body:**
> Native Tally connector. SAP RFC integration. Zoho Books sync. Extract BOMs, supplier invoices, and GST transactions automatically.

**CTA:** "View Integrations →"

---

### Section 7: CTA

**Headline:**
> Ship Your First Compliant Battery This Month.

**Subhead:**
> 14-day free trial. No setup fee. Cancel anytime.

**CTAs:** "Request Demo" / "Start Free Trial"

---

## 3. Product: Anviora Textile

**URL:** `/textile`  
**Meta Title:** Anviora Textile — Digital Product Passports for Textile Exporters  
**Meta Description:** Track fiber composition, manage sustainability certifications, and generate EU-compliant textile DPPs. From Tirupur to Europe.

---

### Section 1: Hero

**Eyebrow:**
> ANVIORA TEXTILE

**Headline:**
> From Fiber to Final Product. Fully Traced.

**Subhead:**
> EU ESPR textile DPP. REACH. OEKO-TEX. GOTS. Fiber composition. Dye batch tracking. One platform for every textile exporter in India.

**CTAs:**
- "Request Demo"
- "See Textile Passport Sample"

---

### Section 2: The Textile DPP Challenge

**Headline:**
> 40 SKUs. 12 Certificates. One Audit.

**Body:**
> Textile exporters manage BIS certificates, EU REACH compliance, OEKO-TEX documentation, and sustainability reports across dozens of SKUs. Every audit is a scramble through spreadsheets and email threads.

**Body:**
> Anviora Textile turns that chaos into a single source of truth.

**Visual:** Before/After comparison — messy spreadsheet vs. clean Anviora dashboard

---

### Section 3: Textile-Specific Features

**Feature 1 — Fiber Composition Tracking**
- Headline: "Cotton. Polyester. Viscose. Traced."
- Body: Track fiber percentages by batch. Organic vs. conventional. Recycled content. GOTS-certified vs. standard. Every lot documented.

**Feature 2 — Dye Batch Management**
- Headline: "Every Dye Lot. Every Color. On Record."
- Body: Log dye chemicals, water usage, and effluent treatment. Link dye batches to finished product lots. Complete chemical traceability.

**Feature 3 — Certification Management**
- Headline: "OEKO-TEX. GOTS. BCI. All in One Place."
- Body: Upload certificates. Auto-extract expiry dates. Get 30-day renewal alerts. Never scramble for a missing cert during an audit again.

**Feature 4 — EU ESPR Readiness**
- Headline: "Ready for the 2028 Mandate."
- Body: The EU Ecodesign for Sustainable Products Regulation (ESPR) will mandate textile DPPs in late 2028. Get ahead now. Build your data foundation before the deadline.

---

### Section 4: India-EU FTA Advantage

**Headline:**
> The India-EU FTA Is Live. Compliance Is the New Tariff.

**Body:**
> The India-EU Free Trade Agreement (concluded January 2026) eliminates tariffs on most textile exports. But the new non-tariff barrier is compliance. European buyers now require:
- Fiber composition disclosure
- Chemical compliance (REACH)
- Sustainability certifications
- Digital product traceability

**Body:**
> Anviora Textile gives you the documentation to compete — and win.

**Stat:** "$7.6B — India's annual textile exports to EU"

---

### Section 5: CTA

**Headline:**
> Tirupur. Surat. Panipat. Europe.

**Subhead:**
> Wherever you weave, we'll get you there.

**CTAs:** "Request Demo" / "Start Free Trial"

---

## 4. Pricing

**URL:** `/pricing`  
**Meta Title:** Pricing — Plans for Every Scale | Anviora  
**Meta Description:** Simple, transparent pricing for Indian battery and textile exporters. Free for starters. ₹4,999/month for growing teams. Enterprise plans available.

---

### Section 1: Hero

**Headline:**
> Plans for Every Scale.

**Subhead:**
> No hidden fees. No setup costs. Cancel anytime.

**Toggle:** Monthly / Annual (Save 20%)

---

### Section 2: Pricing Cards

**Three cards, same structure as homepage pricing teaser but expanded:**

**Starter — Free**
- For first-time exporters
- 1 user
- 3 batches/month
- Basic product passport
- QR code generation
- Public passport pages
- Email support (48h response)
- **CTA:** "Start Free"

**Growth — ₹4,999/mo (or ₹3,999/mo annual)**
- For growing manufacturers
- 5 users
- 50 batches/month
- AI certificate parsing
- Compliance gap analysis
- Certificate expiry alerts
- Blockchain anchoring
- Carbon footprint calculator
- Mass balance ledger
- Priority support (24h response)
- **CTA:** "Start 14-Day Trial"
- **Highlighted:** "Most Popular" badge

**Enterprise — Custom**
- For large-scale operations
- Unlimited users
- Unlimited batches
- Dedicated account manager
- Custom integrations (SAP, Oracle)
- SLA + phone support
- On-premise deployment option
- Audit assistance
- White-label passport pages
- **CTA:** "Contact Sales"

---

### Section 3: Feature Comparison Table

**Full comparison table (responsive, horizontal scroll on mobile):**

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Users | 1 | 5 | Unlimited |
| Batches/mo | 3 | 50 | Unlimited |
| Product Passports | Basic | Full | Full + White-label |
| QR Codes | ✅ | ✅ | ✅ |
| AI Certificate Parsing | — | ✅ | ✅ |
| Compliance Scoring | Basic | Full | Full |
| Certificate Alerts | — | ✅ | ✅ |
| Blockchain Anchoring | — | ✅ | ✅ |
| Carbon Calculator | — | ✅ | ✅ |
| Mass Balance | — | ✅ | ✅ |
| DGFT TRACE Claims | — | ✅ | ✅ |
| API Access | — | — | ✅ |
| Tally Integration | — | ✅ | ✅ |
| Support | Email (48h) | Priority (24h) | SLA + Phone |

**Table style:** Clean, minimal borders, checkmarks in `color/success`, dashes in `color/slate-300`. Header row sticky on scroll.

---

### Section 4: FAQ (Pricing-Specific)

**Q: Is there a free trial?**
> Yes. Growth plans include a 14-day free trial. No credit card required. Full access to all Growth features.

**Q: What happens if I exceed my batch limit?**
> We'll notify you when you hit 80% of your limit. You can upgrade instantly or purchase additional batch packs.

**Q: Can I switch plans?**
> Anytime. Upgrade takes effect immediately. Downgrade takes effect at the end of your billing cycle.

**Q: Do you offer discounts for MSMEs?**
> Yes. We participate in the DGFT TRACE scheme, which can reimburse up to 75% of your platform cost. We help you file the paperwork.

**Q: Is there an annual discount?**
> Yes. Pay annually and save 20%.

**Q: What payment methods do you accept?**
> Credit/debit cards, UPI, net banking, and Razorpay. Invoicing available for Enterprise plans.

---

### Section 5: CTA

**Headline:**
> Still Have Questions?

**Subhead:**
> Talk to our team. We'll help you find the right plan.

**CTA:** "Contact Sales" / "Book a Call"

---

## 5. About

**URL:** `/about`  
**Meta Title:** About Anviora — Built in India for Indian Exporters  
**Meta Description:** We're building the identity infrastructure that Indian manufacturers need to compete globally. Learn about our mission, team, and story.

---

### Section 1: Hero

**Headline:**
> Built in India. Trusted in Europe.

**Subhead:**
> Anviora is the Digital Product Identity Platform for Indian manufacturers. We believe compliance shouldn't be a walled garden only big corporations can afford.

**Visual:** Abstract India→EU map with connection lines, or team photo (if available)

---

### Section 2: Our Story

**Layout:** Narrative text block, max-width 680px, centered

**Body:**
> In 2025, we watched a mid-size battery manufacturer in Gujarat lose a €2 million export contract because their Battery Passport was missing a carbon footprint declaration. The shipment sat at Rotterdam for 18 days. The buyer walked.

> That shouldn't happen. Not in a country with 4,000+ registered battery producers and some of the world's most sophisticated manufacturing talent.

> We started Anviora to democratize export compliance. To give a 50-person factory in Pune the same regulatory firepower as a Fortune 500 giant. To build infrastructure, not consulting.

> Today, we're helping Indian exporters generate EU-compliant product passports, track certificates, and manage compliance from a single platform. We're not just software. We're your competitive advantage.

---

### Section 3: Mission & Values

**Headline:**
> What We Believe.

**Values (2×2 grid):**

**1. Compliance Is Infrastructure, Not a Service**
> You don't call a consultant every time you need to send an email. Compliance should be the same — built into your operations, not bolted on.

**2. Indian Manufacturers Deserve Global Tools**
> The best compliance software shouldn't only be available to German auto giants. We're building for Gujarat, Tamil Nadu, and Maharashtra first.

**3. Trust Is Verifiable**
> Self-declared compliance is dead. The future is blockchain-anchored, QR-verified, instantly auditable product identity.

**4. Deadlines Don't Wait**
> February 2027 is not negotiable. We're here to make sure you're ready — not scrambling.

---

### Section 4: Team

**Headline:**
> The People Behind Anviora.

**Team Grid (3 columns, gap 32px):**

For each team member:
- Avatar (120px circle)
- Name (20px, weight 600)
- Role (16px, `color/slate-500`)
- Brief bio (16px)
- LinkedIn link

**Placeholder until photos secured:**
> "We're a team of engineers, designers, and regulatory experts based in India. We've built supply chain software for Fortune 500s. Now we're building for the factories that power India's export economy."

---

### Section 5: Join Us

**Headline:**
> We're Hiring.

**Body:**
> Engineers. Designers. Regulatory experts. Sales leaders. If you care about Indian manufacturing and want to build infrastructure that matters, we want to hear from you.

**CTA:** "See Open Roles →" / careers@anviora.com

---

## 6. Compliance Hub: EU Battery Regulation

**URL:** `/compliance/eu-battery-regulation`  
**Meta Title:** EU Battery Regulation 2023/1542 — Complete Guide | Anviora  
**Meta Description:** Everything Indian battery exporters need to know about EU Battery Regulation 2023/1542, Battery Passports, carbon footprint, and compliance deadlines.

**Purpose:** SEO + education + lead generation. This page captures high-intent search traffic.

---

### Section 1: Hero

**Headline:**
> EU Battery Regulation 2023/1542: The Complete Guide for Indian Exporters.

**Subhead:**
> Everything you need to know about Battery Passports, carbon footprint declarations, and compliance deadlines. Written for Indian manufacturers.

**CTA:** "Get Compliant — Book Demo"

**Table of Contents (sticky sidebar on desktop):**
1. What Is the EU Battery Regulation?
2. Who Does It Apply To?
3. Battery Passport Requirements
4. Carbon Footprint Rules
5. Recycled Content Targets
6. Critical Deadlines
7. How Anviora Helps
8. FAQ

---

### Section 2: What Is the EU Battery Regulation?

**Body (long-form, ~500 words):**
> Regulation (EU) 2023/1542 on batteries and waste batteries entered into force on 17 August 2023. It repeals the previous Battery Directive 2006/66/EC and establishes the most comprehensive battery sustainability framework in history.

> The regulation applies to **all batteries placed on the EU market**, regardless of where they are manufactured. If you export batteries from India to Europe, you are subject to this regulation.

> Key areas covered:
> - Sustainability and safety requirements
> - Labelling and information (QR codes, CE marking)
> - Extended Producer Responsibility
> - Due diligence for raw materials
> - Carbon footprint declarations
> - **Battery Passports (mandatory from Feb 2027)**
> - Recycled content targets

---

### Section 3: Battery Passport Deep Dive

**Body:**
> Article 77 mandates that a Battery Passport become compulsory from **18 February 2027** for:
> - Electric vehicle (EV) batteries
> - Light means of transport (LMT) batteries
> - Industrial batteries with capacity > 2 kWh

**Data Requirements (expandable sections):**

**Tier 1 — Public Data:**
> Any person can scan the QR code and see: manufacturer ID, battery chemistry, carbon footprint total, recycled content %, rated capacity, voltage ranges, warranty period, EU declaration of conformity.

**Tier 2 — Legitimate Interest:**
> Registered professionals, recyclers, and second-life operators can access: detailed cathode/anode/electrolyte composition, part numbers for replacement, dismantling diagrams, tools required, safety measures.

**Tier 3 — Authorities:**
> Notified bodies, market surveillance, and the European Commission receive complete test reports proving compliance.

**Tier 4 — Individual Battery:**
> Real-time performance and durability parameters, state of health (SoH) data.

---

### Section 4–6: Carbon Footprint, Recycled Content, Deadlines

*(Similar long-form educational content, ~300–500 words each)*

---

### Section 7: How Anviora Helps

**Headline:**
> Don't Read 200 Pages. Just Use Anviora.

**Feature list (same as product page, but contextualized):**

**Feature 1:** "Auto-Generated Battery Passports"
> Upload your certificates. We generate a fully compliant Battery Passport per Annex XIII. QR-coded. GS1 Digital Link ready. Hosted for 10+ years.

**Feature 2:** "Carbon Footprint Calculator"
> Calculate kg CO₂e/kWh. Get A–G performance class. Export-ready declaration. PEF methodology aligned with ISO 14040/44.

**Feature 3:** "Certificate Management"
> Track BIS, UN38.3, IEC 62133, MSDS. Expiry alerts. Renewal workflows. Never miss a deadline.

**CTA:** "Start Free Trial" / "Book Demo"

---

### Section 8: FAQ

**5–7 specific questions about EU Battery Regulation.**

---

## 7. Compliance Hub: India BWM Rules

**URL:** `/compliance/india-bwm-rules`  
**Meta Title:** India Battery Waste Management Rules — Complete Guide | Anviora  
**Meta Description:** Understand India BWM Rules 2022 (amended 2025), EPR registration, QR code mandates, and recycled content targets for battery manufacturers.

**Structure:** Mirror of EU guide but India-focused.

---

### Section 1: Hero

**Headline:**
> India BWM Rules 2022 (Amended 2025): The Complete Compliance Guide.

---

### Section 2: Key Requirements

**Body:**
> The Battery Waste Management Rules, 2022 (amended January 2025) apply to all 4,022 CPCB-registered battery producers and 487 recyclers in India.

**Key mandates:**
- EPR registration via CPCB portal
- QR code-based traceability (post-February 2025 amendment)
- Recycled content targets: 5% FY 2027–28 → 20% FY 2030–31
- Collection and recycling obligations
- Annual returns filing

---

### Section 3: QR Code Mandate

**Body:**
> The 2025 amendment mandates QR code-based traceability for all registered producers. Every battery must carry a QR code linking to:
> - Producer details
> - Battery specifications
> - EPR registration number
> - Recycling instructions

**Anviora connection:**
> Anviora generates BWMR-compliant QR codes automatically. Link to our hosted pages or export data for the CPCB portal.

---

### Section 4: EPR & Recycled Content

**Body:**
> Producers must meet escalating recycled content targets:

| Year | Lead | Other Metals |
|---|---|---|
| FY 2027–28 | 5% | 2% |
| FY 2028–29 | 10% | 5% |
| FY 2029–30 | 15% | 10% |
| FY 2030–31 | 20% | 15% |

---

### Section 5: How Anviora Helps

*(Same structure as EU guide)*

---

## 8. Contact / Demo

**URL:** `/demo` or `/contact`  
**Meta Title:** Book a Demo — See Anviora in Action  
**Meta Description:** Book a personalized demo of Anviora. See how battery and textile exporters generate digital passports, track compliance, and ship to Europe.

---

### Section 1: Hero

**Headline:**
> See Anviora in Action.

**Subhead:**
> 30 minutes. Personalized walkthrough. No pressure.

---

### Section 2: Form + Info (2-column)

**Left — Form:**
- First Name (required)
- Last Name (required)
- Work Email (required)
- Company Name (required)
- Industry: Battery / Textile / Other
- Company Size: 1–10 / 11–50 / 51–200 / 200+
- Phone (optional)
- Message (optional)
- Submit: "Book My Demo"

**Right — Info:**

**What to expect:**
1. A 30-minute video call
2. Personalized to your industry
3. Live product walkthrough
4. Q&A with our compliance team
5. No commitment required

**Contact details:**
- Email: hello@anviora.com
- Phone: +91 [number]
- Hours: Mon–Fri, 9:30 AM – 6:30 PM IST
- Address: [India office address]

**Trust signals:**
- "Response within 4 business hours"
- "Free for qualifying exporters"
- "No credit card required"

---

### Section 3: Alternative CTA

**Headline:**
> Not Ready for a Demo?

**Links:**
- "Explore the platform →" /product
- "Read compliance guides →" /compliance
- "Start free trial →" /signup

---

## 9. Blog / Resources Hub

**URL:** `/blog`  
**Meta Title:** Resources & Guides for Indian Exporters | Anviora  
**Meta Description:** Compliance guides, regulatory updates, and export strategies for Indian battery and textile manufacturers.

---

### Section 1: Hero

**Headline:**
> Compliance Doesn't Have to Be Complicated.

**Subhead:**
> Guides, updates, and strategies for Indian exporters.

---

### Section 2: Featured Article

**Large card:** Most important recent article  
- Image, category, title, excerpt, read time, date

---

### Section 3: Category Filters

**Tabs:** All | Battery | Textile | EU Compliance | India Compliance | Product Updates | Export Strategy

---

### Section 4: Article Grid

**3-column grid of article cards:**
- Thumbnail image
- Category badge
- Title
- Excerpt (2 lines)
- Author + Date + Read time

---

### Section 5: Newsletter CTA

**Headline:**
> Stay Ahead of Regulatory Changes.

**Body:**
> EU regulations change. Indian rules get amended. We'll keep you informed.

**Form:** Email input + "Subscribe"

---

## 10. Navigation & Footer

### 10.1 Navigation

**Logo:** Anviora wordmark (left)  
**Height:** 72px  
**Background:** `color/white` with `backdrop-blur-md` on scroll

**Left Nav:**
- Products (dropdown)
  - Anviora Battery → /battery
  - Anviora Textile → /textile
- Industries (dropdown)
  - Battery → /battery
  - Textile → /textile
  - Electronics (coming soon)
- Pricing → /pricing
- Resources (dropdown)
  - EU Battery Regulation Guide → /compliance/eu-battery-regulation
  - India BWM Rules Guide → /compliance/india-bwm-rules
  - Blog → /blog
  - API Docs → /docs

**Right Nav:**
- "Book Demo" → /demo (primary button)
- Mobile: Hamburger menu

**Dropdown style:**
- Background: `color/white`
- Border: 1px solid `color/slate-200`
- Border Radius: `radius-lg`
- Shadow: `shadow-lg`
- Padding: 8px
- Items: 40px height, hover `color/slate-50`

### 10.2 Footer

**Background:** `color/slate-900`  
**Padding:** 80px top, 40px bottom  
**Text color:** `color/slate-400`

**4-Column Grid:**

**Column 1 — Product**
- Anviora Battery
- Anviora Textile
- Pricing
- Changelog
- API Docs

**Column 2 — Resources**
- EU Battery Regulation Guide
- India BWM Rules Guide
- Blog
- Compliance Calculator
- Help Center

**Column 3 — Company**
- About
- Careers
- Contact
- Press Kit

**Column 4 — Legal**
- Privacy Policy
- Terms of Service
- Cookie Policy
- Security

**Bottom Bar:**
- Left: Anviora logo (white, small)
- Center: "© 2026 Anviora. Built in India for Indian exporters. 🇮🇳"
- Right: Social icons (LinkedIn, Twitter/X, YouTube)

---

## Appendix: Copy Patterns & Tone Reference

### Headline Formulas

| Formula | Example |
|---|---|
| Every X Needs Y | "Every Product Needs an Identity" |
| Verb + Noun + Preposition | "Build Trust Into Every Product" |
| From A to B | "From Factory Floor to European Warehouse" |
| Number + Noun | "200-Page Rulebooks" |
| Question | "Ready to Digitize Your Products?" |

### CTA Patterns

| Type | Copy |
|---|---|
| Primary action | "Book Demo" |
| Secondary action | "See Live Passport" |
| Low commitment | "Start Free" |
| Urgency | "Start 14-Day Trial" |
| Navigation | "Explore Anviora Battery →" |
| Video | "Watch Video (2 min)" |

### Microcopy Samples

**Empty state:**
> No batches yet. Create your first batch and generate a compliant passport in under 5 minutes.

**Success:**
> Passport generated. Your QR code is ready for printing.

**Warning:**
> Your BIS certificate expires in 14 days. Renew now to avoid shipment delays.

**Error:**
> We couldn't parse this PDF. Try a clearer scan, or enter the details manually.

**Loading:**
> Generating your passport...

**Onboarding:**
> Welcome to Anviora. Let's create your first digital product passport.

---

*End of content document. All copy is approved for design and development. Questions? Reach out on `#design-anviora`.*
