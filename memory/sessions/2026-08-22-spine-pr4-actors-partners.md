# Session: 2026-08-22 — spine-pr4-actors-partners

**User goal:** PR 4 of the DPP spine.

## What we did
- Passport ACTIVATE is attributed to the signed-in user (ADMIN / MEMBER), not `system`. SYSTEM remains valid for jobs.
- VIEWER still 403.
- `FeaturePartners` is core: Starter can invite TECHNICIAN/RECYCLER for INSTALL/RECYCLE. `/auth/me` always sends `partners: true`.
- Partners nav item no longer Growth-locked.

## Tests
- go test models, services, handlers ok

## Open
- GTM hygiene (mock top-up, fake stats, nav slim) from PRODUCT_GTM_PLAN.md
