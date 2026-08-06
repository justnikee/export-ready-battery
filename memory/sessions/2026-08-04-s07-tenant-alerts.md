# Session: 2026-08-04 — S-07 tenant-scoped alerts

**Date:** 2026-08-04  
**User goal:** Implement S-07 properly (MarkAlertRead IDOR).

## What we did

### Tenant alerts
- `MarkAlertRead(ctx, alertID, tenantID)` — `WHERE id AND tenant_id`; 0 rows → `pgx.ErrNoRows` → 404
- Service + interface + mock + fakes updated
- Handler tests: own tenant 200, foreign 404

### Regulatory alerts (same class of bug)
- `MarkTenantRegulatoryAlertRead/Dismissed` also require `tenant_id`
- Handlers pass JWT tenant; 404 when not found

### Related
- Capped alert list limits in handlers (≤200 / ≤100)

## Next
- **S-08** proxy.ts JWT verification for dashboard gate
