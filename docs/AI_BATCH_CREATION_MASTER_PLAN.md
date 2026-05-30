# Anvaya Battery: AI-Powered Batch Creation & Compliance Intelligence
## Master Implementation Plan

**Version:** 1.0  
**Date:** May 2026  
**Status:** Research-Validated, Ready for Engineering  
**Classification:** Internal — Product Strategy & Technical Roadmap

---

## 1. Executive Summary

This document defines the full product and engineering plan for transforming Anvaya's batch creation flow from a 63-field manual form into an **AI-powered compliance operating system** for mid-to-lower-tier battery manufacturers and assemblers.

### Why This Matters Now

The EU Battery Regulation (EU 2023/1542) creates a phased compliance cliff:
- **February 2027**: Battery passport mandatory for EV, LMT, and industrial batteries >2kWh
- **August 2027**: Supply chain due diligence obligations (postponed from 2025)
- **August 2028**: Recycled content disclosure mandatory
- **2031**: Hard minimum recycled content targets (6% Li, 6% Co, 16% Pb, 10% Ni)

India's BIS IS 16046 certification is already mandatory for all Li-ion/LiPo portable batteries, with a 2-year renewal cycle and ISO 9001:2015 prerequisite.

**The gap**: Existing solutions (Circulor, Minespider, Siemens) target **large OEMs and cell manufacturers** with blockchain-heavy, ERP-integrated platforms. **Mid-tier battery assemblers** — the companies buying cells from China, spot-welding them into packs, and shipping to e-bike OEMs — have **no viable compliance software**. They use Excel, WhatsApp, and paper logs.

**The opportunity**: A $2.35B market by 2035 (CAGR 32.1%) with a massive underserved segment.

### What We're Building

An AI-powered platform that:
1. **Eliminates manual data entry** via PDF datasheet parsing, smart defaults, and natural language batch creation
2. **Prevents compliance disasters** via real-time regulation checking, certificate expiry tracking, and pre-shipment gates
3. **Turns compliance into a competitive advantage** via carbon benchmarking, supplier risk scoring, and auto-generated legal documents
4. **Scales from free to enterprise** with clear value at every tier

---

## 2. Research Validation: What We Confirmed

### 2.1 EU Battery Regulation (EU 2023/1542) — Confirmed Timeline

| Date | Requirement | Impact on Our Users |
|------|-------------|---------------------|
| Aug 2024 | CE marking on ALL batteries | Self-cert for small; notified body for EV/industrial >2kWh |
| Feb 2025 | Carbon footprint declaration (EV batteries) | Must calculate kg CO2e/kWh, third-party verified |
| Feb 2026 | Carbon footprint (industrial >2kWh, LMT) | Same requirement expands to more battery types |
| Feb 2027 | **Battery passport mandatory** | QR-linked DPP with composition, carbon, traceability |
| Aug 2027 | **Due diligence obligations** | Formal policy, supplier traceability, 10-year records |
| Aug 2028 | Recycled content disclosure | Must declare % recycled Co, Li, Ni, Pb |
| 2031 | Minimum recycled content targets | Hard minimums: 6% Li, 6% Co, 10% Ni, 16% Pb |

**Carbon footprint specifics (confirmed):**
- Expressed as **kg CO2e per kWh of total energy delivered over service life**
- Must use **PEF methodology** based on ISO 14040/44 and ISO 14067
- **Primary (company-specific) data mandatory** for main production stage
- **Carbon offsets NOT allowed** in declared figure
- **Performance classes (A-G)** will be established
- **Maximum thresholds** will eventually bar non-compliant batteries from EU market
- Must be **third-party verified by a notified body**
- Full study must be publicly accessible via web link

**Battery Passport specifics (confirmed):**
- **QR code** is primary data carrier (ISO/IEC 18004)
- Must remain legible for **product lifetime + 10 years**
- **GS1 Digital Link** with GTIN is recognized identifier pattern
- **CIRPASS-2 ontology** is interoperability reference
- **EU Central DPP Registry** goes live **July 19, 2026**
- Tiered access: public, restricted (authorities), proprietary (commercial)

### 2.2 India BIS IS 16046 — Confirmed Requirements

| Requirement | Details |
|-------------|---------|
| Standard | IS 16046 (Part 2):2018 (Li-ion/LiPo portable) |
| Scheme | Compulsory Registration Scheme (CRS) — mandatory |
| Validity | **2 years**, must renew before expiry |
| Prerequisite | **ISO 9001:2015** certificate mandatory |
| Foreign manufacturers | Must appoint **Authorized Indian Representative (AIR)** |
| Testing | BIS-recognized NABL lab, **4-8 weeks** |
| EV batteries | AIS 048 & AIS 156 (automotive standards) |
| EV traction packs | IS 16893 |
| Stationary BESS | IS 17424 |
| Products in scope | Power banks, earbuds, smart watches, e-bikes, power tools, medical devices, toys |

### 2.3 UN38.3 Transport Compliance — Confirmed

| Fact | Detail |
|------|--------|
| Tests required | T1-T8: altitude, thermal, vibration, shock, external short, impact/crush, overcharge, forced discharge |
| Expiry | **No fixed expiry**, but carriers require 12-24 month "recency" |
| Cell vs Pack | **Cell UN38.3 ≠ Pack UN38.3** — separate reports required |
| Air Transport Report | Separate document, **valid 1 year**, must renew annually |
| Model-specific | Each model needs its own report |
| IATA DGR | Updated annually; currently 67th Edition (2026) |

### 2.4 Competitive Landscape — Confirmed

| Competitor | Target | Price Point | Gap for Mid-Tier |
|------------|--------|-------------|-------------------|
| **Circulor** | Large OEMs, miners | Enterprise ($$$$) | Too complex, requires ERP integration |
| **Minespider** | Cell manufacturers, OEMs | Enterprise ($$$$) | Blockchain-heavy, supplier onboarding friction |
| **Siemens** | Automotive tier-1 | Enterprise ($$$$) | Part of larger PLM suite, overkill for assemblers |
| **AVL** | EV manufacturers | Enterprise ($$$$) | Engineering-focused, not compliance-focused |
| **iPoint-systems** | Large manufacturers | Enterprise ($$$$) | Compliance generalist, not battery-specific |
| **Circularise** | Chemical/materials | Enterprise ($$$) | Requires supplier network adoption |

**Market data (confirmed):**
- Battery passport market: **$0.15B (2025) → $2.35B (2035)**
- CAGR: **32.1%**
- Cloud SaaS deployment: **61% market share**
- Carbon data is the **most critical compliance metric** (29% of market focus)
- **No competitor targets mid-tier assemblers** with simple, affordable SaaS

### 2.5 Mid-Tier Battery Assembler Pain Points — Confirmed

From academic research and industry analysis:

1. **Data silos**: Each department (Sales, Production, QA, Accounting) uses different Excel files with inconsistent calculations
2. **Manual data collection**: Machine logs on SD cards/USB, manual counting, Excel formulas that can't be audited
3. **No real-time visibility**: Weekly/monthly reports mean decisions are made on stale data
4. **Supplier data chaos**: Different formats, no standardization, scattered across email/WhatsApp
5. **Regulatory panic**: Learn about requirements when shipment gets rejected, not before
6. **Certificate management**: No tracking of UN38.3, BIS, ISO expiry dates
7. **Warranty scramble**: Takes hours/days to find original test reports and batch data
8. **Customer order chaos**: Up to 25 customers, each with different order formats, manually re-typed

---

## 3. Target User Personas

### Persona 1: Rajesh — Owner, 40-Person Battery Pack Assembler (Gujarat, India)

**Demographics:**
- Age: 47, family business
- Team: 40 people, 3 admin staff
- Output: ~500 battery packs/month (e-bikes, solar storage)
- Customers: Local e-bike OEMs, solar installers, 1 European distributor

**Daily Workflow:**
1. 9:00 AM: WhatsApp from cell supplier with datasheet PDF (often Chinese)
2. 10:00 AM: Production meeting — what batches to make today?
3. 11:00 AM: Create batch record in Excel (or your platform)
4. 2:00 PM: European customer emails asking for "battery passport" — panic
5. 4:00 PM: Warehouse asks if Batch B-2024-11 is "okay to ship"
6. 5:00 PM: Check if BIS cert needs renewal (usually forgets until last minute)

**Pain Points:**
- Can't read Chinese datasheets
- Doesn't know what EU Battery Regulation requires
- Loses track of which batches have which certificates
- Warranty claims require digging through WhatsApp history
- No dedicated compliance staff

**Tech Comfort:** Smartphone power user. Uses WhatsApp Business, Google Sheets, UPI. Never used Salesforce or SAP.

**Willingness to Pay:** ₹3,000-5,000/month ($35-60) for something that prevents a shipment rejection.

### Persona 2: Priya — Quality Manager, 120-Person Battery Assembly (Shenzhen → Export)

**Demographics:**
- Age: 32, engineering background
- Company: Assembles LiFePO4 packs for energy storage, exports 70% to EU
- Team: 5 people in QA/compliance

**Daily Workflow:**
1. Reviews incoming cell COAs (Certificates of Analysis)
2. Updates compliance checklist for each batch
3. Tracks UN38.3 and CE marking status
4. Responds to customer audit requests
5. Prepares documentation for customs clearance

**Pain Points:**
- Multiple customers have different documentation requirements
- Hard to prove carbon footprint data to EU customers
- Supplier certificates expire without warning
- Every EU regulation change requires manual research
- Needs audit trail for everything

**Tech Comfort:** Uses ERP (basic), Excel pivot tables, familiar with compliance concepts.

**Willingness to Pay:** $150-300/month for team plan that automates compliance checks and document generation.

### Persona 3: Hans — Procurement Director, German EV Battery Pack Integrator

**Demographics:**
- Age: 45
- Company: 200 employees, integrates battery packs for commercial EVs
- Sources cells from China, assembles in Germany
- Must comply with EU Battery Regulation, supply due diligence

**Pain Points:**
- Need to trace cobalt/graphite origin for Article 6 due diligence
- Carbon footprint calculation is manual and error-prone
- Must generate Battery Passport by Feb 2027
- OEM customers demand real-time compliance dashboards
- Needs ESG reporting for investors

**Tech Comfort:** Full ERP (SAP), PLM, familiar with LCA concepts.

**Willingness to Pay:** €2,000-5,000/month for enterprise plan with API access, white-label, and custom integrations.

---

## 4. Product Architecture: The Full Feature Set

### 4.1 Core Platform (All Tiers)

#### Batch Management
- **Batch creation** with stepper wizard (4 steps: Identity → Specs → Compliance → Review)
- **Template system** with rich preview cards and search
- **Clone/duplicate** from existing batches with change highlighting
- **Batch versioning** — track changes to specs over time
- **Batch status lifecycle**: DRAFT → COMPLIANCE_REVIEW → READY → SHIPPED → ACTIVE → END_OF_LIFE
- **Quantity tracking** — serial number ranges, lot numbers
- **Batch QR code** — scannable from warehouse floor

#### Passport Generation
- **Public passport page** (`/p/[uuid]`) with QR code
- **Tiered access**: Public (basic), Customer (full specs), Authority (compliance docs)
- **Multi-language** support (24 EU languages)
- **GS1 Digital Link** compatible identifiers
- **Printable passport PDF** for physical shipment

#### Document Vault
- Upload and associate documents with batches:
  - UN38.3 test reports
  - BIS/CE certificates
  - Declaration of Conformity
  - MSDS/SDS sheets
  - Supplier COAs
  - Carbon footprint studies
- **Document expiry tracking** with auto-alerts
- **Document templates** (auto-generate DoC, risk assessments)

#### Multi-Market Support
- **Market region selector**: India, EU, Global
- **Conditional field display** based on market + battery category
- **Regulation-aware validation** (required fields per market)
- **Multi-currency/multi-unit** support

### 4.2 AI-Powered Features

#### Feature A: Smart Datasheet Parser ("Upload PDF → Batch")

**What it does:**
- User uploads a manufacturer datasheet PDF (or forwards via WhatsApp/email)
- AI extracts structured battery specifications
- Pre-fills batch creation form with 85-95% accuracy
- Flags low-confidence fields for human review

**Extracted fields:**
```
- Model name / part number
- Chemistry (LFP/NMC/NCA/LCO/Other)
- Nominal voltage (V)
- Rated capacity (Ah)
- Energy density (Wh/kg)
- Cycle life (cycles)
- Weight (kg)
- Dimensions (mm)
- Operating temperature range
- Manufacturer name
- Country of origin
- Safety certifications (UN38.3, IEC 62133, UL)
- Material composition (% Li, Co, Ni, Mn, Graphite)
```

**AI approach:**
1. **Text extraction**: `pdf-parse` or `pdfjs-dist` extracts raw text
2. **Regex layer** (fast, deterministic): Pattern matching for common formats
3. **LLM fallback** (Groq API free tier): Structured JSON extraction from messy/scanned PDFs
4. **Confidence scoring**: Each field gets 0-100% confidence score
5. **Human review UI**: Low-confidence fields highlighted in amber

**Supported languages:** English, Chinese (simplified/traditional), German, Korean, Japanese

**Tier:** Free (10/month) → Pro (unlimited + scanned PDF support)

---

#### Feature B: Compliance Guardian ("Don't Ship to Jail")

**What it does:**
- Analyzes batch data against live EU Battery Regulation and India BIS requirements
- Returns a **compliance score** (0-100) with specific gap list
- Cites the **exact regulation article** for each gap
- Suggests **remediation steps**

**Checks performed:**

| Check | Regulation | Example Alert |
|-------|-----------|---------------|
| Missing required field | EU 2023/1542 Art 7 | "Expected lifetime cycles required for EV batteries per Article 7.1(c)" |
| CE marking logic | EU 2023/1542 Art 14 | "Industrial battery >2kWh requires notified body involvement. You selected self-certification." |
| Carbon class readiness | EU 2023/1542 Art 7 | "Carbon footprint declaration required from Feb 2025. No study uploaded." |
| Due diligence trigger | EU 2023/1542 Art 25 | "Cobalt source: DRC flagged. Article 6.2 due diligence documentation required by Aug 2027." |
| BIS validity | IS 16046 | "BIS CRS registration expires in 45 days. Renewal required for continued sales in India." |
| UN38.3 recency | IATA DGR | "UN38.3 report issued 18 months ago. Some carriers may reject. Consider refresh." |
| Material total | Internal | "Material composition totals 98.4%. Should equal 100%." |
| Date ordering | Internal | "Manufacturing date (2025-06-01) is after expiry date (2025-05-01)." |

**AI approach:**
1. **Rule engine** (deterministic): Hard-coded regulation checks (fast, always accurate)
2. **Embedding search** (RAG): Regulation corpus vectorized for semantic query
3. **LLM synthesis** (Groq): Generate human-readable explanations and remediation advice

**Data maintenance:**
- EU regulation corpus updated quarterly
- India BIS updates monitored via BIS website scraping
- Change log tracked per tenant

**Tier:** Pro (full checks) → Enterprise (custom regulation training)

---

#### Feature C: Regulation Radar ("The Law Changed — Are You Affected?")

**What it does:**
- Monitors EU Official Journal, BIS notifications, IATA DGR updates
- When a regulation changes, AI analyzes tenant's batch portfolio
- Alerts: **"Regulation X changed. You have Y affected batches. Here's what to do."**

**Alert types:**
- **Critical**: Immediate action required (e.g., "New SVHC list published. Your batches contain substance X above 0.1% threshold.")
- **Warning**: Action required by specific date (e.g., "Due diligence obligations moved to Aug 2027. 12 batches need supplier documentation.")
- **Info**: Good to know (e.g., "New carbon footprint methodology published for LMT batteries. No action required until 2026.")

**Delivery channels:**
- In-app notification center
- Email digest (daily/weekly)
- WhatsApp Business API (for Indian market)
- Slack/Teams webhook (Enterprise)

**AI approach:**
1. **Scraper**: Monitor EUR-Lex, BIS portal, IATA updates
2. **Diff engine**: Compare new vs old regulation text
3. **Impact analyzer**: Cross-reference changed requirements against tenant batch specs
4. **LLM summary**: Generate plain-language alert with action items

**Tier:** Pro (EU + India) → Enterprise (all jurisdictions + custom alerts)

---

#### Feature D: Carbon Anomaly Detective ("Why Is Your Carbon Class D?")

**What it does:**
- Compares batch carbon footprint against **anonymized industry benchmarks**
- Identifies outliers and suggests root causes
- Tracks carbon class trajectory over time

**Benchmarks (anonymized, aggregated):**
```
LFP 100Ah pack: median 85 kg CO2e/kWh, range 60-120
NMC 811 50Ah pack: median 110 kg CO2e/kWh, range 80-160
LTO 40Ah pack: median 150 kg CO2e/kWh, range 100-200
```

**Example alert:**
```
Your batch "EV-Pack-150Ah-LFP" shows 145 kg CO2e/kWh.
Industry median for similar packs: 85 kg CO2e/kWh.

Possible causes:
1. Cell supplier location: Your cells from CN (coal-heavy grid) vs EU benchmark using EU-made cells
2. Transport mode: Sea freight (lower) vs air freight (higher) — verify shipping method
3. Missing data: End-of-life recycling credit not applied (-15 kg CO2e/kWh possible)

Recommendation: Upload cell supplier's carbon data or switch to verified low-carbon supplier.
```

**AI approach:**
1. **Statistical clustering**: Group similar batches by chemistry, capacity, weight, region
2. **Outlier detection**: Z-score analysis for carbon values
3. **Root cause suggestion**: Rule-based mapping of high carbon to likely causes
4. **LLM explanation**: Generate natural language insight

**Data requirements:**
- Aggregate anonymized data from all Pro/Enterprise tenants
- Third-party LCA database integration (ecoinvent, GaBi)
- User consent for benchmark participation

**Tier:** Pro (basic benchmarks) → Enterprise (detailed LCA + supplier comparison)

---

#### Feature E: Auto-DoC Generator ("One-Click Legal Document")

**What it does:**
- Generates **Declaration of Conformity** PDF from batch specs
- Auto-fills EU regulation references (EN 50604, UN 38.3, etc.)
- Includes blank signature blocks and company stamp areas
- Supports multiple languages

**DoC sections auto-generated:**
1. Manufacturer identification
2. Product identification (model, batch, serial range)
3. Harmonized standards applied (auto-selected based on battery category)
4. Notified body details (if applicable)
5. EU Representative details
6. Declaration statement
7. Place and date
8. Signature block

**AI approach:**
1. **Template engine**: Pre-built DoC templates per battery category
2. **Field mapping**: Auto-populate from batch database
3. **LLM refinement**: Adjust language for specific customer/regulator requirements
4. **PDF generation**: `puppeteer` or `react-pdf` for professional output

**Tier:** Pro (standard DoC) → Enterprise (multi-jurisdiction + custom templates)

---

#### Feature F: Natural Language Batch Creator ("Make me 50 LFP packs for EU")

**What it does:**
- User types natural language command
- AI parses intent, extracts parameters, suggests missing info
- Creates draft batch with smart defaults

**Examples:**
```
User: "Create 50 units of 150Ah LFP for Vélo Électrique, EU market"
AI:   "Draft created: 150Ah LFP, EU market, customer: Vélo Électrique.
      Missing: nominal voltage, weight, cell supplier.
      Suggested: Clone from Batch B-2024-03-15 (similar specs)?"

User: "New batch for solar storage, 48V 200Ah, NMC, India BIS certified"
AI:   "Draft created. Note: NMC for stationary storage — 
      customer may prefer LFP for longer cycle life. 
      BIS IS 16046 will be required. Auto-checking cert validity..."
```

**AI approach:**
1. **Intent classification**: Parse command type (create, clone, search, analyze)
2. **Entity extraction**: Extract chemistry, capacity, voltage, quantity, market, customer
3. **Slot filling**: Identify missing required fields
4. **Suggestion engine**: Recommend templates, similar batches, or defaults
5. **LLM dialog**: Conversational refinement

**Tier:** Free (simple commands) → Pro (complex multi-step + customer-aware)

---

#### Feature G: Supplier Risk Scout ("Where Did Your Cobalt Come From?")

**What it does:**
- Analyzes supplier countries against EU due diligence risk lists
- Flags conflict mineral exposure
- Tracks supplier certificate status (ISO, BIS, etc.)
- Suggests alternative suppliers with better risk profiles

**Risk factors analyzed:**
- Country risk (DRC cobalt, Myanmar tin, etc.)
- Certificate validity (ISO 9001, ISO 14001, IATF 16949)
- Audit history (SA8000, RMI, RBA)
- Carbon intensity of supplier location
- Geopolitical stability index

**Example alert:**
```
Supplier: "Xinjiang Power Cells" (China)
Risk level: MEDIUM-HIGH

Issues:
- Region flagged under EU Forced Labor Regulation
- No ISO 14001 certificate on file
- Carbon intensity: 850g CO2/kWh (grid average)

Alternatives:
1. EVE Energy (CN) — ISO 14001, 650g CO2/kWh
2. Farasis (DE plant) — TÜV certified, 320g CO2/kWh
3. Local supplier (IN) — BIS certified, 450g CO2/kWh
```

**AI approach:**
1. **Geocoding + risk database**: Map supplier addresses to risk indices
2. **Certificate verification**: OCR + API checks for ISO/BIS validity
3. **Carbon estimation**: Grid carbon intensity by country/region
4. **Alternative suggestion**: Match specifications against supplier database

**Tier:** Enterprise only (supplier database + risk modeling)

---

#### Feature H: Lifecycle Oracle ("Recycle, Reuse, or Remanufacture?")

**What it does:**
- For batteries at end-of-first-life, AI recommends optimal next step
- Considers: SOH, market value, remanufacture cost, regulation requirements, carbon impact

**Decision matrix:**
```
Input: Battery at 78% SOH, 4 years old, LFP 150Ah

Option A: Second-life stationary storage
- Resale value: $450/unit
- Remaining useful life: ~8 years (stationary)
- Market demand: HIGH (grid storage growing)
- Regulation: Must update passport, declare SOH
- Carbon benefit: Avoids new battery production
- RECOMMENDATION: PROCEED

Option B: Recycle for materials
- Material value: $80/unit (Li, Fe, phosphate recovery)
- Recycling cost: $40/unit
- Net value: $40/unit
- Carbon benefit: Partial (recycling energy intensive)
- RECOMMENDATION: Only if SOH < 70%

Option C: Remanufacture
- Cost: $200/unit (new cells, keep casing/BMS)
- Resale as "refurbished": $300/unit
- Margin: $100/unit
- Regulation: Must meet same standards as new
- RECOMMENDATION: Viable if cell supply stable
```

**AI approach:**
1. **Rule-based scoring**: Score each option on economic, regulatory, environmental dimensions
2. **Market data integration**: Scraped pricing for second-life batteries, recycling commodities
3. **LLM explanation**: Generate recommendation narrative with justification

**Tier:** Pro (basic recommendations) → Enterprise (market data + custom rules)

---

#### Feature I: Warranty Defense Pack ("The Customer Complained — Prove Your Case")

**What it does:**
- One-click assembles complete documentation package for warranty dispute
- Includes: original specs, test reports, production photos, compliance docs, supplier certs
- Timeline view: "What was true at time of shipment vs now"
- Export as PDF evidence pack

**Generated sections:**
1. Batch identity and specs at time of manufacture
2. Cell supplier COA and UN38.3 status (at time of production)
3. QC test results from assembly
4. Production photos (if uploaded)
5. Compliance docs valid at time of shipment
6. Shipping conditions (temperature, SOC, packaging)
7. Customer usage data (if available via BMS)
8. Comparison to warranty terms

**AI approach:**
1. **Data aggregation**: Pull all related records from database
2. **Timeline reconstruction**: Show state of each document at shipment date
3. **LLM summary**: Generate executive summary of evidence strength
4. **PDF assembly**: Professional formatted evidence pack

**Tier:** Pro (basic pack) → Enterprise (legal-grade formatting + expert witness support)

---

#### Feature J: Passport Chatbot ("Ask This Battery Anything")

**What it does:**
- Public-facing chatbot on battery passport page
- Answers questions about: carbon footprint, recycling, safety, specs, compliance
- Speaks 24 languages automatically
- Reduces customer support tickets for manufacturer

**Example interactions:**
```
Consumer: "What is the carbon footprint of this battery?"
Bot: "This battery has a carbon footprint of 85 kg CO2e per kWh,
      which is Performance Class B — better than 65% of similar batteries.
      The main emissions come from cell manufacturing in China (60%)."

Recycler: "What materials are inside?"
Bot: "This LFP battery contains: Lithium Iron Phosphate (cathode),
      Graphite (anode), Copper (current collector), Aluminum (casing).
      No cobalt or nickel. Recycling instructions: [link]"

Regulator: "Show me the DoC"
Bot: "[Restricted access — authentication required]"
```

**AI approach:**
1. **RAG pipeline**: Vectorize passport data, retrieve relevant sections
2. **LLM generation** (Groq): Generate natural language answers
3. **Access control**: Filter responses based on user tier (public/restricted)
4. **Multilingual**: Auto-translate responses

**Tier:** Free (Anvaya-branded) → Enterprise (white-label + custom training)

---

## 5. Free / Pro / Enterprise Tiers

### Free Tier — "Better Than Excel"
**Target:** Individual assemblers, <100 packs/month, 1 user
**Price:** $0

| Feature | Limit |
|---------|-------|
| Batches | 50 active |
| Datasheet Parser | 10 PDFs/month |
| NL Batch Creator | Simple commands only |
| Templates | 5 custom templates |
| Passport Generation | Basic QR page |
| Batch Health QR | 🟢🟡🔴 status |
| Basic Compliance Check | Required field validation only |
| Document Vault | 1GB storage |
| Support | Community |

**Upgrade triggers:**
- Hits 50 batch limit
- Needs more than 10 PDF parses/month
- First EU customer asks for compliance docs
- BIS cert expires and they need help

---

### Pro Tier — "Compliance Peace of Mind"
**Target:** Small teams, 100-2,000 packs/month, 2-10 users
**Price:** $49/user/month (team minimum $149/month)

Everything in Free, plus:

| Feature | Detail |
|---------|--------|
| Batches | Unlimited |
| Datasheet Parser | Unlimited + scanned PDFs + Chinese language |
| NL Batch Creator | Complex commands, customer-aware |
| **Compliance Guardian** | Full EU + India regulation checks with citations |
| **Regulation Radar** | EU + India alerts, email + WhatsApp |
| **Carbon Anomaly Detective** | Basic benchmarks vs anonymized industry data |
| **Auto-DoC Generator** | Standard EU Declaration of Conformity |
| **Customer Compliance Profiles** | Save per-customer requirements, auto-check |
| **Certificate Expiry Radar** | UN38.3, BIS, ISO, CE — 90/60/30-day alerts |
| **Smart Shipment Gate** | Deep validation before status change to "Ready" |
| **Batch Inconsistency Guard** | AI cross-checks specs vs uploaded docs |
| **Warranty Defense Pack** | One-click evidence assembly |
| **Lifecycle Oracle** | Basic reuse/recycle/remanufacture recommendations |
| Templates | Unlimited |
| Document Vault | 50GB |
| Team collaboration | Role-based access |
| Support | Email, 24h response |

**Value proposition:** "One prevented shipment rejection pays for 10 years of Pro."

---

### Enterprise Tier — "Strategic Compliance"
**Target:** Large manufacturers, 2,000+ packs/month, 10+ users, multi-factory
**Price:** Custom ($2,000-5,000/month)

Everything in Pro, plus:

| Feature | Detail |
|---------|--------|
| **Supplier Risk Scout** | Full risk database + alternative suggestions |
| **Advanced Carbon Analytics** | Detailed LCA, supplier comparison, reduction pathways |
| **ESG Report Generator** | Portfolio-level sustainability reports for investors |
| **White-label Passport Chatbot** | OEM branding, custom training |
| **Multi-factory Support** | Factory-specific compliance tracking |
| **API Access** | Full REST API for ERP/PLM integration |
| **Custom Regulation Training** | Private standards, jurisdiction-specific rules |
| **Dedicated AI Model** | No shared rate limits, faster processing |
| **SSO / SAML** | Enterprise authentication |
| **SLA** | 99.9% uptime, 4h support response |
| **On-premise Option** | Self-hosted AI (Ollama) for data sovereignty |
| Document Vault | Unlimited |
| Support | Dedicated account manager |

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Next.js App │  │  Mobile Web  │  │  Warehouse Scanner   │  │
│  │  (React 19)  │  │  (PWA)       │  │  (QR Code Reader)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Go/chi)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth/JWT    │  │  Rate Limit  │  │  Tenant Isolation    │  │
│  │  Middleware  │  │  (per tier)  │  │  (Row-level)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│  Core API    │    │  AI Service  │    │  Compliance Engine   │
│  (battery-   │    │  (Go +       │    │  (Go + PostgreSQL    │
│   api)       │    │   Python)    │    │  + Vector Store)     │
│              │    │              │    │                      │
│  /batches    │    │  /ai/parse   │    │  /compliance/check   │
│  /passports  │    │  /ai/nl      │    │  /compliance/alert   │
│  /templates  │    │  /ai/benchmark│   │  /compliance/regulations│
│  /documents  │    │  /ai/generate│    │                      │
└──────────────┘    └──────────────┘    └──────────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  Vector DB   │  │  Object Storage      │  │
│  │  (Supabase)  │  │  (pgvector   │  │  (Supabase           │  │
│  │              │  │   or Pinecone│  │   Storage)           │  │
│  │  batches     │  │              │  │                      │  │
│  │  passports   │  │  regulation  │  │  PDFs                │  │
│  │  templates   │  │  embeddings  │  │  DoCs                │  │
│  │  documents   │  │  supplier    │  │  images              │  │
│  │  audit_log   │  │  profiles    │  │  generated reports   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Groq API    │  │  EU DPP      │  │  WhatsApp Business   │  │
│  │  (LLM)       │  │  Registry    │  │  API                 │  │
│  │              │  │  (July 2026) │  │                      │  │
│  │  Fallback:   │  │              │  │  Email (SendGrid)    │  │
│  │  Ollama      │  │              │  │  Slack/Teams         │  │
│  │  (self-host) │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 AI Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    AI SERVICE MODULES                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Extractor  │───▶│  Validator  │───▶│  Formatter  │      │
│  │  Service    │    │  Service    │    │  Service    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ PDF Parser  │    │ Rule Engine │    │ Template    │      │
│  │ (pdf-parse) │    │ (rego/CEL)  │    │ Engine      │      │
│  │             │    │             │    │ (Go templ)  │      │
│  │ OCR Fallback│    │ LLM Check   │    │             │      │
│  │ (Tesseract) │    │ (Groq)      │    │ PDF Gen     │      │
│  └─────────────┘    └─────────────┘    │ (puppeteer) │      │
│                                        └─────────────┘      │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  NL Parser  │    │  Benchmark  │    │  RAG Engine │      │
│  │  Service    │    │  Service    │    │             │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ Intent      │    │ Statistical │    │ Vector DB   │      │
│  │ Classifier  │    │ Clustering  │    │ (pgvector)  │      │
│  │ (tiny model)│    │ (Python)    │    │             │      │
│  │             │    │             │    │ Embedding   │      │
│  │ Slot Filling│    │ Outlier     │    │ Model       │      │
│  │ (Groq)      │    │ Detection   │    │ (all-MiniLM)│      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Database Schema Additions

```sql
-- AI parsing jobs (for tracking usage + billing)
CREATE TABLE ai_parsing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    job_type TEXT NOT NULL CHECK (job_type IN (
        'DATASHEET_PARSE', 'NL_CREATE', 'COMPLIANCE_CHECK',
        'DOC_GENERATE', 'BENCHMARK_COMPARE'
    )),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    )),
    input_metadata JSONB,
    result_data JSONB,
    confidence_score DECIMAL(5,2),
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Customer compliance profiles (Pro+)
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    market_region TEXT NOT NULL,
    required_fields TEXT[], -- e.g., ['ce_marking', 'un38_3', 'ip67_test']
    required_documents TEXT[], -- e.g., ['msds', 'coa', 'carbon_study']
    custom_requirements JSONB, -- free-form additional checks
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulation corpus (for RAG)
CREATE TABLE regulation_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction TEXT NOT NULL, -- 'EU', 'IN', 'US', etc.
    regulation_code TEXT NOT NULL, -- 'EU_2023_1542', 'IS_16046'
    article TEXT, -- 'Art_7', 'Section_4.2'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    effective_date DATE,
    embedding VECTOR(384), -- for semantic search
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate tracking (Pro+)
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    certificate_type TEXT NOT NULL, -- 'UN38.3', 'BIS_CRS', 'ISO_9001', 'CE'
    issuer TEXT NOT NULL,
    certificate_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    document_path TEXT, -- storage URL
    associated_batch_ids UUID[],
    associated_supplier_id UUID,
    reminder_sent_90d BOOLEAN DEFAULT FALSE,
    reminder_sent_60d BOOLEAN DEFAULT FALSE,
    reminder_sent_30d BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier database (Enterprise)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    address TEXT,
    risk_score DECIMAL(3,2), -- 0.00 - 1.00
    risk_factors JSONB,
    certificates UUID[],
    materials_supplied TEXT[],
    carbon_intensity_g_co2_kwh DECIMAL(10,2),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carbon benchmarks (anonymized aggregation)
CREATE TABLE carbon_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chemistry TEXT NOT NULL,
    capacity_ah_range_min DECIMAL(10,2),
    capacity_ah_range_max DECIMAL(10,2),
    battery_category TEXT NOT NULL,
    median_kg_co2e_per_kwh DECIMAL(10,3),
    p10 DECIMAL(10,3),
    p90 DECIMAL(10,3),
    sample_size INTEGER,
    region TEXT, -- 'GLOBAL', 'EU', 'APAC'
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 API Endpoints

```
POST   /api/v1/ai/parse-datasheet        # Upload PDF → extracted specs
POST   /api/v1/ai/nl-create-batch        # Natural language → draft batch
POST   /api/v1/ai/compliance-check       # Batch ID → compliance report
POST   /api/v1/ai/generate-doc           # Batch ID + doc type → generated PDF
POST   /api/v1/ai/benchmark-carbon       # Batch ID → carbon comparison
GET    /api/v1/ai/regulation-alerts      # Tenant → pending alerts
POST   /api/v1/ai/warranty-pack          # Batch ID → evidence PDF

GET    /api/v1/compliance/regulations    # List active regulations
GET    /api/v1/compliance/gaps/:batch_id # Specific gap analysis
POST   /api/v1/compliance/shipment-gate  # Validate before status change

POST   /api/v1/certificates              # Add certificate
GET    /api/v1/certificates/expiring     # List expiring soon
PUT    /api/v1/certificates/:id/renew    # Mark as renewed

POST   /api/v1/customers                 # Create customer profile
GET    /api/v1/customers/:id/checklist   # Get compliance checklist for customer
```

---

## 7. Implementation Roadmap

### Phase 0: Foundation (Weeks 1-2)
**Goal:** Clean up existing code, prepare for new architecture

| Task | Owner | Deliverable |
|------|-------|-------------|
| Remove duplicate material composition grid | Frontend | Cleaner form |
| Remove 7 dead textile hooks | Frontend | -600 lines |
| Add `react-hook-form` + Zod schema | Frontend | Type-safe form validation |
| Migrate batch creation to stepper wizard | Frontend | 4-step UX |
| Add blur validation | Frontend | Real-time error feedback |
| Create `ai_parsing_jobs` table | Backend | DB migration |
| Add tenant tier field (`free`/`pro`/`enterprise`) | Backend | Feature gate support |

**Milestone:** Batch creation is 50% faster, 80% fewer lines, no manual validation

---

### Phase 1: AI Data Entry (Weeks 3-6)
**Goal:** Eliminate manual typing for batch specs

| Week | Feature | Detail |
|------|---------|--------|
| 3 | PDF text extractor | `pdf-parse` + `pdfjs-dist` integration |
| 3 | Regex extraction layer | Pattern matching for 20 common datasheet formats |
| 4 | Groq API integration | Fallback LLM extraction for messy PDFs |
| 4 | Upload UI | Drag-and-drop in batch creation dialog |
| 5 | Confidence scoring | 0-100% per field, amber highlight for <80% |
| 5 | Multi-language support | Chinese, English, German, Korean |
| 6 | NL batch creator | "Create 50 LFP 150Ah for EU" → draft batch |
| 6 | Template cards | Rich preview, search, clone-with-changes |

**Milestone:** User can create a batch from PDF in <2 minutes

---

### Phase 2: Compliance Engine (Weeks 7-10)
**Goal:** Prevent compliance disasters before they happen

| Week | Feature | Detail |
|------|---------|--------|
| 7 | Regulation corpus | Seed EU 2023/1542 + IS 16046 into vector DB |
| 7 | Rule engine | Hard-coded checks for 50 common gaps |
| 8 | Compliance Guardian | Full check with citations + remediation advice |
| 8 | Shipment Gate | Block "Ready to Ship" if compliance <100% |
| 9 | Certificate tracking | UN38.3, BIS, ISO expiry dates + alerts |
| 9 | Customer profiles | Save per-customer requirements |
| 10 | Regulation Radar | Scraper + impact analyzer + alert digest |
| 10 | Batch inconsistency guard | Cross-check specs vs uploaded docs |

**Milestone:** Zero preventable shipment rejections due to missing docs

---

### Phase 3: Advanced AI (Weeks 11-14)
**Goal:** Turn compliance into competitive advantage

| Week | Feature | Detail |
|------|---------|--------|
| 11 | Auto-DoC generator | EU Declaration of Conformity PDF |
| 11 | Carbon calculator v2 | Full lifecycle stage breakdown |
| 12 | Carbon benchmarks | Anonymized industry comparison |
| 12 | Carbon anomaly detection | Outlier analysis + root cause |
| 13 | Warranty Defense Pack | One-click evidence assembly |
| 13 | Lifecycle Oracle | Reuse/recycle/remanufacture recommendations |
| 14 | Passport chatbot | Public Q&A on battery passport page |
| 14 | ESG report generator | Portfolio-level sustainability PDF |

**Milestone:** Pro users can answer any customer compliance question in <5 minutes

---

### Phase 4: Enterprise Scale (Weeks 15-18)
**Goal:** Capture large manufacturer accounts

| Week | Feature | Detail |
|------|---------|--------|
| 15 | Supplier database | Risk scoring, certificate tracking |
| 15 | Supplier Risk Scout | Country risk + carbon + alternative suggestions |
| 16 | Multi-factory support | Factory-specific compliance tracking |
| 16 | API v2 | Full REST API for ERP/PLM integration |
| 17 | White-label chatbot | OEM branding on passport page |
| 17 | SSO/SAML | Enterprise authentication |
| 18 | On-premise AI | Ollama deployment option |
| 18 | SLA + dedicated support | Enterprise account management |

**Milestone:** First enterprise pilot customer onboarded

---

### Phase 5: Polish & Launch (Weeks 19-20)
**Goal:** Production-ready, market launch

| Task | Detail |
|------|--------|
| Performance optimization | AI response <3s, page load <1s |
| Security audit | Penetration test, data encryption review |
| Load testing | 1000 concurrent users |
| Documentation | API docs, user guides, compliance whitepapers |
| Pricing page | Clear tier comparison |
| Launch campaign | LinkedIn, battery industry newsletters, trade shows |

---

## 8. Go-to-Market Strategy

### Target Segments (in order)

1. **Indian battery assemblers** (IS 16046 compliance)
   - Channel: BIS consultant partnerships, India battery trade associations
   - Message: "Never miss a BIS renewal again"
   - Price: Free → Pro at ₹3,999/month

2. **EU-exporting pack integrators** (Battery passport ready)
   - Channel: EU battery trade shows, LinkedIn targeting
   - Message: "Be passport-ready by February 2027"
   - Price: Pro at €49/user/month

3. **Energy storage system integrators**
   - Channel: Solar + storage conferences
   - Message: "One platform for BIS + EU + UL compliance"
   - Price: Pro → Enterprise

4. **EV battery pack manufacturers**
   - Channel: Direct sales, OEM introductions
   - Message: "Full due diligence + carbon footprint + passport"
   - Price: Enterprise custom

### Competitive Positioning

| | Anvaya | Circulor | Minespider | Excel |
|--|--------|----------|------------|-------|
| **Setup time** | 5 minutes | 3-6 months | 2-4 months | N/A |
| **Price** | $0-5K/mo | $50K+/yr | $50K+/yr | $0 |
| **Target** | Mid-tier assemblers | Large OEMs | Cell manufacturers | Everyone |
| **AI features** | Yes (built-in) | No | No | No |
| **India BIS** | Native | No | No | Manual |
| **EU Battery Reg** | Native | Yes | Yes | Manual |
| **Ease of use** | Simple | Complex | Complex | Simple |
| **Supplier network** | Growing | Large | Medium | N/A |

### Key Messaging

**For Indian market:**
> "BIS certification is mandatory. Renewals are easy to miss. We track everything — so you never lose market access."

**For EU exporters:**
> "The EU Battery Passport is mandatory from February 2027. Don't wait until January to panic. Start now, ship compliant."

**For carbon-conscious customers:**
> "Your carbon class will be public by 2026. Will it be A or D? We help you measure, improve, and prove it."

---

## 9. Success Metrics

### Product Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|-------------------|
| Monthly active users | 200 | 1,000 |
| Batches created via AI parser | 60% of all batches | 75% |
| Compliance check usage | 500/month | 5,000/month |
| Average batch creation time | 8 min → 3 min | 8 min → 2 min |
| Certificate expiry alerts acted on | 80% within 30 days | 90% |
| Free → Pro conversion rate | 5% | 8% |
| Pro → Enterprise conversion rate | 2% | 3% |
| NPS score | 40 | 50 |

### Business Metrics

| Metric | Target (12 months) |
|--------|-------------------|
| Monthly Recurring Revenue (MRR) | $25,000 |
| Paying customers | 150 |
| Enterprise customers | 5 |
| Gross margin | 85% |
| Customer acquisition cost | $200 |
| Lifetime value (Pro) | $1,800 |
| LTV:CAC ratio | 9:1 |

### Compliance Impact Metrics

| Metric | Target |
|--------|--------|
| Prevented shipment rejections | 50+ in year 1 |
| BIS renewals completed on time | 95% |
| EU passport readiness by Feb 2027 | 100% of EU customers |
| Carbon class improvement (avg) | One letter grade |

---

## 10. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Groq API rate limits / price changes | Medium | High | Build Ollama fallback; cache aggressively |
| Regulation changes break AI checks | Medium | High | Rule engine is deterministic; LLM is advisory only |
| Competitor launches cheaper product | Medium | Medium | Focus on India BIS + mid-tier segment (underserved) |
| AI hallucination in compliance advice | Low | Critical | Never rely solely on LLM for legal advice; always cite regulation text |
| Data privacy concerns (EU) | Medium | High | GDPR compliance; EU data stays in EU; on-premise option |
| Customer doesn't trust AI suggestions | Medium | Medium | Confidence scores; human-in-the-loop; audit trail |
| EU DPP registry delays | Medium | Medium | Build passport independently; integrate when registry opens |
| PDF parsing accuracy too low | Low | High | Regex + LLM hybrid; human review UI; continuous training |

---

## 11. Technical Dependencies & Prerequisites

### External APIs

| Service | Purpose | Cost | Fallback |
|---------|---------|------|----------|
| Groq API | LLM extraction, generation | Free tier: 1M tokens/day | Ollama self-hosted |
| Supabase | Database, auth, storage | Free tier: 500MB | Self-hosted PostgreSQL |
| SendGrid | Email alerts | Free: 100/day | AWS SES |
| WhatsApp Business API | India alerts | Per-message | Email fallback |

### Open Source Components

| Component | License | Purpose |
|-----------|---------|---------|
| pdf-parse | MIT | PDF text extraction |
| pdfjs-dist | Apache 2.0 | Browser-side PDF rendering |
| Tesseract.js | Apache 2.0 | OCR for scanned PDFs |
| pgvector | PostgreSQL | Vector search for RAG |
| sentence-transformers | Apache 2.0 | Text embeddings |
| Ollama | MIT | Self-hosted LLM |

---

## 12. Conclusion

The battery compliance software market is a **$2.35B opportunity by 2035** with a massive gap at the mid-tier. Existing players target large OEMs with complex, expensive platforms. **Mid-tier battery assemblers** — the companies that actually build most battery packs — have no viable solution.

This plan positions Anvaya as the **first AI-powered compliance platform built specifically for battery assemblers**. By combining:
- **AI data entry** (PDF parsing, natural language)
- **Real-time compliance checking** (EU + India regulations)
- **Proactive alerts** (certificate expiry, regulation changes)
- **Document generation** (DoC, passport, ESG reports)
- **Competitive intelligence** (carbon benchmarking, supplier risk)

...we transform compliance from a cost center into a **competitive moat**.

**The timeline is real**: February 2027 is 9 months away. Battery passport obligations are non-negotiable. The manufacturers who start now will have compliant products. The ones who wait will have warehouses full of unsellable batteries.

**Let's build this.**

---

## Appendix A: Research Sources

1. EU Battery Regulation (EU) 2023/1542 — EUR-Lex
2. Regulation (EU) 2025/1561 — Due diligence postponement
3. TÜV SÜD — EU Battery Regulation Overview (2024)
4. Battery Pass Consortium — Carbon Footprint Rules (2023)
5. JRC/European Commission — Carbon Footprint Methodology for Industrial Batteries (2024)
6. BIS IS 16046 (Part 2):2018 — Bureau of Indian Standards
7. UN Manual of Tests and Criteria — Section 38.3
8. IATA DGR 67th Edition (2026)
9. CIRPASS-2 DPP Core Ontology (March 2025)
10. MarketsandMarkets — Battery Passport Market Report (2025)
11. Future Market Insights — EV Battery Passport Market (2026)
12. PSQR — Carbon Footprint Requirements Guide (2026)
13. Thammasat University — Data Management Solution for Battery Manufacturer (2024)

---

*Document compiled from regulatory research, competitive analysis, and user pain point validation. Ready for product review and engineering kickoff.*
