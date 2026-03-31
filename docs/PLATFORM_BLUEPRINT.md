# Battery Passport Platform — Full Blueprint

> Based on: Gap Analysis, Competitive Benchmarking, Frontend/Backend Exploration
> Goal: Complete step-by-step plan covering onboarding → passport → lifecycle → SoH → IoT (no partners yet)

---

## CURRENT STATE SUMMARY

**What exists (solid core):**
- 7-state lifecycle machine (CREATED → ACTIVE → SHIPPED → IN_SERVICE → RECALLED → RECYCLED → END_OF_LIFE)
- SHA-256 hash chain audit trail
- Three-tier data access (PUBLIC / PARTNER / REGULATOR)
- BMS telemetry ingestion (SoH, cycles, temp, voltage, thermal events)
- Carbon footprint calculator (JRC 2024 factors)
- India dual-mode compliance (BIS, EPR, AIS-156/038, MoRTH, IEC)
- 4-step onboarding, magic links, API keys, trusted partners
- 41 frontend pages, 27 backend services, 38 DB migrations

**What's broken or missing (gap summary):**
- REPAIR/REPLACE transitions exist in model but no endpoints/UI
- DataVisibility JSONB saved but never enforced in views
- Hash chain genesis not anchored to passport UUID
- No BatteryCategory field (EV/LMT/INDUSTRIAL/PORTABLE)
- No SupplyChainProvenance (mine/smelter/refiner tiers)
- SoH telemetry updates bypass audit hash chain
- No DisassemblyGuide struct
- No structured PerformanceSpec
- No carbon EOL phase
- No InitialSoH baseline
- Passport transfer + lifecycle handlers missing tenant ownership checks (security)
- Refresh token JTI never validated (security)
- No outbound partner webhooks

---

## PART 1 — DASHBOARD PAGES: REQUIRED vs GOOD-TO-HAVE

### 🔴 ABSOLUTELY REQUIRED (Platform Cannot Function Without These)

#### 1. `/onboarding` — Multi-Step Company Setup
**Status: EXISTS (4 steps)**
Steps needed:
1. Company Profile (name, address, support email, logo)
2. Target Market Selection (India / EU / Both)
3. Compliance Setup (EPR, BIS-R, IEC, MoRTH, EU Rep details)
4. **MISSING: Battery Category Declaration** — must add EV/LMT/INDUSTRIAL/PORTABLE selection
5. Review & Complete

**Gaps to fix:**
- Add BatteryCategory step
- Add DVA % target (for PLI eligibility)
- Connect onboarding data to activation compliance gate check preview

---

#### 2. `/dashboard` — Overview Command Center
**Status: EXISTS**
Must show:
- Active batch count + passport count
- Compliance status summary (India ✅/❌, EU ✅/❌)
- Recent lifecycle activity feed
- Quota balance + top-up CTA
- Carbon footprint aggregate
- **MISSING: EU compliance deadline countdown** (Feb 18, 2027 banner)
- **MISSING: Gap checklist widget** ("You are X% EU compliant — 3 things missing")

---

#### 3. `/batches` + `/batches/[id]` — Batch Management Hub
**Status: EXISTS but incomplete**
Must have on batch detail:
- All current tabs: Overview, Passports, Carbon, DVA, Exports
- **MISSING TAB: Supply Chain** — SupplyChainProvenance input (mine/smelter/refiner per material)
- **MISSING TAB: Performance Specs** — structured PerformanceSpec form (capacity Ah/Wh, voltages, C-rate, temp range)
- **MISSING TAB: Disassembly Guide** — step-by-step, tools, hazard warnings, EOL instructions
- **MISSING TAB: Compliance Checklist** — real-time BatteryPass 80-attribute completion score
- Activation button must show pre-flight check results inline (not just 422 toast)

---

#### 4. `/passports/[uuid]` — Individual Passport Detail
**Status: Partial — public view exists at `/p/[uuid]`; internal view needs work**
Required internal view sections:
- Identity block (BPAN, UUID, manufacture date, status badge)
- Lifecycle timeline (visual state machine — which state, what happened, when, by whom)
- **MISSING: Repair/Replace log** — table of all repair events with technician, date, parts
- Telemetry chart (SoH over time, cycle count, temperature, voltage) ← exists
- Audit trail tab (hash chain events table with verify chain button)
- Access control panel (generate magic links, assign data access tokens)
- **MISSING: SoH health gauge** — current SoH % vs initial baseline vs 80% threshold

---

#### 5. `/analytics` — Scan & Lifecycle Analytics
**Status: EXISTS (country, device, live scan feed)**
Must add:
- **MISSING: Lifecycle funnel** — how many passports per state (CREATED/ACTIVE/SHIPPED/IN_SERVICE)
- **MISSING: SoH distribution chart** — histogram of all in-service batteries' current SoH
- **MISSING: Telemetry anomaly log** — thermal events per batch/passport
- **MISSING: Carbon aggregate dashboard** — total kg CO2e across all batches

---

#### 6. `/settings` — Account & Compliance Configuration
**Status: EXISTS (company, docs, data access tokens, data visibility)**
Must fix:
- **BROKEN: Data Visibility settings save but are never enforced** (GAP-4) — critical fix
- Add MoRTH settings (migration 000035 exists but UI may be incomplete)
- **MISSING: EU Representative section** — separate from India compliance
- Add Carbon Class thresholds display (when Aug 2027 mandate kicks in)

---

#### 7. `/partners` — Partner & Trusted Domain Management
**Status: EXISTS**
Must have:
- Create/list trusted partners (email domain allowlist for magic links)
- Partner invite code generation
- **MISSING: Partner webhook configuration** — URL + secret + events to subscribe to (GAP-10)
- Partner access log (which partner accessed which passport when)

---

#### 8. `/developer` — API Keys & Device Tokens
**Status: EXISTS (API keys)**
Must add:
- **MISSING: Device Token management UI** — create/list/revoke IoT device tokens
- Device token scoped to specific passport UUID
- Sample curl/JSON payloads for telemetry ingestion
- **MISSING: Webhook log** — outbound webhook delivery history + retry status

---

#### 9. `/p/[uuid]` — Public Passport Page (QR Scan Landing)
**Status: EXISTS**
Must work correctly:
- **BROKEN: DataVisibility not enforced** — fields hidden in settings still show publicly
- Must show: Chemistry, SoH, certifications, material composition, hazardous substances
- Must show: Repair/Replace history (public per EU Art 14)
- Must show: DisassemblyGuide (public per EU Art 11)
- Must show: Carbon footprint (public per EU Art 7)
- Must NOT show (unless PARTNER/REGULATOR): ownership history, supply chain tiers, internal notes

---

#### 10. `/team` — Team & Role Management
**Status: EXISTS**
Required roles for lifecycle to work:
- OWNER / ADMIN — can RECALL
- MEMBER / INTERNAL_OPERATOR — can SHIP
- TECHNICIAN — can INSTALL, log REPAIR/REPLACE
- LOGISTICS — can SHIP
- RECYCLER — can RECYCLE, CLOSE

**MISSING: Role clearly labelled in UI per lifecycle capability**

---

### 🟡 GOOD TO HAVE (Important but not blocking)

#### 11. `/lifecycle` — Lifecycle Operations Center ← **NEW PAGE NEEDED**
A dedicated page to:
- Filter passports by lifecycle state
- Bulk transition (e.g., bulk SHIP 500 passports)
- Bulk RECALL with reason
- Repair logging console for technicians
- Replace logging console
- Magic link generator for external logistics/recycler actors

This is the "operations center" — separate from batch management, focused on physical movement.

---

#### 12. `/compliance` — EU/India Compliance Dashboard ← **NEW PAGE NEEDED**
- EU Battery Regulation coverage score (X of 80 attributes)
- BatteryPass consortium attribute checklist
- India EPR obligation tracker (current obligation vs filed)
- Carbon class projection (A-G, based on current data)
- Audit-ready export (one-click generate all compliance PDFs)
- Deadline countdown widgets (Feb 2027, Aug 2027, Aug 2028)

---

#### 13. `/supply-chain` — Supply Chain Provenance ← **NEW PAGE NEEDED**
- Visual multi-tier supply chain map
- Add/manage mine → smelter → refiner → cell manufacturer per material
- Compliance status per tier (VERIFIED / PENDING / FLAGGED)
- RMI/RMAP certification tracking
- Art. 48 due diligence completion score

---

#### 14. `/exports` — Reports & Document Center
**Status: EXISTS**
Add:
- One-click "EU Compliance Pack" (due diligence + declaration + audit trail bundled)
- Scheduled export jobs
- Export history with download links

---

#### 15. `/rewards` — Gamification & Loyalty
**Status: EXISTS**
- Keep as-is for now; good for SMB retention

---

## PART 2 — FULL WORKING FLOW: ONBOARDING → PASSPORT

### STEP 1: MANUFACTURER ONBOARDS

```
User visits /register
  → Creates account (company email, password)
  → Email verification sent
  → On verify → redirected to /onboarding

/onboarding — 5 steps:
  Step 1: Company Profile
    - Company name, address, support email, website, logo upload
    
  Step 2: Target Market
    - India only / EU only / Both (GLOBAL)
    - This sets MarketRegion on the tenant
    
  Step 3: India Compliance (if India or GLOBAL)
    - EPR registration number (CPCB)
    - BIS R-Number
    - IEC Code
    - MoRTH Code
    - DVA target % (for PLI eligibility)
    
  Step 4: EU Compliance (if EU or GLOBAL)
    - EU Authorized Representative name
    - EU Rep address
    - EU Rep contact email
    
  Step 5: Battery Category Declaration (NEW — MISSING)
    - Select: EV / LMT / INDUSTRIAL / PORTABLE
    - This is required for EU scope determination
    
  Step 6: Review & Invite Team
    - Invite team members (optional)
    - Set roles: OWNER/ADMIN/MEMBER/TECHNICIAN/RECYCLER/LOGISTICS
    
  → On complete: onboarding_completed = true → redirect to /dashboard
```

---

### STEP 2: CREATE A BATCH (Model-Level Data)

```
/batches → "New Batch" button → create-batch-dialog.tsx

Required fields (mapped to activation compliance):
  Basic Info:
    - Model name (e.g., "EV-Pack-100kWh-LFP-2026")
    - Chemistry: LFP / NMC / NCA / LCO / NiMH / Lead-Acid
    - BatteryCategory: EV / LMT / INDUSTRIAL / PORTABLE (NEW)
    - Capacity: structured Ah + Wh (not free text)
    - Nominal voltage (V)
    - Weight (kg)
    - Manufacturing start/end dates
    - Market region (inherits from tenant, can override)
  
  Performance Specs tab (NEW — GAP-8):
    - Rated capacity Ah + Wh
    - Min/Max/Nominal voltage
    - Capacity at 80% SoH (for second-life planning)
    - Initial internal resistance (Ω)
    - Max charge C-rate / discharge C-rate
    - Operating temp range (°C min/max)
  
  Material Composition tab:
    - Cobalt %, Lithium %, Nickel %, Manganese %, Graphite %, Lead %
    - Recycled % per material (soft-warned until Aug 2028, then hard block)
  
  Hazardous Substances tab:
    - Lead present (yes/no) + declaration text
    - Mercury present + declaration
    - Cadmium present + declaration
    - REACH/RoHS compliance statement
  
  Certifications tab:
    - AIS-156 / AIS-038 (India)
    - BIS certification number
    - CE marking (EU)
    - UL / IEC 62133 / UN38.3 (international)
  
  Supply Chain tab (NEW — GAP-1):
    - Country of origin
    - For each critical material (Co/Li/Ni/Mn):
      - Mine/extraction: name, GPS, operator, country, compliance status
      - Smelter/processor: name, country, cert number
      - Refiner: name, country, RMI/RMAP cert
      - Cell manufacturer: name, country
  
  Disassembly Guide tab (NEW — GAP-7):
    - Step-by-step disassembly steps (ordered list)
    - Tools required
    - Hazard warnings
    - Minimum SoH threshold before decommission
    - EOL instructions
    - Recycler contact URL
  
  → Save as DRAFT → status = DRAFT
```

---

### STEP 3: CARBON FOOTPRINT CALCULATION

```
On batch detail → Carbon tab:
  
  Inputs:
    - Chemistry (auto-filled from batch)
    - Capacity kWh
    - Cell manufacturing country
    - Battery assembly country
    - Assembly energy kWh
    - Transport mode + distance
    - EOL carbon (NEW — GAP-13): recycler energy mix + dismantling
  
  → POST /api/v1/batches/{id}/carbon-footprint
  → JRC 2024 factors applied
  → Result: kg CO2e/kWh breakdown per phase:
      Raw materials + Cell manufacturing + Assembly + Transport + EOL
  → Declaration text generated
  → Carbon class A-G assigned (when Aug 2027 mandate active)
  
  → carbon_footprint_result saved as JSONB to batch
```

---

### STEP 4: BATCH ACTIVATION (Compliance Gate)

```
On batch detail → "Activate Batch" button:
  
  Pre-flight checklist displayed (NEW UX improvement):
    ✅/❌ BatteryCategory set
    ✅/❌ PerformanceSpec complete
    ✅/❌ Material composition declared
    ✅/❌ Hazardous substances declared
    ✅/❌ Carbon footprint calculated
    ✅/❌ Supply chain provenance (at least mine+country per critical material)
    ✅/❌ Disassembly guide present
    ✅/❌ [India] EPR, BIS-R, IEC, MoRTH, AIS-156, AIS-038
    ✅/❌ [EU] EU Rep details, carbon result, material composition, hazardous, cycles, warranty
  
  All ✅ → "Activate" button enabled
  Any ❌ → Shows exactly what's missing + link to fix it
  
  → POST /api/v1/batches/{id}/activate
  → 200: batch.status = "ACTIVE"
  → 422: list of failures (current behavior, improve UX)
```

---

### STEP 5: PASSPORT GENERATION

```
On active batch → "Generate Passports" button:
  
  Input: count (1 to 500 per batch)
  
  → POST /api/v1/batches/{id}/generate-passports?count=N
  → For each passport:
      - UUID assigned
      - BPAN serial: {REGION}-{MFR}-{CHEM}-{YEAR}-{NNNNN}
        e.g., IN-TEN-LFP-2026-00001
      - BatchSnapshot frozen (full specs immutable into passport)
      - InitialSoH = 100.0 set (NEW — GAP-14)
      - status = CREATED
      - QR code generated: /p/{uuid}
      - Genesis hash anchored: GENESIS:{uuid}:{serial} (NEW — GAP-3)
  
  → Passports appear in batch detail → Passports tab
  → Download QR ZIP → /api/v1/batches/{id}/download
  → Download Labels PDF → /api/v1/batches/{id}/labels
  → Print QR codes, affix to physical batteries
```

---

### STEP 6: LIFECYCLE TRANSITIONS (Physical Battery Journey)

```
CREATED → ACTIVE (manufacturer activates unit)
  Action: ACTIVATE
  Actor: INTERNAL_OPERATOR or SYSTEM
  Evidence: none
  Trigger: Can be bulk-activated for whole batch
  
ACTIVE → SHIPPED (battery leaves factory)
  Action: SHIP
  Actor: INTERNAL_OPERATOR or LOGISTICS
  Evidence:
    - shipment_reference (e.g., AWB number, PO number)
    - shipment_date (ISO 8601)
  Options:
    - Internal user transitions directly
    - OR: Generate magic link for logistics partner
      → POST /api/v1/auth/magic-link
      → Link emailed to logistics partner (single-use, role=LOGISTICS, action=SHIP)
      → Partner clicks link → opens /p/{uuid}/action → fills evidence → submits
  
SHIPPED → IN_SERVICE (battery installed)
  Action: INSTALL
  Actor: TECHNICIAN
  Evidence:
    - installation_date
    - installer_id (technician badge/ID)
  Options:
    - Internal technician transitions via dashboard
    - OR: Magic link for external installer
  
IN_SERVICE → REPAIR (ongoing — does NOT change main state)
  Action: REPAIR (NEW — GAP-2)
  Actor: TECHNICIAN or MANUFACTURER
  Evidence:
    - repair_date
    - technician_id
    - component_repaired (e.g., "BMS board")
    - repair_notes
  → Creates PassportEvent type=REPAIR_LOGGED (enters hash chain)
  → RepairEvents JSONB updated on passport
  → Visible in PUBLIC view (EU Art 14 requires this)
  
IN_SERVICE → REPLACE (component replaced — does NOT change main state)
  Action: REPLACE (NEW — GAP-2)
  Actor: TECHNICIAN or MANUFACTURER
  Evidence:
    - replacement_date
    - technician_id
    - component_replaced
    - replacement_reason
    - new_component_serial (optional)
  → Creates PassportEvent type=REPLACEMENT_LOGGED
  → ReplacementEvents JSONB updated
  
IN_SERVICE → RECALLED (safety hold)
  Action: RECALL
  Actor: ADMIN only
  Evidence:
    - recall_reason (mandatory)
    - recall_reference (batch recall ID)
  → Passport blocked for use
  → Magic link generation blocked for recalled passports
  
RECALLED/IN_SERVICE → RECYCLED
  Action: RECYCLE
  Actor: RECYCLER
  Evidence:
    - recycler_epr_id (mandatory)
    - recycling_date
    - certificate_reference
  Options:
    - Internal recycler transitions via dashboard
    - OR: Magic link for authorized recycler company
  
RECYCLED → END_OF_LIFE
  Action: CLOSE
  Actor: SYSTEM or RECYCLER
  Evidence:
    - certificate_reference
  → Passport permanently closed
  → Hash chain sealed
  → Due diligence PDF can still be downloaded
```

---

### STEP 7: TELEMETRY / SOH (IN-SERVICE PHASE)

```
Physical battery → BMS device → Internet → ExportReady API

Device Setup:
  1. Manufacturer creates device token in /developer
     → POST /api/v1/device-tokens { passport_id, label }
     → Returns device_token (shown once, save it)
     → Token scoped to that passport UUID only
  
  2. Flash token into BMS firmware or gateway device

BMS Data Ingestion:
  POST /api/v1/telemetry
  Headers: Authorization: Bearer {device_token}
  Body: {
    passport_id: "...",
    state_of_health: 92.3,       // %
    cycle_count: 145,
    temperature: 28.4,           // °C
    voltage: 48.2,               // V
    current: 15.3,               // A (optional)
    thermal_event: false,
    recorded_at: "2026-03-31T10:00:00Z"
  }
  
  → Server validates device token
  → Updates passport dynamic fields (soh, cycles, temp, voltage)
  → Creates PassportEvent type=SOH_UPDATE (NEW — GAP-6 fix)
  → If thermal_event=true → creates THERMAL_EVENT PassportEvent
  → Reading stored in telemetry_readings time-series table
  
SoH Visibility:
  - Current SoH → PUBLIC view (EU Art 14)
  - InitialSoH baseline → PUBLIC view (set to 100 at creation)
  - SoH at 80% threshold → structured in PerformanceSpec
  - Full telemetry history → PARTNER view only
  - Thermal event log → PARTNER view

SoH-Driven Actions:
  - SoH < MinSOHThreshold (e.g., 70%) → flag on passport
  - Flag visible in dashboard → "Battery Degradation Alert"
  - Recommendation: Second-life assessment or decommission
  - Future: automated lifecycle transition suggestion
```

---

## PART 3 — LIFECYCLE TRACKING: BIG PLAYERS vs US vs HOW TO IMPROVE

### How Big Players Handle Lifecycle

#### Circulor (Enterprise, deployed at Volvo Cars)
- **Full supply chain graph** from raw material (mine GPS) to OEM vehicle
- Every entity in the chain (mine operator, smelter, refiner, cell mfr, OEM) is an actor in the system
- Each actor self-declares their tier's data, verified by third-party auditor
- Status transitions happen at every tier: raw material lot → cell → pack → vehicle install
- SoH tracked via direct OEM integration (CAN bus → cloud)
- REPAIR events triggered by workshop management system (WMS) integration
- Blockchain-anchored: hash chain written to public blockchain for external verifiability
- Carbon footprint is PRIMARY data from each factory (not estimates)

#### Circularise (Privacy-first)
- Zero-knowledge proofs: supplier can PROVE recycled content % without revealing actual supply chain
- Claims are attested by independent verifiers (SGS, Bureau Veritas sign claims cryptographically)
- Every field has visibility setting: ZK-disclosed / selective / full
- Lifecycle events come from ERP integrations (SAP, Oracle)
- SoH comes from OEM fleet management API

#### BatteryPass Consortium (Reference model)
- Defines 80+ mandatory attributes across 8 categories
- Lifecycle status is just one dimension — they track: capacity degradation curve, impedance growth, energy efficiency loss
- "State of Certified Energy" (SOCE) — standardized health declaration

#### Catena-X (Automotive OEM network)
- PCF (Product Carbon Footprint) data exchange between Tier-1 and Tier-2 suppliers in real-time
- Lifecycle tracked across entire vehicle production → in-service → end-of-life per VIN
- Repair data comes from authorized service center ERP systems via Catena-X connector

---

### How ExportReady Currently Handles Lifecycle

**Strengths:**
- Clean 7-state machine covering physical battery journey
- Tamper-evident hash chain on every event
- Magic links for external actors (no partner login required)
- BMS telemetry ingestion with device tokens
- Thermal event auto-detection
- Bulk transitions for fleet operations

**Weaknesses:**
- No REPAIR/REPLACE in state machine (GAP-2)
- SoH changes not in hash chain (GAP-6)
- No multi-tier supply chain events (GAP-1)
- No external actor webhook notifications (GAP-10)
- No second-life SoH threshold trigger
- No integration with service center systems (manual log only)

---

### How We Can Improve

**Short-term (EU compliance by Feb 2027):**

1. **Add REPAIR/REPLACE to lifecycle**
   - Add ActionRepair, ActionReplace constants
   - Add to TransitionMap: allowed from IN_SERVICE, role=TECHNICIAN or MANUFACTURER
   - Write PassportEvent with hash chain for each repair
   - Surface repair history in PUBLIC view (EU Art 14 mandates this)
   - Add repair logging UI in /passports/[uuid] and new /lifecycle page

2. **Fix SoH in hash chain**
   - In telemetry_service.go Ingest(), after updating dynamic fields, call CreatePassportEvent() with type=SOH_UPDATE
   - Store new SoH value in metadata
   - Now SoH is verifiable, auditable, tamper-evident

3. **Add second-life SoH alert**
   - When SoH drops below MinSOHThreshold (defined in DisassemblyGuide)
   - Create a PassportEvent type=DEGRADATION_THRESHOLD_REACHED
   - Dashboard alert: "12 batteries below 70% SoH — consider second-life assessment"

4. **Add outbound webhooks for partner notifications**
   - Table: outbound_webhooks (tenant_id, url, secret, events[])
   - After every ApplyTransition(), POST webhook payload to registered URLs
   - Events: passport.shipped, passport.installed, passport.recalled, passport.recycled, passport.repaired, telemetry.soh_update, telemetry.thermal_event

**Medium-term (competitive parity Q2-Q3 2026):**

5. **Supplier portal for self-declared supply chain tiers**
   - Invite mine/smelter/refiner to portal via magic link
   - They fill in their tier's data (GPS, cert number, compliance status)
   - System records who declared what (audit trail)
   - Manufacturer reviews and approves each tier
   - Art. 48 compliance achieved without expensive third-party audit

6. **Carbon A-G class assignment**
   - After carbon footprint calculated, assign class based on EU threshold table
   - Display class badge prominently on public passport view
   - EU will mandate this from Aug 2027

7. **prEN18239 attribute mapping**
   - Map every ExportReady data field to BatteryPass consortium's 80+ attribute list
   - Show compliance score: "Your passport covers 72 of 80 required EU attributes"
   - This becomes a sales tool for Indian manufacturers worried about EU compliance

---

## PART 4 — SOH DEEP DIVE

### What SoH Is and Why It Matters

State of Health (SoH) measures a battery's remaining capacity relative to its original rating.
- SoH = 100% at manufacture (new battery)
- SoH < 80% = typical EV "end of first life" threshold (time for second-life or recycle)
- SoH < 60% = typically decommission/recycle

EU Art. 14 requires:
- Initial SoH baseline (at manufacture) — currently MISSING (GAP-14)
- Current SoH (dynamic, updated) — exists but bypasses hash chain (GAP-6)
- Minimum rated capacity at 80% SoH — part of PerformanceSpec (GAP-8)

### Current SoH Architecture

```
BMS device → POST /api/v1/telemetry → telemetry_service.go
  → Updates passport.state_of_health directly (no hash chain event)
  → Stores reading in telemetry_readings table (time-series)
  → Creates THERMAL_EVENT if thermal_event=true
```

**Problem:** SoH is mutable, unverified, and unauditable.

### Fixed SoH Architecture (what it should be)

```
BMS device → POST /api/v1/telemetry → telemetry_service.go
  → Updates passport.state_of_health directly
  → Stores reading in telemetry_readings table
  → Creates PassportEvent type=SOH_UPDATE {
      soh_previous: 94.1,
      soh_new: 92.3,
      cycle_count: 145,
      measured_at: "2026-03-31T10:00:00Z"
    }
  → Event hashed and chained (now verifiable)
  → If SoH < MinSOHThreshold → creates DEGRADATION_THRESHOLD_REACHED event
  → If thermal_event=true → creates THERMAL_EVENT (already done)
```

### SoH Without IoT (Manual Entry)

```
No BMS device? Manufacturer/technician can manually update SoH:
  POST /api/v1/passports/{uuid}/soh
  Body: {
    state_of_health: 85.0,
    cycle_count: 200,
    measurement_method: "MANUAL" | "BMS" | "LAB_TEST",
    measured_by: "technician_id",
    notes: "Annual capacity test performed"
  }
  → Treated same as telemetry ingestion
  → PassportEvent created with source=MANUAL
  → Visible in audit trail with measurement method noted
```

---

## PART 5 — IOT WITHOUT PARTNERS: HOW TO IMPLEMENT

### The Problem

Without IoT hardware partners, we have no data flowing from batteries in the field.
The telemetry API exists and is ready. The gap is: **who sends the data?**

---

### Option 1: Manual SoH Entry (Available Now)

**For:** Battery manufacturers without BMS connectivity

Implementation:
- Technician logs annual capacity test result via dashboard
- POST /api/v1/passports/{uuid}/soh with measurement_method=LAB_TEST
- Creates auditable SOH_UPDATE event
- Sufficient for EU Art. 14 "dynamic, updated" SoH requirement
- **Build: Add manual SoH update UI on passport detail page**

---

### Option 2: CSV Batch SoH Upload (Quick Win)

**For:** Fleet operators who have SoH data but not API integration

Implementation:
- Add new export job type: SOH_UPDATE_IMPORT
- CSV format: passport_uuid, soh_pct, cycle_count, measured_at
- Upload → validates → creates PassportEvent for each row
- Useful for battery rental companies that do periodic capacity tests
- **Build: Add CSV upload tab to /lifecycle or /batches/[id]**

---

### Option 3: Device Token Self-Service (Existing API, No Partners Needed)

**For:** Manufacturers who have their own BMS or gateway device

The telemetry API already works. What's missing is:
- Clear documentation (mount Swagger UI — GAP-11)
- Device Token management UI in /developer (MISSING)
- Sample code snippets (Python/Arduino/Node.js) for BMS integration

Implementation:
- Add Device Tokens section to /developer page
- Show sample payload + curl command
- Manufacturer flashes their device with token + API endpoint
- **This requires ZERO IoT partners — manufacturer handles integration themselves**

---

### Option 4: Simulated / Synthetic SoH Data for Demo/Testing

**For:** Early customers, demos, platform development without real devices

Implementation:
- Add a "Simulate Telemetry" feature in development/staging
- For each active passport, generate realistic SoH degradation curve
- SoH decreases based on chemistry-specific degradation model:
  - LFP: ~3000 cycles to 80% SoH (slow degradation)
  - NMC: ~1500 cycles to 80% SoH (moderate)
  - Lead-Acid: ~500 cycles to 80% SoH (fast)
- Useful for demos, customer POCs, testing lifecycle alerts

---

### Option 5: BMS Gateway Integration Blueprint (Future, When Partners Arrive)

**Architecture for when IoT partnerships are established:**

```
Physical Battery
  └── BMS (Battery Management System)
        └── CAN Bus / UART → Microcontroller (ESP32, Raspberry Pi, etc.)
              └── MQTT / REST → IoT Gateway (cloud or on-prem)
                    └── ExportReady Telemetry API
                          POST /api/v1/telemetry
                          Headers: Authorization: Bearer {device_token}

Integration options (in order of complexity):
  1. Direct REST: Gateway posts JSON directly to /api/v1/telemetry (simplest)
  2. MQTT bridge: Gateway publishes to MQTT topic → ExportReady MQTT subscriber → ingests
  3. AWS IoT Core / Azure IoT Hub: manufacturer uses cloud IoT platform → 
     webhook/event → ExportReady ingestion endpoint
  4. Catena-X connector: for EU OEM customers already on Catena-X network
```

**What to build now (no partners needed):**
1. MQTT ingestion endpoint (receive from any MQTT broker)
2. Webhook receiver endpoint (receive from AWS IoT / Azure IoT Hub)
3. Bulk telemetry batch endpoint (already exists: POST /api/v1/telemetry/batch)
4. IoT integration guide in /docs/iot-integration

---

### Option 6: Partner Portal for IoT Data (Medium-term)

**For:** When you land your first hardware partner (BMS manufacturer, EV OEM, fleet operator)

Build:
- Partner API key with telemetry:write scope
- Partner sends SoH data for all batteries they manage
- Partner sees a "partner view" of all passports they have access to
- Partner gets webhook notifications when passports enter IN_SERVICE
- Outbound webhooks tell partner: "passport {uuid} is now IN_SERVICE — start tracking SoH"

---

## PART 6 — SECURITY FIXES (REQUIRED BEFORE LAUNCH)

These are not features but blocking bugs:

### Fix 1: Passport Transfer Missing Tenant Check (GAP-11b)
```go
// In passport transfer handler, after fetching passport:
if passport.TenantID != tenantID {
    respondError(w, http.StatusForbidden, "passport not found")
    return
}
```

### Fix 2: Lifecycle Transition Missing Tenant Check (GAP-11d)
```go
// After fetching passport in lifecycle handler:
// Verify passport.BatchID belongs to authenticated tenant
```

### Fix 3: Refresh Token JTI Never Validated (GAP-11c)
```go
// On every token refresh:
// 1. Extract JTI from incoming refresh token
// 2. Query: WHERE refresh_token_jti = $1 AND refresh_token_expires > NOW()
// 3. Reject if not found or expired
// 4. Rotate: update refresh_token_jti to new value
```

### Fix 4: Hash Chain Genesis Anchor (GAP-3)
```go
// In GenerateEventHash, when event.PreviousHash == "" (genesis):
genesisAnchor := "GENESIS:" + passport.UUID.String() + ":" + passport.SerialNumber
event.PreviousHash = genesisAnchor
```

### Fix 5: DataVisibility Not Enforced (GAP-4)
```go
// In BuildPublicView() and BuildPartnerView():
if t.DataVisibility != nil {
    applyVisibilityFilter(view, t.DataVisibility, "public")
}
```

---

## PART 7 — PRIORITIZED BUILD ROADMAP

### 🔴 PHASE 1: Security & Critical Fixes (Do Now — blocks trust)

| # | Task | Files | Effort |
|---|------|-------|--------|
| S1 | Fix passport transfer tenant check | passport_handlers.go | XS |
| S2 | Fix lifecycle transition tenant check | lifecycle_handlers.go | XS |
| S3 | Validate refresh token JTI on every refresh | auth_handlers.go | S |
| S4 | Fix hash chain genesis anchor to UUID | event_hash.go | XS |
| S5 | Enforce DataVisibility in BuildPublicView/PartnerView | access_views.go | S |

---

### 🔴 PHASE 2: EU Compliance Gaps (before Feb 2027)

| # | Task | Files | Effort |
|---|------|-------|--------|
| C1 | Add BatteryCategory field to BatchSpec | models.go + migration | S |
| C2 | Add BatteryCategory to activation compliance gate | activation_compliance.go | S |
| C3 | Add BatteryCategory step to onboarding UI | onboarding/page.tsx | S |
| C4 | Add structured PerformanceSpec to BatchSpec | models.go + batch UI | M |
| C5 | Add DisassemblyGuide struct to BatchSpec | models.go + batch UI | M |
| C6 | Add InitialSoH = 100.0 at passport creation | lifecycle.go | XS |
| C7 | Fix SoH updates to write PassportEvent | telemetry_service.go | S |
| C8 | Build REPAIR/REPLACE lifecycle actions | models.go + lifecycle.go + lifecycle_handlers.go + UI | L |
| C9 | Add SupplyChainProvenance struct | models.go + batch UI | L |
| C10 | Add EOL carbon phase to calculator | carbon_calculator.go + UI | S |

---

### 🟡 PHASE 3: New Pages & Features (Q2 2026)

| # | Task | Files | Effort |
|---|------|-------|--------|
| F1 | Device Token management UI in /developer | developer/page.tsx | M |
| F2 | Manual SoH entry UI on passport detail | passport detail component | S |
| F3 | CSV SoH batch upload | upload component + new endpoint | M |
| F4 | /lifecycle operations center page | new page + components | L |
| F5 | /compliance dashboard page | new page + components | L |
| F6 | EU compliance checklist widget on /dashboard | dashboard component | M |
| F7 | Partner webhook configuration UI | partners/page.tsx | M |
| F8 | Outbound webhook system in backend | webhook_handlers.go + service | L |
| F9 | Repair history visible on public passport page | passport-view.tsx | S |
| F10 | SoH health gauge on passport detail | passport detail component | S |
| F11 | Mount Swagger UI at /api/docs | main.go | XS |

---

### 🟢 PHASE 4: Differentiation (Q3-Q4 2026)

| # | Task | Effort |
|---|------|--------|
| D1 | Carbon A-G class assignment + display | S |
| D2 | BatteryPass 80-attribute compliance score | M |
| D3 | Supplier self-declaration portal (supply chain tiers) | XL |
| D4 | Second-life SoH threshold automation | M |
| D5 | MQTT/IoT Hub ingestion endpoint | L |
| D6 | Field-level selective disclosure | L |
| D7 | Third-party claim attestation | XL |
| D8 | prEN18239 / DIN DKE SPEC 99100 mapping doc | M |

---

## PART 8 — DATA FLOW DIAGRAM (TEXT)

```
MANUFACTURER (OWNER)
  │
  ├─► /onboarding ──────────────────► Tenant created with MarketRegion
  │                                    India/EU compliance fields set
  │
  ├─► /batches (CREATE) ────────────► Batch DRAFT created
  │     │ Chemistry, Category           BatchSpec with all EU attributes
  │     │ PerformanceSpec               SupplyChainProvenance
  │     │ Materials, Hazardous          DisassemblyGuide
  │     │ Supply Chain
  │     │ Disassembly Guide
  │     │
  │     ├─► Carbon Calculator ───────► carbon_footprint_result saved
  │     │                               Carbon class A-G assigned
  │     │
  │     └─► Activate Batch ──────────► Compliance gate checks ALL fields
  │           (compliance gate)          India: EPR, BIS, IEC, MoRTH, AIS
  │                                      EU: carbon, materials, hazardous, perf
  │                                      Both: BatteryCategory, SupplyChain
  │
  ├─► Generate Passports ───────────► N passports created
  │     count=N                         BPAN serial assigned
  │                                     BatchSnapshot frozen
  │                                     InitialSoH = 100.0
  │                                     Genesis hash anchored to UUID
  │                                     QR codes generated
  │
  ├─► Print QR Labels ──────────────► Physical batteries labelled
  │
  └─► Lifecycle Transitions:
        │
        CREATED ──[ACTIVATE]──► ACTIVE
                                  │
                    INTERNAL ─────┤─[SHIP]──────────────────► SHIPPED
                    or LOGISTICS  │  +shipment_ref,date          │
                    magic link    │                         [INSTALL]
                                  │                          +installer_id
                                  │                               │
                                  │                          IN_SERVICE
                                  │                          │    │    │
                                  │               [REPAIR]──►│    │    │◄──[REPLACE]
                                  │               (no state  │    │    │   (no state
                                  │               change)    │    │    │   change)
                                  │                          │    │    │
                                  │                     [RECYCLE]  │
                                  │                          │     │
                                  │                     RECYCLED   │
                                  │                          │     │
                                  │                     [CLOSE]   [RECALL]─►RECALLED
                                  │                          │              │
                                  │                     END_OF_LIFE    [RECYCLE/CLOSE]
                                  │
                    MANUFACTURER──┘─[RECALL from any active state]─► RECALLED


BMS DEVICE (in field, IN_SERVICE batteries)
  │
  └─► POST /api/v1/telemetry
        device_token scoped to passport UUID
        │
        ├─► Updates passport.state_of_health
        ├─► Stores telemetry_reading (time-series)
        ├─► Creates PassportEvent SOH_UPDATE (NEW)
        ├─► If SoH < threshold → DEGRADATION_THRESHOLD_REACHED event
        └─► If thermal_event → THERMAL_EVENT PassportEvent


QR SCAN (any person, no auth)
  │
  └─► GET /p/{uuid}
        │
        ├─► detectAccessTier():
        │     no token → PUBLIC
        │     Bearer magic-link token → PARTNER
        │     X-Regulator-Key → REGULATOR
        │
        ├─► BuildPublicView() [filtered by DataVisibility]
        │     Shows: chemistry, category, SoH, certifications,
        │             materials, carbon footprint, repair history,
        │             disassembly guide
        │
        ├─► BuildPartnerView() [filtered by DataVisibility]
        │     Adds: telemetry history, ownership history,
        │            supply chain tiers, lifecycle timestamps
        │
        └─► BuildRegulatorView()
              All of above + full audit trail with hashes,
              actor IPs, full event chain
```

---

*Document last updated: 2026-03-31. Based on Gap Analysis + Competitive Benchmarking + Full Codebase Review.*
