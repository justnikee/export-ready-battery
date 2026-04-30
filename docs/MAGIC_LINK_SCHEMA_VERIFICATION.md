# Magic Link Schema Verification Guide

## Purpose

This guide provides SQL scripts and procedures to verify that the magic link database schema is correctly configured in production, specifically checking for migration 000049 which adds the `requires_otp` column.

## Quick Verification Script

Run this SQL script in your production database to verify the schema:

```sql
-- ============================================================================
-- Magic Link Schema Verification Script
-- ============================================================================

-- 1. Check Migration Status
-- Expected: Migration 000049 should be present and not dirty
SELECT 
    version,
    dirty,
    CASE 
        WHEN version >= 49 THEN '✓ Migration 000049 applied'
        ELSE '✗ Migration 000049 NOT applied'
    END as status
FROM schema_migrations 
WHERE version >= 49 
ORDER BY version DESC 
LIMIT 5;

-- 2. Verify magic_link_tokens table structure
-- Expected: Table should exist with all required columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'magic_link_tokens'
ORDER BY ordinal_position;

-- 3. Check for requires_otp column specifically
-- Expected: Column should exist as BOOLEAN with DEFAULT FALSE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'requires_otp' AND data_type = 'boolean' 
        THEN '✓ Column exists with correct type'
        ELSE '✗ Column missing or wrong type'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'magic_link_tokens'
  AND column_name IN ('requires_otp', 'last_resent_at');

-- 4. Test the actual query used by the application
-- Expected: Query should execute without errors
SELECT 
    passport_id, 
    email, 
    role, 
    action, 
    expires_at, 
    used_at,
    COALESCE(requires_otp, false) as requires_otp
FROM magic_link_tokens
LIMIT 1;

-- 5. Check magic_link_otp table (Phase 7)
-- Expected: Table should exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'magic_link_otp'
ORDER BY ordinal_position;

-- 6. Verify indexes
-- Expected: All required indexes should exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('magic_link_tokens', 'magic_link_otp')
ORDER BY tablename, indexname;

-- 7. Count existing magic link tokens
-- Expected: Should return count without errors
SELECT 
    COUNT(*) as total_tokens,
    COUNT(CASE WHEN used_at IS NULL THEN 1 END) as unused_tokens,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_tokens,
    COUNT(CASE WHEN requires_otp = true THEN 1 END) as otp_required_tokens
FROM magic_link_tokens;

-- 8. Sample token data (if any exists)
-- Expected: Should show token structure
SELECT 
    id,
    passport_id,
    email,
    role,
    action,
    requires_otp,
    used_at IS NOT NULL as is_used,
    expires_at > NOW() as is_valid,
    created_at
FROM magic_link_tokens
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Results

### 1. Migration Status
```
 version | dirty |           status            
---------+-------+-----------------------------
      49 | f     | ✓ Migration 000049 applied
```

### 2. Table Structure
The `magic_link_tokens` table should have these columns:
- `id` (uuid, PRIMARY KEY)
- `passport_id` (uuid, NOT NULL)
- `email` (text, NOT NULL)
- `role` (varchar(20), NOT NULL)
- `action` (varchar(20))
- `token_hash` (text, NOT NULL, UNIQUE)
- `expires_at` (timestamptz, NOT NULL)
- `used_at` (timestamptz)
- `created_at` (timestamptz, DEFAULT NOW())
- `requires_otp` (boolean, DEFAULT FALSE) ← **Critical for fix**
- `last_resent_at` (timestamptz)

### 3. requires_otp Column
```
 column_name  | data_type | is_nullable | column_default |              status              
--------------+-----------+-------------+----------------+----------------------------------
 requires_otp | boolean   | NO          | false          | ✓ Column exists with correct type
```

### 4. Test Query
Should return rows without error (or empty result if no tokens exist).

## Troubleshooting

### Issue: Migration 000049 Not Found

**Symptoms**:
```
 version | dirty | status
---------+-------+--------
      48 | f     | ✗ Migration 000049 NOT applied
```

**Solution**:
```bash
# Apply the migration
cd backend
go run cmd/migrate/main.go up
```

Or manually apply the migration:
```sql
-- From backend/internal/db/migrations/000049_magic_link_otp.up.sql
CREATE TABLE IF NOT EXISTS public.magic_link_otp (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    magic_link_token_hash TEXT        NOT NULL,
    otp_hash              TEXT        NOT NULL,
    attempt_count         INTEGER     NOT NULL DEFAULT 0,
    max_attempts          INTEGER     NOT NULL DEFAULT 3,
    last_resent_at        TIMESTAMPTZ,
    resend_count          INTEGER     NOT NULL DEFAULT 0,
    max_resends           INTEGER     NOT NULL DEFAULT 3,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at               TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_magic_link_otp_token_hash
    ON public.magic_link_otp(magic_link_token_hash);

ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS requires_otp   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;

-- Update schema_migrations
INSERT INTO schema_migrations (version, dirty) VALUES (49, false);
```

### Issue: Column "requires_otp" Does Not Exist

**Symptoms**:
```
ERROR: column "requires_otp" does not exist
```

**Solution**:
```sql
-- Add the missing column
ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS requires_otp BOOLEAN NOT NULL DEFAULT FALSE;
```

### Issue: Query Fails with Other Error

**Symptoms**:
```
ERROR: [some other database error]
```

**Solution**:
1. Check database connection
2. Verify user permissions
3. Check for table locks
4. Review full error message in logs

## Manual Testing Procedure

### Step 1: Connect to Production Database

```bash
# Using psql
psql -h <host> -U <user> -d <database>

# Or using connection string
psql "postgresql://user:password@host:5432/database?sslmode=require"
```

### Step 2: Run Verification Script

Copy and paste the verification script from above into the psql prompt.

### Step 3: Review Results

Check each section's output:
- ✓ All checks should pass
- ✗ Any failures indicate schema issues

### Step 4: Document Findings

Record the results:
```
Date: [YYYY-MM-DD HH:MM:SS]
Database: [production/staging]
Migration 000049: [Applied/Not Applied]
requires_otp column: [Exists/Missing]
Test query: [Success/Failed]
Notes: [Any additional observations]
```

## Automated Verification Script

For automated checks, you can use this bash script:

```bash
#!/bin/bash
# verify_magic_link_schema.sh

DB_URL="${DATABASE_URL}"

if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

echo "Verifying magic link schema..."

# Check migration status
echo "1. Checking migration 000049..."
psql "$DB_URL" -c "SELECT version, dirty FROM schema_migrations WHERE version >= 49 ORDER BY version DESC LIMIT 1;" -t

# Check requires_otp column
echo "2. Checking requires_otp column..."
psql "$DB_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'magic_link_tokens' AND column_name = 'requires_otp';" -t

# Test query
echo "3. Testing application query..."
psql "$DB_URL" -c "SELECT COUNT(*) FROM magic_link_tokens WHERE COALESCE(requires_otp, false) = false;" -t

echo "Verification complete!"
```

Usage:
```bash
chmod +x verify_magic_link_schema.sh
export DATABASE_URL="postgresql://user:pass@host:5432/db"
./verify_magic_link_schema.sh
```

## Integration with CI/CD

Add this verification to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Verify Database Schema
  run: |
    psql $DATABASE_URL -c "SELECT version FROM schema_migrations WHERE version >= 49 LIMIT 1;"
    if [ $? -ne 0 ]; then
      echo "Migration 000049 not found!"
      exit 1
    fi
```

## Monitoring Queries

### Check for Failed Token Validations

```sql
-- This requires application logs to be stored in database
-- Adjust based on your logging infrastructure
SELECT 
    timestamp,
    message,
    error,
    token_hash_prefix,
    passport_id
FROM application_logs
WHERE message LIKE '%Failed to fetch magic link token%'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### Token Usage Statistics

```sql
-- Analyze token usage patterns
SELECT 
    action,
    COUNT(*) as total_tokens,
    COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used_tokens,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_tokens,
    COUNT(CASE WHEN requires_otp = true THEN 1 END) as otp_required,
    AVG(EXTRACT(EPOCH FROM (COALESCE(used_at, NOW()) - created_at))) as avg_time_to_use_seconds
FROM magic_link_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY total_tokens DESC;
```

## Related Documentation

- [Magic Link Validation Fix Plan](./MAGIC_LINK_VALIDATION_FIX.md)
- [Database Migration Guide](./DEVELOPER_ONBOARDING.md)
- [Deployment Checklist](./MAGIC_LINK_VALIDATION_FIX.md#deployment-checklist)

## Support

If verification fails or you encounter issues:

1. Review the error messages carefully
2. Check the [Troubleshooting](#troubleshooting) section
3. Consult the [Magic Link Validation Fix Plan](./MAGIC_LINK_VALIDATION_FIX.md)
4. Contact the backend team with verification results