# Vertical AI Research: Battery Export Compliance
## Indian Manufacturers → EU Market · July 2026

> **Purpose:** Deep research into the real pain points of Indian battery manufacturers exporting to the EU, and a precise map of which AI features solve which problems with the highest impact. All claims are grounded in current industry reports, regulation text, and the Anviora codebase.

---

## Part 1 — The Real Pain Points

### Pain Point 1: The EU Authorized Representative Wall

**What it is:** Non-EU companies — including Indian manufacturers — cannot legally place products on the EU market without an EU-based Authorized Representative (AR) who holds the Technical File and assumes full legal liability for compliance. This person can be sued on the manufacturer's behalf.

**Why it hurts:**
- AR fees: €3,000–15,000/year for a professional service
- AR requires a complete Technical File before signing — which the manufacturer doesn't have yet
- If your Technical File is wrong and a regulator catches it, your AR gets the enforcement notice, not you — so ARs are extremely conservative and demand extensive documentation upfront
- Indian manufacturers typically discover this requirement late, after they've already quoted a customer and promised delivery

**Current gap in Anviora:** The platform doesn't help manufacturers assemble or maintain a Technical File. There's no concept of "EU AR readiness" in the compliance output.

---

### Pain Point 2: Carbon Footprint / LCA — The Data Black Hole

**What it is:** EU Battery Regulation Art. 7 requires a verified Life Cycle Assessment-based carbon footprint declaration for every battery model per manufacturing plant, using ISO 14040/44 methodology aligned to the EU PEF approach. This became mandatory for industrial batteries (>2 kWh) as of **February 18, 2026**.

**Why it hurts:**
- Indian manufacturers don't have in-house LCA expertise. Hiring an LCA consultant costs ₹3–8L per battery model
- Supplier data arrives in incompatible formats (kWh vs MJ vs tonnes CO₂), different functional units, or not at all
- Suppliers frequently don't share energy consumption data due to "confidentiality concerns" — they treat it as IP
- Transportation data is genuinely hard: end-of-life transport emissions are difficult to trace through multi-hop logistics chains
- The difference between an estimate (using secondary data) and a verified declaration (primary data) is legally significant — regulators are beginning to distinguish
- Small factories don't have metered energy data at the pack-assembly level; they have one meter for the entire building

**The specific calculation problem:** The JRC methodology requires `cell_source_country`, `assembly_energy_kwh`, `transport_mode`, `transport_distance_km`, `battery_weight_kg` — all per-pack values. Real factories know their total monthly energy bill and total units produced. They do not know energy per pack with any precision.

**Current Anviora code:** `internal/services/carbon_calculator.go` does the JRC calculation correctly but requires every field to be explicitly provided. If `assembly_energy_kwh` is missing, the calculation fails or returns junk. There's no estimation layer.

---

### Pain Point 3: Supply Chain Data Collection — 6–12 Months of Work

**What it is:** 60–80% of the data required for a Battery Passport comes from Tier 2 and Tier 3 suppliers. The DPP requires **primary data** — industry averages are no longer acceptable for carbon and material composition fields.

**Industry survey findings (2026):**
- Supply chain data collection alone takes **6–12 months** for most small brands
- That is the bottleneck — not the technology
- Most small brands **cannot name their Tier 2 suppliers** when they start the process
- Only 17 consortia (large companies) are in the EU's 2026 Operational Trials; SMEs are largely absent

**What manufacturers have to collect:**
- Material composition per battery model (cell chemistry, electrolyte, casing materials, weight breakdown)
- Recycled content percentages for cobalt, lithium, nickel, natural graphite (per supplier, per batch)
- Smelter/refiner identities (for due diligence under Art. 48)
- Energy use at cell manufacturing (Tier 1 supplier)
- Energy use at active material production (Tier 2 supplier)

**The actual process today:** A compliance manager sends emails to suppliers asking for data. Some suppliers respond with PDFs in their own format. Some respond in Excel. Some don't respond. The compliance manager manually translates everything into a spreadsheet. This is the industry norm in 2026.

**Current Anviora code:** `internal/compliance/supplier/cmrt_importer.go` handles CMRT (Conflict Minerals Reporting Template) import. These are Excel files with deeply inconsistent formats across suppliers. The importer handles a normalized format — real-world CMRTs are messier.

---

### Pain Point 4: Certificate Sprawl — Tracking Dozens of Expiry Dates Across Agencies

**What a typical Indian battery exporter needs to maintain:**

| Certificate | Agency | Validity | Lead Time to Renew |
|---|---|---|---|
| BIS IS 16046 (LIB safety) | Bureau of Indian Standards | 1–2 years | 45–60 days |
| UN38.3 (transport) | Accredited lab | Per test report | 6–10 weeks |
| IEC 62133 (safety) | International lab | Per test report | 8–12 weeks |
| EPR Registration | CPCB | Annual | 4–8 weeks |
| DGFT TRACE Claim | DGFT portal | Per shipment | Days (but portal issues) |
| EU CE Declaration of Conformity | Self-declared + AR | Per product | Depends on Technical File |
| EU Battery Carbon Footprint Declaration | Verified by notified body | Annual per model | 6–12 weeks |

**Why it hurts:**
- These expire at different times, from different agencies, through different portals
- A missed BIS renewal stops all domestic sales AND export
- A missed carbon footprint declaration (required from Feb 2026) means the battery passport is non-compliant even if everything else is right
- No single system tracks all of these — manufacturers use personal calendars or Excel sheets

**Current Anviora code:** Background worker for daily alerts (`internal/jobs/daily_alerts.go`) triggers on certificate expiry. But alerts are rule-based — "X days before expiry." No intelligence about what happens if the renewal is delayed, or what the renewal process looks like.

---

### Pain Point 5: The Compliance Score Without a Roadmap

**What it is:** EU Battery Regulation has 90+ articles. A manufacturer runs a compliance check and gets back a list of gaps. Without expertise, they don't know:
- Which gaps block EU market access immediately vs which are future deadlines
- What document or action fixes each gap
- Who inside or outside the organization needs to take action
- How long each remediation actually takes in practice

**Industry data:** 60% of compliance officers plan to invest in AI-powered compliance tools by 2026. The dominant use case is gap analysis with **remediation guidance** — not just detection.

**Current Anviora code:** `internal/compliance/battery/eu.go` returns a structured `Result` with gap field names like `carbon_footprint_missing`, `recycled_cobalt_below_threshold`, `due_diligence_policy_missing`. These are technical identifiers, not action items. A manufacturer in Pune cannot act on `due_diligence_policy_missing` without knowing what a due diligence policy is, what it must contain under Art. 11, and where to find a template.

---

### Pain Point 6: Regulatory Change Tracking — Discovered Too Late

**What it is:** EU Battery Regulation is not finished. In 2026 alone, multiple delegated acts were added:
- Carbon footprint methodology finalized and enforcement began (Feb 2026)
- Labeling requirements for chemical composition came into force (Aug 2026)
- Due diligence deadline moved from Aug 2025 → Aug 2027 (Omnibus IV, 2025)
- DPP Registry went live (July 19, 2026)

India side:
- Battery Waste Management (Amendment) Rules, 2025 — new CPCB requirements
- BIS Scheme X certification extended to September 2026
- New plastic EPR reporting cycle started July 2026

**Why it hurts:** A manufacturer who last checked regulations in Q1 2026 may not know that labeling requirements now apply, or that the due diligence deadline shifted. The compliance status of their existing batches may have changed without any action on their part.

**Current Anviora code:** `internal/regulatory/classifier.go` uses keyword string matching (`strings.Contains()`) against hardcoded keyword lists. It cannot distinguish "proposed draft regulation" from "mandatory enforcement begins immediately." Both contain words like "battery" and "mandatory" — both get classified as high urgency. This is noise that erodes trust in the alert system over time.

---

### Pain Point 7: The DPP Technical Implementation Gap

**What it is:** Even if a manufacturer has all the data, turning it into a valid EU DPP requires:
- Registration with the EU DPP Registry (operational July 19, 2026)
- A globally unique BPAN V2 serial number per battery unit
- A QR code linking to the passport
- A W3C Verifiable Credential signed by a trusted issuer
- Bitcoin/blockchain timestamping for immutability proof
- Ongoing updates as the battery moves through its lifecycle (reuse, recycling)

**Why it hurts:** Most Indian SME battery manufacturers have zero IT infrastructure for this. Their "product management system" is a WhatsApp group and an Excel file. They cannot self-implement a DPP. They need a platform that does it for them — but most platforms in the market are priced for OEMs (Siemens, AVL, Circulor), not SMEs.

**Market gap:** The battery passport market is projected at $0.6B in 2026 → $3.0B by 2036 (18.8% CAGR). 61% of deployment is Cloud SaaS. But the dominant customers are OEMs (41% share) and large manufacturers — SMEs are underserved.

**Current Anviora position:** This is exactly what Anviora does. The platform issues BPAN V2 serials, QR codes, W3C VCs, and anchors to Bitcoin via OpenTimestamps. This is a real competitive advantage — but manufacturers don't know they need it yet.

---

### Pain Point 8: India ↔ EU Data Reconciliation — Same Battery, Two Compliance Worlds

**What it is:** The same physical battery unit must satisfy:
- **India side:** BIS IS 16046, UN38.3, EPR registration number on label, DGFT TRACE claim for export
- **EU side:** Carbon footprint declaration, recycled content declaration, due diligence documentation, DPP serial, CE Declaration of Conformity

These are two completely separate data models, maintained by different agencies, in different languages, in different portals. Currently, manufacturers maintain two separate workflows — sometimes with two different consultants.

**The core insight:** The underlying data is largely the same. The chemistry, capacity, safety test results, and supply chain provenance are identical. Only the *format* of the declaration changes. A single unified dataset could satisfy both regulators simultaneously.

**Current Anviora position:** This is the core product premise — "enter data once, satisfy India + EU." The codebase has separate India and EU compliance validators (`internal/compliance/battery/india.go` and `eu.go`) that both read from the same `BatchSpec` JSONB field. This is the right architecture. The gap is in making it *feel* effortless to the manufacturer — right now they still see two separate validation UIs.

---

## Part 2 — AI Features Mapped to Pain Points

### AI Feature 1: Certificate Intelligence Parser
**Solves:** Pain Point 4 (certificate sprawl), partially Pain Point 8 (data reconciliation)  
**Impact level: CRITICAL — closes the biggest product-promise gap**

**What it does:**  
A multimodal AI model that reads any battery compliance certificate PDF and returns a structured `BatchSpec`-compatible JSON. The manufacturer uploads their BIS, UN38.3, IEC 62133, or EPR registration certificate. The AI extracts every relevant field and pre-fills the batch creation form. The manufacturer reviews, corrects anything wrong, and confirms.

**Why it's the highest priority:**  
The marketing site says "AI reads your certificates for you. Drop in a BIS, EPR, UN38.3 or IEC 62133 PDF and Anviora extracts 100+ fields in seconds." This feature is promised but does not exist in the codebase. Every demo is weaker without it. Every manufacturer who tries to create a batch manually gives up.

**Accuracy benchmark:** Document AI for structured manufacturing documents achieves 99%+ extraction accuracy in 2026. For manufacturing certificate workflows, early adopters achieve 200–350% ROI by month 12 with full payback by month 6.

**Implementation approach:**
- New API endpoint: `POST /api/v1/batches/parse-certificate`
- Accepts: PDF upload (multipart)
- Returns: Pre-filled `BatchSpec` JSON with confidence scores per field
- Calls a multimodal LLM (Claude/GPT-4o) with structured system prompt embedding the exact `BatchSpec` schema and 5–10 few-shot examples of real BIS/UN38.3 docs
- The LLM call is constrained to return only valid `BatchSpec` fields — no hallucination risk on field names
- Frontend: Add "Upload certificate to auto-fill" step at the start of the batch creation wizard

**Specific documents to train/prompt against:**
- BIS IS 16046 Part 1 & Part 2 certificates (fixed header layout, certificate number format `CM/L-XXXXXXXX`)
- UN38.3 test reports (pass/fail table per test condition T.1–T.8, cell/battery section)
- IEC 62133-2 certificates (safety test summary, edition number, scope statement)
- CPCB EPR Registration certificates (registration number `CPCB/BWMR/...`, validity date)
- EU Declaration of Conformity (EC DoC) (article references, notified body number)

**Codebase touchpoint:** New handler file `internal/handlers/certificate_handlers.go`. Add `ParseCertificate` route in `cmd/server/main.go`. Frontend: new `useParseCertificate` hook in `hooks/use-queries.ts`.

---

### AI Feature 2: Carbon Footprint Estimator with Uncertainty Quantification
**Solves:** Pain Point 2 (LCA data black hole)  
**Impact level: HIGH — unblocks the largest group of manufacturers who abandon the carbon form**

**What it does:**  
An AI layer that accepts partial carbon footprint inputs and fills in the gaps using JRC benchmark data, country-specific grid emission factors, and chemistry-specific energy profiles. It returns:
- A calculated carbon footprint per kWh
- A carbon class (A–G)
- A confidence level (Estimated / Partially Verified / Fully Verified)
- A list of exactly which inputs were estimated vs. provided
- A plain-English note explaining what the manufacturer needs to measure to upgrade from Estimated to Verified

**Why manufacturers need this:**  
The current `carbon_calculator.go` requires: `chemistry`, `capacity_kwh`, `cell_source_country`, `assembly_energy_kwh`, `transport_mode`, `transport_distance_km`, `battery_weight_kg`. A factory in Pune making LFP cells knows:
- Their chemistry (LFP)  
- Their capacity (obvious from the product spec)  
- Where they buy cells (China, typically)  
- That they ship by sea to Hamburg  

They do not know `assembly_energy_kwh` per pack. They do not know `transport_distance_km` (they have a shipping agent, not a logistics database). An Estimated declaration is still legally useful — it can be included in the DPP as long as it's labeled "estimated" and the method is disclosed.

**Implementation approach:**
- New `EstimateCarbonFootprint` service method that accepts a `PartialCarbonInput` struct with optional fields
- Calls an LLM with the full JRC PEF methodology embedded in the system prompt + a lookup table of:
  - India grid emission factor: 0.71 kgCO₂e/kWh (CEA 2023 data)
  - Typical LFP assembly energy: 12–18 kWh/pack (JRC benchmark range)
  - Sea freight India→Hamburg: ~20,000 km, 0.008 kgCO₂/tonne-km
- Returns estimates with explicit uncertainty ranges, not false precision
- Confidence labels: `ESTIMATED` / `PARTIAL_PRIMARY_DATA` / `PRIMARY_DATA_VERIFIED`
- The existing `ClassifyCarbonClass()` function works unchanged on the estimated value

**Codebase touchpoint:** New method on `CarbonCalculatorService`. New `BatchSpec` field: `carbon_estimation_confidence` (JSONB, no migration needed per CLAUDE.md).

---

### AI Feature 3: Compliance Co-pilot — Gap-to-Action Translator
**Solves:** Pain Point 5 (gap score without roadmap), Pain Point 8 (India ↔ EU reconciliation)  
**Impact level: HIGH — the feature that creates daily active use and reduces churn**

**What it does:**  
A new API endpoint `POST /api/v1/batches/{id}/compliance-advice` that takes the structured gap output from the existing EU and India validators and passes it to an LLM with deep context about:
- The full text of relevant EU Battery Regulation articles
- BIS IS 16046 requirements
- CPCB EPR Battery Waste Management Rules
- The specific `BatchSpec` field that's missing or below threshold
- Today's date vs. regulatory deadlines

The LLM returns a structured action plan per gap:
```json
{
  "gap": "recycled_cobalt_below_threshold",
  "severity": "future_deadline",
  "deadline": "2031-08-18",
  "plain_english": "Your cobalt recycled content is 3.2% (EU 2030 minimum: 16%).",
  "actions": [
    "Contact your cell supplier and request their Recycled Content Declaration",
    "If they cannot meet 16%, add a Declaration Note in the Compliance tab",
    "Consider sourcing from suppliers already meeting threshold (3 matches in your Suppliers list)"
  ],
  "estimated_effort": "2-3 days",
  "regulation_reference": "EU 2023/1542 Art. 8(1)(a)"
}
```

**Why this creates stickiness:** Manufacturers stop asking "what does this score mean?" and start following clear weekly action plans. This is the feature that makes them open their Anviora dashboard every morning rather than only returning when something breaks.

**Important constraint:** The underlying compliance validators (`eu.go`, `india.go`) remain **deterministic and rule-based** — correct, auditable, non-hallucinating. AI only touches the *explanation layer*, not the *determination layer*. This is critical for regulatory defensibility.

**Codebase touchpoint:** New `ComplianceAdviceService`. New handler in `internal/handlers/compliance_handlers.go`. The existing `compliance.Result` struct is the input; the AI output is a new `compliance.AdviceResult` struct returned alongside it.

---

### AI Feature 4: Regulatory Classifier Upgrade (Classifier v2)
**Solves:** Pain Point 6 (regulatory changes discovered too late)  
**Impact level: MEDIUM — improves existing system, reduces alert noise**

**What it is now:**  
`internal/regulatory/classifier.go` uses `strings.Contains()` against hardcoded keyword lists to assign `ProductType`, `Region`, `Urgency`, and extract deadlines. It cannot understand context.

**What an LLM classifier does better:**  
- Distinguishes "Commission published a draft consultation for..." (low urgency) from "Commission Delegated Regulation (EU) 2026/XXXX enters into force..." (high urgency)  
- Understands that "proposed amendment to Article 8" affects recycled content specifically, not just "EU battery"  
- Extracts grace periods: "applies from 18 months after publication" requires date arithmetic, not just a regex  
- Identifies when a rule change extends a deadline (good for manufacturers) vs. tightens a requirement (bad)

**Implementation approach:**
- Replace `Classify(*models.RegulatoryItem) Classification` with a method that first tries the LLM classifier, falls back to keyword matching on failure
- System prompt embeds the Anviora taxonomy: product types, regions, urgency levels, tag types
- LLM returns structured JSON that maps directly to `Classification` struct
- Add a `classifier_method` field to `RegulatoryItem` — `"llm"` or `"keyword"` — so you can audit performance over time

**Codebase touchpoint:** `internal/regulatory/classifier.go` — the `Classify()` method. The `RegisterFetcher` interface in `ingester.go` is unchanged; this is a drop-in replacement for the classification step.

---

### AI Feature 5: Supplier Data Orchestrator
**Solves:** Pain Point 3 (supply chain data collection)  
**Impact level: MEDIUM-HIGH — reduces 6–12 month data collection to weeks**

**What it does:**  
An AI-powered supplier outreach and data processing system:

1. **Outreach generation:** Given a supplier's name and the specific fields Anviora needs (e.g., recycled cobalt content, smelter IDs, energy consumption per cell), AI generates a pre-filled email in the supplier's expected language with the exact data request formatted as a table they can fill in

2. **Response parsing:** When a supplier responds with a PDF, Excel, or email, AI extracts the relevant fields — even from non-standard CMRT formats — and maps them to the Anviora supplier data schema

3. **Completeness scoring:** AI tracks which fields are confirmed vs. assumed vs. missing per supplier, and generates a "Supply Chain Completeness Score" that shows what percentage of the DPP data is primary-data verified

4. **CMRT parser:** The existing `cmrt_importer.go` handles one format. AI can handle the ~20 variant CMRT formats that exist in the wild (RMI Conflict Minerals Reporting Template v4, v5, v6 have different column layouts)

**Codebase touchpoint:** New `internal/services/supplier_orchestrator.go`. Enhances `cmrt_importer.go` with an AI fallback for unrecognized column layouts.

---

### AI Feature 6: Intelligent Daily Digest
**Solves:** Pain Point 4 (certificate expiry), Pain Point 6 (regulatory changes), Pain Point 5 (roadmap)  
**Impact level: MEDIUM — drives retention, reduces passive churn**

**What it does:**  
Replace rule-based daily alerts with an AI-generated personalized digest. The AI reasons across the full state of a tenant's account — all batches, all certificates, all compliance gaps, all recent regulatory updates — and generates a prioritized "what to do this week" briefing:

> **Good morning, Rajesh. 3 items need your attention this week:**
>
> **Urgent (act today):** BIS certificate for batch NMC-C1180 expires in 28 days. BIS renewal takes 45–60 days — you're already in the window. [Start renewal checklist →]
>
> **This week:** The EU Commission published a delegated act on Tuesday affecting carbon footprint reporting for your LFP-B4471 batch. Your current declaration method is still valid but you'll need to update it by Q1 2027. [Read our summary →]
>
> **When you can:** 3 of your batches have Estimated carbon class (not Verified). Adding your factory's energy meter readings would upgrade them to Verified. [How to do this →]

**Codebase touchpoint:** Enhance `internal/jobs/daily_alerts.go` to call a new `DigestGeneratorService` that aggregates account state and calls the LLM for the narrative.

---

## Part 3 — Build Priority Matrix

| Feature | Pain Points Solved | Blocks Marketing Promise | Effort | Ship Order |
|---|---|---|---|---|
| Certificate AI Parser | #4, #8 | YES — core claim in `features.tsx` | Medium | **1st** |
| Compliance Co-pilot | #5, #8 | No (new feature) | Low-Medium | **2nd** |
| Carbon Estimator | #2 | No (enhancement) | Medium | **3rd** |
| Regulatory Classifier v2 | #6 | No (improvement) | Low | **4th** |
| Supplier Orchestrator | #3 | No (new feature) | High | **5th** |
| Intelligent Daily Digest | #4, #5, #6 | No (enhancement) | Medium | **6th** |

---

## Part 4 — Why This Won't Be Commoditized

The concern with AI features is that competitors can build the same thing. Here's why Anviora's AI moat is defensible:

**1. The data flywheel.** Every certificate Anviora parses improves its extraction prompts. Every compliance gap Anviora explains becomes training signal for better explanations. Anviora's AI gets better the more Indian manufacturers it serves. A new entrant starts cold.

**2. The regulatory ontology.** India BIS + EU Battery Regulation is a very narrow domain. A general-purpose LLM doesn't know that `CM/L-XXXXXXXX` is a BIS certificate number, or that T.1–T.8 in a UN38.3 report refer to specific transport tests. Anviora bakes that into the system prompt. Building this context takes months of domain work.

**3. The dual-country position.** Competitors building for EU DPP (Circulor, Minespider, Siemens) are not building for Indian compliance (BIS, CPCB, DGFT). Competitors building for Indian compliance are not building for EU DPP. Anviora is the only system building for both — which means only Anviora can offer "one dataset satisfies both."

**4. The trust layer.** Compliance AI that can be wrong is worse than no AI in compliance. Anviora's architecture — deterministic validators as the ground truth, AI only in the explanation and estimation layers — means users can trust the compliance determination while benefiting from AI guidance. This is the right architecture. General-purpose tools use AI for everything, including the compliance determination itself.

---

## Part 5 — What Is Not an AI Opportunity

Being honest about scope boundaries:

**The compliance determination itself should never be AI.** Whether a battery meets EU Art. 7 carbon threshold is a binary legal question. The answer must be deterministic, auditable, and defensible in a regulatory investigation. The existing Go validators are correct for this. Do not replace them with LLM calls.

**The BPAN serial and QR code generation is not an AI opportunity.** This is a cryptographic/registry operation. It should be deterministic. It already works.

**The Bitcoin timestamping is not an AI opportunity.** OpenTimestamps is a pure cryptographic protocol. It already works.

**The W3C Verifiable Credential issuance is not an AI opportunity.** VC signing with Ed25519 is a security operation. It already works.

The architecture principle: **AI handles what's fuzzy (natural language, estimation, explanation). Deterministic code handles what's legal (compliance determination, cryptographic proof, registry operations).**

---

## Sources

- [Battery Passport 2027: What makers exporting to the EU actually have to do — EVreporter](https://evreporter.com/battery-passport-2027-what-makers-exporting-to-the-eu-actually-have-to-do/)
- [Exporting Batteries to EU: 2026 Documentation & Labeling Guide — digiprodpass.com](https://digiprodpass.com/blogs/exporting-batteries-eu-2026-documentation)
- [EU Battery Regulation News 2026: Your Compliance Guide — Noveltech](https://www.noveltechservices.com/eu-battery-regulation-news/)
- [Compliance with the EU's Carbon Footprint Requirements for EV Batteries — CEPS (Feb 2026)](https://cdn.ceps.eu/2026/02/IDA-2024-15_ERCC_BATRAW-2-1.pdf)
- [The Digital Battery Passport Implementation Report 2026 — Minespider](https://www.minespider.com/the-battery-passport-report-2026)
- [EU Digital Battery Passport: The Complete Guide — digiprodpass.com](https://digiprodpass.com/blogs/digital-battery-passport-what-it-is-who-must-comply-and-when)
- [IMPLEMENTING THE EU DIGITAL BATTERY PASSPORT — CEPS In-Depth Analysis](https://circulareconomy.europa.eu/platform/sites/default/files/2024-03/1qp5rxiZ-CEPS-InDepthAnalysis-2024-05_Implementing-the-EU-digital-battery-passport.pdf)
- [EU Battery Regulation 2023/1542: A Guide for Manufacturers — Tracex](https://tracextech.com/eu-battery-regulation-2023-1542-compliance-guide/)
- [EU Battery Regulation and Carbon Footprint Requirements — Minviro](https://www.minviro.com/resources/blogs/eu-battery-regulation-carbon-footprint-requirements)
- [Carbon Footprint Guide for Industrial Batteries (>2 kWh) — digiprodpass.com](https://digiprodpass.com/blogs/industrial-battery-carbon-footprint-guide)
- [EU Battery Regulation Due Diligence Requirements — Anthesis Group](https://www.anthesisgroup.com/insights/eu-batteries-regulation-due-diligence-requirements/)
- [DPP Preparation Checklist for Small Brands (2026) — PassportCraft](https://passportcraft.com/insights/dpp-preparation-checklist-small-brands)
- [Battery Passport 2026: Build the Right Foundation Now — Circunomics](https://www.circunomics.com/blog/battery-passport-in-2026-foundation-not-fantasy)
- [ESG Compliance for Export-Oriented Manufacturing in India 2026 — openpr.com](https://www.openpr.com/news/4520217/esg-compliance-for-export-oriented-manufacturing-in-india)
- [Battery Waste Management Rules 2026 — Omgaruda Group](https://www.omgarudagroup.com/blogs/battery-waste-management-rules-2026-key-changes-impacting-producers-and-importers)
- [BIS Certification for Lithium-Ion Batteries in India (2025 Guide) — Sunlith Energy](https://sunlithenergy.com/bis-certification-lithium-ion-batteries-india/)
- [The 2026 State of Document AI — Artificio](https://artificio.ai/blog/document-ai-trends-2026-from-ocr-to-agentic-processing)
- [AI Intelligent Document Extraction for Manufacturing — Revenue Institute](https://revenueinstitute.com/ai-use-cases/ai-intelligent-document-extraction-for-manufacturing)
- [Automated Supplier Compliance Portal: AI Document Parsing — Certivo](https://www.certivo.com/blog-details/automated-supplier-compliance-portal-ai-document-parsing-certificate-validation)
- [How AI Solves the 4 Biggest Regulatory Compliance Challenges — AuditBoard](https://auditboard.com/blog/how-ai-helps-solve-the-4-biggest-challenges-in-regulatory-compliance)
- [Regulatory Horizon Scanning — Optro AI](https://optro.ai/product/horizon-scanning)
- [AI in Regulatory Compliance for 2026 — V-Comply](https://www.v-comply.com/blog/ai-aids-regulatory-compliance-efficiency/)
- [How to Use AI for Compliance Gap Analysis — ioni.ai](https://ioni.ai/post/how-to-use-ai-for-compliance-gap-analysis)
- [Global EV Battery Passport Market — PR Newswire](https://www.prnewswire.co.uk/news-releases/global-ev-battery-passport-market-surges-across-europe-asia-pacific-and-united-statesgermany-leads-growth-while-circulor-minespider-siemens-and-avl-drive-industry-transformation-302723397.html)
- [EU Battery Passport: Standards & Test Environment Live (2026) — PassportCraft](https://passportcraft.com/insights/eu-battery-passport-test-environment)
