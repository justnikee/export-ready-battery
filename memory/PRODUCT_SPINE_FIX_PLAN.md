# DPP spine fix plan

**Goal:** A first customer can open a lot, activate it, print labels, scan them out, and complete ship → install → recycle without a founder on the call and without a 403.

**Order:** PR 1 → 2 → 3 → 4. Do not start 2 until 1 is green.

## PR 1 — Activation honesty
- Art. 8 2030 floors → WARNING (dated 2031), not ERROR (`eu.go`)
- AIS-156/038 only EV/LMT (`india.go` + FE blockers)
- India IEC 62133 + MSDS dates on India accordion
- Tracker: 1 credit **per passport**
- ADR 028

## PR 2 — Create is a lot
- Wizard `lot_size`; default generate count
- DVA/HSN/BoE/IEC not required at CREATE
- Do not overwrite pack origin with cell origin
- Persist recycled % + carbon on create
- GTIN optional; QR stays `/p/{uuid}`

## PR 3 — QR + warehouse scan
- `qr_codes_ready` iff batch ACTIVE/ARCHIVED
- Dispatch parse UUID | `/p/{uuid}` | BPAN; resolve serial tenant-scoped
- SHIP only units that are ACTIVE after ACTIVATE

## PR 4 — Actors + partners
- Passport ACTIVATE event = signed-in user, not `system`
- `FeaturePartners` core (installer/recycler magic links)

## Done
EU LMT N packs: create → generate → activate → labels → dispatch by BPAN → SHIPPED; partner INSTALL. India INDUSTRIAL activates without AIS.

Full file-level plan: Grok session plan.md (2026-08-22).
