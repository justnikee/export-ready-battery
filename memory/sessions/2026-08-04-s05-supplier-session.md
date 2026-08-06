# Session: 2026-08-04 — S-05 supplier session

**Date:** 2026-08-04  
**User goal:** Remove supplier JWT from localStorage (S-05).

## What we did

### Backend
- Login sets HttpOnly `supplier_token` cookie
- `POST /supplier/logout` clears cookie
- `Protect` middleware accepts `supplier_token` cookie when no Bearer header
- Supplier document upload: no longer requires tenant onboarding complete

### Frontend
- `lib/supplier-session.ts` — in-memory token only
- `lib/supplier-api.ts` — axios withCredentials + Bearer from memory
- Login / dashboard / upload no longer touch localStorage

### Tests
- SupplierLogin sets HttpOnly cookie
- SupplierLogout clears cookie
- Auth Protect accepts supplier cookie

## Next
- **S-06** remove JWT from query string
