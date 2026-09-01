# Session: 2026-08-22 — dpp-spine-review

**Date:** 2026-08-22  
**Agent/tool:** Grok 4.6  
**User goal:** Review batch create → activate → QR → lifecycle as they work in code vs real factory life.

## Context loaded
- [x] CURRENT.md
- [x] PRODUCT_GTM_PLAN.md
- [x] Code: CreateBatch, ActivateBatch, AutoGenerate, QR, Lifecycle, wizard, dispatch

## What we did
- End-to-end code review of the DPP spine (no code changes).
- Confirmed two ACTIVATE operations, Art. 8 2030 hard errors, AIS on all India, UUID-only dispatch, GS1 QR 404, SYSTEM actor on passport ACTIVATE.

## Decisions
- None implemented. Recommended P0 spine fixes before outreach.

## Open for next session
1. Fix activation honesty (Art. 8 warnings, AIS gating).
2. Wizard: quantity, India test dates, don’t require DVA at create.
3. QR: BASE_URL, don’t encode GTIN until `/01/` exists; dispatch scan BPAN.
4. Partners on pilot SKU; stop SYSTEM-washing ACTIVATE actor.

## Graphify
- [x] Query used (broad BFS). N/A update (docs-only).
