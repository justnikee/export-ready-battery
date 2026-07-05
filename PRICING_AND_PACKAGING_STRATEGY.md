# Pricing & Packaging Strategy

**Scope:** Commercial model — tiers, feature-to-tier mapping, Indian-market pricing, trial, overage.
**Companion doc:** `RBAC_AND_ENTITLEMENTS_PLAN.md` owns *how* access is enforced (roles, plan gates, quota middleware). This doc owns *what* each tier costs and includes.
**Status:** Feature→tier map is ready to lock. R1 and R5 **fully resolved** (verified + closed 2026-07-05). R2 partially addressed. R3/R4 still open — see below.

---

## ⚠️ Billing-model reconciliation

**Re-verified against code on 2026-07-05; R1/R5 follow-ups closed same day.** R2/R3/R4 remain open.

### R1 — The meter: passport vs batch — ✅ RESOLVED (passport)
`ActivateBatch` (`billing_handlers.go`) counts passports in the batch (`CountPassportsByBatch`) and debits quota per-passport (`DeductQuota(tenantID, passportCount)`), returning 402 if balance < passport count. Confirmed by `TestActivateBatch_PassportMeteredQuota`. **The pricing tiers below (500 / 5,000 passports/month) match the actual meter.**

✅ **Copy follow-up closed:** Razorpay package descriptions (`razorpay_service.go`, `billing_handlers.go`) now say "Passport Activations"; the frontend billing page and `PricingCard` (`battery-billing-page.tsx`, `pricing-card.tsx`) renamed `batchCount`→`quotaCount`/`pricePerBatch`→`pricePerUnit` and display "N passports @ ₹X/passport", "passports remaining", "passports activated". The backend JSON field `price_per_batch` was kept frozen for API-contract stability (comment added explaining it means "per quota unit").

### R2 — Prepaid wallet vs monthly subscription — ⚠️ PARTIALLY ADDRESSED
Still **not** a true recurring subscription (no Razorpay Subscriptions API, no eNACH/UPI autopay mandate, nothing auto-charges). What **was** added: every successful one-time Razorpay purchase now also stamps `plan_type`, a 30-day `subscription_expires_at`, and `plan_status='ACTIVE'` on the tenant (migration `000100`, wired in `razorpay_handlers.go` + the webhook path). This gives a **time-boxed plan window** — a Growth purchase unlocks Growth features for 30 days, then silently lapses unless repurchased. It is a reasonable interim design, not full subscription billing.

✅ **Enforcement gap closed (2026-07-05):** the expiry this sets was previously enforced only on write routes; Growth-feature **read** routes never checked it, so an expired tenant kept indefinite read access. Fixed — `RequireFeature` now checks `services.IsSubscriptionExpired(planStatus, expiresAt)` before the plan-inclusion check, on every Growth route. Still open: the actual recurring/auto-charge mechanism itself (that's the real R2 scope, unchanged).

### R3 — Free / expired tier (trial has nowhere to land) — still open
No change. `plan_status` supports a `TRIAL` value in a code comment only — no code path sets or handles it. Still need to define what an expired/unpaid account becomes.

### R4 — Downgrade vs already-issued compliance artifacts (policy) — still open
No change. Still needs an explicit product decision (also tracked in the RBAC doc).

### R5 — GST-compliant invoicing — ✅ FULLY RESOLVED
`internal/services/invoice_service.go` generates a real GST-compliant PDF (GSTIN, HSN, taxable value + GST breakup) and `GET /api/v1/billing/invoices/{payment_id}/download` is registered and working. **UI gap closed (2026-07-05):** the billing page now has a download button on every credit (top-up) transaction row, scoped to that transaction's `payment_id`.

---

## 1. Model: flat subscription + issuance quota (proposed)

Hybrid: flat monthly subscription unlocks **features** (India vs EU is a binary plan gate); an issuance **quota** meters the core value event — now implemented as a **per-passport** meter (R1 resolved). Avoid per-seat as the *primary* meter — Indian buyers resist per-seat SaaS and seat count isn't a value metric for a compliance platform. Seats remain a secondary limit (2 / 10 / 100, already in `PlanSeatLimits`).

*(The "flat monthly subscription" half is still contingent on R2 — today it's a 30-day plan window on top of one-time purchases, not true recurring billing.)*

---

## 2. Indian market context

### 2.1 Segments
| Segment | Examples | Revenue | Target plan |
|---|---|---|---|
| Large Enterprise | Amara Raja, Exide, Tata Agratas, OLA, Reliance | ₹1,000–50,000+ cr | Enterprise (direct sales) |
| Mid-Market | Neuron, Log9, BatterySmart, Livguard, Waaree | ₹50–1,000 cr | Growth (core market) |
| SME / Startup | 2W/3W assemblers, cell importers, early exporters | ₹5–50 cr | Starter (volume acquisition) |

### 2.2 Demand drivers
- India Li-ion market ~USD 6.73B (2026) → USD 15.17B (2031), 17.65% CAGR (Mordor Intelligence).
- **EU DPP mandatory deadline: 18 Feb 2027** for EV batteries — non-discretionary compliance demand.
- PLI scheme: ₹18,100 cr to 11 cell makers, all needing compliance/traceability.
- Immediate addressable market ~50–200 companies (11 PLI cell makers + pack assemblers) for Growth/Enterprise in 2026–27.

### 2.3 Competitive anchors
| Competitor | Price | Relevance |
|---|---|---|
| T-Systems Magenta DPP | €1,499/mo (~₹1.35L) entry | EU-only, no India compliance. Primary EU competitor. |
| Circularise | Enterprise ~€30K–120K/yr | EU supply chain; no India. |
| Spherity | Enterprise ~€50K+/yr | EU identity DPP; no India. |
| Indian EPR consultants | ₹2–5 L/yr | Direct substitute for Starter — must price at/below. |
| Indian ERP (SAP, TallyPrime) | ₹5–10 L/yr | Indirect budget competitor for Growth. |

### 2.4 India pricing dynamics
- Buyers expect 40–60% of EU/US list; enterprise within ~2× of global.
- 20–30% negotiation room expected — list so targets survive a 25% discount.
- Annual billing discount 15–20% standard.
- No-credit-card trial essential; usage-based (per-issuance) billing increasingly accepted.

---

## 3. Pricing tiers — ✅ LIVE in code as of 2026-07-05

These numbers are no longer just proposed — `services.Packages` (`razorpay_service.go`) and `GetPackages` (`billing_handlers.go`) were updated to match, and the frontend billing page's fallback packages mirror them. Previously the live packages still had old placeholder numbers (₹4,999/10 units, ₹19,999/50 units) that didn't match this doc — that mismatch is what's fixed here.

⚠️ **Framing caveat (ties to R2):** "issuances/mo" below describes the *target* recurring cadence. What's actually implemented today is a **one-time purchase** that credits the full quota amount to the wallet immediately (it does not expire or get consumed monthly) and separately stamps a 30-day Growth-*feature* window (see R2). A Starter purchase today is "pay ₹14,999 once, get 500 passport credits in your wallet, no expiry on the credits themselves" — not an auto-renewing monthly subscription. Real recurring billing is still R2's open scope.

### STARTER — ₹14,999 (500 passport credits)
- 500 issuances included · overage: **hard block** (upgrade or top up to continue)
- 2 seats (OWNER + 1 MEMBER) · email support (48h) · **India compliance only**
- Target: small assemblers, 2W/3W makers, early exporters, PLI startups
- Rationale: at/below consultant cost (₹2–5L/yr) — replaces the consultant; 11× cheaper than T-Systems entry; acquisition vehicle for Growth upgrade.

### GROWTH — ₹44,999 (5,000 passport credits)
- 5,000 issuances included · overage: **₹8/issuance soft** (billed month-end)
- 10 seats · priority support (24h) · onboarding call · **full EU + India**
- Target: mid-market (₹50–1,000 cr) actively pursuing EU export
- Rationale: fits Indian SME software budget (₹3–6L/yr); 3.75× cheaper than T-Systems (€400 vs €1,499/mo); unlocks EU DPP, mass balance, DD, DGFT, fleet, API.

### ENTERPRISE — from ₹1,50,000 · direct sales (Contact Sales, not self-serve)
- Custom quota (50,000–unlimited) · negotiated overage
- Up to 100 seats · dedicated CSM · SLA · SSO/SAML · multi-entity
- Target: Amara Raja, Exide Energy, Tata Agratas, OLA — direct sales, expect 25–30% negotiation from floor.
- Note: floor ₹1.5L is ~parity-to-slightly-above T-Systems (₹1.35L); acceptable for global-procurement buyers.

### 14-DAY GROWTH TRIAL
Full Growth features · 100 issuances · **no credit card**. Day 14 → **needs a defined landing tier (R3)**; all data preserved. **Not built yet** — no trial code path exists (see R3).

---

## 4. Overage & add-on packs (pending R1)
| Item | Starter | Growth | Enterprise |
|---|---|---|---|
| Extra 500 issuances | ₹6,000 (₹12 ea) | ₹4,000 (₹8 ea) | Custom (₹5–6 ea) |
| Extra 5,000 issuances | N/A (→ Growth) | ₹35,000 (₹7 ea) | Custom |
| Extra seat | ₹2,500/mo | ₹2,000/mo | In contract |
| API rate-limit 2× | N/A | ₹5,000/mo | Custom/included |

Benchmark: consultants charge ~₹400/document; ₹12/issuance at worst is dramatically cheaper.

---

## 5. Feature → tier map (definitive; independent of R1/R2)

**EU Compliance stays Growth-only.** Rationale: serious EU exporters have >₹50 cr revenue and can afford Growth; India-compliance-in-Starter creates the upgrade trigger ("I need to issue DPPs for EU shipments"). Carbon Calculator stays in Starter as a **preview** (JRC class, not a certified DPP) — the aha moment that drives the upgrade.

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| **Core:** Dashboard, Batches, Templates, Lifecycle, Dispatch | ✅ | ✅ | ✅ |
| BPAN V2 serial issuance; basic CSV/PDF exports | ✅ | ✅ | ✅ |
| Team mgmt (seats 2/10/100); Settings, Billing, Profile | ✅ | ✅ | ✅ |
| **India:** Compliance hub (BIS/EPR/CPCB/PLI), AIS-156/038, EPR filing, PLI DVA | ✅ | ✅ | ✅ |
| Carbon Calculator | ✅ preview | ✅ full | ✅ full |
| Basic analytics | ✅ basic | ✅ full | ✅ full |
| **EU:** Compliance hub (Art.7/8/11) | — locked | ✅ | ✅ |
| Issue EU DPP (W3C VC, Ed25519, did:key); OTS Bitcoin anchoring | — locked | ✅ | ✅ |
| Art.7 certified carbon; Mass Balance (Art.8); EPCIS 2.0 export | — locked | ✅ | ✅ |
| **Supply chain:** Suppliers & DD (Art.11); corrective actions | — locked | ✅ | ✅ |
| DGFT claims (RoDTEP/Drawback/IES); Regulatory feed; Partners magic-link | — locked | ✅ | ✅ |
| **Fleet:** Fleet Health; BMS Telemetry | — locked | ✅ | ✅ |
| **Developer:** API keys; Webhooks; Tally ERP sync | — locked | ✅ | ✅ |
| **Enterprise:** SSO/SAML; advanced analytics + custom reports | — | — | ✅ |
| Custom EPCIS/label formats; multi-entity; VPC deploy; dedicated CSM+SLA | — | — | ✅ |

*(Enterprise-only features — SSO, multi-entity, custom reports — are not yet built; they define the Enterprise upsell, not current capability.)*

---

## 6. Decisions needed
1. ~~**R1 meter**~~ — ✅ resolved: passport. Copy updated to match.
2. **R2 billing model** — still open. Current: 30-day plan window on one-time purchases (expiry now correctly enforced everywhere), not true recurring subscription. Decide if/when to build real Razorpay Subscriptions + autopay.
3. **R3 free/expired tier** — still open — what does an unpaid/expired account become?
4. **R4 downgrade policy** — still open — issued DPPs stay valid on downgrade (confirm).
5. ~~**R5 GST invoicing**~~ — ✅ fully resolved: GST PDF, download route, and frontend download button all working.
6. **Tier boundaries** — confirm EU=Growth (recommended) and the §5 map.

Once R2/R3 are settled, add a **Phase 4 — Billing infrastructure** to the roadmap (recurring mandates, quota reset job, trial state machine).
