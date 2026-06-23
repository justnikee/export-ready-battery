# Agent Deployment Manifest: Manufacturer Personas

**Deployed:** 2026-06-05  
**Location:** `docs/agents/`  
**Purpose:** Embodied user personas for feature validation, UX review, and requirement gathering

---

## Deployed Agents

| Agent ID | File | Persona | Market | Revenue Tier |
|----------|------|---------|--------|--------------|
| `persona-rajesh-midtier-india` | `persona-rajesh-midtier-india.md` | Rajesh Patel — Battery pack assembler | India domestic | Mid (₹45–80 Cr) |
| `persona-priya-smalltier-eu` | `persona-priya-smalltier-eu.md` | Priya Krishnan — Custom battery designer | 60% EU export | Small (₹8–15 Cr) |

---

## How to Use These Agents

### 1. Feature Design Review
Before building a new feature, ask: **"What would Rajesh say? What would Priya say?"**

Example:
> We're designing a new "Recycled Content Claim" workflow.  
> **Rajesh says:** "I buy cells from China. I don't know recycled %. My supplier won't tell me. What do I type?"  
> **Priya says:** "Samsung won't disclose this. Your validator must handle UNKNOWN as a valid state, not force me to lie."

### 2. UX Walkthrough Validation
When reviewing UI mockups or staging builds, load the persona and walk through the flow:

- **Rajesh test:** Can he create 500 passports in under 10 minutes? Is the QR label in Gujarati? Does Tally sync work?
- **Priya test:** Does the EU compliance score show PASS/FAIL per regulation article? Can she export JSON-LD? Is the QR GS1-compliant?

### 3. Prioritization Debates
When the team debates feature priority, use the personas as tie-breakers:

| Feature | Rajesh Priority | Priya Priority | Team Decision |
|---------|----------------|----------------|---------------|
| Tally sync | BLOCKER | Useful | Build first |
| JSON-LD export | Meh | BLOCKER | Build first |
| CPCB API auto-submit | ESSENTIAL | N/A | Build second |
| EU DPP Registry connector | N/A | BLOCKER | Build second |
| IoT/MQTT telemetry | Meh | Useful | Build third |

### 4. Sprint Review Role-Play
During sprint demos, assign team members to "play" the personas:
- One developer argues as Rajesh ("Too complex! Where is bulk upload?")
- One developer argues as Priya ("This warning should be a failure. Show me the regulation reference.")

### 5. Requirement Document Validation
Before finalizing PRDs, run the requirement through both personas:
- Does Rajesh have the bandwidth to use this?
- Does Priya trust the legal accuracy?

---

## Persona Quick-Reference Cards

### Rajesh Patel — Mid-Tier India Assembler
```
Voice: Gujarati-Hindi-English business mix
Tech: Tally Prime, Excel, WhatsApp
Decision driver: Cost < ₹50,000/year, Tally integration, CPCB acceptance
Fear: EPR shortfall penalty, informal recycler audit, PLI rejection
Magic phrase: "My nephew should do this without calling me"
```

### Priya Krishnan — Small-Tier EU Exporter
```
Voice: Precise, regulation-literate, slightly anxious
Tech: Excel, Tally, reads EU legal texts, GitHub-aware
Decision driver: Feb 2027 deadline survival, German customer acceptance, < ₹25,000/month
Fear: Passport non-compliance = customer loss, REACH liability, recycled content trap
Magic phrase: "Show me the exact Annex XIII field mapping"
```

---

## Persona Coverage Matrix vs. Platform Features

Use this to identify which persona validates which feature area:

| Feature Area | Primary Validator | Secondary Validator |
|--------------|-------------------|---------------------|
| India EPR / CPCB | Rajesh | — |
| BIS CRS / MoRTH | Rajesh | — |
| Tally Integration | Rajesh | Priya |
| Bulk Production / QR Labels | Rajesh | — |
| EU Battery Passport | Priya | — |
| GS1 Digital Link / CE Marking | Priya | — |
| Carbon Footprint (Art 7) | Priya | Rajesh (future) |
| Recycled Content (Art 8) | Priya | Rajesh (future) |
| BOM / Cell Disclosure (Art 77) | Priya | — |
| W3C VC / Interoperability | Priya | — |
| Supplier Portal | Rajesh | Priya |
| Lifecycle Management | Rajesh | Priya |
| Compliance Scoring | Both | — |
| Blockchain Anchoring | Both | — |
| Multi-language Passport | Rajesh (HI/GU) | Priya (DE/NL) |
| DGFT Claims | Rajesh | — |
| AI / NL Features | Both | — |
| Team RBAC | Rajesh | — |
| API / ERP Integration | Priya | — |

---

## Updating These Agents

These personas should evolve as:
1. New regulations are notified (e.g., India BWM 2026 amendments, EU delegated acts)
2. Customer interviews provide real quotes and pain points
3. Platform features change the user's capability set

**Update cadence:** Quarterly or after major regulatory changes.

---

## Related Documents

- `docs/MANUFACTURER_PERSONA_DEEP_ANALYSIS.md` — Full gap analysis, feature matrix, and strategic recommendations
- `docs/battery_dual_compliance_gap_analysis.md` — Technical DB schema gap analysis (EU + India)
- `docs/DPP_COMPETITIVE_ANALYSIS_ROADMAP.md` — Competitive landscape and execution roadmap
- `AUDIT.md` — Comprehensive architectural audit report
