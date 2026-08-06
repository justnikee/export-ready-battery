# ADR 016: Scoped regulator API keys + access audit (S-12)

## Status
Accepted — 2026-08-05

## Context
A single env `REGULATOR_API_KEY` granted Art. 78 regulator-tier passport data for **every** passport. Key leak = global regulator access; no attribution, rotation, or tenant/market scoping. Tenant-issued `data_access_tokens` with `access_tier=REGULATOR` also lacked a tenant match check on passport read.

## Decision
1. **DB-backed credentials** (`regulator_api_keys`): name/org, SHA-256 `key_hash`, `key_prefix`, `tenant_ids[]` (empty = all tenants), `markets[]` (empty = all), expiry, soft revoke.
2. **Raw key format** `reg_<64 hex>`; shown once on create via platform admin API.
3. **Authorize path** for `X-Regulator-Key`:
   - Look up by hash → enforce tenant + market scope → audit → allow/deny.
   - Else constant-time match **env bootstrap** `REGULATOR_API_KEY` (global; for local/emergency only) → audit as `source=env`.
4. **Access audit** table `regulator_access_log` (key identity, passport, tenant, market, IP, outcome).
5. **Admin CRUD** under `ADMIN_API_KEY`: create/list/revoke keys + list access log.
6. **Data-access REGULATOR tokens** must match passport tenant; wrong tenant → public tier. Successful reads audited as `source=data_access`.

## Consequences
- Production should issue scoped DB keys and avoid relying on env global key (config warns when env is set in production).
- Migration `000106_regulator_api_keys` required before admin create works.
- Invalid/out-of-scope keys fall through to partner/public (no 401 oracle on passport GET).
