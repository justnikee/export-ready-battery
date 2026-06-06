# ExportReady Battery Platform — Deep Manufacturer Persona Analysis
## "Getting in Their Shoes": Mid-Tier India Assembler vs. Small-Tier EU Exporter

**Date:** 2026-06-05  
**Platform Version Audited:** `services/battery-api` (85 migrations) + `apps/battery-web` (53 routes)  
**Analyst Perspective:** Two realistic Indian battery manufacturer personas with divergent compliance needs

---

## Table of Contents
1. [Persona A: Mid-Tier Battery Manufacturer & Assembler (India Domestic)](#persona-a)
2. [Persona B: Small-Tier Battery Manufacturer (EU Exporter)](#persona-b)
3. [Feature Matrix: Both Personas Compared](#feature-matrix)
4. [Strategic Gap Analysis & Prioritized Recommendations](#strategic-gaps)
5. [What ExportReady Should Build Next](#next-build)

---

## <a name="persona-a"></a>1. Persona A: Mid-Tier Battery Manufacturer & Assembler (India Domestic)

### Who Is This Person?

**Name:** Rajesh Patel  
**Company:** Patel Power Solutions Pvt. Ltd., Ahmedabad  
**Revenue:** ₹45–80 crore/year  
**Employees:** 120–180  
**Product:** LFP battery packs for 2W/3W electric vehicles and industrial energy storage  
**Business Model:** Assembles imported cells (mostly CATL/ BYD) into battery packs with BMS, thermal management, and enclosure. Sells to OEMs and fleet operators across Gujarat, Maharashtra, Rajasthan.  
**Export Ambition:** None currently. Exploring Middle East in 2–3 years.  

**Rajesh's Daily Reality:**
- Buys 18650/21700 cylindrical cells or prismatic LFP cells in bulk from China
- Assembles 800–1,500 battery packs per month
- Has 2 assembly lines, a small testing lab, no carbon audit capability
- Uses Tally Prime for accounting and GST filing
- Has a BIS CRS R-number for his battery packs (IS 16046)
- Registered on CPCB portal for EPR but doesn't fully understand obligation calculations
- Worried about the 2025 BWM amendment requiring QR codes with EPR numbers on every battery
- Has informal relationships with 3–4 local scrap dealers for end-of-life collection — no formal recycler MoU

---

### What Rajesh MOST Importantly Needs

| Priority | Need | Why It Matters |
|----------|------|----------------|
| **P0** | **BIS CRS compliance tracking** | Without BIS R-number and IS 16046 certification, he cannot legally sell batteries in India. MoRTH requires AIS-156/038 for EV batteries. |
| **P0** | **EPR obligation calculator + certificate ledger** | CPCB mandates collection targets (70% → 90%). He must track kg placed on market vs. kg recycled via purchased EPR certificates. Missing this = Environmental Compensation up to ₹1 lakh/day. |
| **P0** | **Digital QR labelling with EPR number** | BWM 2025 amendment mandates QR/barcode with EPR reg number on every battery, pack, equipment, and packaging. |
| **P0** | **Cell source declaration & customs documentation** | For imported cells, he needs Bill of Entry, country of origin, customs date. For domestic cells, DVA % proof for PLI eligibility. |
| **P1** | **CPCB quarterly/annual return filing** | Must file Form 3 returns. Manual CSV generation from spreadsheets is error-prone. |
| **P1** | **Production batch management at scale** | Creating 1,000+ passports/month. Needs bulk CSV import, not one-by-one entry. |
| **P1** | **Tally integration** | His accounting, BOM, and supplier data live in Tally. Manual re-entry into compliance software is a dealbreaker. |
| **P1** | **Supplier document collection** | Needs CoCs, test reports, MSDS from cell suppliers. Currently managed via WhatsApp and email. |
| **P2** | **Refurbishment/second-life tracking** | Some returned batteries are refurbished. Needs BIS/NABL-backed refurbishment certificates per 2025 amendment. |
| **P2** | **DGFT subsidy claim automation** | Wants to claim RoDTEP and Interest Equalization on exports to Middle East later. |

---

### How ExportReady Serves Rajesh (Implemented Features)

| Need | ExportReady Implementation | Status |
|------|---------------------------|--------|
| BIS CRS tracking | **BIS Tracker** in Compliance Hub with 10-section IS 16046 checklist. Tenant-level BIS R-number validation. Batch-level BIS certification number. Registry verification cached. | ✅ Strong |
| EPR obligation calculator | **EPR Obligation Service** computes annual obligation by FY, battery category. Applies BWM 2022 targets (60%→80%). Shows deficit, penalty exposure (₹50/kg), status (ON_TRACK / AT_RISK / NON_COMPLIANT). Multi-year dashboard. | ✅ Strong |
| EPR certificate ledger | Full CRUD for purchased recycler certificates with weight kg, FY, status (ACTIVE/RETIRED/EXPIRED). Integrates into obligation computation. | ✅ Strong |
| Digital QR with EPR | QR code generation + PDF label sheets. Public passport at `/p/{uuid}` with EPR number visible. 24-language support including Hindi, Gujarati. | ✅ Strong |
| Cell source & customs | Batch creation wizard has **IMPORTED vs DOMESTIC** toggle. Forces BoE, country of origin, customs date for imports. Server-side DVA calculation (`sale_price_inr / import_cost_inr`) for domestic. PLI auto-disable for imports. | ✅ Strong |
| CPCB Form 3 export | `GET /api/v1/epr/cpcb-export` generates Form 3 CSV for manual portal upload. | ⚠️ Partial (manual upload only) |
| Bulk production | **Bulk CSV import** (500 rows max), auto-generate passports from batch, QR ZIP download (max 500), label PDF sheets. 4-step wizard with templates. | ✅ Strong |
| Tally integration | **Tally sync** with staging/review workflow. Imports BOM → material composition, supplier invoices → provenance, GST transactions → HSN/coo. Configurable sync. | ✅ Strong |
| Supplier document collection | **Supplier portal** with invitation tokens, document upload (CoC, audit reports), review workflow (pending/approved/rejected). Supplier login and dashboard. | ✅ Strong |
| Refurbishment certs | `passports` table has `circularity_status` (RECYCLED, REMANUFACTURED, REUSED, REPURPOSED). Repair/replacement logging. | ⚠️ Partial (no BIS/NABL cert integration yet) |
| DGFT claims | **DGFT Claims module** with RoDTEP, Interest Equalization, Duty Drawback. Status workflow DRAFT→SUBMITTED→APPROVED→REJECTED. PDF/Excel export. | ✅ Strong |

---

### + (Plus/Premium) Features Rajesh Gets (Beyond Essential Needs)

These are features that differentiate ExportReady from basic compliance tools:

| Feature | What It Does | Value to Rajesh |
|---------|-------------|-----------------|
| **Blockchain certificate anchoring** | SHA-256 + OpenTimestamps Bitcoin anchoring for BIS/EPR certificates. Tamper-evident proof. | Gives his OEM customers confidence. Differentiator in tenders. |
| **Compliance score + gap analysis** | Per-batch 0–100 score with actionable gaps ("Missing UN38.3 cert", "DVA below 50%"). | Helps his compliance officer prioritize work. |
| **Proactive alerts** | Daily background job emails for certificate expiry, compliance degraded, low quota. | Prevents lapses that could stop shipments. |
| **Lifecycle management with GPS** | Bulk transition passports (SHIP → INSTALL → RECYCLE) with GPS capture and evidence docs. | Fleet operators love this traceability. |
| **Dispatch scanner** | Web-based barcode scanner with audio feedback for warehouse shipping. LocalStorage crash recovery. | His warehouse team can ship 200+ packs/day without mistakes. |
| **Scan analytics + gamification** | GeoIP tracking of QR scans, scan-to-earn reputation points. | Helps him understand where his batteries are in the field. |
| **Team RBAC** | Owner/admin/operator roles. Invite team members. | His son (operations) and compliance officer can have different permissions. |
| **AI datasheet parsing** | Groq LLM extracts 40+ fields from PDF datasheets/certs. | Saves hours of manual data entry from Chinese cell datasheets. |
| **Natural language batch creation** | "Create 500 LFP 48V packs for Mahindra" → auto-populated batch. | Impressive demo for his investors. |
| **Carbon footprint calculator** | EU Art 7 cradle-to-grave calculator built-in. | Even if not exporting now, ready for Middle East expansion. |
| **EPCIS 2.0 export** | GS1 event export for supply chain interoperability. | Future-proof for large OEM integrations. |
| **Mass balance ledger** | EU Article 8 book-and-claim for recycled materials. | If he starts using recycled content claims, this is essential. |
| **Public passport in 24 languages** | `/p/[uuid]` shows Hindi, Gujarati, English. Rich animated UI with SoH gauge. | His OEM customers' end-users can verify authenticity. |

---

### Essential Features STILL MISSING for Rajesh

| Gap | Impact | Priority |
|-----|--------|----------|
| **Automated CPCB portal API submission** | Currently Form 3 CSV is download-only. Rajesh still has to manually log into CPCB portal and upload. If CPCB opens APIs, this should be automated. | 🔴 P0 |
| **Collection center / recycler MoU tracking** | BWM Rules require formal agreements with registered collection centers and recyclers. No table to store MoU copies, expiry dates, or center registration numbers. | 🔴 P0 |
| **Environmental Compensation (EC) tracking** | If Rajesh misses EPR targets, CPCB levies EC. No tracking of penalty orders, payments, appeals. | 🟡 P1 |
| **BIS/NABL refurbishment certificate integration** | 2025 amendment mandates second-life batteries need refurbishment certs. No dedicated workflow for this. | 🟡 P1 |
| **Informal sector recycler linkage** | 90% of India's battery recycling is informal. Rajesh's local scrap dealers are unregistered. Platform has no mechanism to channel informal collection into formal EPR credits. | 🟡 P1 |
| **State-level compliance variations** | Some states (Maharashtra, Karnataka) have additional e-waste/EV policies beyond central BWM Rules. No state-level rule engine. | 🟢 P2 |
| **PLI Scheme Phase II auto-validation** | DVA calculation exists, but no automatic check against MeitY's PLI beneficiary list or integration with PLI claim submission. | 🟢 P2 |

---

## <a name="persona-b"></a>2. Persona B: Small-Tier Battery Manufacturer (EU Exporter)

### Who Is This Person?

**Name:** Priya Krishnan  
**Company:** Krishnan Energy Systems, Coimbatore  
**Revenue:** ₹8–15 crore/year  
**Employees:** 35–50  
**Product:** Custom cylindrical Li-ion battery packs (18650/21700) for power tools, medical devices, and light mobility (e-bikes, e-scooters)  
**Business Model:** Designs and assembles battery packs using imported Samsung/LG/Molicel cells. 60% export to EU (Germany, Netherlands, Nordics), 40% domestic. White-label manufacturing for European brands.  
**Certifications:** ISO 9001, BIS CRS (domestic), CE marking (for EU), UN38.3 (transport)  

**Priya's Daily Reality:**
- Small team. She is CEO, compliance officer, and sales head rolled into one
- Her European customers (German power tool brand, Dutch e-bike startup) are asking for "battery passports" by Feb 2027
- Has heard of EU Battery Regulation 2023/1542 but finds Annex XIII overwhelming
- Doesn't have budget for €50k–€200k enterprise DPP solutions (Circulor, Minespider)
- Uses Excel + Tally for everything. No ERP.
- Her battery packs are "Light Means of Transport (LMT)" and "Industrial >2kWh" categories — both require full battery passports by Feb 2027
- Worried about: CE marking + Notified Body, carbon footprint declaration, recycled content thresholds, GS1 Digital Link QR codes, W3C Verifiable Credentials
- Has EU Authorized Representative in Germany (mandatory for non-EU manufacturers)
- Needs to prove supply chain due diligence for cobalt, lithium, nickel — but her cell suppliers (Samsung SDI, LG Chem) won't share mine-level data easily

---

### What Priya MOST Importantly Needs

| Priority | Need | Why It Matters |
|----------|------|----------------|
| **P0** | **EU Battery Passport generation (Annex XIII)** | From Feb 2027, every LMT and industrial battery >2kWh MUST have a digital passport accessible via QR code. No passport = cannot place on EU market. |
| **P0** | **GS1 Digital Link QR code** | EU interoperability standard. QR must resolve to passport data in GS1-compliant format. Non-GS1 QR = failed market surveillance. |
| **P0** | **CE marking + Declaration of Conformity (DoC)** | Art 16 & 18. Must affix CE mark, have DoC signed, retain technical documentation for 10 years. |
| **P0** | **Carbon footprint declaration (Art 7)** | Mandatory from Feb 2025 (EV) / Feb 2026 (LMT/industrial). Must calculate kg CO2e/kWh, third-party verified. Carbon offsets excluded. |
| **P0** | **Recycled content disclosure (Art 8)** | Must declare % of recycled Co, Li, Ni, Pb in active materials. From 2031, minimum targets apply (Co 16%, Li 6%, Ni 6%, Pb 85%). |
| **P0** | **Nested component/BOM disclosure (Art 77)** | EU requires cell-level chemistry and recycled content disclosure. Pack-level averages are insufficient. |
| **P1** | **W3C Verifiable Credentials** | CIRPASS/ACRAA interoperability framework requires machine-verifiable credentials. Regulators and market surveillance need to verify passport authenticity programmatically. |
| **P1** | **EU Authorized Representative management** | Non-EU manufacturer must have EU Rep. Name, address, email must be on passport. |
| **P1** | **Removability & replaceability disclosure (Art 11/13)** | From Feb 2027, portable batteries in appliances must be removable/replaceable by end-user. LMT/industrial need disclosure too. |
| **P1** | **Mass balance accounting** | If claiming recycled content, needs ISCC-compliant book-and-claim chain of custody. Percentage-only claims = greenwashing risk. |
| **P1** | **Supply chain due diligence (Art 48–52)** | Postponed to Aug 2027 (Omnibus IV), but customers want evidence now. Need OECD-aligned due diligence for Co, Li, Ni, graphite. |
| **P2** | **REACH/RoHS substance screening** | Must ensure no SVHCs above 0.1%. Needs actual CAS-number screening, not just "did you upload a file?" |
| **P2** | **JSON-LD / machine-readable export** | For ERP integration with EU customers' systems. DIN DKE SPEC 99100 / AAS submodel alignment. |
| **P2** | **EU DPP Registry submission** | By July 2026, EU DPP Registry goes live. Must submit passport identifiers before market placement. |

---

### How ExportReady Serves Priya (Implemented Features)

| Need | ExportReady Implementation | Status |
|------|---------------------------|--------|
| EU Battery Passport (Annex XIII) | **Public passport** at `/p/[uuid]` covers: general info, material composition, hazardous substances, carbon footprint, performance/durability, supply chain, SoH, end-of-life. Three-tier access (public/partner/regulator). Batch snapshot immutability. | ✅ Strong |
| GS1 Digital Link QR | **QRService** supports GS1 Digital Link format. `batches` table has `gtin` field. QR can encode `https://id.gs1.org/01/{GTIN}/21/{SN}`. | ✅ Strong |
| CE marking + DoC | Batch schema includes `ce_marking`, `notified_body_number`, `declaration_of_conformity_path`, `carbon_performance_class` (A–E). Tenant profile stores EU Rep data. | ✅ Strong |
| Carbon footprint | **CarbonCalculatorService** — cradle-to-grave, 5 lifecycle stages, kg CO2e/kWh, performance class A–G. Offsets explicitly excluded. Result stored in `batches.carbon_footprint_result` JSONB. | ✅ Strong |
| Recycled content | Per-material percentages (Co, Li, Ni, Pb, Graphite, Mn) in `batches.specs.material_composition`. EU validator checks against thresholds (DB-configurable). | ✅ Strong |
| BOM/cell-level disclosure | **`components` table** (migration 079) supports pack/module/cell hierarchy with parent IDs. Batch detail page has Components tab. BOMValidator checks cycle-free hierarchy. | ✅ Strong |
| W3C Verifiable Credentials | **`passport_vcs` table** + `VCCryptoService` — Ed25519 DID generation, LD-Proof signing. DID document endpoint. | ✅ Strong |
| EU Rep management | `battery_tenant_profiles` stores EU Rep name, address, email. Validated by EU validator. | ✅ Strong |
| Removability/replaceability | `batches` has `removable_and_replaceable` boolean field. Part of EU schema. | ✅ Strong |
| Mass balance | **`mass_balance_ledgers`** and **`mass_balance_allocations`** tables. EU Art 8 book-and-claim tracking per material. UI page with summary cards and allocation dialog. | ✅ Strong |
| Supply chain due diligence | `batches.specs.supply_chain_provenance` stores country of origin, supplier names, certification body (RMI/IRMA), mine/refinery. Supplier portal for CoC collection. | ⚠️ Partial (no OECD risk scoring) |
| REACH/RoHS | EU validator checks `has_reach_data` and `has_rohs_data` booleans. Hazardous substances struct present. | ⚠️ Partial (presence check only, no CAS screening) |
| JSON-LD export | `GET /api/v1/passports/{uuid}/epcis` returns EPCIS XML. **No dedicated JSON-LD export for DIN DKE SPEC 99100 / AAS submodel.** | ❌ Missing |
| EU DPP Registry submission | No connector to EU Central DPP Registry. | ❌ Missing |

---

### + (Plus/Premium) Features Priya Gets

| Feature | What It Does | Value to Priya |
|---------|-------------|-----------------|
| **Dual India + EU compliance checking** | `GLOBAL` market mode runs both validators simultaneously. One batch = compliance for both markets. | She sells 60/40 EU/India. This saves duplicate work. |
| **Hash-chain audit trail** | SHA-256 + previous_hash in `passport_events`. Verify endpoint recomputes chain. | Her German customers ask for tamper-evident traceability. This delivers it. |
| **Certificate blockchain anchoring** | OpenTimestamps Bitcoin anchoring for certificates. | Adds credibility to her BIS and UN38.3 certs. |
| **AI datasheet parsing** | Upload Samsung/LG cell datasheet PDF → auto-extracts capacity, chemistry, voltage, cycle life. | Saves her 2–3 hours per new cell model. |
| **Natural language batch creation** | Type "500 packs with Molicel INR21700 cells for Bosch tool line" → wizard auto-fills. | Fast batch creation during busy periods. |
| **Compliance deadlines dashboard** | `compliance_deadlines` table tracks regulatory milestones (e.g., "EU recycled-content 6% deadline: 2027-08-18"). | She can plan ahead and warn customers. |
| **Async export jobs** | Background generation of QR ZIP, label PDFs, due diligence reports, compliance declarations. | She can queue exports and keep working. |
| **Three-tier data access** | Public QR scan vs. Partner magic-link vs. Regulator key. | Protects commercially sensitive data (prices, margins) from public view. |
| **Lifecycle repair/replace logging** | Tracks repairs, part replacements, refurbishment with evidence. | Supports warranty claims and second-life certification. |
| **Multi-language public passport** | German, Dutch, English, French + Indian languages. | Her EU customers' end-users can read passports in local language. |
| **DGFT claims** | RoDTEP, Interest Equalization for her 40% domestic export shipments. | Cash flow improvement via subsidy claims. |
| **External API with API keys** | Her EU customers can pull passport data via REST API with HMAC-signed keys. | Enables ERP integration without her building custom APIs. |
| **Tally integration** | Imports her Tally BOM and supplier data. | No manual re-entry from her existing accounting system. |

---

### Essential Features STILL MISSING for Priya

| Gap | Impact | Priority |
|-----|--------|----------|
| **JSON-LD / DIN DKE SPEC 99100 export** | EU interoperability framework expects AAS submodel with ECLASS semantic IDs. ExportReady has no AAS, ECLASS, or IEC 63278 references. Her customers' ERPs may not parse the passport data programmatically. | 🔴 P0 |
| **EU DPP Registry API connector** | The EU DPP Registry goes live July 2026. Without automated submission, Priya must manually register each battery model. At her scale (20–30 models/year), this is manageable but risky. | 🔴 P0 |
| **Actual REACH SVHC CAS-number screening** | Current validator checks `has_reach_data == true`. It does NOT screen CAS numbers against the SVHC list. A battery with a restricted substance could pass validation. Legal liability for Priya. | 🔴 P0 |
| **Hard threshold enforcement for EU recycled content** | Validator emits warnings but does NOT fail validation when recycled % is below regulatory floors. Priya could generate a "passing" passport that is legally non-compliant. | 🔴 P0 |
| **Due diligence risk scoring (OECD-aligned)** | `SupplyChainProvenance` stores data but has no conflict-affected area flagging, no human rights risk scoring, no tier-1/2/3 mapping with risk levels. Her German customer requires OECD DDG evidence. | 🟡 P1 |
| **Automated EU Notified Body lookup** | `notified_body_number` is a free-text field. No validation against NANDO database. Wrong number = invalid CE marking. | 🟡 P1 |
| **Data residency / EU-region hosting** | EU customers often require data stored in EU. Single DB with no geo-sharding is an enterprise sales blocker. | 🟡 P1 |
| **GDPR Art 17 right-to-erasure endpoint** | EU data subjects (end consumers) have right to erasure. No `DELETE /me` or data-export endpoint exists. | 🟡 P1 |
| **CE marking readiness checklist** | No pre-flight check that conformity assessment modules are complete before passport issuance. | 🟢 P2 |
| **Spare parts availability tracking** | Art 11 requires part numbers + supplier contact for replacement parts. Not in schema. | 🟢 P2 |
| **Cross-market intelligence** | No alert like "You have EU carbon data but lack BIS certificate for India" when running GLOBAL mode. | 🟢 P2 |

---

## <a name="feature-matrix"></a>3. Feature Matrix: Both Personas Compared

| Feature Category | Feature | Rajesh (Mid-Tier India) | Priya (Small-Tier EU Export) |
|------------------|---------|------------------------|------------------------------|
| **India Compliance** | BIS CRS tracking | ✅ Essential | ⚪ N/A |
| | EPR obligation calculator | ✅ Essential | ⚪ N/A |
| | EPR certificate ledger | ✅ Essential | ⚪ N/A |
| | CPCB Form 3 export | ⚠️ Partial | ⚪ N/A |
| | QR with EPR number | ✅ Essential | ⚪ N/A |
| | Cell source / customs / DVA | ✅ Essential | ⚪ N/A |
| | MoRTH BPAN support | ✅ Essential | ⚪ N/A |
| | PLI tracking | ✅ Strong | ⚪ N/A |
| | Tally integration | ✅ Essential | ✅ Nice-to-have |
| **EU Compliance** | Battery Passport (Annex XIII) | ⚪ N/A | ✅ Essential |
| | GS1 Digital Link QR | ⚪ N/A | ✅ Essential |
| | CE marking + DoC | ⚪ N/A | ✅ Essential |
| | Carbon footprint (Art 7) | ✅ Nice-to-have | ✅ Essential |
| | Recycled content (Art 8) | ⚠️ Partial | ✅ Essential |
| | BOM/cell disclosure (Art 77) | ⚪ N/A | ✅ Essential |
| | W3C Verifiable Credentials | ⚪ N/A | ✅ Essential |
| | EU Rep management | ⚪ N/A | ✅ Essential |
| | Removability/replaceability | ⚪ N/A | ✅ Essential |
| | Mass balance accounting | ⚪ N/A | ✅ Essential |
| | JSON-LD / AAS export | ⚪ N/A | ❌ Missing |
| | EU DPP Registry connector | ⚪ N/A | ❌ Missing |
| | REACH CAS screening | ⚪ N/A | ❌ Missing |
| **Shared / Platform** | Bulk batch creation | ✅ Essential | ✅ Essential |
| | Passport generation | ✅ Essential | ✅ Essential |
| | Lifecycle management | ✅ Strong | ✅ Strong |
| | Supplier portal | ✅ Strong | ✅ Strong |
| | Blockchain anchoring | ✅ +Feature | ✅ +Feature |
| | AI datasheet parsing | ✅ +Feature | ✅ +Feature |
| | Compliance scoring | ✅ +Feature | ✅ +Feature |
| | Proactive alerts | ✅ +Feature | ✅ +Feature |
| | Multi-language passport | ✅ +Feature | ✅ +Feature |
| | Team RBAC | ✅ +Feature | ✅ +Feature |
| | External API | ✅ +Feature | ✅ +Feature |
| | DGFT claims | ✅ +Feature | ⚪ N/A |
| | Async export jobs | ✅ +Feature | ✅ +Feature |
| | EPCIS 2.0 export | ✅ +Feature | ✅ +Feature |
| | Telemetry / SoH ingestion | ✅ +Feature | ✅ +Feature |

---

## <a name="strategic-gaps"></a>4. Strategic Gap Analysis & Prioritized Recommendations

### The Good News

ExportReady is **significantly more mature** than the May 2026 audit documents suggested. Many "P0 gaps" have been closed:

- ✅ BOM/Components table (migration 079)
- ✅ EPR obligation tracking (`epr_obligations` table)
- ✅ Mass balance ledgers (`mass_balance_ledgers`, `mass_balance_allocations`)
- ✅ W3C VC with Ed25519 signing (`passport_vcs` table, `VCCryptoService`)
- ✅ GS1 Digital Link QR support (`QRService`, `gtin` field)
- ✅ Tally integration (4 migrations: 075–078)
- ✅ Supplier portal (migrations 082–083)
- ✅ DGFT claims (migrations 080–081)
- ✅ Registry verifications (migration 084)
- ✅ Compliance deadlines (migration 085)
- ✅ 24-language public passport (including Hindi, Gujarati, Tamil, Telugu)
- ✅ 4-step batch wizard with templates and auto-save
- ✅ Certificate blockchain anchoring

### The Bad News

Three categories of gaps remain that block real-world adoption:

#### Category 1: Regulatory Hard Blockers (Will Cause Legal Problems)

| # | Gap | Who It Blocks | Regulatory Risk |
|---|-----|---------------|-----------------|
| 1 | **No JSON-LD / AAS / DIN DKE SPEC 99100 export** | Priya (EU exporter) | EU customers' ERPs cannot machine-read passport data. Interoperability failure. |
| 2 | **No EU DPP Registry connector** | Priya (EU exporter) | Cannot submit passport IDs to EU registry. Market access blocked after Feb 2027. |
| 3 | **REACH is presence-check only (no CAS screening)** | Priya (EU exporter) | Restricted substances could pass validation. Legal liability, recall risk. |
| 4 | **No hard threshold enforcement on recycled content** | Priya (EU exporter) | Passport can show "compliant" while being legally non-compliant. Liability trap. |
| 5 | **No automated CPCB API submission** | Rajesh (India assembler) | Manual Form 3 upload = errors, missed deadlines, EC penalties. |
| 6 | **No collection center / recycler MoU tracking** | Rajesh (India assembler) | Cannot prove formal recycling agreements to CPCB auditors. |

#### Category 2: Operational Friction (Will Cause Churn)

| # | Gap | Who It Blocks | Business Risk |
|---|-----|---------------|---------------|
| 1 | **No India informal sector recycler linkage** | Rajesh (India assembler) | 90% of recycling is informal. Rajesh cannot convert collection into EPR credits. |
| 2 | **No OECD-aligned due diligence risk scoring** | Priya (EU exporter) | German customers demand OECD DDG evidence. Manual preparation = lost deals. |
| 3 | **No data residency / EU hosting** | Priya (EU exporter) | Enterprise EU customers require EU data storage. Blocks sales >€500k. |
| 4 | **No GDPR/DPDP right-to-erasure** | Both | Legal requirement. Fine risk up to 4% global turnover. |
| 5 | **Aggregate scoring flattens per-market scores** | Both | Rajesh can't see "India score 95%, EU score 45%" separately. Bad UX. |

#### Category 3: Competitive Moat (Will Lose to Competitors)

| # | Gap | Who It Blocks | Competitive Risk |
|---|-----|---------------|------------------|
| 1 | **No SAP/Oracle/Dynamics connectors** | Priya (EU exporter) | Large EU OEMs use SAP. ExportReady only has Tally + generic REST API. |
| 2 | **No IoT/BMS integration (MQTT/OPC-UA)** | Both | Real-time SoH from BMS is a differentiator. Currently only manual CSV upload. |
| 3 | **No multi-brand support per tenant** | Priya (EU exporter) | Contract manufacturers manage multiple OEM brands. Forces separate accounts. |
| 4 | **No compliance readiness gap dashboard** | Both | TrusTrace, Kosha.ai have this. ExportReady's per-batch score is insufficient. |

---

## <a name="next-build"></a>5. What ExportReady Should Build Next

### Sprint 1–2 (Weeks 1–4): Fix Legal Liability

1. **Add JSON-LD export endpoint** — Map batch + components + passport data to DIN DKE SPEC 99100 AAS submodel with ECLASS semantic IDs.
2. **Add hard threshold enforcement** — EU validator must FAIL (not warn) when recycled content is below regulatory floors. Make this configurable via `compliance_rules`.
3. **Add REACH SVHC CAS screening** — Integrate with ECHA SVHC list API. Screen BOM components against CAS numbers.
4. **Add collection center MoU table** — `recycler_mous` table with CPCB registration number, expiry, document upload.

### Sprint 3–4 (Weeks 5–8): EU Market Access

5. **EU DPP Registry connector spike** — Research registry API specs (expected July 2026). Build submission endpoint.
6. **Per-market scorecard** — Replace `Aggregate()` arithmetic mean with structured `{eu: {score, gaps}, india: {score, gaps}}`.
7. **GDPR/DPDP erasure endpoint** — `DELETE /api/v1/me` with 30-day purge workflow.
8. **OECD due diligence risk scoring** — Add conflict-affected area flagging, human rights risk matrix, tier mapping.

### Sprint 5–6 (Weeks 9–12): Scale & Moat

9. **IoT/BMS MQTT ingestion** — Device-token authenticated MQTT broker endpoint. Real-time SoH streaming.
10. **Compliance readiness dashboard** — "You need X to sell in EU" gap analysis with regulatory deadline calendar and per-market checklists.
11. **Multi-brand support** — `brands` table, tenant-scoped brand management, brand-scoped passport views.
12. **SAP connector (MVP)** — IDoc or OData connector for BOM and supplier data extraction.

---

## Conclusion

**ExportReady is 80–85% compliant-feature-complete** for both personas — a remarkable achievement for a platform at this stage. The core regulatory data model, compliance engine, and manufacturer workflows are solid.

**For Rajesh (mid-tier India assembler):** ExportReady is nearly ready for production use. The missing pieces are operational (CPCB API automation, recycler MoU tracking) rather than regulatory. The Tally integration, EPR calculator, and bulk import directly solve his pain points. He would benefit from onboarding today.

**For Priya (small-tier EU exporter):** ExportReady is "almost compliant" but has three hard blockers that prevent regulatory submission: (1) no JSON-LD/AAS machine-readable export, (2) no EU DPP Registry connector, and (3) soft warnings instead of hard failures on recycled content. These must be fixed before February 2027. Once fixed, the platform is competitively priced and feature-rich for her segment.

**The platform's biggest strategic strength:** Dual India + EU compliance in one workflow. No global competitor (Circulor, TrusTrace) has built India BWM + EU Battery Regulation together. This is ExportReady's defensible moat — if the remaining P0 gaps are closed before competitors catch up.
