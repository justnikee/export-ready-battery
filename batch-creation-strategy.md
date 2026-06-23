# Batch Creation — Strategy & UX Redesign

## 1. Current State Diagnosis

### What exists today
The wizard is a 4-step Sheet (slide-over drawer):
**Identity → Specifications → Compliance → Review**

It has auto-save drafts (localStorage, 5s debounce), template load via a plain `<select>`, and two AI modes (PDF datasheet parse, natural language) — both buried inside Step 1.

### Root problems

| Area | Problem |
|---|---|
| **AI** | Hidden in a collapsible panel on Step 1 only. NL mode only extracts 10 fields. No per-field confidence shown. No preview before applying — fields just overwrite silently. Cache UI shows raw filenames. |
| **Templates** | Plain `<select>` HTML element, no preview, no market filter, no search. Save is a checkbox on the final Review step — requires a successful submit. |
| **Drafts** | Single slot per tenant. Banner only renders when `!isDirty`, so touching any field before noticing the banner hides it. No visual "saved" indicator. Can't name drafts. |
| **Wizard structure** | Always 4 steps regardless of market or complexity. Step 3 (Compliance) dumps India and EU fields together, hidden behind market conditionals — overwhelming and confusing. |
| **No clone path** | No way to say "create another batch like this one". |
| **AI scope** | After Step 1, AI disappears. The hardest step (Compliance) has zero AI assistance. |

---

## 2. Proposed Architecture

### Entry flow → 3 paths instead of 1

Instead of directly opening the 4-step form, a **"How do you want to start?"** modal presents three fast paths. Market selection lives here, before any fields are shown.

```
[ Create Batch ]
      ↓
┌─────────────────────────────────────────┐
│  How do you want to start?              │
│                                         │
│  [AI Fill]  [From Template]  [Blank]    │
│                                         │
│  Market:  ● India   ○ EU   ○ Global    │
└─────────────────────────────────────────┘
      ↓                  ↓           ↓
  AI Panel         Template Picker  Wizard Step 1
```

**Why move market selection here:**  
The market region determines which compliance fields appear, how many steps the wizard has, and which template/AI suggestions are relevant. Choosing it after entering 10 fields forces backtracking and confusion.

---

## 3. Feature Redesigns

### 3.1 AI — from hidden helper to primary entry point

**Current:** Collapsed panel inside Step 1. PDF parse sends text to `/ai/parse-datasheet` (Groq Llama-3.3-70b) and silently overwrites form fields. NL mode calls `/ai/nl-create-batch` for only 10 fields.

**Proposed changes:**

#### A. AI-first entry path
When user picks "AI Fill" from the entry modal:
- Show a full-screen drop zone: "Drop your battery datasheet PDF" 
- Or a large text area: "Describe your battery in plain English"
- While parsing, show a progress animation with field names appearing ("Extracting chemistry… capacity… certifications…")

#### B. AI Result Preview (the key missing piece)
After parsing, show a **two-column diff preview** before any form field is touched:

```
┌─────────────────────────────────────────────────────┐
│  AI extracted 23 fields  (confidence: 87%)          │
│                                                      │
│  Field              Extracted          Confidence    │
│  ─────────────────────────────────────────────────  │
│  ✓ Model name       BT-LFP-2500        ████████ 96% │
│  ✓ Chemistry        LFP                ████████ 99% │
│  ✓ Capacity         2500 mAh           ███████░ 88% │
│  ⚠ HSN Code         8507.60            █████░░░ 62% │  ← amber, editable inline
│  ✗ Manufacturer     (not found)        ░░░░░░░░  0% │  ← red, skip or type
│                                                      │
│  [ Apply All ]  [ Review field by field ]  [ Cancel ]│
└─────────────────────────────────────────────────────┘
```

Fields below ~60% confidence are highlighted amber and pre-selected for manual review. Users can edit inline without leaving this preview.

After "Apply All", the wizard opens at **Step 2 (Specs)** — because Step 1 is already filled. This saves the user's first entire step.

#### C. AI assist on Compliance step (Step 3)
A persistent "AI" button in the step header:
- **"Fill from profile"** — applies EPR/BIS/IEC/EU rep data from tenant profile
- **"Explain this field"** — shows the regulation article, why it's required, and example values
- **"Check compliance"** — runs the backend `/batch/validate` and explains failures in plain English ("Your DVA is 42% — PLI scheme requires 50%. Either increase domestic sourcing or uncheck PLI Compliant.")

#### D. NL mode expansion
Extend `NLCreateResult` and `/ai/nl-create-batch` to also return compliance-relevant fields:
- `hsn_code`, `cell_source`, `dva_source` for India
- `battery_category`, `carbon_performance_class` for EU
This means a user typing "India LFP 2500mAh domestic cells, PLI compliant" fills ~15 fields instead of 4.

#### E. AI field highlighting (post-apply)
Fields AI touched get a subtle amber left border + "AI" badge for 60 seconds. This shows the user exactly what was auto-filled so they can spot-check it, then the highlight fades.

---

### 3.2 Templates — cards not dropdown

**Current:** `<select>` HTML element on Step 1, save buried in Review.

**Proposed:**

#### A. Visual template picker (replaces select)
A modal or full-width panel showing template cards:

```
┌─────────────────────────────────────────────────────┐
│  Your Templates                   [ + New Template ] │
│  Filter: [All] [India] [EU] [Global]   Search...    │
│                                                      │
│  ┌────────────────┐  ┌────────────────┐             │
│  │ 🇮🇳 INDIA       │  │ 🇪🇺 EU          │             │
│  │ LFP EV Pack    │  │ NMC Industrial  │             │
│  │ 2500mAh · LFP  │  │ 3.7V · 180Wh   │             │
│  │ Last used 2d   │  │ Last used 1w   │             │
│  │ [Use this]     │  │ [Use this]     │             │
│  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────┘
```

Hovering a card shows a tooltip with all key specs. Market-mismatched templates (EU template when India is selected) are shown grayed out with a "switch market?" prompt.

#### B. Template save — anytime, not just on submit
The wizard footer always shows a **"Save as Template"** ghost button (not a checkbox). Clicking it opens a small popover: enter name → save immediately via `POST /templates`. This works even mid-wizard — the user doesn't need to submit a batch to save their work as a template.

#### C. "Save as Template" after batch creation
On the success toast after batch creation, include an action: "Save as template?" — this is the right moment because the batch is proven valid.

---

### 3.3 Drafts — multiple slots, named, always visible

**Current:** One slot, resume banner hides when user touches the form.

**Proposed:**

#### A. Multiple named draft slots
Store drafts as `anvaya_batch_draft_v2_{tenantId}` — an array of up to 5 entries:
```ts
interface DraftSlot {
  id: string;
  name: string;         // auto-named: "{modelName || 'Untitled'} — {market} — {step}/4"
  step: number;
  market: MarketRegion;
  data: Partial<BatchFormData>;
  savedAt: string;
  completionPct: number; // % of required fields filled
}
```

#### B. Draft picker in entry modal
Instead of an inline banner inside the wizard, drafts appear in the entry modal as a fourth section:

```
┌────────────────────────────────┐
│  Resume a draft                │
│                                │
│  BT-LFP-2500 — India — Step 2  │
│  72% complete · saved 3h ago   │  [Resume]  [Delete]
│                                │
│  NMC Pack EU — EU — Step 1     │
│  21% complete · saved 2d ago   │  [Resume]  [Delete]
└────────────────────────────────┘
```

#### C. Persistent "saved" indicator in wizard
A small "● Saved" indicator in the wizard footer, animated when a save fires. Replaces the amber banner that was easy to miss.

#### D. Save current wizard state as draft
"Save & exit" button in the footer (next to Cancel) — explicitly saves and closes the wizard. The current code only auto-saves; there's no intentional save path.

---

### 3.4 Wizard restructure — market-adaptive steps

**Current:** Always 4 steps, regardless of complexity.

**Proposed:** Step count adapts to market + cell source.

| Path | Steps |
|---|---|
| India · Domestic | Core → India Compliance → Review (3 steps) |
| India · Imported | Core → Import Docs → India Compliance → Review (4 steps) |
| EU | Core → Specs → EU Compliance → Review (4 steps) |
| Global | Core → Specs → India+EU Compliance → Review (4 steps) |

"Core" merges the current Identity + the top of Specs (chemistry, capacity, voltage) into one step. These 8 fields are mandatory for all paths — putting them together avoids a step that feels like a speed bump.

#### Step 1 (Core) redesign
- **Market region** moves to the entry modal (before the wizard opens)
- **Manufacturer block** is a collapsible accordion, pre-filled from profile, collapsed by default (showing "Pre-filled from your profile ✓")
- **AI assist** button visible at the top of the step

#### Step 2 — market-specific, not generic "Specifications"
For India: "India Compliance" — shows HSN, cell source, DVA calculator
For EU: "Battery Specifications" — shows the physical specs + EU material composition
These have different labels in the stepper, making it immediately clear what's coming.

#### Step 3 (Compliance) — split into sections with progress
Rather than one long scrolling form, use an **accordion of sections** each with a completeness indicator:

```
▼ Sustainability & Safety          [3/4 complete]
  Carbon footprint, recycled content, hazardous substances, lifetime

▶ EU Representative                [0/3 complete]  ← collapsed, clearly incomplete
  Company, email, address

▶ Certifications & Documents       [1/2 complete]
```

#### Step 4 (Review) — actionable
- Add a prominent "Completion score" ring (e.g., 78%)
- List optional fields that would raise the score: "Adding carbon footprint raises your passport score to 91%"
- One-click jump-to-field from the review (click a row → goes back to that step + scrolls to that field)

---

### 3.5 Batch cloning

Add a "Duplicate" action on the batch detail page and batch list. Clicking it opens the wizard pre-filled with all fields from the source batch, on Step 4 (Review) — so the user can rename and submit instantly, or go back and change whatever differs.

API: `POST /batches/{id}/clone` → returns a draft payload; wizard receives it as initial values.

---

## 4. Implementation Phases

### Phase 1 — Quick wins (1–2 weeks, no API changes)
These fix the worst pain points with frontend-only changes:

1. **Draft banner fix**: Remove the `!isDirty` guard so the banner always shows on open
2. **"Saved" indicator**: Add a visual save confirmation in the wizard footer
3. **Template visual picker**: Replace `<select>` with a modal using existing template data
4. **AI result preview**: Add the diff table before applying AI results to form fields
5. **"Fill from profile" button**: On the Compliance step, a single button that applies all profile data in one click
6. **"Save as Template" button**: Move save-as-template out of Review, add it to the wizard footer as a persistent button

### Phase 2 — Wizard restructure (2–3 weeks)
7. **Entry modal**: Market selection + path picker (AI / template / blank / resume draft)
8. **Market-adaptive step count**: Collapse Identity+core-Specs into one step, split compliance by market
9. **Compliance accordions**: Replace the single long scroll with collapsed sections + completeness indicators
10. **Multiple draft slots**: Upgrade localStorage schema, draft picker in entry modal
11. **Review jump-to-field**: Make review rows clickable with step navigation

### Phase 3 — AI overhaul (3–4 weeks, requires API work)
12. **Expand NL endpoint**: Add India/EU compliance fields to `NLCreateResult`
13. **Per-field confidence rendering**: Pass `confidence` map from `/ai/parse-datasheet`; shade fields by confidence
14. **AI assist on Compliance step**: "Explain this field" and "Check compliance" using the existing validate endpoint + a new explain endpoint
15. **AI field highlighting**: Amber left-border on AI-populated fields, fading after 60s

### Phase 4 — Clone & advanced (1–2 weeks)
16. **Batch clone**: `POST /batches/{id}/clone` endpoint + wizard entry path
17. **Template market filtering**: Filter templates shown by currently selected market
18. **Review completion score**: Calculate and display passport completeness score

---

## 5. File-level change map

### Frontend (`apps/battery-web`)

| File | Change |
|---|---|
| `components/batches/create-batch-wizard.tsx` | Add entry modal, market-adaptive steps, footer save-as-template, saved indicator |
| `components/batches/batch-entry-modal.tsx` | **New** — path picker (AI/template/blank), market select, draft list |
| `components/batches/ai-result-preview.tsx` | **New** — diff table with per-field confidence, inline edit, apply/reject |
| `components/batches/template-picker.tsx` | **New** — replaces `<select>`, card grid with market filter |
| `components/batches/draft-manager.ts` | **New** — multi-slot draft schema, named drafts, completion % calc |
| `components/batches/batch-form-steps/step-compliance.tsx` | Add accordions, "Fill from profile" button, AI explain button |
| `components/batches/batch-form-steps/step-review.tsx` | Add completion score ring, clickable jump-to-field rows |
| `lib/batch-draft.ts` | Upgrade to multi-slot (`v2`) schema |

### Backend (`services/battery-api`)

| File | Change |
|---|---|
| `internal/handlers/ai_handlers.go` | Add `POST /ai/explain-field` endpoint |
| `internal/services/ai_service.go` | Expand `NLCreateResult` with compliance fields; add `ExplainField` method |
| `internal/handlers/batch_handlers.go` | Add `POST /batches/{id}/clone` |
| `internal/repository/batch.go` | Add `Clone` method |

---

## 6. Key metrics to track post-launch

- **Wizard completion rate** (currently unknown baseline — instrument first)
- **Steps-to-submit** (should decrease as AI fills more fields)
- **Draft resume rate** vs draft discard rate
- **Template usage rate** (should increase with card picker vs select)
- **AI assist trigger rate** per step
- **Validation error rate on submit** (should decrease with per-step backend validation)
