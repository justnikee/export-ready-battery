# Session handoff — 2026-08-05 EOD

**Date:** 2026-08-05  
**Purpose:** Clean stop so the next session starts here without re-deriving context.

---

## Read first tomorrow

1. [`memory/CURRENT.md`](../CURRENT.md) — priorities + do-nots  
2. This handoff  
3. [`memory/backlog.md`](../backlog.md) — next item **P-02**  
4. Optional: [`docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md`](../../docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md)

---

## What we finished this multi-session sprint

### Security (S-01 … S-15) — **DONE**

| ID | Summary | ADR |
|----|---------|-----|
| S-01 | Platform admin key for doc verify (not tenant OWNER) | 004 |
| S-02 | `RequireWrite` on tenant mutations | 006 |
| S-03 | Global jobs → admin key only | 007 |
| S-04 | Webhook SSRF | 008 |
| S-05 | Supplier HttpOnly session | 009 |
| S-06 | No session JWT in `?token=` | 010 |
| S-07 | Tenant-scoped alert mutations | 011 |
| S-08 | Proxy verifies JWT (not cookie presence) | 012 |
| S-09 | Trusted client IP / rightmost XFF | 013 |
| S-10 | Private compliance certs + re-sign on read | 014 |
| S-11 | Upload magic-byte sniff | 015 |
| S-12 | Scoped regulator keys + access audit | 016 |
| S-13 | Password policy (12+, letter+digit, blocklist) | 017 |
| S-14 | Register no email-enumeration 409 | 018 |
| S-15 | CSP nonces, no script `unsafe-inline` | 019 |

### Performance

| ID | Status | Notes |
|----|--------|--------|
| **P-01** | **Done** | DB pool default 20/2, health `db_pool`, ADR 020 |
| **P-02** | **Next** | Cap list `limit` ≤ 200 |
| P-03+ | Open | Labels 10k, global rate limit, etc. |

---

## Ops / env reminders (not committed secrets)

- Apply migration **`000106_regulator_api_keys`** before using admin regulator-key routes.
- `ADMIN_API_KEY` on battery-api for platform admin + regulator key CRUD.
- Prefer DB regulator keys; env `REGULATOR_API_KEY` is global bootstrap only.
- `DB_MAX_CONNS`: keep `instances × max` under Supabase/PgBouncer limit.
- After deploy: smoke-test **billing → Razorpay** (CSP nonces).

---

## Uncommitted work

Many security/perf files are modified/untracked in the working tree (see git status when you open the repo). **Nothing assumed committed** — review and commit when ready. Do not force-push or schema-reset.

Key new surfaces to know:

- `services/battery-api/internal/db/pool_config.go` (P-01)
- `services/battery-api/internal/services/password_policy.go`, `file_sniff.go`, `regulator_keys.go`, `ssrf.go`
- `services/battery-api/internal/db/migrations/000106_regulator_api_keys.*`
- `apps/battery-web/lib/csp.ts`, `lib/password-policy.ts`, `proxy.ts` CSP
- `memory/decisions/004` … `020`

---

## Next concrete task (start here)

**P-02 — unbounded list `limit`**

- Audit: alerts (+ similar list endpoints) accept `limit` with no upper bound.
- Done when: clamp to **≤ 200** (project convention in CLAUDE.md / rules).
- Start surfaces: `alert_handlers.go`, then grep `limit` / `Atoi` across handlers.

---

## Graphify

Run at session start if `graphify-out/` is stale:

```bash
graphify update .
# then: graphify query "…" for symbol navigation
```

---

## Do not re-open as “new bugs”

See CURRENT.md **Do not** list — especially S-01 ownership, S-14 409, S-15 unsafe-inline scripts, pool math.
