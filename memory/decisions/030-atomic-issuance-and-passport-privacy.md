# ADR 030 — Atomic issuance and enforced passport privacy

Date: 2026-10-17. Status: accepted for the P1 demo correctness fixes requested by the user.

## Decision

- Batch document references must resolve to the owning tenant's `batch-staging/{doc|pli}/<file>.pdf` key. Create/PATCH persist canonical keys; signing repeats the ownership and purpose check. Legacy signed/public URL shapes are accepted only when they resolve to an allowed key. Other legacy references require re-upload; no unverified external-URL fallback.
- Shared private-bucket signing requires the owning tenant and fails closed on traversal, foreign keys, invalid references, or unavailable storage.
- Visibility uses the existing flat settings categories (`battery_composition`, `lifecycle_metrics`, `supply_chain`, `compliance_docs`). Nested legacy field rules remain supported. Unconfigured categories default to PARTNER, matching the settings UI. Explicit invalid category tiers require REGULATOR. The public repository lookup loads the configuration; public/partner projections and document URLs enforce it server-side.
- Basic product identity, rated voltage/capacity/weight, safety fields, and manufacturer identity are not controlled by these categories. These controls are a privacy policy, not a legal-compliance certification. Settings copy describes the scope.
- Activation and every HTTP passport creation path use one transaction with tenant-then-batch row locks. Status checks, current count, quota debit, ledger, insertion/genesis events or snapshot finalization, and activation commit together. A concurrent state change returns conflict; the caller reloads before retrying. Active/archived reactivation cannot debit again. Archived batches cannot receive new passports.
- All issuance reads, including the component tree, use the transaction connection; callbacks do no additional DB/network work. This prevents connection-pool starvation while holding locks.
- Draft passport records are provisional (no final snapshot) and are not publicly published. Activation creates a complete version-2 snapshot from current validated data for the draft records. Active-batch additions receive a current snapshot and a debit atomically. Existing issued snapshots/events are not retroactively rewritten.
- V2 snapshot zero/empty values are authoritative. Historical manufacturer identity is frozen; permitted current support contact and freshly resolved certificate links remain available and still pass visibility filtering. Stored carbon-result display formatting is shared between live and issued views; no calculation formula changed.

## Compatibility and limits

No migration, environment change, deployment, or existing customer-data rewrite. Already-active legacy passports retain their historical snapshots; they are not silently repaired. Non-staging legacy attachments must be re-uploaded. Serial reservation may leave gaps after a rejected request; it must never reuse identifiers. Activation retries return conflict without charging again; generation does not gain a new general-purpose idempotency API.

## Verification

Real disposable PostgreSQL regression tests cover overlapping activation, both upload/activation orderings, quota/ledger rollback, failed passport/event insertion, archived rejection, final snapshot content, and saved visibility loading. Handler/model tests cover reference authorization, category filtering, document endpoint gating, draft publication, and snapshot projection. The fixture creates its own temporary cluster and never uses project DATABASE_URL.
