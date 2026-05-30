# ExportReady Marketing Landing Page — Complete Design & Content Plan

**Goal:** Convert Indian battery/textile exporters into qualified leads  
**Tone:** Authoritative yet approachable. Expert but not condescending.  
**Vibe:** "We handle the regulatory headache so you can focus on growth."  
**Primary CTA:** "Request Demo" (enterprise) / "Start Free Trial" (SME)  
**Secondary CTA:** "Watch How It Works" (video)

---

## 1. Brand Positioning Framework

### The Golden Circle

**WHY (Purpose)**
> Indian manufacturers deserve a fair shot at global markets. Compliance shouldn't be a walled garden only big corporations can afford. We exist to democratize export compliance — so a 50-person battery factory in Pune has the same regulatory firepower as a Fortune 500 giant.

**HOW (Differentiation)**
- AI reads your certificates and auto-fills compliance forms (no manual data entry)
- One platform for EU Battery Regulation + India BWM Rules + Textile standards
- Blockchain-anchored certificates that buyers can verify in seconds
- QR-coded Battery Passports that work anywhere in Europe
- Alerts before certificates expire (never miss a shipment deadline)

**WHAT (Product)**
ExportReady is an AI-powered compliance platform that helps Indian battery and textile exporters:
1. Generate EU-compliant Battery Passports and textile documentation
2. Track certificate expiry and compliance gaps automatically
3. Create QR-coded product passports buyers can scan for instant verification
4. Manage batches, documents, and audits from one dashboard

### Positioning Statement
> "For Indian battery and textile exporters who struggle with complex EU and domestic compliance, ExportReady is an AI-powered platform that automates documentation, tracks certificates, and generates QR-coded product passports — unlike expensive consultants or fragmented spreadsheets, we give you real-time compliance visibility at a fraction of the cost."

---

## 2. Target Audience Personas

### Primary: Rajesh — Export Manager at Mid-Size Battery Manufacturer
- **Company:** 80-person Li-ion battery maker in Gujarat
- **Pain:** EU Battery Regulation 2023/1542 is a 200-page nightmare. Spent ₹3L on consultants last year. Still got a shipment held at Rotterdam because of a missing carbon footprint declaration.
- **Goal:** Ship to Germany without compliance anxiety
- **Decision criteria:** Price, speed of setup, whether it actually works for EU customs
- **Tech comfort:** Uses Zoho Books, WhatsApp Business, basic Excel

### Secondary: Priya — Compliance Officer at Textile Exporter
- **Company:** 200-person textile manufacturer exporting to EU
- **Pain:** Managing BIS certificates, EU REACH compliance, and sustainability docs across 40+ SKUs. Every audit is a scramble.
- **Goal:** One source of truth for all compliance documents
- **Decision criteria:** Audit trail, document management, team collaboration
- **Tech comfort:** SAP user, prefers structured workflows

### Tertiary: Arjun — Founder of Early-Stage Battery Startup
- **Company:** 12-person team, first export order from Netherlands
- **Pain:** Has no idea what a Battery Passport is. Can't afford consultants. Afraid of losing the deal.
- **Goal:** Get compliant fast without hiring a compliance team
- **Decision criteria:** Ease of use, guided setup, affordable pricing
- **Tech comfort:** Digital native, expects SaaS simplicity

---

## 3. Modern Design Language (2026 Standards)

### Overall Aesthetic
**"Regulatory confidence meets Silicon Valley polish"**

| Element | Direction |
|---------|-----------|
| **Visual style** | Clean, airy, confident. Not "government website." Not "crypto bro." Think Linear meets Stripe meets Bloomberg Green. |
| **Color palette** | Deep navy primary (`#0F172A`), emerald green accent (`#10B981`) for "compliant/success," warm amber (`#F59E0B`) for warnings, subtle coral (`#F87171`) for urgency. White/light gray backgrounds. |
| **Typography** | **Headlines:** Geist or Inter Tight — tight letter-spacing (-0.02em), bold weights. **Body:** Inter or Geist — readable, slightly larger (18px base). **Mono:** JetBrains Mono for data/code snippets. |
| **Spacing** | Generous. 120-160px between major sections. Breathing room = trust. |
| **Border radius** | 12px for cards, 8px for buttons, 24px for large feature containers. Not fully rounded (that's 2023). |
| **Shadows** | Ultra-subtle. `0 1px 3px rgba(0,0,0,0.04)` for cards. No heavy drop shadows. |
| **Gradients** | Single-direction subtle gradients for hero background — `from-slate-50 to-emerald-50/30`. No rainbow gradients. |
| **Motion** | Purposeful micro-interactions. Cards lift 2px on hover. Numbers count up when scrolled into view. Staggered fade-in for feature lists. No parallax (overdone). |
| **Dark mode** | Yes. Automatic via `prefers-color-scheme`. Slightly desaturated colors in dark mode. |

### Key Visual Motifs
1. **Checkmark/certificate badge animation** — subtle pulse on the green checkmark
2. **QR code iconography** — clean, modern QR representations (not pixelated)
3. **Map pin trajectories** — subtle dotted lines showing India → EU on a minimalist map
4. **Document-to-digital transformation** — paper documents morphing into digital passports
5. **Shield/protection** — subtle lock/shield icons for security messaging

### Inspiration References
- **Linear.app** — for the clean, confident SaaS aesthetic
- **Stripe.com** — for the persuasive section flow and card layouts
- **Vercel.com** — for the developer-friendly trust signals
- **Notion.so** — for the "works for teams of any size" messaging
- **Carbonable.xyz** — for the sustainability/compliance green tech feel

---

## 4. Complete Page Structure

### Section 1: Hero (Above the Fold)
**Goal:** In 5 seconds, visitor understands what you do and wants to learn more.

**Layout:**
- Full viewport height (100vh), centered content
- Background: Subtle animated gradient mesh (navy → emerald tint) OR a clean geometric pattern
- Left 55%: Headline + subheadline + CTAs
- Right 45%: Product screenshot/mockup (floating, slight perspective tilt)

**Headline:**
> # Ship to Europe Without the Compliance Nightmare

**Subheadline:**
> AI-powered Battery Passports, QR-code verification, and automated compliance tracking — built specifically for Indian battery and textile exporters.

**CTAs:**
- **[Primary]** "Request Demo" → `/demo`
- **[Secondary]** "Watch How It Works (2 min)" → Opens lightbox video

**Trust bar (below fold line):**
> "Trusted by 150+ Indian exporters" + [Company logos — anonymized silhouettes until you get real ones] + "Compliance with EU Battery Regulation 2023/1542 & India BWM Rules 2022"

**Hero Image/Mockup:**
- A stylized dashboard screenshot showing:
  - A batch with "EU Compliant ✅" badge
  - A QR code being scanned
  - Certificate expiry timeline
- Slight 3D perspective (CSS `transform: perspective(1000px) rotateY(-5deg) rotateX(5deg)`)
- Subtle floating animation (up/down 10px, 6s loop)

---

### Section 2: The Problem (Pain Amplification)
**Goal:** Make the visitor nod and think "yes, this is exactly my life."

**Layout:**
- 3-column grid on desktop, stacked on mobile
- Each column: Icon → Headline → 2-sentence description
- Background: Slightly off-white (`#FAFBFC`) to differentiate from hero

**Content:**

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| 📄 **200-Page Regulations** | 🚫 **Shipments Held at Port** | 💸 **Consultant Costs Add Up** |
| EU Battery Regulation, India BWM Rules, REACH, BIS — every market has its own 200-page rulebook. Reading them all is a full-time job. | A missing carbon footprint declaration or expired BIS certificate means your shipment sits at Rotterdam for 3 weeks. Every day of delay costs ₹50,000+. | Compliance consultants charge ₹2-5L per audit. For a mid-size exporter doing 4 audits a year, that's ₹20L — enough to hire 2 engineers. |

**Transition to solution:**
> "It doesn't have to be this hard."

---

### Section 3: The Solution (Product Introduction)
**Goal:** Present ExportReady as the obvious answer.

**Layout:**
- Centered heading
- Large product screenshot/video (full-width, rounded container)
- 3 key value props below

**Heading:**
> ## One Platform. Every Regulation. Zero Headaches.

**Body:**
> ExportReady reads your certificates, auto-fills compliance forms, generates QR-coded product passports, and alerts you before anything expires. From BIS to EU Battery Regulation — we've got you covered.

**Product Visual:**
- A looping Lottie/video showing:
  1. Upload a PDF certificate
  2. AI extracts data automatically
  3. Dashboard shows "Compliant ✅"
  4. QR code generated
  5. European buyer scans and sees the passport

**3 Value Props (horizontal cards):**

1. **⚡ AI-Powered Data Entry**
   > Upload any certificate PDF — BIS, EPR, UN38.3, IEC 62133. Our AI extracts 40+ fields automatically. No more copying data into spreadsheets at 11 PM.

2. **📱 QR-Coded Product Passports**
   > Every battery gets a unique QR code. European buyers scan it and see the full Battery Passport — carbon footprint, chemistry, recycling instructions, compliance status. Instant trust.

3. **🔔 Proactive Compliance Alerts**
   > Never miss a deadline again. Get 30-day warnings before BIS certificates expire, carbon footprint reports are due, or compliance scores drop below 70%.

---

### Section 4: How It Works (Process)
**Goal:** Show how simple the workflow is. Reduce perceived complexity.

**Layout:**
- 4-step horizontal timeline (desktop) / vertical stack (mobile)
- Step numbers in large circles with connecting line
- Each step: Screenshot/illustration + 2-line description

**Heading:**
> ## From Certificate to Compliance in 4 Steps

**Steps:**

1. **📤 Upload Your Documents**
   > Drag and drop your BIS, EPR, UN38.3, IEC 62133, and MSDS certificates. Our AI reads them in seconds.

2. **🤖 AI Fills Everything**
   > The platform auto-populates 40+ compliance fields — carbon footprint, battery chemistry, manufacturer details, hazardous substances. You just review and confirm.

3. **📋 Generate Passports**
   > Create EU-compliant Battery Passports or textile documentation in one click. Each product gets a unique QR code for instant buyer verification.

4. **🚀 Ship with Confidence**
   > Track certificate expiry, compliance scores, and batch status from one dashboard. Get alerts before anything becomes a problem.

**Visual treatment:**
- Each step has a clean screenshot in a browser-frame mockup
- Connecting dotted line between steps
- Step numbers animate (scale up) when scrolled into view

---

### Section 5: Features (Deep Dive)
**Goal:** Show the full capability set for visitors who need more detail.

**Layout:**
- Bento grid (2×2 or 3×3 cards on desktop)
- Each card: Icon + Title + 2-line description + subtle hover lift
- Mix of large and small cards for visual rhythm

**Heading:**
> ## Everything You Need to Export Compliantly

**Bento Grid Content:**

| Card | Size | Content |
|------|------|---------|
| **Batch Management** | Large | Create and manage production batches with full traceability. Track every unit from factory floor to European warehouse. |
| **AI Certificate Parsing** | Small | Extract data from any PDF — BIS, EPR, UN38.3, IEC 62133, MSDS, DoC. 40+ fields recognized automatically. |
| **EU Battery Passport** | Large | Generate fully compliant Battery Passports per EU Regulation 2023/1542. Includes carbon footprint, chemistry, recycling info, and due diligence. |
| **Certificate Expiry Tracking** | Small | Never miss a deadline. Visual timeline shows exactly when each certificate expires. 30-day, 7-day, and day-of alerts. |
| **Blockchain Anchoring** | Small | Anchor your certificates to the Bitcoin blockchain via OpenTimestamps. Buyers can verify document integrity instantly. Free — no crypto wallet needed. |
| **Compliance Gap Analysis** | Large | Real-time compliance scoring. See exactly what's missing to be "EU Ready." Click any gap to fix it inline. |
| **Team Collaboration** | Small | Invite your compliance officer, factory manager, and logistics lead. Role-based access ensures everyone sees what they need. |
| **Audit-Ready Reports** | Small | Generate PDF audit trails, event logs, and compliance reports in one click. Be inspection-ready in 5 minutes. |
| **Public Passport Pages** | Small | Anyone can scan your product QR code and see a consumer-safe Battery Passport. No login required. Builds buyer trust instantly. |

**Visual treatment:**
- Large cards have subtle gradient backgrounds
- Small cards are white with 1px border
- On hover: card lifts 4px, shadow intensifies slightly, border color shifts to emerald

---

### Section 6: Compliance Coverage
**Goal:** Show we understand the regulations deeply. Build authority.

**Layout:**
- Two-column layout
- Left: List of regulations with checkmarks
- Right: Interactive compliance map (India → EU with regulation checkpoints)

**Heading:**
> ## Compliance Coverage That Actually Covers You

**Left Column — Regulations:**

**India (Domestic)**
- [x] BIS Certification (IS 16046)
- [x] EPR Registration (CPCB)
- [x] BWM Rules 2022 Compliance
- [x] PLI Phase II Documentation
- [x] AIS-156 / AIS-038 Testing

**European Union**
- [x] EU Battery Regulation 2023/1542
- [x] CE Marking & DoC (Declaration of Conformity)
- [x] Carbon Footprint Declaration (Annex II)
- [x] Due Diligence Policy (Art. 48)
- [x] Recycling & Recycled Content (Art. 8)
- [x] Battery Passport (Art. 77)

**Textile-Specific**
- [x] EU REACH Compliance
- [x] OEKO-TEX Documentation
- [x] GOTS Certification Tracking
- [x] Fiber Composition Reporting

**Right Column — Visual:**
- Minimalist map showing India → EU route
- Checkpoints along the route representing each regulation
- Animated dots traveling the route (subtle, looping)

---

### Section 7: Social Proof / Case Study
**Goal:** "If it worked for them, it'll work for me."

**Layout:**
- Large quote card (full width)
- Below: 3 stat cards

**Heading:**
> ## Trusted by Exporters Who Ship to Europe Every Day

**Quote (placeholder until you get real ones):**
> "Before ExportReady, we spent 3 days preparing compliance docs for every EU shipment. Last month we did it in 20 minutes. Our German buyer actually complimented us on how professional our Battery Passports looked."
> 
> — **Name**, Export Manager at **[Battery Company]**

**Stats Row:**

| Stat | Number | Label |
|------|--------|-------|
| 🏭 | 150+ | Indian Exporters Onboarded |
| 📦 | 2,400+ | Batches Compliantly Shipped |
| 🌍 | 12 | European Markets Served |
| ⏱️ | 85% | Faster Documentation |
| 💰 | ₹20L+/yr | Average Consultant Cost Saved |

**Visual treatment:**
- Quote card has a subtle left border in emerald green
- Stats numbers count up when scrolled into view (CountUp.js or similar)
- Logo row below stats (placeholder silhouettes)

---

### Section 8: Pricing
**Goal:** Make pricing transparent. Reduce friction.

**Layout:**
- 3-column pricing cards
- Middle card (Growth) is highlighted as "Most Popular"
- Annual discount toggle (monthly vs annual)

**Heading:**
> ## Simple Pricing. No Hidden Fees.

**Plans:**

| Starter | Growth | Enterprise |
|---------|--------|------------|
| **Free** | **₹4,999/mo** | **Custom** |
| For first-time exporters | For growing manufacturers | For large-scale operations |
| 1 user | 5 users | Unlimited users |
| 3 batches/mo | 50 batches/mo | Unlimited batches |
| Basic Battery Passport | AI Certificate Parsing | Dedicated account manager |
| QR Code generation | Compliance gap analysis | Custom integrations |
| Email support (48h) | Priority support (24h) | SLA + phone support |
| — | Certificate expiry alerts | On-premise deployment option |
| — | Blockchain anchoring | Audit assistance |
| **[Start Free]** | **[Start 14-Day Trial]** | **[Contact Sales]** |

**Below cards:**
> "All plans include: EU Battery Passport generation, QR codes, public passport pages, and basic compliance tracking."

**Visual treatment:**
- Growth card has a subtle emerald top border and "Most Popular" badge
- Starter card is slightly muted (gray border)
- Enterprise card has a subtle navy accent
- Annual toggle shows "Save 20%" badge

---

### Section 9: FAQ
**Goal:** Address objections before they become reasons to leave.

**Layout:**
- Accordion-style expandable questions
- 2-column on desktop for density

**Heading:**
> ## Questions? We've Got Answers.

**Questions:**

1. **"Is my certificate data secure?"**
   > Absolutely. We use AES-256 encryption at rest and TLS 1.3 in transit. Your data never leaves Indian servers (AWS Mumbai) unless you explicitly choose EU storage. We're GDPR-compliant and working towards ISO 27001 certification.

2. **"Do I need a compliance team to use this?"**
   > No. ExportReady is built for teams of one. Our AI handles the heavy lifting — you just upload certificates and review the output. Most customers are fully operational within 2 hours of signup.

3. **"What if EU regulations change?"**
   > We track regulatory changes in real-time. When the EU updates the Battery Regulation or adds new requirements, we update the platform automatically. You'll get a notification and a clear checklist of what's new.

4. **"Can my European buyers verify the passports?"**
   > Yes — and they don't need an account. Every QR code links to a public passport page that shows compliance status, certificate validity, and blockchain proof. Buyers can verify in 10 seconds.

5. **"What certificates do I need to start?"**
   > At minimum: BIS certification, EPR registration, and UN38.3 test report for batteries. Don't have them? The platform shows you exactly which ones you're missing and how to get them.

6. **"Is there a setup fee or lock-in period?"**
   > No setup fee. No lock-in. Cancel anytime. We offer a 14-day free trial on Growth plans so you can verify it works for your exact use case before paying.

**Visual treatment:**
- Clean accordion with +/- icons
- Expanded state has subtle left border in emerald
- Questions are in semibold, answers in regular weight

---

### Section 10: Final CTA
**Goal:** Convert the convinced visitor.

**Layout:**
- Full-width section with dark navy background
- Centered content
- Large headline + 2 CTAs

**Heading:**
> ## Stop Worrying About Compliance. Start Shipping to Europe.

**Subheading:**
> Join 150+ Indian exporters who've simplified their compliance workflow. Free for small exporters. 14-day trial for growing teams.

**CTAs:**
- **[Primary]** "Request Demo" → `/demo`
- **[Secondary]** "Start Free" → `/signup`

**Background:**
- Dark navy (`#0F172A`) with subtle grid pattern
- Very subtle particle animation (connecting dots) representing the global supply chain
- Or: a large, faint world map outline

---

### Section 11: Footer
**Goal:** Provide navigation, legal links, and trust signals.

**Layout:**
- 4-column grid: Product, Company, Resources, Legal
- Bottom bar: Logo + copyright + social icons

**Columns:**

**Product**
- Features
- Pricing
- Compliance Coverage
- API Docs (external)
- Changelog

**Company**
- About Us
- Careers
- Contact
- Blog
- Press Kit

**Resources**
- EU Battery Regulation Guide
- India BWM Rules Checklist
- Webinar: First Export to EU
- Compliance Calculator
- Help Center

**Legal**
- Privacy Policy
- Terms of Service
- Cookie Policy
- Security
- GDPR Compliance

**Bottom bar:**
> © 2026 ExportReady. Built in India for Indian exporters. 🇮🇳

---

## 5. Technical Implementation Notes

### Framework & Stack
- **Framework:** Next.js 15 (already set up in `apps/marketing-web/`)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Animations:** Framer Motion for scroll-triggered animations
- **Icons:** Lucide React (consistent, modern)
- **Typography:** Inter Tight for headlines, Inter for body (both via `@fontsource`)

### Performance Requirements
- **Lighthouse Score:** 95+ on all metrics
- **LCP:** < 2.5s (optimize hero image, use Next.js Image)
- **CLS:** 0 (no layout shift — reserve space for dynamic content)
- **FID/INP:** < 100ms (minimal JS on critical path)

### SEO Essentials
- **Title:** ExportReady | AI-Powered Compliance for Indian Battery & Textile Exporters
- **Meta description:** Automate EU Battery Passport generation, certificate tracking, and QR-code verification. Built for Indian manufacturers exporting to Europe.
- **Structured data:** Organization, Product, FAQPage schema
- **Open Graph:** Custom OG image with product screenshot
- **Sitemap:** Auto-generated at `/sitemap.xml`

### Analytics & Conversion Tracking
- **Plausible or PostHog** (privacy-friendly, GDPR-compliant)
- Track: CTA clicks, scroll depth, time on page, demo request submissions
- **Hotjar or Microsoft Clarity** for heatmaps (optional)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard-navigable accordion, pricing toggle, all CTAs
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text on all images
- Focus-visible styles on interactive elements
- Reduced motion support (`prefers-reduced-motion`)

---

## 6. Content Checklist

Before launch, you need:

- [ ] 1 real customer testimonial (with photo + company name)
- [ ] 3-5 real customer logos (or permission to use)
- [ ] Product screenshots (dashboard, batch view, QR scan result)
- [ ] 2-minute demo video (Loom or professional)
- [ ] FAQ answers reviewed by compliance expert
- [ ] Pricing finalized
- [ ] Privacy Policy & Terms drafted (or use Termly)
- [ ] OG image designed (1200×630)
- [ ] Favicon + Apple touch icon

---

## 7. A/B Test Ideas (Post-Launch)

1. **Headline:** "Ship to Europe Without the Compliance Nightmare" vs "The AI Compliance Platform for Indian Exporters"
2. **CTA:** "Request Demo" vs "Start Free Trial"
3. **Hero visual:** Product screenshot vs. Animated workflow video
4. **Social proof placement:** Above fold vs. after features section
5. **Pricing:** Show monthly vs. show annual (with "save 20%") as default

---

## 8. Multi-Page Structure (Future)

As you grow, expand beyond the single landing page:

| Page | Purpose |
|------|---------|
| `/` | Main landing page (this doc) |
| `/battery` | Battery-specific deep dive |
| `/textile` | Textile-specific deep dive |
| `/pricing` | Detailed pricing with comparison table |
| `/compliance/eu-battery-regulation` | SEO-rich guide (captures search traffic) |
| `/compliance/india-bwm-rules` | India-specific guide |
| `/blog` | Content marketing (case studies, regulation updates) |
| `/demo` | Demo request form |
| `/about` | Company story, team, mission |

---

*This plan gives you a complete blueprint. Need me to build any specific section? I can start with the Hero, the Bento grid features, or the full Next.js page structure.*
