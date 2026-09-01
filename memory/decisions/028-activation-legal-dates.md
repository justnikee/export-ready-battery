# ADR 028: Activation gates vs future legal dates

- **Status**: Accepted
- **Date**: 2026-08-22

## Context

Batch activation runs India + EU validators as a hard 403. The EU validator treated Art. 8 recycled-content floors (Co 16% / Li 6% / Ni 6% / Pb 85%) as errors. Those minima apply from **18 August 2031** (disclosure from 18 August 2028). India required AIS-156 and AIS-038 on every batch; MoRTH type-approval is for traction (EV/LMT), not stationary/portable/SLI.

A first exporter of LMT/industrial packs in 2026 could not activate a honest lot.

## Decision

1. Activation may **require disclosure** (calculator carbon result, non-zero material composition, recycled % *declared* when the metal is present).
2. Activation must **not** enforce legal floors that are not yet in force. Art. 8 minima are **WARNING**s dated 18 Aug 2031.
3. AIS-156 / AIS-038 apply only when `battery_category` is `EV` or `LMT`. Empty category: WARNING, not block. INDUSTRIAL / PORTABLE / SLI: no AIS.

## Consequences

- EU LMT with metals declared and 0% recycled can activate; the warning stays on the checklist.
- India industrial/UPS lots can activate without AIS strings.
- India LMT/EV still cannot activate without AIS-156 and AIS-038.
- Frontend `activation-blockers.ts` must stay in lockstep (heuristic + `/compliance` merge).
