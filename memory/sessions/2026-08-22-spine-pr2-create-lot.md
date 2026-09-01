# Session: 2026-08-22 — spine-pr2-create-lot

**User goal:** Continue DPP spine; PR 2 create-as-lot.

## What we did
- Wizard `lotSize` required; NL quantity writes it; auto-generate defaults from `specs.lot_size`.
- Create no longer requires DVA>0, HSN, BoE/customs, or tenant IEC (activation still does).
- Pack origin not overwritten by cell origin (`cell_country_of_origin`).
- Recycled % + carbon result posted on create.
- QR stays `/p/{uuid}` even if GTIN is set.
- Shared fixtures + Go/FE tests updated.

## Tests
- go test compliance/battery, services, models, handlers — ok
- vitest schema, activation-blockers, PassportsTab — 36 passed

## Open
- PR 3 QR/dispatch scan
- PR 4 actors/partners
