# Batch Creation — Bug-Fix + UI/UX Revamp Plan

> **Status:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ (full-screen two-pane wizard) ·
> Phase 4 ✅ (NL endpoint expansion; batch clone already shipped via existing
> `/duplicate`). Optional AI-modal relocation still deferred.

> Companion to `batch-creation-strategy.md`. That doc described the redesign that
> was **already implemented** in commit `1044d0e`. This doc is the **post-ship
> audit**: the real bugs that landed with it, the decision to drop GLOBAL, and a
> ground-up UI/UX revamp of the wizard. Sequenced so we fix correctness first,
> then rebuild the visual layer.

---

## 0. Scope decisions (locked)

- **Drop GLOBAL as a creation option.** New batches can only be `INDIA` or `EU`.
  - GLOBAL is referenced in **129 places across 49 backend files** and across the
    entire batch **detail** view, and `"GLOBAL"` is the default fallback for any
    batch with no market set (`batch.market_region || "GLOBAL"`). Ripping it out
    system-wide would break the detail page for legacy batches and require a DB
    migration.
  - Therefore "drop GLOBAL" = **remove it from the creation surfaces only**
    (entry modal + wizard). Detail/backend GLOBAL handling stays for legacy data.
    The `marketRegion` enum keeps `GLOBAL` so a legacy GLOBAL template can still
    load without a runtime error — it's just not user-selectable.
  - Bonus: this makes the P0 data-loss bug (below) **unreachable** for new batches.

---

## 1. Bugs found in the shipped redesign

### 🔴 P0 — GLOBAL silently drops all India compliance (data loss)
For a GLOBAL batch the wizard **collects** India fields (HSN, cell source, DVA,
PLI, BIS/EPR) and the review ring **counts** them, but the submit payload only
includes India data `if (marketRegion === "INDIA")`
(`create-batch-wizard.tsx:219`, `:730`) and the review's India section is gated
on `isIndiaMode` only (`step-review.tsx:330`). Result: user fills India data,
ring says "85% complete", data is thrown away on submit.
**Fix:** removing GLOBAL from creation makes this unreachable. No payload change
needed.

### 🟠 P1 — Two writers fight over `certifications` on market change
The Step 1 market button sets `certifications` inline (`step-identity.tsx:732-738`)
while a wizard-level effect *also* resets it (`create-batch-wizard.tsx:158-162`).
Outcome depends on render order.
**Fix:** remove the inline writes from the button; let the single effect own it.

### 🟠 P1 — Duplicate market selector
Market is chosen in the entry modal but Step 1 renders a second full market
picker (`step-identity.tsx:715-755`). Redundant, and the trigger for the certs
conflict.
**Fix:** replace with a compact 2-option (India / EU) segmented control with no
side effects, or a read-only summary in the revamped layout.

### 🟠 P1 — Template path merges onto stale form state
`handleTemplateSelect` does `reset({ ...watch(), ...updates })`
(`create-batch-wizard.tsx:497`). If the wizard was opened/edited earlier and
closed without submit, stale values bleed into the new batch.
**Fix:** reset to `defaultBatchFormValues` first, then apply the template.

### 🟡 P2 — Polish
- **Fake draft progress**: entry modal shows `(step+1)/3` → always 33/67/100%
  (`batch-entry-modal.tsx:152`), not real field completion.
- **"Saved" indicator pulses forever** once set (`create-batch-wizard.tsx:949`)
  instead of flashing on each save.
- **AI badges never clear** — strategy wanted a 60s fade.
- **Overcounted AI toast** — "Applied N fields" counts parsed keys never written
  to the form (`step-identity.tsx:318`).
- **Dead code**: `getRequiredFieldsForStep` returns `["templateName"]` for the
  unreachable Review step (`create-batch-wizard.tsx:628`).

---

## 2. UI/UX revamp

### Why the current wizard still feels wrong (beyond bugs)
1. **Cramped 560–640px slide-over** for a dense, compliance-heavy form → endless
   vertical scrolling, no room to show context.
2. **Step 1 overload**: AI strip + market picker + identity + dates + manufacturer
   accordion + specs + GTIN stacked on one screen.
3. **No persistent context** while filling — completion score and profile
   readiness only appear at the very end (Review).
4. **AI strip eats prime real estate** at the top of Step 1 even for "blank" entry.
5. **Inconsistent visual system** — ad-hoc inline styles, mixed badges, amber
   gradients, emoji in some places and lucide icons in others.

### Recommended direction — full-screen focus wizard, two-pane
Replace the slide-over with a centered, full-viewport wizard (the Stripe / Vercel
/ Linear onboarding pattern):

```
┌───────────────────────────────────────────────────────────────┐
│  Create Battery Batch                                    ✕      │
├──────────────┬───────────────────────────────┬────────────────┤
│  STEP RAIL   │   ACTIVE STEP (max-w ~720px)   │  LIVE SUMMARY  │
│              │                                │                │
│ ● Core       │   [ generously spaced fields,  │   ◐ 62%        │
│ ○ Compliance │     one logical group at a     │   India · LFP  │
│ ○ Review     │     time ]                      │   Remaining:   │
│              │                                │   • HSN code   │
│              │                                │   • Cell src   │
│              │                                │   Profile ✓3/3 │
│              │                                │   [✨ AI assist]│
├──────────────┴───────────────────────────────┴────────────────┤
│  ← Back        ● Saved        Save & Exit        Next: Compliance │
└───────────────────────────────────────────────────────────────┘
```

- **Left rail**: vertical steps with completion ticks; click to jump to a
  validated step.
- **Center**: the active step, generous spacing, max-width ~720px. Manufacturer
  stays a collapsed accordion; GTIN moves under an "Advanced" disclosure.
- **Right panel (≥lg)**: sticky live summary — completion ring, market + chemistry
  chips, "required fields remaining" list, profile readiness, and a single
  contextual **AI assist** button. Collapses under the center column on
  tablet/mobile.
- **AI** becomes a contextual action (button in the summary panel / step header),
  and the AI extract preview is a focused modal — not a permanent strip.
- **Footer**: Back · Saved · Save & Exit · Next/Create, persistent.

**Alternative (cheaper):** keep the slide-over, widen to ~760px, tighten the
visual system, and add a sticky mini-summary header. Less impactful but lower
risk. *Recommendation: full-screen two-pane.*

### Visual system cleanup (applies either way)
- One badge component family (AI / Settings / market) with consistent sizing.
- Drop emoji from functional UI; use lucide consistently.
- Standardize section headers, spacing scale, and the amber "needs attention"
  treatment into reusable primitives.
- Reduce two-column dense grids on narrow widths (responsive single column).

---

## 3. Execution phases

**Phase 1 — Correctness + GLOBAL removal (layout-agnostic, do first)**
1. Remove GLOBAL from entry-modal market options + template filter chips.
2. Replace Step 1 market picker with a compact India/EU control, no inline
   `certifications` writes (fixes the conflict).
3. **Keep** the internal `|| GLOBAL` conditionals in specs/compliance/review —
   a legacy GLOBAL *template* can still load, and these branches make it render
   correctly. Stripping them would show an empty compliance step for such
   templates. GLOBAL is simply unreachable for *new* batches now.
4. Template path: reset-to-defaults-then-apply.
5. Remove dead `["templateName"]` required-field entry.
6. Tests: a creation round-trip asserting only INDIA/EU are selectable and an
   India batch persists HSN/cell-source.

**Phase 2 — UX polish (layout-agnostic)**
7. Real draft completion % (share the review ring's check logic).
8. Saved-indicator flash-on-save; 60s AI-badge fade; accurate applied-field count.

**Phase 3 — Visual revamp (needs layout sign-off)**
9. Build the two-pane focus wizard shell; move steps into it.
10. Live summary panel (ring + remaining + readiness + AI button).
11. Visual-system cleanup (badges, spacing, icons, responsive grids).

**Phase 4 — Enhancements**
12. ✅ Expand `/ai/nl-create-batch` + `NLCreateResult` with compliance hints
    (`hsn_code`, `cell_source`, `carbon_performance_class`); market constrained to
    INDIA/EU. Prompt + struct in `ai_service.go`; frontend type, apply, and preview
    in `parse-datasheet.ts` / `step-identity.tsx`.
13. ✅ Batch clone — **already shipped**: `DuplicateBatch` handler
    (`batch_handlers.go:847`) + `duplicateBatch()` wired into the batches list
    (`battery-batches-page.tsx:143`). No new endpoint needed; a parallel clone path
    would duplicate existing behavior.
14. ⏸ Optional: relocate the AI assistant from Step 1 into a fully contextual
    modal (deferred — needs lifting AI parse state out of `StepIdentity`).

---

## 4. Files touched (Phase 1)
- `apps/battery-web/components/batches/batch-entry-modal.tsx` — drop GLOBAL option + filter chip
- `apps/battery-web/components/batches/batch-form-steps/step-identity.tsx` — 2-option market control, no inline cert writes
- `apps/battery-web/components/batches/create-batch-wizard.tsx` — template reset-then-apply, dead-code removal
</content>
</invoke>
