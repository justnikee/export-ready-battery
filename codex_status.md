# ExportReady Battery � Change Status (Codex)
Last updated: 2026-02-03

This file lists what has been implemented and what is still pending based on the latest Codex work against `design_system.md`.

## Completed

### Backend
- Added `state_of_health` to passport model as optional (`*float64` + `omitempty`).
- Expanded passport repository queries and inserts to include:
  - `ownership_history`
  - `state_of_health`
  - `last_soh_update_timestamp`
  - owner identifiers/emails
  - repair/replacement events
  - recycling fields
  - tenant EU representative fields
- Enforced manufacturing date requirement for passport creation (auto-generate and external API).
- Set `current_owner_identifier` and initial ownership history during passport creation.
- Updated lifecycle event creation signature and usage to include actor type and source.
- Added ownership history helper: `BuildInitialOwnershipHistory`.
- Updated role transition permissions to allow LOGISTICS `CREATED -> SHIPPED`.

### Frontend
- Removed auto-filled defaults in passport certificate view (no silent placeholders).
- Added �Missing� fallbacks for all critical compliance fields (manufacturer, cell source, dates, import info, DVA, etc.).
- Added lifecycle/ownership section to certificate view:
  - State of Health (SoH)
  - Ownership count
  - Repair and replacement counts
  - India recycling fields
- Certificate view now uses tenant EU rep data instead of batch spec duplication.
- Passport view updated:
  - No auto-fill of materials or DVA
  - �India Market� / �EU Battery Passport� badges
  - SoH shows Missing if timestamp absent
  - Import block shows Missing fields
  - EU block shows missing materials, recycled content, warranty, lifetime, hazard declaration
- Bulk action toolbar simplified to remove bulk delete/status actions.
- CSV auto-generate now requires manufacture date.
- Frontend types updated:
  - `state_of_health` nullable
  - `graphite_pct` in material composition
  - new lifecycle event types

## Pending / To Verify

### Backend
- Complete `PassportWithSpecs` struct additions:
  - `model_name`, `manufacturing_start_date`, `manufacturing_end_date` (ensure model + query + scan).
- Update `GetPassportWithSpecs` SELECT/Scan to include the three manufacturing fields and wire into response.
- Re-scan for any remaining calls to old `CreateLifecycleEvents` signature.
- Confirm all passport creation paths set `CurrentOwnerIdentifier` and `OwnershipHistory` (CSV/auto/external done; verify any remaining flows).

### Frontend
- If required by `design_system.md`, surface `model_name` and manufacturing window in certificate view.
- Re-check any missing-field UI fallbacks or display labels against `design_system.md` after backend wiring.

## Notes
- Authoritative migrations path is `backend/internal/db/migrations`.
- Business rule decisions captured:
  - Hard-block at **Batch Activation** for compliance (do not allow activation if data incomplete).
  - Batch edits must be **Archive & Clone** (no amendments).

If you want, I can keep this file updated as we finish the remaining items.
