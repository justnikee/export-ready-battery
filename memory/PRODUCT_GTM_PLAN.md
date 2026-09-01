# Product, market, and first-customer plan

**Date:** 2026-08-22  
**Status:** Live intent — use this, not historical `docs/*` GTM essays.  
**Scope:** Battery product only. Code is truth; this file is the commercial plan.

---

## 1. Verdict in one page

You have **enough product to sell a paid pilot**. You do **not** have enough honesty, packaging, or a first-customer motion.

The DPP spine is real: draft batch → India/EU field checks → activate → BPAN serials → QR/labels → public passport → hash-chained SHIP/INSTALL/RECYCLE → partner/regulator views → Razorpay quota.

Almost everything around that spine is a second product (fleet, BMS, regulatory RSS, scan gamification, DGFT estimator, Tally LAN sync) or an overclaim (Art. 8 2030 minima as 2026 blockers, “JRC carbon”, “DGFT TRACE 75%”, fake landing stats).

**Do not build more features until a named manufacturer has issued real serials.** The next 90 days are: tighten the spine, hide the rest, pick 15 target accounts, run a concierge pilot, get one public reference.

| Question | Answer |
|----------|--------|
| Do we have the features we need for a first customer? | **Yes, for a passport pilot.** No, if we keep claiming CPCB filing, certified LCA, GS1-as-a-service, or EU DPP registry. |
| What is the #1 product problem? | Over-wide dashboard + overstated compliance claims. |
| What is the #1 commercial problem? | Zero production users, request-access gate, no outbound ICP, branding split (ExportReady / AnvayaLabs / ANVIORA). |
| Who is the first customer? | Mid-size India **pack assembler** already exporting (or contracted to export) LMT / industrial >2 kWh packs to the EU — not Exide / Ola / Agratas. |
| How do we get in? | Sell through the **EU buyer’s mandate** (“no passport, no PO after Feb 2027”), not through “blockchain DPP platform.” |

---

## 2. What we actually have

Verified against `apps/battery-web` + `services/battery-api` on 2026-08-22. `platform-core` is **not in this repo**; auth and Razorpay live in battery-api.

### Ready for a paying pilot

| Capability | Where |
|------------|--------|
| Signup, JWT, team invites, onboarding | Auth + `/onboarding` |
| Batch wizard, CSV import, templates | `/dashboard/batches` |
| Activation with quota + server validators | `POST /batches/{id}/activate` |
| BPAN V2 serials | `{REGION}-{MFR}-{CHEM}-{YYYY}-{NNNNN}` |
| QR + label PDF/ZIP (ACTIVE/ARCHIVED only) | Batch detail + export jobs |
| Public passport `/p/{uuid}` + 3 access tiers | Tenant / partner magic-link / regulator key |
| Lifecycle via `LifecycleService` (hash chain) | Dispatch + Lifecycle pages |
| W3C VC issue/download (if `VC_SIGNING_KEY` set) | Passports tab |
| OpenTimestamps cert anchors | Compliance anchors |
| India: EPR ledger, Form 3 CSV, BIS/EPR/IEC fields | India Compliance + Settings |
| EU: AR fields, carbon result required, Art. 78 views | EU pages + validator |
| Carbon **estimator** (not PEFCR) | Carbon calculator |
| Razorpay credit packs (not subscriptions) | Billing |
| API keys + webhooks | Developer (Growth) |
| Supplier portal + CMRT | Due diligence (Growth) |

### Partial / estimator (do not sell as “done”)

- GS1 Digital Link only if the tenant **already has a GTIN**; otherwise QR is `/p/{uuid}` on **our** domain.
- CPCB / BIS / NANDO: format check or scrape; activation accepts PENDING PDFs.
- DGFT: internal tracker + hardcoded HSN rates; no ICEGATE.
- Mass balance: self-attested book-and-claim.
- Carbon: simplified factors + 0.15 kWh/kWh heuristic; not notified-body LCA.
- Tally: XML to **factory LAN** `localhost:9000`; cloud cannot reach it.
- Telemetry: REST ingest only; no OEM BMS connectors.
- EU 56-attr score: presence, not legal completeness.

### Stub / dangerous if shown to customers

| Item | Issue |
|------|--------|
| `POST /billing/top-up` | **Removed** (ADR 029). Was a tenant-JWT free mint. |
| SSO / SAML, multi-entity | Entitlement keys only |
| Analytics Money/Scans | Hardcoded `+8%` / `+24%` trends; date range unused |
| BIS IS 16046 checklist | All rows flip with one VERIFIED flag |
| Landing stats | `10,000+ passports`, `99.8% accuracy`, `50+ production lines` — **no production users** |
| Marketing TRACE 75% rebate | No TRACE filing code |
| EU Art. 8 | 2031 minima used as **errors now** |
| EU “Art. 11” | Code cites due diligence; Art. 11 is **removability**; DD is Ch. VII |

---

## 3. Dashboard layout — what to keep, hide, merge

Nav today (`lib/products.ts`): **~24 items in 7 groups**. A first-week exporter needs ~6.

### Current IA (problem)

| Group | Items | Problem |
|-------|--------|---------|
| Overview | Dashboard, Analytics | Analytics overclaims |
| Production | Batches, Dispatch, Lifecycle, Templates, Fleet, Telemetry | Fleet ≈ Telemetry; core loop buried |
| Compliance | India, EU, Carbon, Mass Balance, DGFT | 5 compliance brains + Settings vault |
| Supply Chain | Suppliers, Regulatory | Regulatory empty without crawlers |
| Account | Team, Partners, Billing, Settings | Partners vs Team vs Suppliers |
| Developer | API Keys, Webhooks, Downloads, Docs | **Downloads buried**; operators need labels |
| Admin | Admin Panel | Signup queue; visible to all; misleading name |

### Target IA for first 90 days

**Always visible**

1. Home  
2. Batches  
3. Dispatch  
4. Lifecycle  
5. Compliance (one hub: India + EU tabs; carbon/mass-balance/DGFT as inner tabs)  
6. Settings / Team / Billing  

**Collapsed “More” after first ACTIVE batch**

- Downloads (move out of Developer)  
- Partners / Suppliers  
- Developer  

**Hide until a customer asks**

- Fleet Health  
- BMS Telemetry  
- Regulatory Intelligence  
- Analytics Money/Scans (or delete fake trends)  
- Admin Panel (role-gate in nav)  
- Templates as a top-level item (keep on batch create only)

### Page verdicts

| Page | Verdict |
|------|---------|
| Batch detail | **The product.** Keep investing here. |
| Batches list | Ready; add market filter; large-batch labels → jobs. |
| Home | Usable; don’t Activate without checklist; don’t Delete non-drafts. |
| Dispatch | Good shop-floor SHIP if scan accepts BPAN/QR URL, not UUID only. |
| Lifecycle | Real; required after ship. |
| Onboarding | Good; add GSTIN; cert **files** not just numbers. |
| Billing | Enough to take INR. |
| India Compliance | EPR ledger + Form 3 real; BIS tracker cosmetic. |
| EU Compliance | Readiness dashboard, not a filing product. |
| Carbon | Tool, not a certified declaration. |
| Analytics | Compliance tab real; Money/Scans not trustworthy. |
| Fleet / Telemetry | Duplicate; empty without BMS. Not first-customer. |
| DGFT | Spreadsheet replacement. |
| Mass balance / DD / Partners | Growth extras; keep gated. |
| Templates page | “Use” only toasts — incomplete. |

---

## 4. What we are doing wrong

1. **Selling a regulator, not a passport printer.** Buyers will ask a notified body / EU importer: “is this the official passport?” We cannot say yes. We can say: we issue serials, QR, public record, audit trail, and we store your certificates.

2. **Feature factory with 0 customers.** L-01…L-23 and S/P audits are done. The missing work is commercial: ICP, outbound, concierge onboarding, one reference pack on a real export.

3. **Starter plan blocks the reason to buy.** EU, partners, and developer API are Growth. INSTALL/RECYCLE need partner roles. ERP needs API keys. A first exporter on Starter cannot finish the loop.

4. **QR lock-in.** Default payload is `app.anvayalabs.in/p/{uuid}`. EN 18219 wants GS1 Digital Link **or** IEC 61406 on a domain **the manufacturer owns**. Printed codes on our domain are a 10-year hostage. Circuland/Circularise already sell this as the buying criterion.

5. **Three brand names.** Sidebar ANVIORA, repo ExportReady, email anvayalabs.com, marketing Anviora. Procurement will bounce.

6. **Fake social proof.** Landing `10,000+ passports` / `99.8%` / `50+ lines` will destroy the first serious sales call.

7. **India rules over-applied.** AIS-156 + AIS-038 required on **every** India batch (including stationary/UPS). PENDING PDFs count as valid.

8. **Lifecycle roles vs manufacturer JWT.** SHIP is admin; INSTALL is technician; RECYCLE is recycler. A solo factory cannot close the loop without magic-link partners — and partners are Growth-gated.

9. **Docs still describe platform-core :8081.** Agents and ops will split brains.

10. **Textile still in battery UI** (regulatory filter) while textile is out of product scope.

---

## 5. What is actually missing (prioritized)

Only items that block a first paid export or a 2027 market-surveillance scan.

### P0 — before first paid pilot

| ID | Gap | Why |
|----|-----|-----|
| G1 | Honest packaging copy (product + marketing) | Legal and sales risk |
| G2 | Kill or admin-key `POST /billing/top-up` | **Done** — route deleted, ADR 029 |
| G3 | Starter (or a Pilot SKU) includes partners + developer + EU fields | Otherwise the loop is gated |
| G4 | Art. 8 2030 % as **warnings dated 2031**, not activation errors | Blocks honest EU packs today |
| G5 | AIS-156/038 only when category is EV/LMT traction | Stops false fails |
| G6 | Nav slim + hide Fleet/Telemetry/Regulatory/fake analytics | First-week usability |
| G7 | One brand + one public domain | Trust |
| G8 | Email (Resend) always on in the environment you demo | Invites/magic links |
| G9 | Oracle DB migrations 107+108 applied | Integrity spine |
| G10 | Dispatch scan accepts UUID **or** BPAN **or** `/p/{uuid}` QR | Warehouse reality |

### P1 — before printing labels for EU shipment

| ID | Gap |
|----|-----|
| G11 | Customer-owned passport domain (IEC 61406) so QR survives vendor exit |
| G12 | GSTIN / LUT / factory address on tenant profile |
| G13 | Public passport: Annex XIII clusters + public vs restricted honesty |
| G14 | Carbon UI: “screening estimate, not PEFCR / not third-party verified” |
| G15 | Official-looking label: CE, capacity, chemistry, QR quiet zone, human-readable ID (EN 18220-ish) |
| G16 | Concierge: we issue the first 50 passports **with** the customer |

### P2 — before claiming “EU registry ready”

| ID | Gap |
|----|-----|
| G17 | Map DIN DKE SPEC 99100 / EC July 2026 data-point list vs our fields |
| G18 | EU DPP registry connector when the Commission system is callable |
| G19 | Notified-body / verifier export pack (technical file zip) |
| G20 | Real GS1 Company Prefix flow **or** document “bring your own GTIN” |

**Do not build next:** in-house BMS, Catena-X, SAP, scan gamification, textile, admin-web rewrite, `packages/ui` adoption.

---

## 6. Competitive analysis (August 2026)

### European passport platforms

| Vendor | Strength | Weakness vs us | Price signal |
|--------|----------|----------------|--------------|
| **Circulor** | Mine-to-cell, Volvo EX90, Catena-X | Enterprise, no India EPR/Tally | ~€100k–500k |
| **Circularise** | Supplier ZK sharing, Honda, GS1 DL, customer subdomain | No India dual-use | Sales-led |
| **Spherity** | did:web + VCs | Not India GTM | Sales-led |
| **Minespider** | Provenance, on-prem, Renault/Ford | India via Tata Elxsi MOBIUS+ | From **€11,900/year** |
| **osapiens / Siemens / T-Systems** | ESG suite / Catena-X / managed | Too heavy for MSME | T-Systems from **€1,499/month** for 5k passports |
| **Circuland** | EN 18219 both ID types, **customer QR domain**, public pricing, free tier | No India BIS/EPR/PLI | Public; free tier |

### India-native competitors (the ones that will eat us if we wait)

| Vendor | What they have | Threat |
|--------|----------------|--------|
| **Tata Technologies WATTSync** | BPAN 21-char Battery Aadhaar, EU BR alignment, BMS/SoH, Agratas/JLR pilots, Tata trust | Default for anyone in Tata orbit |
| **Tata Elxsi + Minespider MOBIUS+** | Bharat Mobility launch, India deployment lead | Default for large OEM IT budgets |
| **In-house at Ola / Exide / Amara Raja / Agratas** | They will not buy a 2-person SaaS for cell plants | Do not pitch gigafactories as first logos |

### Where we can actually win

**Wedge:** Indian **pack assemblers** (not cell gigafactories) who:

- already sell or are quoting LMT / industrial packs to EU importers,
- run Tally + Excel, not SAP,
- cannot pay Circulor,
- need **India EPR/BIS paperwork in the same system** as the EU QR.

Nobody else honestly productises **dual-use India + EU at MSME price**. WATTSync will win enterprises. Circuland will win EU brands who own the passport. We win the Indian factory that has to **issue** the passport because the German importer said so.

### Positioning statement (use this)

> Anviora issues EU-scannable battery passports for Indian pack manufacturers — serials, QR, public record, and India certificate vault — at a price a Coimbatore factory can pay. We are not your notified body, not Catena-X, and not a mine-traceability network.

### Pricing vs market

Our Growth ₹44,999 / 5,000 passports (~₹9/passport) is **cheap vs Europe** and **expensive vs Indian MSME software**. That is fine for exporters. It is wrong for domestic-only EPR.

Pilot offer (recommended):

- **90-day Pilot:** ₹49,000 (or waived against a case study)  
- 1,000 passport credits  
- Partners + API + EU fields included  
- White-glove: we sit with their compliance person and issue the first batch  
- Not Starter. Not “request access and wait.”

---

## 7. First-customer strategy

### Who (ICP)

**Primary:** India pack assembler, 30–200 people, ₹10–80 crore, LFP/NMC packs for:

- e-bike / e-scooter **white-label for EU brands** (LMT — passport mandatory 18 Feb 2027)
- industrial / BESS / material-handling packs **>2 kWh** into EU
- medical / power-tool packs if industrial category applies

**Buyer:** Owner or export/compliance manager. Trigger: EU customer email “we need a battery passport / QR by 2027 or we dual-source.”

**Do not chase first:** Exide, Amara Raja, Ola, Reliance, Agratas, Adani. They have WATTSync/MOBIUS+/internal IT.

**Named-style targets (illustrative — refresh the list, then outreach):**

- White-label LMT pack exporters in Coimbatore, Pune, Ahmedabad, Gurugram, Hosur  
- E-rickshaw/LFP pack makers exploring EU last-mile (Trontek-class, Neuron-class, Grinntech-class)  
- BESS integrators quoting EU C&I  
- **EU importers / brands** who will **mandate** their Indian supplier — sell the importer, they bring the factory  

### How we get the first 3 (90-day playbook)

**Week 1–2 — unblock sales**

1. Pick **one public name**: Anviora (or ExportReady — pick, kill the other).  
2. Strip fake stats from marketing + battery-web landing. Replace with deadline + sample passport.  
3. Open **self-serve Growth trial** or founder-provisioned tenants (stop waiting on Admin signup queue as the only path).  
4. Publish one **live demo passport** (public, no login) like Circuland does.  
5. One-pager PDF: “What we do / what we don’t / Feb 2027 / ₹49k pilot.”

**Week 2–6 — outbound (founder-led)**

- 15 accounts, not 150.  
- Channel: LinkedIn + WhatsApp + warm intros (IESA, SMEV, state EV cells, CA/CS who file EPR).  
- Message: “Your EU buyer will ask for a QR-linked passport in 2027. We will issue your first 50 with you this month.”  
- Parallel: 10 EU e-bike / industrial battery importers — “we onboard your Indian pack supplier.”  
- Trade: IESA events, Bharat Mobility follow-ups, Electronica India — **booth only if a demo passport is live**.

**Week 4–10 — concierge pilot**

- One factory, one SKU, 50–200 serials.  
- You operate the product with them (screenshare).  
- Success = labels on a crate + EU buyer can scan without an account.  
- Capture: photos, quote, before/after (Excel → QR).  
- Contract: paid pilot or credits against Year 1.

**Week 10–12 — reference**

- Case study (even anonymized: “Coimbatore LMT exporter, 120 packs, German importer”).  
- Ask the EU buyer to stay as a design partner.

### What “first customer won” means

Not: “they requested access.”  
Yes: **paid invoice or signed pilot + at least one ACTIVE batch with public QR that a third party scanned.**

---

## 8. Marketing strategy (until 3 logos)

Stop category marketing (“compliance infrastructure”, “blockchain”, “99.8%”). Start deadline marketing.

### Narrative

- **Hook:** 18 February 2027 — no digital battery passport, no EU placement (EV, LMT, industrial >2 kWh).  
- **India hook:** Battery Pack Aadhaar / BPAN + EPR QR are coming anyway; one record for both.  
- **Proof:** live passport URL, not adjectives.  
- **Offer:** 90-day pilot, we do the first batch with you.

### Channels that work at this stage

| Channel | Use |
|---------|-----|
| Founder LinkedIn (3 posts/week) | Deadline explainers, screenshot of public passport, “what Annex XIII actually means for a pack assembler” |
| Direct email/WhatsApp | ICP list |
| EU-buyer page (`marketing-web/battery/for-eu-buyers`) | Keep; this is the inbound wedge |
| SEO | “EU battery passport India exporter”, “LMT battery passport 2027” — long-tail, not “best DPP platform” |
| Partnerships | One notified-body / LCA consultant / export house — they lack software; we lack EU trust |
| Do not | Paid ads, fake testimonials, textile pages, conference keynotes without a customer |

### Claims policy (non-negotiable)

Allowed: “issues serials and QR”, “stores certificates”, “hash-chained lifecycle”, “screening carbon estimate”, “EPR ledger + Form 3 CSV for **manual** CPCB upload.”

Forbidden until true: certified Art. 7, Art. 8 compliance, CPCB live, DGFT TRACE 75%, GS1-as-a-service, 10k passports issued, 99.8% accuracy, Catena-X, “EU registry connected.”

---

## 9. 90-day execution plan (follow this)

### Days 1–14 — Pilot-ready product (engineering)

1. G1–G6, G10 (honesty, Art. 8 warnings, AIS gating, nav slim, dispatch scan).  
2. G2 mock top-up.  
3. G7 brand pass on sidebar + marketing + emails.  
4. G8/G9 ops: Resend + Oracle migrations.  
5. Sample public passport + marketing stats removed.  
6. Pilot SKU: Growth entitlements, 1,000 credits, 90 days.

Stop condition: a stranger can go register → create batch → activate → print QR → open `/p/{uuid}` without a founder on the call. (Concierge still recommended; the path must work.)

### Days 15–45 — Pipeline

- 15 ICP accounts contacted.  
- 5 demos.  
- 2 pilots in legal/verbal.  
- One EU importer conversation.

### Days 46–90 — Proof

- One ACTIVE customer batch in production (or staging that they treat as production).  
- Case study.  
- Decide: keep Fleet/Telemetry/Regulatory **deleted from nav** or kill the code paths later.

### After first 3 customers (only then)

- Customer-owned QR domain (G11) — this becomes a **sales objection** vs Circuland.  
- Annex XIII field gap vs EC 2026 data-point list.  
- Verifier export pack.  
- Tally **file import** as the supported path (not live LAN).  
- Optional: BIS working group / IESA membership for Battery Aadhaar alignment.

---

## 10. Feature include / exclude

### Include more (small, high leverage)

- Customer-owned domain for QR  
- Honest “not a notified body” badge on public passport  
- GSTIN + factory sites  
- Label PDF that a German warehouse will accept  
- WhatsApp/email magic link that a recycler actually uses  
- English + German public passport (not 24 languages first)

### Exclude until pulled by a customer

- Fleet / BMS product  
- Regulatory news feed  
- Scan leaderboards  
- Textile  
- SAP/Oracle  
- Catena-X  
- In-app DGFT filing  
- CPCB API (doesn’t exist as a clean public API)  
- SSO/SAML

---

## 11. Regulatory calendar (sell against this)

| Date | What | Our product implication |
|------|------|-------------------------|
| **18 Aug 2026** | Expanded EU labelling | Label PDF quality matters **now** |
| **18 Feb 2027** | Passport + QR mandatory (EV, LMT, industrial >2 kWh) | **The sale** |
| **18 Aug 2027** | Due diligence postponed to | DD module is **not** the first-sale feature |
| **18 Aug 2028** | Recycled-content **disclosure** | Mass balance later |
| **18 Aug 2031** | Recycled-content **minima** | Stop blocking activation in 2026 |

India: Battery Pack Aadhaar / BPAN is the domestic analogue. We already issue BPAN V2 — **align the format to the official 21-character spec as it freezes**, or we will migrate every serial.

---

## 12. How to use this file

- Next engineering sprint = §5 P0 + §3 target IA.  
- Next founder week = §7 playbook.  
- Do not reopen textile, admin-web, or packages/ui.  
- Do not treat `docs/MANUFACTURER_PERSONA_DEEP_ANALYSIS.md` or `dpp-competitive-analysis.agent.final` as current — they overstate GS1/Annex XIII completeness and chase Exide as a first logo.
