# Magic Link Validation Error - Root Cause Analysis & Fix Plan

## Problem Summary

**Issue**: Magic link validation fails with 500 Internal Server Error when accessing `/api/v1/passport/{uuid}/action-info`

**Symptoms**:
- Frontend displays: "Access Denied – Failed to validate magic link"
- Backend returns HTTP 500 from the action-info endpoint
- No error-level logs, only INFO-level HTTP request logs
- Error occurs when fetching magic link token from database

## Root Cause Analysis

### 1. **Insufficient Error Logging** (Primary Issue)

In [`backend/internal/handlers/magic_link_handlers.go`](../backend/internal/handlers/magic_link_handlers.go), three critical handlers have inadequate error logging:

#### GetPassportForAction (Line 542-544)
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```
**Problem**: The actual database error is not logged, making diagnosis impossible.

#### TransitionWithMagicLink (Line 295-299)
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    slog.Error("Failed to fetch magic link token", "error", err)
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```
**Problem**: While this logs the error, it doesn't include critical context like tokenHash, passportID, or email.

#### UpdateSoHWithMagicLink (Line 655-658)
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```
**Problem**: No error logging at all.

### 2. **Potential Database Schema Mismatch**

The [`GetMagicLinkTokenByHash`](../backend/internal/repository/magic_link.go:57-101) method queries the `requires_otp` column (added in migration 000049):

```go
query := `SELECT passport_id, email, role, action, expires_at, used_at,
                 COALESCE(requires_otp, false)
          FROM magic_link_tokens
          WHERE token_hash = $1`
```

**Fallback Logic**: The code includes a fallback for missing `requires_otp` column (lines 73-92), but if the deployed backend doesn't have this code, it will fail.

**Migration 000049** (`backend/internal/db/migrations/000049_magic_link_otp.up.sql`):
```sql
ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS requires_otp   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;
```

### 3. **Possible Scenarios**

1. **Schema Drift**: Production database missing migration 000049
2. **Stale Deployment**: Backend running old code without the `isUndefinedColumnError` fallback
3. **Database Connection Issue**: Transient DB errors not being logged properly
4. **Token Hash Mismatch**: Token hash computation differs between request and storage

## Solution Plan

### Phase 1: Enhanced Error Logging (Immediate)

Add comprehensive error logging to all three handlers to capture:
- The actual database error message
- Token hash (first 8 chars for security)
- Passport UUID
- Request context (IP, user agent)
- Timestamp

### Phase 2: Database Verification

Create a verification script to check:
1. Migration 000049 is applied
2. `requires_otp` column exists on `magic_link_tokens` table
3. Sample token records can be queried successfully

### Phase 3: Deployment & Testing

1. Deploy enhanced logging to production
2. Reproduce the error with a test magic link
3. Analyze detailed error logs to confirm root cause
4. Apply appropriate fix based on findings

## Detailed Fix Implementation

### Fix 1: Add Error Logging to GetPassportForAction

**Location**: [`backend/internal/handlers/magic_link_handlers.go:542`](../backend/internal/handlers/magic_link_handlers.go:542)

**Before**:
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

**After**:
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    slog.Error("Failed to fetch magic link token from database",
        "error", err,
        "token_hash_prefix", tokenHash[:min(8, len(tokenHash))],
        "passport_id", passportID,
        "endpoint", "GetPassportForAction",
        "remote_addr", r.RemoteAddr,
    )
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

### Fix 2: Enhance Error Logging in TransitionWithMagicLink

**Location**: [`backend/internal/handlers/magic_link_handlers.go:295`](../backend/internal/handlers/magic_link_handlers.go:295)

**Before**:
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    slog.Error("Failed to fetch magic link token", "error", err)
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

**After**:
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    slog.Error("Failed to fetch magic link token from database",
        "error", err,
        "token_hash_prefix", tokenHash[:min(8, len(tokenHash))],
        "passport_id", passportID,
        "endpoint", "TransitionWithMagicLink",
        "remote_addr", r.RemoteAddr,
    )
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

### Fix 3: Add Error Logging to UpdateSoHWithMagicLink

**Location**: [`backend/internal/handlers/magic_link_handlers.go:655`](../backend/internal/handlers/magic_link_handlers.go:655)

**Before**:
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

**After**:
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    slog.Error("Failed to fetch magic link token from database",
        "error", err,
        "token_hash_prefix", tokenHash[:min(8, len(tokenHash))],
        "passport_id", passportID,
        "endpoint", "UpdateSoHWithMagicLink",
        "remote_addr", r.RemoteAddr,
    )
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

### Fix 4: Enhanced Repository Error Context

**Location**: [`backend/internal/repository/magic_link.go:97`](../backend/internal/repository/magic_link.go:97)

**Enhancement**: Add more context to the error message:

```go
if err != nil {
    return nil, fmt.Errorf("failed to fetch magic link token (hash_prefix=%s): %w", 
        tokenHash[:min(8, len(tokenHash))], err)
}
```

## Database Migration Verification

### Check Migration Status

```sql
-- Check if migration 000049 is applied
SELECT version, dirty 
FROM schema_migrations 
WHERE version >= 49 
ORDER BY version DESC 
LIMIT 5;

-- Verify requires_otp column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'magic_link_tokens'
  AND column_name IN ('requires_otp', 'last_resent_at');

-- Test query that matches the code
SELECT passport_id, email, role, action, expires_at, used_at,
       COALESCE(requires_otp, false) as requires_otp
FROM magic_link_tokens
LIMIT 1;
```

### Expected Results

1. Migration 000049 should be present and not dirty
2. `requires_otp` column should exist as BOOLEAN with DEFAULT FALSE
3. `last_resent_at` column should exist as TIMESTAMPTZ
4. Test query should execute without errors

## Deployment Checklist

### Pre-Deployment

- [ ] Review all code changes
- [ ] Verify migration 000049 exists in production database
- [ ] Check current backend version/commit hash
- [ ] Backup current logs for comparison
- [ ] Prepare rollback plan

### Deployment Steps

1. [ ] Deploy enhanced logging code to production
2. [ ] Verify deployment successful (check version endpoint)
3. [ ] Monitor logs for any startup errors
4. [ ] Wait 2-3 minutes for service stabilization

### Post-Deployment Testing

1. [ ] Generate a new magic link for a test passport
2. [ ] Access the magic link URL in browser
3. [ ] Check browser network tab for response
4. [ ] Review backend logs for detailed error information
5. [ ] Document the actual error message found

### Expected Outcomes

After deploying enhanced logging, you should see one of these scenarios:

**Scenario A: Schema Mismatch**
```
ERROR: column "requires_otp" does not exist
```
**Fix**: Apply migration 000049 to production database

**Scenario B: Token Not Found**
```
No error, but record is nil
```
**Fix**: Investigate token generation/storage logic

**Scenario C: Database Connection Issue**
```
ERROR: connection refused / timeout
```
**Fix**: Check database connectivity and credentials

**Scenario D: Other Database Error**
```
ERROR: [specific database error]
```
**Fix**: Address the specific error based on message

## Testing After Fix

### Manual Test Flow

1. **Request Magic Link**:
   ```bash
   curl -X POST https://api.example.com/api/v1/auth/magic-link \
     -H "Content-Type: application/json" \
     -d '{
       "passport_id": "test-uuid",
       "email": "test@example.com",
       "role": "TECHNICIAN",
       "action": "INSTALL"
     }'
   ```

2. **Access Action Page**:
   ```bash
   curl -X GET "https://api.example.com/api/v1/passport/{uuid}/action-info?token={token}"
   ```

3. **Check Logs**:
   ```bash
   # Look for detailed error logs
   grep "Failed to fetch magic link token" logs/app.log
   ```

### Success Criteria

- [ ] Action page loads without 500 error
- [ ] If error occurs, detailed error message is logged
- [ ] Error logs include token hash prefix, passport ID, and endpoint
- [ ] Root cause is identified from error logs

## Monitoring & Alerts

### Key Metrics to Watch

1. **Error Rate**: Monitor 500 errors on `/api/v1/passport/*/action-info`
2. **Database Query Performance**: Track `GetMagicLinkTokenByHash` execution time
3. **Magic Link Success Rate**: Track successful vs failed validations

### Log Queries

```bash
# Find all magic link validation errors
grep "Failed to fetch magic link token from database" logs/app.log | jq .

# Count errors by endpoint
grep "Failed to fetch magic link token" logs/app.log | jq -r .endpoint | sort | uniq -c

# Extract unique error messages
grep "Failed to fetch magic link token" logs/app.log | jq -r .error | sort | uniq
```

## Rollback Plan

If the enhanced logging causes issues:

1. Revert to previous deployment
2. The logging changes are additive and should not break functionality
3. If needed, remove the enhanced logging and deploy minimal fix

## Next Steps

1. **Immediate**: Deploy enhanced error logging
2. **Within 1 hour**: Reproduce error and analyze logs
3. **Within 4 hours**: Apply appropriate fix based on root cause
4. **Within 24 hours**: Verify fix in production and document resolution

## Related Files

- [`backend/internal/handlers/magic_link_handlers.go`](../backend/internal/handlers/magic_link_handlers.go) - Main handlers
- [`backend/internal/repository/magic_link.go`](../backend/internal/repository/magic_link.go) - Database queries
- [`backend/internal/db/migrations/000049_magic_link_otp.up.sql`](../backend/internal/db/migrations/000049_magic_link_otp.up.sql) - Schema migration
- [`backend/internal/models/magic_link.go`](../backend/internal/models/magic_link.go) - Data models

## Additional Notes

- The `isUndefinedColumnError` helper (line 279-290 in magic_link.go) provides backward compatibility
- SOH_UPDATE tokens are multi-use and have different validation logic
- OTP-required actions (RECYCLE, RECALL) have additional validation steps
- Rate limiting is applied to SOH updates (1 per minute per token)