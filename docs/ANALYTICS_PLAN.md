# Analytics Strategy & Roadmap — ExportReady Battery

## 1. Why Analytics Exist Here (What We Need Them For)

ExportReady sells **compliance certainty** to Indian battery manufacturers exporting to the EU.
Analytics in this product are not "nice-to-have charts" — they serve four concrete jobs:

1. **Prevent regulatory failure** — catch expired certificates, missing Art. 7/8/11 fields,
   and EPR shortfalls *before* a shipment is blocked or a fine is issued.
2. **Prove money ROI** — quantify DGFT incentives (RoDTEP, Duty Drawback, Interest Equalization),
   PLI DVA status, and EPR obligation coverage so the customer sees the platform paying for itself.
3. **Reduce operational drag** — show where batches get stuck, which suppliers cause gaps,
   and what needs action this week (vs. making users hunt through 12 modules).
4. **Support enterprise sales** — `advanced_analytics` is already defined as an ENTERPRISE
   entitlement (`apps/battery-web/lib/entitlements.ts`, `services/battery-api/internal/services/entitlements.go`)
   but is **not enforced** anywhere. A credible premium analytics tier is unclaimed revenue.

## 2. Customer Personas & Pain Points

| Persona | Pain Point | Analytics That Solve It |
|---|---|---|
| **Compliance Manager** | "Which batches will fail EU checks, and why?" | Compliance score trend, gap heatmap by regulation article, compliance-ready count |
| **Compliance Manager** | "Certificates expire silently; I find out at customs." | Certificate expiry countdown (BIS IS 16046, UN38.3, IEC 62133, MSDS), proactive alerts |
| **CFO / Founder** | "Am I leaving export-incentive money on the table?" | DGFT claim funnel + claimed-vs-eligible value (₹), PLI DVA tracking |
| **CFO / Founder** | "What does EPR non-compliance cost me this FY?" | EPR obligation coverage %, ECC exposure estimate, certified-kg trend |
| **Operations Head** | "Where is my production pipeline stuck?" | Batch status funnel, time-in-stage, passports created vs. activated vs. shipped |
| **Sustainability Lead** | "Is my carbon footprint competitive for EU buyers?" | Carbon class distribution (A–G), avg kg CO₂e/kWh vs. JRC thresholds, per-chemistry breakdown |
| **Procurement / Supply Chain** | "Which supplier is my biggest compliance risk?" | Supplier risk leaderboard, overdue audits, CMRT conformance %, corrective action aging |
| **Sales / Marketing** | "Do EU buyers actually scan our passports?" | Scan geo/device analytics, scan→lead conversion (`eu_buyer_leads`) |

**Meta-pain-point across all personas:** data exists across 12+ modules (batches, compliance,
EPR, DGFT, suppliers, fleet, telemetry) but there is no single "what needs my attention today"
surface. The dashboard action queue partially does this; analytics should deepen it.

## 3. Current State (What Already Exists)

### Implemented
- **Scan Analytics** (`/dashboard/analytics`, Scan tab): total/today scans, countries, device
  split, world map, live SSE feed. Real GeoIP data from `scan_events`.
- **Compliance & Operations tab**: 12-week compliance score trend, certificate expiry buckets,
  batch status / carbon class / market region / supplier docs donuts, DGFT claim funnel,
  alert severity donut. Backed by 8 real SQL aggregations (`internal/repository/analytics.go`).
- **Fleet Health** (`/dashboard/fleet`, GROWTH+): SoH bands, recalls, thermal events, geo map.
- **Telemetry** (`/dashboard/telemetry`, GROWTH+): device counts, SoH, thermal events.
- **Dashboard KPIs** (`/dashboard`): production trend, compliance score, EPR obligation card,
  regulatory deadlines, action queue.

### Known Gaps / Bugs to Fix First
1. `compliance_ready_count` is computed by the backend but **never rendered** (frontend
   `ComplianceAnalyticsData` interface omits it).
2. `advanced_analytics` ENTERPRISE entitlement is **not enforced** on `/analytics/overview`
   or the page route — all tiers get everything for free.
3. Stale docs: `app/docs/features/page.tsx:306` still says "Analytics dashboard (Coming Soon)".
4. `queryKeys.analytics` in `hooks/use-queries.ts` is dead code; the analytics page uses raw
   `useState`/`useEffect` instead of TanStack Query (inconsistent with fleet/telemetry pages).
5. Frontend test coverage is a single loading-spinner assertion.

## 4. Proposed Analytics Framework

Organized by priority. **P0 = essential (table stakes for the compliance value prop)**,
**P1 = high-value (retention + upsell)**, **P2 = differentiators (enterprise tier)**.

---

### P0 — Essential (fix/complete what we have)

These directly serve the core promise "never fail compliance, never miss money."

| # | Analytics | Why It's Essential | Effort |
|---|---|---|---|
| P0-1 | **Compliance-Ready Count** — surface the existing `compliance_ready_count` (score ≥95, no ERROR gaps) as a headline KPI + trend | The single number a compliance manager reports upward. Backend already computes it. | XS (frontend only) |
| P0-2 | **Gap Heatmap by Regulation Article** — count of open gaps grouped by EU Art. 7/8/11/16–18/38/57, AIS-156, BIS, EPR, PLI | Tells users *where* to act, not just *that* the score dropped. Gaps are already structured with citations + severity. | M (1 backend aggregation + heatmap UI) |
| P0-3 | **Action-Required Feed** — unified "needs attention" list: certs expiring ≤30d, overdue supplier audits, EPR shortfall, unsigned DoCs, failed registry verifications | The #1 cross-persona ask. Data exists in 5 tables; needs one aggregation endpoint. | M |
| P0-4 | **DGFT Money Dashboard** — claimed vs. eligible value (₹) per scheme (RoDTEP / Duty Drawback / Interest Equalization), approval rate, avg time-to-approval | Converts the existing funnel (counts) into rupees — the CFO's language. Claims table has the data. | M |
| P0-5 | **EPR Position Card (analytics-grade)** — FY-over-FY obligation vs. certified kg, projected year-end shortfall, ECC exposure estimate | EPR shortfall = direct financial penalty. Current card shows one year only, no projection. | M |
| P0-6 | **Certificate Expiry Command Center** — extend existing chart with per-batch drill-down (which batches lose BIS/UN38.3 coverage when) | Expiry at customs = blocked shipment. Current chart is aggregate-only. | S |
| P0-7 | **Fix entitlement gating** — enforce `advanced_analytics` on scan/geo/deep-dive surfaces; keep compliance essentials on all paid tiers | Stops enterprise revenue leak; defines the tier boundary. | S |

**Tier boundary proposal:** compliance essentials (score, gaps, cert expiry, action feed) stay
available on all plans — they *are* the product. Scan/geo analytics, financial analytics,
and everything P1+ moves behind `advanced_analytics` (ENTERPRISE).

---

### P1 — High-Value (next quarter)

| # | Analytics | Pain Point Solved | Effort |
|---|---|---|---|
| P1-1 | **Supplier Risk Leaderboard** — risk score trend per supplier, overdue audits, CMRT conformance %, corrective action aging (open >30/60/90d) | "Which supplier will get me flagged under Art. 11/39/48?" Data exists in `supplier_risk_profiles`, `due_diligence_assessments`, `corrective_actions`. | M |
| P1-2 | **Carbon Competitiveness** — avg kg CO₂e/kWh by chemistry vs. JRC thresholds, class distribution trend, best/worst batches, simulated "what improves my class" | Sustainability lead needs to negotiate with EU buyers. Carbon results already stored per batch. | M |
| P1-3 | **Pipeline Velocity** — batch funnel (CREATED→READY→ACTIVE→SHIPPED), median time-in-stage, stuck-batch list (>N days) | Operations: where does production stall between compliance and dispatch? | M |
| P1-4 | **PLI DVA Tracker** — estimated vs. CA-audited DVA % per batch, batches below 50% threshold, value-at-risk | PLI is a major subsidy; falling below 50% DVA loses it. Fields exist on `batches`. | S–M |
| P1-5 | **Scan→Lead Attribution** — join `scan_events` with `eu_buyer_leads`: scans by EU country, scans→lead conversion, top-scanned products | Turns scan analytics from vanity metric into sales signal. | M |
| P1-6 | **Mass Balance Position** — cobalt/lithium/nickel/lead certified-input vs. allocated vs. remaining, trend per quarter | Art. 8 recycled-content proof; ledger tables already exist. | M |
| P1-7 | **Fleet Degradation Analytics** — SoH decay curve by cohort/chemistry, predicted months-to-80% (warranty threshold), thermal incident rate by region | Warranty cost prediction + Art. 10 durability evidence. Telemetry data already flowing. | L |

---

### P2 — Differentiators (enterprise / future)

| # | Analytics | Value |
|---|---|---|
| P2-1 | **Regulatory Deadline Calendar + Impact Forecast** — "2030 recycled-content step-up affects X of your current batches; 2031 carbon class threshold puts you at class D" using `compliance_rules` effective dates | Forward-looking compliance = strongest enterprise hook |
| P2-2 | **Benchmark Anonymized Peers** — "your avg carbon footprint vs. platform median for LFP 2-wheeler packs" | Powerful but requires careful anonymization (≥5 tenants per bucket) |
| P2-3 | **AI Observability Dashboard** — wire `docs/ai_dashboard.sql` (call volume, latency, parse success, cache hit rate) into an admin view | Internal ops + enterprise transparency |
| P2-4 | **Scheduled Report Builder** — weekly PDF/CSV digest (compliance posture, money, risks) emailed to stakeholders | Executives don't log in; reports come to them. Reuse `export_jobs` infra |
| P2-5 | **Custom KPI / saved views API** — enterprise tenants define their own aggregates via API | API keys + scopes already exist |
| P2-6 | **EPR target forecasts & what-if simulator** (from `DPP_COMPETITIVE_ANALYSIS_ROADMAP.md`) | Already on the competitive roadmap |

### Explicitly NOT building (for now)
- **Product/usage analytics of our own app** (PostHog-style event tracking) — separate concern, not customer-facing analytics.
- **Scan gamification / scan-to-earn analytics** — mentioned in old planning docs; low compliance value, revisit only if marketing pushes it.
- **Real-time alerting infrastructure beyond the existing SSE feed** — the action feed (P0-3) covers the need without a notification system rebuild.

## 5. Technical Plan

### Backend (`services/battery-api`)
- New aggregation endpoints (follow `GetAnalyticsOverview` pattern in `internal/repository/analytics.go`):
  - `GET /analytics/gaps-by-regulation` (P0-2)
  - `GET /analytics/action-feed` (P0-3)
  - `GET /analytics/dgft-value` (P0-4)
  - `GET /analytics/epr-position?fy=` (P0-5)
  - `GET /analytics/supplier-risk` (P1-1), `GET /analytics/carbon-benchmark` (P1-2),
    `GET /analytics/pipeline-velocity` (P1-3)
- **Entitlement enforcement (P0-7) — requires building the enforcement layer first:**
  The entitlement system is defined in `internal/services/entitlements.go` and
  `apps/battery-web/lib/entitlements.ts`, but **no route-level enforcement currently exists**
  — neither in `cmd/server/main.go` nor in any handler middleware. The existing fleet and
  telemetry routes are also unenforced. Implementation steps:
  1. Add a `requireFeature(feature Feature) func(http.Handler) http.Handler` middleware
     in `internal/middleware/` that reads the plan from the JWT claims and calls
     `entitlements.IsEnabled(plan, feature)`.
  2. Wrap scan/geo/financial analytics routes in `main.go` with this middleware.
  3. Mirror the same gate as a frontend route guard component for early UX feedback
     (redirect to upgrade page if entitlement missing).
  > **Effort for P0-7 revised to M** (was S — enforcement layer must be written from scratch).
- All aggregations stay in SQL (Postgres `DATE_TRUNC`, JSONB extraction) — no new infra needed.

### Frontend (`apps/battery-web`)
- Restructure `/dashboard/analytics` into 3 tabs:
  1. **Compliance Posture** (score trend, ready count, gap heatmap, cert expiry drill-down, action feed)
  2. **Money & Incentives** (DGFT ₹, EPR position, PLI DVA)
  3. **Operations & Market** (pipeline velocity, scan analytics, supplier risk, carbon)
- Migrate the page to TanStack Query (`use-queries.ts`) like fleet/telemetry — fixes the dead
  `queryKeys.analytics` and gives caching/polling for free.
- Reuse `StatusDistributionChart`, `StatsCard`, `ScanMap`; add a `GapHeatmap` and
  `MoneyFunnelChart` component (recharts is already the standard).
- Keep the well-established empty-state pattern ("Create batches to see trends") for every new widget.

### Testing
- Backend: table-driven handler tests per endpoint (pattern exists in `analytics_handlers_test.go`).
- Frontend: replace the spinner-only test with per-tab render tests using MSW fixtures
  (`test/msw-handlers.ts` already has the scaffolding).

### Open Schema Questions (verify before P1)
- **`eu_buyer_leads` table** (referenced by P1-5): not found in any Go service or migration.
  Confirm whether this table exists or needs to be designed + migrated before committing to
  P1-5 effort estimate.

## 6. Phased Rollout

| Phase | Scope | Exit Criteria |
|---|---|---|
| **Phase 1 — Essentials** | P0-1…P0-7 + docs fix + dead-code cleanup | Compliance-ready KPI visible, action feed live, entitlement enforced, docs updated |
| **Phase 2 — Money & Risk** | P1-1…P1-5 | CFO-facing ₹ dashboard, supplier risk leaderboard, scan→lead attribution |
| **Phase 3 — Enterprise** | P1-6, P1-7, P2-1, P2-4 | Degradation analytics, deadline forecast, scheduled reports; enterprise tier demo-ready |
| **Phase 4 — Differentiators** | P2-2, P2-3, P2-5, P2-6 (as demanded) | Benchmarks + report builder behind ENTERPRISE |

## 7. Success Metrics for the Analytics Feature Itself

- **Adoption:** % of active tenants visiting `/dashboard/analytics` weekly (target: >60% after Phase 1).
- **Actionability:** % of action-feed items resolved within 7 days.
- **Revenue:** enterprise-tier conversion citing advanced analytics (tracked via entitlement upgrades).
- **Retention proxy:** reduction in "certificate expired" and "EPR shortfall" incidents among analytics-active tenants.
