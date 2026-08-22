# Session: lifecycle integrity + pipeline fixes

**Date:** 2026-08-11  
**Scope:** battery-api + battery-web — implement review findings from batch→lifecycle audit

## Shipped

### P0
- Magic-link OTP: parse body first, validate+stash evidence (`pending_evidence` col, migration `000107`), ConfirmOTP applies stashed evidence
- `IsValidActionSource` accepts `API_KEY`; `ValidateActorContext` aligns `EXTERNAL` + API key
- VC handler `PathValue("uuid")` (was wrong key `id`)

### P1
- `GetAllowedActionsForRole` surfaces ACTIVATE for ADMIN/INTERNAL_OPERATOR
- Circularity actions in `BatteryTransitionActionOrder`; CLOSE from REMANUFACTURED/REUSED/REPURPOSED
- Auto-generate/CSV: validate before quota; refund on failure
- FE activation blockers require `carbon_footprint_result` only (no free-text Art.7)
- Public `/p/[uuid]` forwards `?access_token=`
- Dispatch bulk ACTIVATE sends `reason_code`
- Event hash generation failure aborts transition (no empty hash)

### P2
- Bulk import runs `BatchCreationValidator` + estimated DVA recompute
- Export job create verifies batch ownership
- Passport doc upload, DD create/list, mass-balance allocate/list: tenant ownership checks
- FE `createExportJob` unwraps `{ job }`
- FE types: circularity statuses/actions; lifecycle CLOSE evidence fields

## Tests
- `go test ./internal/handlers ./internal/models ./internal/services` green
- Magic-link OTP recycle end-to-end unit test
- `vitest lib/activation-blockers.test.ts` green

## L-18 (same day)

Magic-link request modal lists remanufacture / reuse / repurpose, filtered by passport status (same AllowedFrom as the state machine). CLOSE from reman/reuse/repurpose/recalled/recycled. API refuses a partner whose verified role cannot perform the action.

## L-17 (same day)

Bulk import template + importer now match BatchCreationValidator: `battery_category`, PLI-ACC cost columns, per-field error list, documented sample rows (India DOMESTIC / IMPORTED / EU).

## L-21 (same day)

Partner `/p/[uuid]/action`: shared evidence catalog + `required_evidence` from action-info; first POST sends only required keys (OTP stash); validation errors no longer wipe the form as Access Denied.

## L-14 + L-16 (same day)

- Applied `000107` locally (`migration_runner up` → `Applied 0107`). Render not touched.
- Wizard cert/DoC: `POST /api/v1/uploads/compliance-doc` (PDF sniff + private path). View via GET re-sign. Form stores `path`, not signed URLs.

## L-15 (same day)

Wizard stores the full `/carbon/calculate` payload (`carbonFootprintResult` + spec fingerprint). After `POST /batches`, calls `POST /batches/{id}/carbon`. Calculator refuses missing capacity/weight (no 50 kWh / 25 kg defaults). Review blockers use the stored result.

## Follow-up this session

- Wrote live product roadmap: `memory/ROADMAP.md`
- Updated CURRENT, backlog (L-14…L-23), INDEX
- Verification pass: added `fakeTeamRepo.SavePendingEvidence`; public page deps on `accessToken` string

## Follow-ups (not done)
- Wizard cert/DoC still uses short-lived signed URLs (S-10) — larger upload redesign
- CPCB registry honesty messaging
- FE magic-link modal circularity action list
- Apply migration `000107` on all envs before OTP evidence in multi-instance prod
