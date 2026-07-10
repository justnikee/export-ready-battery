# AI System Architecture — Battery Product

**Status:** Proposed design (2026-07-10). Companion to `vertical-ai-research.md` (root), with corrections where that doc drifted from the code. Verify against code before implementing any item — this doc describes intent, the code is truth.

---

## 1. Corrections to `vertical-ai-research.md`

The research doc's pain-point analysis is sound, but three codebase claims are wrong or stale:

| Doc claim | Reality (verified 2026-07-10) |
|---|---|
| "Certificate AI parsing is promised in marketing but **does not exist** in the codebase" | It partially exists. `POST /api/v1/ai/parse-datasheet`, `/ai/parse-datasheet-upload`, `/ai/nl-create-batch` are live (`internal/handlers/ai_handlers.go`, wired in `cmd/server/main.go:570-574`), backed by `internal/services/ai_service.go`: regex-first extraction (~50 fields incl. Chinese/Japanese patterns) with a **Groq Llama-3.3-70B** fallback, per-field provenance (`FieldSources`), 1h response cache. Frontend already consumes it (`apps/battery-web/lib/ai/parse-datasheet.ts`, `ai-field-preview-table.tsx`, `step-identity.tsx`). **The real gap:** it only handles *text-layer* PDFs — `ai_handlers.go` rejects scanned/image PDFs ("No text found in PDF"), which is what most real BIS/EPR/UN38.3 certificates are. It also truncates input at 4,000 chars and uses one generic prompt, not certificate-type-aware prompts. |
| "`carbon_calculator.go` requires every field; if `assembly_energy_kwh` is missing the calculation **fails or returns junk**" | Wrong. It already degrades gracefully: missing assembly energy falls back to a country-specific `ASSEMBLY` factor (migration 000042) then `DEFAULT`; unknown countries fall back to the `GLOBAL` energy mix; EOL has a JRC default. **The real gap:** results carry no confidence tier — an all-defaults estimate and a metered-primary-data calculation produce indistinguishable declarations. There is also no transport-distance/mode estimation. |
| "Every demo is weaker without it \[cert parsing\]" | Marketing (`battery-features.tsx:353`) promises "Drag and drop your BIS, EPR, UN38.3, IEC 62133 and MSDS certificates." Backend covers datasheets, not scanned certificates — the promise is ~60% kept. |

Claims that **verified as accurate**: `internal/regulatory/classifier.go` is keyword-list matching that cannot distinguish a draft consultation from an enforcement date (the `"must"/"shall"/"by"` → high-urgency rule fires on drafts); `internal/jobs/daily_alerts.go` is a fixed-interval expiry check with no renewal-lead-time reasoning; `internal/compliance/battery/eu.go` + `india.go` are deterministic validators over shared `BatchSpec` JSONB with DB-driven thresholds — the right foundation; `cmrt_importer.go` handles one normalized CMRT layout.

External validation (July 2026): carbon-footprint declarations for industrial batteries >2 kWh mandatory since Feb 2026; due diligence postponed to 18 Aug 2027 by Regulation (EU) 2025/1561 (Omnibus IV); battery passport mandatory 18 Feb 2027; SMEs are the underserved segment. The doc's pain points 2–8 are real. Pain point 1 (EU Authorized Representative / Technical File) is real **but the doc maps no feature to it** — fixed in §5.7 below.

## 2. Missing pain points (additions to the research doc)

1. **Scanned & photographed documents.** The doc assumes clean PDFs. Indian certificate reality is scans, photos of paper, and stamped/signed pages. This is *the* blocker for the current parser and the single highest-leverage fix (multimodal vision, §5.1).
2. **Technical File / EU AR readiness** (doc's pain #1, unmapped). An AR won't sign without a complete Technical File; manufacturers don't know what one contains. Anviora already holds most of the underlying data. → §5.7.
3. **Cross-language supplier documents.** Cell suppliers are predominantly Chinese; MSDS and test reports arrive in Chinese. The regex layer already has zh/ja patterns — the LLM layer should own this fully.
4. **Domestic-India-only manufacturers** (not just EU exporters): EPR liability math and recycler-certificate procurement under BWM Rules (amended 2025), BIS renewal lead-times (45–60 days vs 1–2 yr validity), Scheme X transition (extended to Sep 2026). Mostly deterministic features + the Co-pilot explanation layer; noted so the roadmap doesn't over-rotate on EU.
5. **ERP reconciliation.** A Tally sync worker already runs in battery-api; mismatches between Tally invoices and batch data are a support burden waiting to happen. AI-suggested field mappings are a later enhancement, not a launch feature.

## 3. Architecture principles

1. **Deterministic core, AI edges.** Compliance determination (`internal/compliance`), BPAN serials, VC signing, OTS anchoring stay 100% deterministic. AI only: *extracts* (documents → structured data, human-reviewed), *explains* (gaps → action plans), *estimates* (labeled, never silently substituting for primary data), *classifies* (with keyword fallback). This matches Part 5 of the research doc and is the regulatory-defensibility story.
2. **Human confirms every write.** No AI output is committed to a batch/tenant record without user review. AI pre-fills forms; the existing `ai-field-preview-table` review pattern is the template for every new feature.
3. **Provenance everywhere.** Every AI-derived value carries `source` (`regex` | `llm` | `vision` | `estimated`) and confidence, persisted in `BatchSpec` where it affects declarations.
4. **One AI plumbing layer, many features.** All six features share one client, one prompt registry, one audit log, one budget guard — not six ad-hoc integrations.
5. **battery-api is the reference; textile mirrors later.** The `internal/ai` package is built to be copy-portable to textile-api like the rest of the stack.

## 4. System architecture

```
apps/battery-web                       services/battery-api
┌─────────────────────────┐            ┌──────────────────────────────────────────────┐
│ batch wizard / cert     │  /api/v1   │ handlers: ai_handlers.go (extended)          │
│ upload / advice panel / ├───────────►│           compliance_handlers.go (+advice)   │
│ digest email links      │            ├──────────────────────────────────────────────┤
└─────────────────────────┘            │ services:  CertificateService (F1)           │
                                       │            CarbonEstimator (F2)              │
                                       │            ComplianceAdviceService (F3)      │
                                       │            SupplierOrchestrator (F5)         │
                                       │            DigestGenerator (F6)              │
                                       ├──────────────────────────────────────────────┤
                                       │ internal/ai  (NEW — shared plumbing)         │
                                       │   client.go     LLMClient interface          │
                                       │   anthropic.go  Claude impl (primary)        │
                                       │   groq.go       existing impl (fallback/dev) │
                                       │   prompts/      versioned, embed.FS          │
                                       │   schemas/      JSON Schemas for outputs     │
                                       │   audit.go      → ai_invocations table       │
                                       │   budget.go     per-tenant token guard       │
                                       ├──────────────────────────────────────────────┤
                                       │ internal/regulatory/classifier.go (F4: LLM   │
                                       │   first, keyword fallback — drop-in)         │
                                       │ internal/jobs/daily_alerts.go (F6 hook)      │
                                       │ deterministic: compliance/, carbon factors,  │
                                       │   BPAN, VC, OTS — UNTOUCHED                  │
                                       └──────────────────────────────────────────────┘
```

### 4.1 `internal/ai` package (the one new foundation)

```go
type LLMClient interface {
    // Structured completion: prompt + JSON Schema → validated JSON.
    Complete(ctx context.Context, req CompletionRequest) (*CompletionResult, error)
    // Multimodal: PDF/image bytes + prompt + schema → validated JSON. (F1)
    CompleteWithDocument(ctx context.Context, doc []byte, mime string, req CompletionRequest) (*CompletionResult, error)
}

type CompletionRequest struct {
    Feature      string          // "certificate_parse", "compliance_advice", ...
    PromptName   string          // key into prompts/ registry
    PromptVars   map[string]any
    OutputSchema json.RawMessage // enforced via structured outputs
    Model        ModelTier       // TierReasoning | TierFast
    MaxTokens    int
}
```

- **Provider: Anthropic Claude, direct HTTP** (stdlib `net/http`, consistent with the no-framework convention; the official Go SDK is an acceptable alternative if the team prefers). `TierReasoning` → `claude-opus-4-8` (certificate extraction, compliance advice, digest). `TierFast` → `claude-haiku-4-5` (regulatory classification volume). Use `output_config.format` (JSON Schema structured outputs) so responses are guaranteed-valid — this replaces the current fragile `extractJSON()` substring hack. Scanned certificates go up as base64 `document` content blocks (native PDF/vision, no OCR pipeline to build).
- **Prompt caching:** the regulatory ontology system prompt (BIS `CM/L-XXXXXXXX` formats, UN38.3 T.1–T.8, EPR `CPCB/BWMR/...`, BatchSpec field glossary, Art. 7/8/11 summaries) is large, stable, and shared across features → one cached system block per feature, volatile content after it. This is the "months of domain work" moat from Part 4 of the research doc, expressed as versioned prompt files.
- **Batch API** for non-interactive work (nightly classifier runs, daily digests): 50% cost.
- **Groq path retained** as `AI_PROVIDER=groq` fallback and free dev mode; the regex extractor remains stage 1 always (free, fast, and its output cross-checks the LLM).
- **`ai_invocations` table** (new migration): `tenant_id, feature, model, prompt_version, input_tokens, output_tokens, latency_ms, success, created_at`. Powers cost dashboards, per-tenant budgets (`budget.go` returns 429 beyond a plan-tier cap), and the eval flywheel. No document content stored — only metadata.
- **Config:** `ANTHROPIC_API_KEY`, `AI_PROVIDER` (default `anthropic`, fallback `groq`), added to `.env.example` (never `.env`). Feature-gate every AI route through the existing `feat(services.Feature...)` middleware with a new `FeatureAI` so plans can tier it.

### 4.2 Failure posture

Every feature must work with AI **off** (key missing, budget exhausted, provider down): F1 falls back to regex-only (current behavior), F3/F6 fall back to raw gap lists / rule-based alerts, F4 falls back to keyword classification, F2 returns the calculator's current behavior. AI never sits between a user and a deterministic capability.

## 5. Feature designs

Ordered by build priority (revised from the research doc — see §6).

### 5.1 F1 — Certificate Intelligence v2 (upgrade, not greenfield)

Closes the marketing promise; fixes the scanned-PDF rejection.

- New `POST /api/v1/ai/parse-certificate`: multipart PDF/JPG/PNG → (1) try text-layer extraction → regex+LLM (current pipeline, cheap); (2) if no text layer, send the document itself to Claude via `CompleteWithDocument` — **this replaces the current hard error** at `ai_handlers.go` ("it may be scanned/image-based").
- **Document-type detection first** (one cheap classification call or filename/keyword heuristic): `BIS | UN38_3 | IEC62133 | EPR | EU_DOC | MSDS | DATASHEET | UNKNOWN` → selects a type-specific prompt + output schema (BIS cert number format, T.1–T.8 pass/fail table, EPR registration + validity, DoC article references). `UNKNOWN` uses the generic datasheet schema.
- Output stays `DatasheetParseResult`-compatible (extended with `doc_type`, `source: "vision"` in `FieldSources`) so the existing frontend preview table and `applyPdfResult` keep working; extend `trackedProvenanceFields` in lockstep with `ai-field-preview-table.tsx` (the file comment already demands this).
- Multi-document upload in the wizard: parse each cert, merge non-conflicting fields, flag conflicts (e.g., two different weights) for review instead of silently preferring one.
- Handles Chinese-language supplier documents natively (missing pain #3).

### 5.2 F3 — Compliance Co-pilot (gap → action plan)

- New `ComplianceAdviceService` + `POST /api/v1/batches/{id}/compliance-advice` in `compliance_handlers.go`. Input: the existing `compliance.Result` (gaps already carry regulation refs like `EU 2023/1542 Art. 8`) + batch spec + today's date vs deadline table. Output schema per gap: `severity (blocks_now | future_deadline | advisory)`, `deadline`, `plain_english`, `actions[]`, `estimated_effort`, `regulation_reference` — exactly the shape in the research doc.
- **Deadline table is deterministic data, not LLM knowledge**: a seeded `regulatory_deadlines` table (Feb 2026 carbon, Feb 2027 passport, Aug 2027 due diligence, 2031 recycled content, BIS/EPR renewal lead times). The LLM composes explanations *from* it; it never invents dates.
- **Cache aggressively**: advice keyed on `(validator_version, gap fingerprint, spec hash)` in a new `ai_advice_cache` table. Most tenants share the same gaps → most requests are cache hits, near-zero marginal cost.
- Covers India gaps identically (BIS/EPR/HSN/cell-source) — this is the "one dataset, two regulators" story rendered as one unified action plan (pain #8, and the domestic-manufacturer additions in §2.4).

### 5.3 F2 — Carbon confidence & estimation layer

Mostly deterministic engineering; the LLM only writes the explanation.

- New spec fields (JSONB — no migration; extend `TestBatchSpec_JSONRoundTrip` + `batch-form-schema.ts` per CLAUDE.md): `carbon_confidence` (`ESTIMATED | PARTIAL_PRIMARY | PRIMARY_VERIFIED`), `carbon_estimated_inputs []string`.
- Seed new `carbon_factors` categories (new migration, append-only): `ASSEMBLY_BENCHMARK` per chemistry (JRC ranges), `ROUTE_DISTANCE` for common lanes (Nhava Sheva/Mundra/Chennai → Rotterdam/Hamburg/Antwerp), so "ships by sea to Hamburg" resolves to km without the user knowing logistics. `CalculateCarbon` already records `FactorsUsed` — derive the confidence tier from which factors were defaults vs user-provided.
- LLM layer (`CarbonEstimator`): given the breakdown + estimated-inputs list, produce the plain-English "you are Estimated because X; metering pack-assembly energy for one month upgrades you to Partial-Primary" note. Declaration text gains the disclosure required for estimated methods.
- Extend the existing monthly-bill helper idea: `total_monthly_kwh / units_produced` → per-pack assembly energy with `PARTIAL_PRIMARY` label (deterministic arithmetic, one form field pair).

### 5.4 F4 — Regulatory Classifier v2

- `classifier.go`: add `ClassifyLLM()` (TierFast, structured output matching the existing `Classification` fields + new `deadline_confidence`, `change_direction (tightens | relaxes | extends_deadline | informational)`); keyword path becomes the fallback. Add `classifier_method` to `RegulatoryItem` for A/B auditing. Ingester interface unchanged — drop-in. Run via Batch API on the ingest cycle.

### 5.5 F6 — Intelligent Daily Digest

- `DigestGenerator` service called from `daily_alerts.go` after the deterministic expiry scan: aggregate tenant state (expiring certs + renewal lead times from the deadlines table, new classified regulatory items matching the tenant's chemistries/markets, compliance-score deltas, carbon-confidence upgrades available) → one LLM call → prioritized briefing (urgent / this week / when you can) → existing email service. Rule-based alerts remain the skeleton; the LLM only writes the narrative. Batch API, nightly.

### 5.6 F5 — Supplier Data Orchestrator

Largest scope, last in line. Three sub-parts, shipped in this order: (a) **CMRT AI fallback** — when `cmrt_importer.go` fails to recognize a column layout, hand the sheet (as CSV text) to the LLM with the importer's target schema; (b) **response parsing** — supplier PDF/Excel replies routed through the F1 pipeline with a supplier-data schema; (c) **outreach generation** — templated emails (existing email service) with an AI-personalized data-request table per supplier + missing-fields list; completeness scoring is deterministic (fields present / fields required).

### 5.7 F7 — Technical File / AR-Readiness Pack (new; closes pain #1)

- Deterministic checklist: EU Technical File contents mapped to data Anviora already holds (spec, test certs, carbon declaration, DoC fields, label artwork) — a completeness score per batch/model, same pattern as compliance score.
- AI assist: generate *draft* Technical File narrative sections (product description, risk assessment outline) from the batch spec, clearly watermarked DRAFT for the manufacturer/AR to edit. Export as the evidence pack (PDF bundle) an AR asks for on day one. This is a differentiator no listed competitor ships for Indian SMEs.

## 6. Build order

Revised from the research doc's matrix — F1 is an upgrade, and the estimator is mostly deterministic:

| Phase | Ship | Why first | Acceptance gate |
|---|---|---|---|
| 1 | `internal/ai` plumbing + F1 cert parser v2 | Fixes the broken marketing promise incl. scanned PDFs; every later feature reuses the plumbing | Scanned BIS + UN38.3 samples parse end-to-end in the wizard; regex-only fallback intact; `ai_invocations` rows written; preflight passes |
| 2 | F3 Co-pilot + deadlines table | Daily-active-use driver; cheap (cache-heavy) | Every current EU/India gap ID renders an action plan; validators untouched (their tests unchanged) |
| 3 | F2 carbon confidence + route/benchmark factors | Unblocks carbon-form abandoners; mostly deterministic | Confidence tier on every declaration; `TestBatchSpec_JSONRoundTrip` extended; formula-duplication grep done (CLAUDE.md rule) |
| 4 | F4 classifier v2 | Low effort, drop-in | Draft-vs-enforcement eval set ≥90% urgency accuracy; keyword fallback on error |
| 5 | F6 digest | Retention; builds on 2+4 | Digest email renders from real tenant state; sends only when actionable items exist |
| 6 | F5 orchestrator (a→b→c) | Highest effort | Unrecognized CMRT variants import via fallback |
| 7 | F7 Technical File pack | New surface area | Completeness score + exportable draft pack |

Each phase ends with `bash scripts/preflight.sh` green and a runtime check per the `verify` skill. Textile-api gets the `internal/ai` package copied only after Phase 2 stabilizes.

## 7. Cross-cutting decisions

- **Security/tenancy:** AI routes sit behind the existing JWT middleware + `RequireOnboardingComplete`; documents are processed in-memory and not persisted to the AI provider beyond the API call; no tenant data in prompts beyond the batch being acted on. Anthropic API is 30-day retention — note in the DPA/privacy page.
- **Cost model (order of magnitude):** cert parse ≈ 1 doc ≈ 5–10K input tokens on Opus ≈ $0.05–0.10; advice mostly cached; classifier on Haiku+Batch ≈ fractions of a cent/item; digest ≈ $0.01–0.03/tenant/day on Batch. Per-tenant monthly token budget enforced in `budget.go`, tiered by plan.
- **Evals before cleverness:** a `testdata/ai-evals/` corpus (redacted real certificates, CMRT variants, regulatory items with known urgency) with a Go test harness that runs against recorded fixtures by default and live API behind an env flag. Prompt changes require the eval to pass. This is the data flywheel made concrete.
- **What stays non-AI (restating the boundary):** compliance pass/fail, thresholds, BPAN, QR, VC signing, OTS anchoring, EPR liability arithmetic, completeness scores. If a future feature idea puts an LLM in any of these paths, it is out of policy.
