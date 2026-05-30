# Batch Detail Page — UX Redesign Plan

> **Current state:** 3,087 lines, 5 tabs, information overload, no visual hierarchy, actions scattered everywhere.
> **Goal:** Clean, scannable, action-oriented batch detail page that guides users through draft → active → archived lifecycle.

---

## 1. The Core Problems

### 1.1 One File Does Everything
`batch-details-page.tsx` is **3,087 lines**. It handles:
- Batch metadata display
- Passport list with pagination
- CSV upload + auto-generation
- Compliance scoring + gap fixing
- Carbon calculator (embedded)
- Certificate blockchain anchoring
- 6 different export/download actions
- Activation preflight checks
- Archive/delete flows

**→ Split into 8+ focused components.**

### 1.2 Tab Names Are Confusing
| Current Tab | Problem |
|-------------|---------|
| **Overview** | 800+ lines of unstructured cards. Everything is "overview." |
| **Passports** | Just a paginated table. Fine, but could be richer. |
| **Upload & Generate** | Two completely different actions in one tab. |
| **Compliance** | Buried as tab #4. This is a **primary concern** for EU exporters. |
| **Reports** | Just a grid of 6 download buttons. Not "reports." |

### 1.3 No Lifecycle Guidance
A draft batch shows:
- Activate button (sometimes disabled with no clear reason)
- Delete button
- A wall of spec cards
- Scattered certificate info

**The user has no idea what to do next.** There's no "Setup Checklist" or "Ready to Activate?" flow.

### 1.4 Action Buttons Everywhere
In the current page, primary actions appear in:
- Header (Activate, Delete, Archive, Print Labels)
- Overview tab (Carbon Calculator, Certificate Anchor)
- Upload tab (CSV Upload, Auto Generate)
- Compliance tab (Download Declaration)
- Reports tab (QR, CSV, Audit, Compliance Report, Due Diligence)

**→ Consolidate actions by lifecycle stage and context.**

### 1.5 Visual Noise
- Corner dot decorations (`absolute -top-0.5 -left-0.5 w-1 h-1 bg-border`)
- Every card has a different icon + background color
- No clear visual hierarchy between primary and secondary info
- Dense grid layouts with no breathing room

---

## 2. The New Architecture

### 2.1 File Structure

```
components/batches/detail/
├── BatchDetailPage.tsx              # Orchestrator (~200 lines)
├── BatchHeader.tsx                  # Name, status, primary actions
├── BatchStatusBar.tsx               # Lifecycle progress stepper
├── BatchActions.tsx                 # Contextual action dropdown
│
├── tabs/
│   ├── OverviewTab.tsx              # Specs + summary (~300 lines)
│   ├── PassportsTab.tsx             # Table + bulk actions
│   ├── ComplianceTab.tsx            # Score, gaps, certificates
│   └── DownloadsTab.tsx             # All export/download actions
│
├── sections/
│   ├── CoreSpecs.tsx                # Chemistry, voltage, capacity, weight
│   ├── MarketCompliance.tsx         # India / EU / Global badges + requirements
│   ├── CertificateStatus.tsx        # BIS, UN38.3, IEC, MSDS with expiry
│   ├── MaterialComposition.tsx      # Recycled content, hazardous substances
│   ├── ComplianceScoreCard.tsx      # Score ring + gap list
│   ├── ActivationChecklist.tsx      # What's blocking activation
│   └── PassportToolbar.tsx          # Generate, upload, search
│
├── hooks/
│   └── useBatchDetail.ts            # Data fetching + mutations
│
└── types.ts                         # Local types
```

**Target:** ~1,200 lines total across all files (vs. 3,087 in one file).

### 2.2 New Tab Structure

| # | Tab | What Goes Here |
|---|-----|---------------|
| 1 | **Overview** | Specs, compliance preview, certificates, materials. **One-screen summary.** |
| 2 | **Passports** | Serial list, pagination, bulk actions, generate/upload tools. |
| 3 | **Compliance** | Full compliance engine: score, gaps, fix buttons, certificate tracker, carbon footprint. |
| 4 | **Downloads** | All export actions: labels, QR, CSV, audit, compliance report, due diligence. |

**Removed:** "Upload & Generate" → merged into **Passports** tab (that's where passports are created).

### 2.3 New Header Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ←  Back to Batches                                                          │
│                                                                             │
│  Batch-2026-001A                    [Draft] [EU] [Battery: LFP]    [⋯]      │
│  Created Jan 15, 2026                                                      │
│                                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Setup   │→ │ Review  │→ │ Activate│→ │ Ship    │→ │ Track   │         │
│  │ 3 of 5  │  │         │  │         │  │         │  │         │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                                             │
│  [Activate Batch]              [Delete Draft]                               │
│  2 requirements missing →                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Lifecycle stepper** replaces scattered status badges. Users see exactly where they are.
- **Primary action** (Activate) is prominent with a clear sub-line showing blockers.
- **Secondary actions** collapsed into a "⋯" dropdown (Archive, Print, Duplicate, etc.).
- **Context chips** (Draft, EU, Battery: LFP) are compact and scannable.

---

## 3. Tab-by-Tab Redesign

### 3.1 Overview Tab — "The Dashboard"

**Current:** Unstructured grid of 20+ cards. User scrolls forever.

**New:** 4 clear sections with visual hierarchy:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ QUICK STATS                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 50       │ │ 94%      │ │ 16 mo    │ │ 6% Li    │ │ 45.5%    │           │
│ │ Passports│ │ Compliance│ │ Warranty │ │ Recycled │ │ DVA      │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│ CORE SPECS                          │ MARKET COMPLIANCE                     │
│ • Chemistry: LFP                    │ ┌─────────────────────────────┐       │
│ • Voltage: 3.2V                     │ │ 🇪🇺 EU Battery Regulation    │       │
│ • Capacity: 100Ah                   │ │ ⚠️  Carbon footprint missing │       │
│ • Weight: 25kg                      │ │ ✓ CE marking declared        │       │
│ • Manufacturer: NK Energy           │ └─────────────────────────────┘       │
│                                     │ ┌─────────────────────────────┐       │
│                                     │ │ 🇮🇳 India BIS / PLI          │       │
│                                     │ │ ⚠️ BIS certificate expiring  │       │
│                                     │ │ ✓ EPR registered             │       │
│                                     │ └─────────────────────────────┘       │
├─────────────────────────────────────────────────────────────────────────────┤
│ CERTIFICATES                          │ MATERIALS                           │
│ ┌─────────────┐ ┌─────────────┐      │ Recycled content: 6% Li, 16% Co     │
│ │ BIS IS      │ │ UN38.3      │      │ Hazardous: Lead, Cadmium (declared) │
│ │ ⚠️ Expires  │ │ ✓ Valid     │      │                                     │
│ │ Mar 2027    │ │ until 2028  │      │                                     │
│ └─────────────┘ └─────────────┘      │                                     │
│ [Upload New]  [View]                  │                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Quick stats row** at the top — 5 most important numbers, no scrolling needed.
- **Two-column layout** for specs + compliance. Side-by-side comparison.
- **Certificate cards** show status + expiry at a glance. Upload action is contextual.
- **"Market Compliance" panel** groups India and EU requirements separately.

### 3.2 Passports Tab — "Create & Manage"

**Current:** Just a paginated table. Upload & Generate are in a separate tab.

**New:** Toolbar + table + creation tools in one place.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Passports (50)                     [Generate 100] [Upload CSV] [⋮ Bulk]     │
│                                                                             │
│ Search serial...              Status: All ▾    Region: EU ▾                 │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ □  Serial Number      Status    Created     Actions                     │ │
│ │ □  IN-NKY-LFP-00001   ACTIVE    Jan 15      [View] [QR] [Ship →]        │ │
│ │ □  IN-NKY-LFP-00002   ACTIVE    Jan 15      [View] [QR] [Ship →]        │ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ← 1 2 3 4 5 →                Showing 1-20 of 50                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Toolbar** combines generation, upload, and bulk actions.
- **Search + filters** inline (not hidden behind modals).
- **Row actions** are compact icons, not buttons.
- **"Generate"** and **"Upload CSV"** are primary toolbar actions — they're how passports get created.

### 3.3 Compliance Tab — "The Engine"

**Current:** Score + progress bar + gap list + certificate expiry cards + carbon calculator modal.

**New:** Three clear panels:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMPLIANCE SCORE                                    [Run Full Check]        │
│                                                                             │
│     ┌─────┐                                                                 │
│    /  94% \        Status: Passed with Warnings                             │
│   /  ████ \       2 warnings, 0 errors                                      │
│  └─────────┘                                                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ GAPS (2)                              │ CARBON FOOTPRINT                    │
│                                       │                                     │
│ ⚠️  Carbon footprint missing           │ ┌─────────────────────────────┐     │
│     [Run Calculator →]                 │ │  45.2 kg CO₂e/kWh          │     │
│                                        │ │  Class B                    │     │
│ ⚠️  BIS certificate expiring Mar 2027  │ │  [Recalculate] [View Report]│     │
│     [Upload Renewal →]                 │ └─────────────────────────────┘     │
│                                        │                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ CERTIFICATE TRACKER                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │ BIS     │ │ UN38.3  │ │ IEC     │ │ MSDS    │                          │
│ │ ⚠️  60d │ │ ✓ 365d  │ │ ✓ 200d  │ │ ✓ 400d  │                          │
│ │ [Renew] │ │ [View]  │ │ [View]  │ │ [View]  │                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Circular score** is more visually prominent than a progress bar.
- **Gaps have direct actions** — not just text descriptions.
- **Carbon footprint** is a first-class panel, not a buried modal.
- **Certificate tracker** uses "days remaining" instead of raw dates. Much more scannable.

### 3.4 Downloads Tab — "Exports & Documents"

**Current:** 6 cards in a grid, each with a button.

**New:** Grouped by category:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PASSPORT DOCUMENTS                      │ COMPLIANCE DOCUMENTS              │
│                                         │                                   │
│ [📇 Print Labels]                       │ [📄 Compliance Report (PDF)]      │
│ [📱 QR Codes (ZIP)]                     │ [📋 Due Diligence Report (PDF)]   │
│ [📊 Serial List (CSV)]                  │ [🌱 Carbon Declaration (PDF)]     │
│                                         │                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ AUDIT & TRACEABILITY                                                      │
│ [📜 Audit Log (CSV)]                                                      │
│ [🔗 Blockchain Anchors]                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Grouped by purpose** — Passport docs, Compliance docs, Audit docs.
- **Each button shows format** in the label (PDF, ZIP, CSV) — no guessing.
- **Disabled states** with tooltips explain why (e.g., "Carbon declaration requires calculated footprint").

---

## 4. New Components to Build

### 4.1 `BatchStatusBar` — Lifecycle Stepper

```tsx
const STEPS = [
  { id: "setup", label: "Setup", check: (b) => b.specs.chemistry && b.specs.capacity },
  { id: "review", label: "Review", check: (b) => b.compliance_score !== null },
  { id: "activate", label: "Activate", check: (b) => b.status === "ACTIVE" },
  { id: "ship", label: "Ship", check: (b) => b.passports.some(p => p.status === "SHIPPED") },
  { id: "track", label: "Track", check: (b) => b.passports.some(p => p.status === "IN_SERVICE") },
];
```

Visual: horizontal stepper with checkmarks. Current step is highlighted. Clicking a completed step scrolls to that section.

### 4.2 `ActivationChecklist` — "What's Blocking Me?"

For draft batches, show a clear checklist:

```
☐ Chemistry & capacity filled
☐ Market region selected
☐ Compliance score ≥ 70%
☐ Certificates uploaded (BIS, UN38.3)
☐ Carbon footprint calculated
```

Each item is clickable → scrolls to the relevant section or opens the fix dialog.

### 4.3 `CertificateCard` — Expiry-Aware

```tsx
interface CertificateCardProps {
  type: "BIS" | "UN38.3" | "IEC62133" | "MSDS";
  issueDate?: string;
  validityMonths: number;
  status: "valid" | "expiring" | "expired" | "missing";
  onUpload: () => void;
  onView: () => void;
}
```

Visual: color-coded border (green/yellow/red/gray). Shows "Expires in 60 days" not "Expires: 2027-03-15".

### 4.4 `ComplianceScoreRing` — Visual Score

Replace the progress bar with a circular ring:
- 80-100%: emerald
- 50-79%: amber
- 0-49%: red

Center shows the score %. Below shows "Passed / Partial / Failing".

---

## 5. Interaction Improvements

### 5.1 Smooth Scroll to Sections

When user clicks a gap fix button or checklist item, smoothly scroll to the relevant section within the current tab. Use `scrollIntoView({ behavior: "smooth" })`.

### 5.2 Inline Editing (Future Phase)

Instead of opening a modal to fix a gap, allow inline editing:
- Click "BIS number missing" → inline input appears
- Click "Carbon footprint missing" → inline Carbon Calculator mini-form appears

### 5.3 Keyboard Shortcuts

- `Cmd/Ctrl + E` → Activate batch (if ready)
- `Cmd/Ctrl + D` → Downloads tab
- `Cmd/Ctrl + P` → Passports tab

### 5.4 Toast Improvements

Current: generic toasts.
New: actionable toasts with buttons:
- "Batch activated! [View Passports] [Print Labels]"
- "Carbon footprint calculated! [View Report] [Download Declaration]"

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1)
1. Create file structure (`components/batches/detail/`)
2. Extract `useBatchDetail` hook from current page
3. Build `BatchHeader` + `BatchStatusBar`
4. Build `BatchActions` dropdown

### Phase 2: Overview Tab (Week 1-2)
5. Build `QuickStats` row
6. Build `CoreSpecs` + `MarketCompliance` panels
7. Build `CertificateStatus` cards with expiry logic
8. Build `MaterialComposition` panel
9. Assemble `OverviewTab`

### Phase 3: Passports Tab (Week 2)
10. Move passport table + pagination into `PassportsTab`
11. Add toolbar with Generate + Upload
12. Add search + filters inline

### Phase 4: Compliance Tab (Week 2-3)
13. Build `ComplianceScoreRing`
14. Build `GapList` with inline fix actions
15. Build `CarbonFootprintPanel` (extract from modal)
16. Build `CertificateTracker`
17. Assemble `ComplianceTab`

### Phase 5: Downloads Tab (Week 3)
18. Build grouped download grid
19. Add disabled states with tooltips
20. Assemble `DownloadsTab`

### Phase 6: Polish (Week 3-4)
21. Add keyboard shortcuts
22. Add smooth scroll
23. Add actionable toasts
24. Responsive testing
25. Accessibility audit

---

## 7. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| File size (batch-details-page) | 3,087 lines | ≤ 200 lines (orchestrator only) |
| Time to find compliance score | ~8 sec (tab + scroll) | ≤ 2 sec (visible on Overview) |
| Time to activate a draft batch | ~30 sec (hunt for blockers) | ≤ 10 sec (checklist + direct fixes) |
| User confusion score (qualitative) | High | Low |

---

## 8. Design Mockups

**Reference design system:** Brillance-inspired (warm backgrounds, Instrument Serif headings, pill badges, 1px borders, generous whitespace).

### Color Tokens for Batch Detail

| Token | Value | Usage |
|-------|-------|-------|
| `status-draft` | `#737373` | Draft badge |
| `status-active` | `#059669` | Active badge |
| `status-archived` | `#d97706` | Archived badge |
| `compliance-pass` | `#059669` | Score ≥ 80% |
| `compliance-warn` | `#d97706` | Score 50-79% |
| `compliance-fail` | `#dc2626` | Score < 50% |
| `cert-valid` | `#059669` | Certificate valid |
| `cert-expiring` | `#d97706` | < 90 days |
| `cert-expired` | `#dc2626` | Expired |
| `cert-missing` | `#737373` | Not uploaded |

---

Ready to start implementation. Recommend **Phase 1 first** — the header + status bar gives immediate visual payoff with minimal risk.
