# Batch Domain Audit — Creation → Lifecycle → Detail

> **Implemented so far:** A.1 (unified activation readiness — shared
> `lib/activation-blockers.ts` now powers both the detail page and the wizard
> Review, which previews the real activation gate + "what's next" + credit cost),
> A.2 (detail-page `BatchLifecycleTracker`: Created → Compliance ready → Activated
> → Passports, with a single next-action line), A.3 (draft terminology),
> B1 (Drafts stat), B2 (stat cards now use the tenant-wide
> `batch_status_breakdown` aggregate — Total/Active/Drafts/Archived, filter- &
> page-independent; the un-aggregatable "Compliance Ready" card was replaced with
> "Archived"), B3 (removed faked due-diligence proxy), B5 (honest completion
> labels). A.4 is largely covered by A.1 (wizard "what's next") + A.2 (detail
> tracker). B4 evaluated and intentionally left.
>
> **Phase C done:** the detail page's two overlapping status panels (lifecycle
> tracker + "Export Readiness %" bar) are merged into a single `BatchStatusCard`
> (stage stepper + next action on top; supporting export-readiness chips — specs,
> compliance, certificates, registry, carbon — below). Stage signals (Activated,
> Passports) appear only in the stepper, and the competing "Export Readiness %"
> number is gone. `BatchReadinessBar` retired. The detail page now has a clean
> two-part status story: `BatchStatusCard` (where am I / what's done) +
> `ActivationChecklist` (what to fix to activate).
>
> **Remaining (optional):** an accurate tenant-wide "Compliance Ready" count
> (needs a small backend aggregate; the stat card currently shows the accurate
> "Archived" count instead), Phase D.

> Scope: everything around batches — how one is created, *when it becomes a batch*,
> what it stores, how its info is shown, and where users get confused. Findings +
> a prioritized improvement plan.

---

## 1. The lifecycle (what actually happens)

```
Wizard submit  →  POST /batches  →  status = DRAFT   (no quota, downloads OFF)
        │                                  │
        │                          land on detail page
        │                                  │
        │            ┌─────────────────────┴─────────────────────┐
        │            │ DRAFT detail shows:                        │
        │            │  • Activation checklist (blockers)         │
        │            │  • Export-readiness bar                    │
        │            │  • 6 tabs (overview/passports/compliance/  │
        │            │    downloads/components/registry)          │
        │            └─────────────────────┬─────────────────────┘
        │                                  │
        │   add passports (serials) · declare certs · satisfy compliance
        │                                  │
        │            POST /batches/{id}/activate
        │              · ValidateActivation HARD-BLOCK (compliance registry)
        │              · deduct 1 activation quota  ← costs money
        │              · status = ACTIVE  (downloads ON) · run compliance engine
        │                                  │
        └──────────────────────────────►  ACTIVE  ──►  ARCHIVED (permanent)
```

**So "when does it become a batch?"** Immediately, as a **DRAFT** — but a draft is
inert: no downloads, no labels, no due-diligence report. It only becomes a usable,
exportable batch after **activation**, which (a) is hard-blocked unless market
compliance passes and (b) spends one activation credit. Key files:
`handlers/batch_handlers.go:37` (create → DRAFT via `repository/batch.go:104`),
`handlers/billing_handlers.go:145` (`ActivateBatch`),
`services/activation_compliance.go:43` (`ValidateActivationCompliance`).

---

## 2. The #1 problem: four "readiness" numbers that don't agree

There are **four independent progress indicators** across the flow, each computed
differently, and nothing reconciles them:

| Where | Name | Formula | Source |
|---|---|---|---|
| Wizard → Review | "completion %" | % of form fields filled | `lib/batch-completion.ts` |
| Detail top | "Export Readiness %" | done/total of {specs, compliance≥80, activated, passports>0, certs, registry, carbon, due-diligence} | `BatchReadinessBar.tsx` |
| Detail | "compliance score" | backend compliance engine 0–100 | compliance engine |
| Detail (draft) | activation blockers | market **compliance registry** (superset of creation rules) | `activation_compliance.go` |

**The cliff:** a user fills the wizard to **"100% — passport ready"**, hits Create,
and lands on a **DRAFT** that says **~30% export-ready** with an activation checklist
full of blockers — for fields the wizard treated as *optional*. Activation
requirements are a **superset** of creation requirements
(`registry.ValidateBatch` in `activation_compliance.go:88`), but the wizard never
previews them. This is the single biggest source of "I don't understand what's
happening."

**Fix direction:** make the wizard's Review preview **activation readiness** (run/
mirror the same checks the activation gate uses), labelled honestly as
"Activation readiness," and carry one shared readiness model from wizard → detail
so the number doesn't reset on submit.

---

## 3. "Draft" means two different things

- **localStorage wizard drafts** — the entry modal's "Resume a Draft" list
  (in-progress *forms*, never submitted).
- **DRAFT-status batches** — created batches awaiting activation. Shown as the
  list "Drafts" stat/filter and the detail "Delete Draft" action.

Same word, two unrelated objects. Users can't tell which "draft" anything refers to.
**Fix:** rename one. e.g. in-progress forms → "Unsaved / In-progress forms";
created-but-not-activated → "Draft batches".

---

## 4. No "what's next" after creation

The wizard's framing ("Create Batch", "passport ready") implies the job is done.
In reality creation is step 1 of: **create → add passports → satisfy compliance →
activate (costs a credit) → download/export.** Nothing in the wizard tells the user
this journey exists, that activation costs quota, or that it can be blocked.
**Fix:** a short post-create handoff / a linear status tracker on the detail page
(Created → Passports → Compliance → Activated), and surface the quota cost in the
wizard Review.

---

## 4b. Bug hunt — creation → lifecycle → detail

### 🔴 FIXED — Activation preflight understated the real backend gate
The detail page's **activation checklist** (and the wizard's "ready to activate"
line) were driven by a **client-side heuristic** (`getActivationBlockers`) that
checked far fewer fields than the **backend activation gate**
(`compliance/battery/india.go` · `eu.go` via `registry.ValidateBatch`). The
backend additionally requires, e.g. for India: BIS certificate issue date,
UN 38.3 / IEC 62133 / MSDS test dates, tenant EPR/BIS/PLI certificate uploads.
Result: the UI said **"ready to activate"**, the user clicked Activate, and the
**server rejected** it — the exact "I don't understand what happened" failure.

Root cause: compliance was only computed/saved on **activation**, so a DRAFT had
empty stored gaps and `GET /compliance` returned nothing, leaving the UI on the
incomplete heuristic.

**Fix:**
- Backend `GetBatchCompliance` now **evaluates compliance live**
  (`BatchService.EvaluateBatchCompliance` → `registry.ValidateBatch`) so drafts
  report authoritative gaps, not stale/empty ones.
- Frontend merges the instant heuristic with those authoritative gaps
  (`mergeActivationBlockers`, additive + deduped via `normalizeGapField`), driving
  the activation checklist, the lifecycle next-action count, and the activate
  preflight. The checklist can no longer say "ready" while the backend would
  reject. Nicer labels added for the newly-surfaced fields.

## 5. Concrete bugs

| # | Severity | Issue | Location |
|---|---|---|---|
| B1 | 🟠 | "Drafts" stat counts **ARCHIVED** batches as drafts (`status !== "ACTIVE"`) | `battery-batches-page.tsx:219` |
| B2 | 🟠 | Stats (Active/Drafts/Compliance-Ready) computed over the **loaded page** (`batches`, limit 50), not totals → undercount with >50 batches | `battery-batches-page.tsx:207,219,231` |
| B3 | 🟡 | Readiness bar lists **"Activated"** as a readiness item, yet activation *requires* readiness — circular; and "Due Diligence" done is faked as `complianceScore ≥ 80` | `BatchReadinessBar.tsx:79,122` |
| B4 | 🟡 | Backend defaults **empty market → GLOBAL** (`req.MarketRegion = GLOBAL`), inconsistent with dropping GLOBAL; an empty market silently creates a GLOBAL batch | `batch_handlers.go:83` |
| B5 | 🟡 | Wizard "100% / passport ready" wording over-promises vs activation reality (see §2) | `step-review.tsx` |

---

## 6. Proposed plan

**Phase A — Reconcile the narrative (highest impact, mostly frontend)**
1. Replace the wizard Review "completion %" with **activation readiness**: reuse
   the same check set the detail/activation uses, labelled clearly. The number
   should mean the same thing before and after submit.
2. Add a linear **status tracker** to the detail page top (Created → Passports →
   Compliance → Activated), unifying the overlapping readiness/activation panels.
3. Disambiguate "draft" terminology across entry modal, list, and detail.
4. Post-create handoff: a brief "what's next" on landing (and surface that
   activation costs 1 credit).

**Phase B — Bug fixes (quick)**
5. B1 Drafts stat → `status === "DRAFT"`; B2 stats from totals not page.
6. B3 readiness-bar circularity + real due-diligence signal.
7. B4 backend: reject or sensibly default empty market (not GLOBAL).

**Phase C — Detail-page IA cleanup**
8. The detail page has overlapping panels (readiness bar + activation checklist +
   compliance tab + overview) that all describe "how ready am I". Consolidate into
   one readiness story + tabs for *data*, not *status*.

**Phase D — Surface activation economics in the wizard**
9. Wizard Review shows detectable activation blockers + the quota cost up front.

Recommended start: **Phase A.1 + A.3 + all of Phase B** — they remove the worst
confusion and the factual bugs with contained, low-risk changes.
