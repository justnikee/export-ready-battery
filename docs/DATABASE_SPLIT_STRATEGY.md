# Database Split Strategy

## Current State

All three services (`platform-core`, `battery-api`, `textile-api`) currently connect to the **same Supabase PostgreSQL database** (`postgres` on Supabase). They share:

- A single migration history (managed by `battery-api/cmd/migration_runner`)
- The same 54 migration files (copied to both `battery-api` and `textile-api`)
- Cross-service table visibility (no row-level security or schema isolation)

This was the correct choice for the **big-bang split** because it allowed immediate service separation without a data migration.

## Problem

As the product lines diverge, sharing one database creates:

1. **Tight coupling** — A migration in battery-api that alters `batches` could break textile-api if it also queries that table
2. **Schema bloat** — Textile tables (`textile_lots`, `dye_batches`) live next to battery tables (`batches`, `passports`)
3. **Deployment risk** — Rolling back a battery migration affects textile data
4. **Scaling asymmetry** — Battery may need read replicas sooner than textile; shared DB makes this hard

## Recommended Approach: Schema-per-Service

Rather than splitting into three **physical databases** immediately, use PostgreSQL **schemas** as a migration path:

```
anvayalabs (database)
├── public        — shared extensions, enums
├── platform      — tenants, users, team_members, billing_transactions, api_keys
├── battery       — batches, passports, scan_events, epr_certificates
├── textile       — lots, supply_chain_events, dye_batches
```

### Why schemas first?

| Approach | Pros | Cons |
|----------|------|------|
| **Single DB, shared tables** (today) | Simple, one connection string, one backup | Coupled, risky |
| **Schema-per-service** (recommended) | Logical isolation, one backup, cross-schema joins possible, easy rollback | Still one physical DB |
| **DB-per-service** (future) | True isolation, independent scaling, different instance sizes | Connection pooling complexity, distributed transactions, backup orchestration |

### Schema Assignment

| Table | Current | Target Schema | Owner Service |
|-------|---------|---------------|---------------|
| `tenants` | public | `platform` | platform-core |
| `users` | public | `platform` | platform-core |
| `team_members` | public | `platform` | platform-core |
| `billing_transactions` | public | `platform` | platform-core |
| `api_keys` | public | `platform` | platform-core |
| `batches` | public | `battery` | battery-api |
| `passports` | public | `battery` | battery-api |
| `passport_events` | public | `battery` | battery-api |
| `scan_events` | public | `battery` | battery-api |
| `epr_certificates` | public | `battery` | battery-api |
| `textile_lots` | public | `textile` | textile-api |
| `supply_chain_events` | public | `textile` | textile-api |
| `dye_batches` | public | `textile` | textile-api |

### Cross-Schema Queries

Services should query their own schema by default. Platform-core owns `tenants` and `users`, so battery-api and textile-api will need **read access** to `platform.users` for JWT validation.

Use PostgreSQL `GRANT`:

```sql
GRANT USAGE ON SCHEMA platform TO battery_api_user;
GRANT SELECT ON platform.tenants, platform.users TO battery_api_user;
```

## Migration Path

### Phase 1: Schema Separation (P0 — Do Next)

1. Add `search_path` to each service's database connection:
   - `platform-core`: `SET search_path TO platform, public`
   - `battery-api`: `SET search_path TO battery, platform, public`
   - `textile-api`: `SET search_path TO textile, platform, public`

2. Create new migrations that move tables into schemas:
   ```sql
   CREATE SCHEMA IF NOT EXISTS platform;
   CREATE SCHEMA IF NOT EXISTS battery;
   CREATE SCHEMA IF NOT EXISTS textile;

   ALTER TABLE tenants SET SCHEMA platform;
   ALTER TABLE batches SET SCHEMA battery;
   -- etc.
   ```

3. Update each service's repository layer to use explicit schema prefixes or rely on `search_path`.

4. Run migrations from a **dedicated migration service** (not battery-api) to avoid ownership confusion.

### Phase 2: Row-Level Security (P1)

Add RLS policies so that even within a schema, services can only see their own rows:

```sql
ALTER TABLE platform.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.tenants
  USING (product_type = current_setting('app.current_product', true));
```

### Phase 3: Physical Database Split (P2 — Post-PMF)

When battery and textile have different scaling needs:

1. Create separate RDS/Supabase instances for `platform`, `battery`, `textile`
2. Use **logical replication** or **pg_dump/pg_restore** to migrate schemas
3. Update connection strings per service
4. Replace cross-schema joins with **service-to-service API calls** or a **read replica** of platform data

## Immediate Action Items

1. **Create a `migrations` package** at the monorepo root that all services depend on, instead of copying migrations into each service
2. **Add `search_path` support** to `internal/db/postgres.go` in each service
3. **Write migration `000055_schema_per_service.up.sql`** that creates schemas and moves tables
4. **Update repository queries** to be schema-aware (explicit schema or search_path)

## Risks

- **Downtime**: Moving tables between schemas requires brief locks. Plan for maintenance window.
- **Code drift**: Until all repos are updated, some queries may fail if they assume `public` schema.
- **Backup**: `pg_dump` captures all schemas; no change needed for backups.
