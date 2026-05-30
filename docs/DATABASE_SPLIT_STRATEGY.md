# Database Split Strategy — DB-per-Service

## Current State (Post Big-Bang Split)

All three services currently connect to the **same Supabase PostgreSQL database** with a heavily polluted schema:

- **55 migrations** copied to both `battery-api` and `textile-api`
- `tenants` table has **flat battery fields** (epr_registration_number, bis_r_number, etc.) that were supposed to be dropped after migration 054 created `battery_tenant_profiles`
- `textile_tenant_profiles` table exists in the **battery-api database** (pollutant)
- `batches` and `passports` reuse the same tables with `product_type` columns, but carry battery-specific columns (cell_source, hsn_code, state_of_health, cycle_count, etc.)
- Battery-specific tables (`epr_certificates`, `soh_history`, `passport_telemetry`, `device_tokens`, `carbon_factors`, `reward_ledger`) exist in the textile-api schema even though textile doesn't use them

## Target Architecture: DB-per-Service

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Project 1                        │
│                      (Existing)                              │
│                     BATTERY API                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   platform   │  │   battery    │  │     neutral      │  │
│  │  tenants     │  │  batches     │  │  blog_posts      │  │
│  │  team_members│  │  passports   │  │  product_schemas │  │
│  │  api_keys    │  │  scan_events │  │  export_jobs     │  │
│  │  transactions│  │  epr_certs   │  │  passport_docs   │  │
│  │  ...         │  │  soh_history │  │  ...             │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  NO textile_tenant_profiles                                  │
│  NO flat battery columns on tenants                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Supabase Project 2                        │
│                      (NEW — you set up)                      │
│                     TEXTILE API                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   platform   │  │   textile    │  │     neutral      │  │
│  │  tenants     │  │  batches     │  │  blog_posts      │  │
│  │  team_members│  │  passports   │  │  product_schemas │  │
│  │  api_keys    │  │  scan_events │  │  export_jobs     │  │
│  │  transactions│  │  lot_events  │  │  passport_docs   │  │
│  │  ...         │  │  dye_batches │  │  ...             │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  NO epr_certificates                                         │
│  NO soh_history                                              │
│  NO passport_telemetry                                       │
│  NO device_tokens                                            │
│  NO carbon_factors                                           │
│  NO reward_ledger                                            │
│  NO battery_tenant_profiles                                  │
│  NO flat battery columns on tenants                          │
└─────────────────────────────────────────────────────────────┘
```

## Migration Plan

### Phase 0: Clean Existing Battery DB (Do Now)

**File:** `services/battery-api/internal/db/migrations/000056_remove_textile_pollutants.up.sql`

1. **Drop `textile_tenant_profiles`** — this table does not belong in the battery DB
2. **Drop flat battery columns from `tenants`** — these were copied to `battery_tenant_profiles` in migration 054 and are no longer read by application code:
   - `epr_registration_number`, `bis_r_number`, `iec_code`
   - `epr_certificate_path`, `bis_certificate_path`, `pli_certificate_path`
   - `epr_status`, `bis_status`, `pli_status`
   - `eu_authorized_representative_name`, `eu_authorized_representative_address`, `eu_contact_email`
   - `morth_manufacturer_code`, `morth_factory_codes`

**Run:**
```bash
cd services/battery-api
go run ./cmd/migration_runner up
```

**Risk:** Low. The application uses `tenant.BatteryProfile.*` (from `battery_tenant_profiles`), not the flat columns.

### Phase 1: Create Clean Textile DB (Do When New Supabase Ready)

**File:** `services/textile-api/internal/db/schema_clean.sql`

Run this in your new Supabase project's SQL Editor. It creates:
- Platform tables (`tenants`, `team_members`, `api_keys`, etc.) with **only shared columns**
- Textile profile table (`textile_tenant_profiles`)
- Neutral tables (`batches`, `passports`, `passport_events`, `scan_events`, etc.) **without battery-specific columns**
- No battery tables (`epr_certificates`, `soh_history`, `passport_telemetry`, `device_tokens`, `carbon_factors`, `reward_ledger`, `battery_tenant_profiles`)

**Key differences from battery schema:**

| Table | Battery has | Textile has |
|-------|-------------|-------------|
| `tenants` | Flat battery columns (pre-054) | **Only shared columns** |
| `batches` | `cell_source`, `hsn_code`, `bis_number`, `epr_number`, `dva_source`, `pli_compliant`, `domestic_value_add`, `carbon_footprint_result`, `materials` | **None of these** |
| `passports` | `installed_at`, `returned_at`, `state_of_health`, `last_soh_update_timestamp`, `repair_events`, `replacement_events`, `recycling_status`, `recycler_epr_id`, `recycling_date`, `cycle_count`, `last_temperature`, `last_voltage`, `thermal_event_count`, `last_telemetry_at` | **None of these** |
| Extra tables | `epr_certificates`, `soh_history`, `passport_telemetry`, `device_tokens`, `carbon_factors`, `reward_ledger`, `battery_tenant_profiles` | **`textile_tenant_profiles`** |

### Phase 2: Data Migration (Manual)

Since textile data is currently mixed in the battery DB, you need to extract it:

```sql
-- Run against battery DB (existing Supabase)
-- Export textile tenants + their data for import into new textile DB

COPY (
  SELECT * FROM tenants WHERE product_type = 'TEXTILE'
) TO '/tmp/textile_tenants.csv' WITH CSV HEADER;

COPY (
  SELECT * FROM batches WHERE product_type = 'TEXTILE'
) TO '/tmp/textile_batches.csv' WITH CSV HEADER;

COPY (
  SELECT p.* FROM passports p
  JOIN batches b ON p.batch_id = b.id
  WHERE b.product_type = 'TEXTILE'
) TO '/tmp/textile_passports.csv' WITH CSV HEADER;

-- Then import into new textile Supabase via dashboard or psql
```

**Alternative:** Use Supabase's built-in backup/restore for the initial seed, then delete battery rows.

### Phase 3: Application Configuration

Update each service's `.env` to point to its own database:

```bash
# battery-api .env
DATABASE_URL=postgresql://postgres.[BATTERY_REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# textile-api .env (new project)
DATABASE_URL=postgresql://postgres.[TEXTILE_REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# platform-core .env (shares battery DB for now, or get own project later)
DATABASE_URL=postgresql://postgres.[BATTERY_REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Phase 4: Platform-Core Extraction (Future)

When ready, platform-core gets its own Supabase project:

1. Create new Supabase project for `platform-core`
2. Migrate `tenants`, `team_members`, `api_keys`, `transactions`, `outbound_webhooks` to it
3. Update `battery-api` and `textile-api` to call platform-core via REST API for auth/team/billing
4. Each product DB keeps a minimal `tenants` read replica or uses JWT claims only

## Schema Files Delivered

| File | Purpose |
|------|---------|
| `services/battery-api/internal/db/migrations/000056_remove_textile_pollutants.up.sql` | Cleans existing battery DB |
| `services/battery-api/internal/db/migrations/000056_remove_textile_pollutants.down.sql` | Rollback |
| `services/textile-api/internal/db/schema_clean.sql` | Full clean schema for new textile Supabase |
| `services/battery-api/internal/db/schema_clean.sql` | Reference doc for clean battery schema |

## Immediate Next Steps

1. **Review migration 056** — confirm `battery_tenant_profiles` is populated for all tenants
2. **Run migration 056** on existing Supabase: `cd services/battery-api && go run ./cmd/migration_runner up`
3. **Create new Supabase project** for textile-api
4. **Run `schema_clean.sql`** in new Supabase SQL Editor
5. **Migrate textile data** from battery DB to new textile DB
6. **Update `services/textile-api/.env`** with new DATABASE_URL
7. **Test textile-api** against clean DB
