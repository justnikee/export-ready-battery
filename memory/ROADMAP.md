# Battery product roadmap

> **Live intent.** Code is truth. This file is the ordered product direction after the 2026-08-11 lifecycle audit + integrity fixes.  
> Last updated: 2026-08-17 (L-23 landed — Phase 2 complete)

---

## North star

A manufacturer can take a battery **from draft batch → compliance-ready activation → serials/QR → in-service → recycle/close**, with:

- India + EU rules enforced **on the server**
- Passport status changes only via `LifecycleService` (hash-chained events)
- Partner / M2M / public tiers that **actually work**, not just exist in the API
- UI that never says “ready” when the API will reject

Security/perf hardening (S-01…S-15, P-01…P-08) is **done**. This roadmap is **product integrity**, not a new security sprint.

---

## The pipeline we are building toward

```
Create batch (DRAFT)
  → complete specs + compliance + carbon calculator result
  → generate / upload passports (CREATED + genesis event)
  → Activate batch (quota + compliance gate → batch ACTIVE)
  → Activate passports (CREATED → ACTIVE + reason_code)
  → SHIP → INSTALL → IN_SERVICE
  → RECYCLE / circularity / CLOSE
  → Public QR + partner/regulator elevated views
```

Two different “activate”s — do not collapse them:

| Action | What it changes |
|--------|-----------------|
| Batch activate | `batches.status` DRAFT → ACTIVE, quota, compliance gate |
| Passport ACTIVATE | `passports.status` CREATED → ACTIVE, audit event |

---

## Phase 0 — Integrity spine (landed, uncommitted)

**Status: implemented in working tree. Apply migration `000107` before OTP evidence in any real DB.**

| ID | Item | State | Notes |
|----|------|-------|--------|
| L-01 | OTP recycle keeps evidence | **Done** | Stash `pending_evidence` on token; ConfirmOTP applies it |
| L-02 | API-key lifecycle actors | **Done** | `API_KEY` + `EXTERNAL` accepted |
| L-03 | VC route param | **Done** | `PathValue("uuid")` |
| L-04 | ACTIVATE discoverable | **Done** | Allowed-actions for ADMIN / INTERNAL_OPERATOR |
| L-05 | Dispatch reason_code | **Done** | `DISPATCH_QC_PASS` |
| L-06 | Circularity discoverable + CLOSE to EOL | **Done** | Order list + CLOSE from reman/reuse/repurpose |
| L-07 | Quota refund on generate/upload fail | **Done** | Deduct after validate |
| L-08 | EU carbon FE = BE | **Done** | Blockers require `carbon_footprint_result` only |
| L-09 | Public page `?access_token=` | **Done** | Elevates Art. 78 tier |
| L-10 | Empty event hash cannot commit | **Done** | Hash failure aborts transition |
| L-11 | Bulk import uses create validator | **Done** | Stricter: India HSN / DVA / EU category now apply |
| L-12 | Tenancy on export/docs/DD/mass-balance | **Done** | Fail closed on foreign IDs |
| L-13 | Export job FE unwrap | **Done** | `createExportJob` returns `job` |

**Config check (2026-08-11):** wiring is consistent (repo 3-file + handler fake + mux `{uuid}` + migration auto-discovered as version 107). See “Verification” below.

---

## Phase 1 — Make the happy path honest (next)

Do these before adding new product surfaces.

| ID | Item | Why | Done when |
|----|------|-----|-----------|
| L-14 | **Apply `000107`** on each battery DB | **Local done** 2026-08-11 (`Applied 0107`). Apply on Oracle if that DB is behind | `migration_runner up` reports 107+ |
| L-15 | Wizard carbon: save calculator result after create | **Done** | Stores full `/carbon/calculate` payload; POST `/batches/{id}/carbon` after create; no silent 50 kWh/25 kg defaults |
| L-16 | Cert/DoC uploads via API (S-10/S-11) | **Done** | `POST/GET /uploads/compliance-doc`; wizard persists `path` only |
| L-17 | CSV import template + docs | **Done** | Template has India DOMESTIC / IMPORTED / EU samples; importer maps DVA breakdown + battery_category; all field errors returned |
| L-18 | Magic-link modal circularity | **Done** | Modal filters by from-status; reman/reuse/repurpose listed; API rejects partner role mismatch |

---

## Phase 2 — Complete the DPP loop

| ID | Item | Why | Done when |
|----|------|-----|-----------|
| L-19 | VC from batch/passport UI | **Done** | Issue + download from batch Passports tab; GET latest VC; 400 path tests |
| L-20 | CPCB / registry honesty | **Done** | Format-only → `format_valid`; UI says Format valid vs Registry lookup |
| L-21 | Partner action page + OTP evidence UX | **Done** | Evidence sent on first POST (required keys only); action-info returns `required_evidence`; 400 stays on form; OTP uses stash |
| L-22 | External API lifecycle smoke | **Done** | `POST /external/passports/{uuid}/transition` SHIP→INSTALL→RECYCLE + role/tenant 403s |
| L-23 | Labels vs QR draft policy | **Done** | QR + labels only on ACTIVE/ARCHIVED; DRAFT 403 on JWT, API-key, export jobs |

---

## Phase 3 — Later (battery only)

Textile is **out of scope**. Do not plan or implement a textile mirror.

| ID | Item | Notes |
|----|------|--------|
| L-24 | ~~Textile mirror~~ | **Cancelled** — not doing textile |
| L-25 | `admin-web` | Still placeholder; keep platform key for cross-tenant |
| L-26 | Adopt `packages/ui` | Do not start without discussion |
| S-16+ | Residual security notes | Info-level from the audit doc |

---

## Direction (how we choose work)

1. **Integrity first** — if UI and API disagree, fix the contract, don’t add a feature.
2. **One pipeline** — batch create, activate, serials, lifecycle, public scan. Side modules (DGFT, Tally, mass balance) stay scoped.
3. **No second lifecycle** — never raw status writes; never weaken hash/evidence.
4. **Do not treat `docs/*` master plans as current** — this file + `CURRENT.md` + code.

---

## Verification of Phase 0 changes

Checked 2026-08-11 against code:

| Check | Result |
|-------|--------|
| Migration numbered after 000106, append-only pair | Yes — `000107_*.up.sql` / `.down.sql` |
| Runner auto-discovers `NNNNNN_name.up.sql` | Yes — no hardcode needed |
| Repo method in impl + `interface.go` + `mock_repository.go` | Yes — `SavePendingEvidence` |
| Handler fake implements new MagicLink method | Yes |
| `fakeTeamRepo` stub for new interface method | Yes (added on review) |
| VC mux `{uuid}` matches `PathValue` | Yes (legacy `{id}` fallback kept) |
| `IsValidActionSource` includes `API_KEY`; EXTERNAL aligned | Yes |
| Allowed-actions include ACTIVATE for admin/member | Yes — discovery only; persist still SYSTEM |
| Circularity in `BatteryTransitionActionOrder` | Yes |
| FE blockers reject free-text carbon | Yes + unit test |
| Public page forwards token; deps on token string | Yes |
| `createExportJob` unwraps `{ job }` | Yes |
| Export create ownership before count probe | Yes |
| Quota refund on insert/seq/snapshot failure | Yes |
| Go tests `handlers` / `models` / `services` | Passed after implement |
| Activation-blockers vitest | Passed |

### Known remaining config / ops

- **Migration not applied** to any live DB until you run it.
- **Bulk import is stricter** than last week: India + BATTERY needs HSN `8507xxxx`; DOMESTIC needs sale/cost inputs for DVA > 0; EU needs `battery_category` if you add that column later (currently CSV has no category column → EU rows fail validator 10b). Follow-up L-17.
- Wizard **carbon calculator still writes only free-text** at create time; activation will still 403 until L-15 or the user uses the batch Carbon tab.

---

## Suggested next session

1. Battery spine L-01…L-23 is in git.  
2. Apply `000107` and `000108` on the Oracle battery DB if it is behind local.
