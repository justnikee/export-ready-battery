# Magic Link Error Logging - Implementation Plan

## Overview

This document provides detailed implementation instructions for adding comprehensive error logging to the magic link validation handlers. The changes are designed to be minimal, safe, and provide maximum diagnostic value.

## Implementation Strategy

### Principles

1. **Non-Breaking**: All changes are additive - no existing functionality is modified
2. **Secure**: Token hashes are truncated to prevent exposure in logs
3. **Contextual**: Each error log includes relevant request context
4. **Consistent**: All three handlers use the same logging pattern

### Files to Modify

1. [`backend/internal/handlers/magic_link_handlers.go`](../backend/internal/handlers/magic_link_handlers.go) - Add error logging to 3 handlers
2. [`backend/internal/repository/magic_link.go`](../backend/internal/repository/magic_link.go) - Enhance error context (optional)

## Detailed Implementation

### Change 1: GetPassportForAction Handler

**File**: `backend/internal/handlers/magic_link_handlers.go`  
**Line**: 542-544  
**Function**: `GetPassportForAction`

#### Current Code
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

#### Updated Code
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    // Enhanced error logging for diagnostics
    tokenPrefix := tokenHash
    if len(tokenHash) > 8 {
        tokenPrefix = tokenHash[:8]
    }
    slog.Error("Failed to fetch magic link token from database",
        "error", err,
        "token_hash_prefix", tokenPrefix,
        "passport_id", passportID,
        "endpoint", "GetPassportForAction",
        "remote_addr", r.RemoteAddr,
    )
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

#### Explanation
- Truncates token hash to first 8 characters for security
- Includes passport UUID for correlation
- Adds endpoint name for filtering logs
- Captures remote address for security analysis
- Preserves original error response to client

---

### Change 2: TransitionWithMagicLink Handler

**File**: `backend/internal/handlers/magic_link_handlers.go`  
**Line**: 295-299  
**Function**: `TransitionWithMagicLink`

#### Current Code
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    slog.Error("Failed to fetch magic link token", "error", err)
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

#### Updated Code
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    // Enhanced error logging with full context
    tokenPrefix := tokenHash
    if len(tokenHash) > 8 {
        tokenPrefix = tokenHash[:8]
    }
    slog.Error("Failed to fetch magic link token from database",
        "error", err,
        "token_hash_prefix", tokenPrefix,
        "passport_id", passportID,
        "endpoint", "TransitionWithMagicLink",
        "remote_addr", r.RemoteAddr,
    )
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

#### Explanation
- Enhances existing error log with additional context
- Maintains consistency with other handlers
- Adds passport ID and endpoint for better filtering

---

### Change 3: UpdateSoHWithMagicLink Handler

**File**: `backend/internal/handlers/magic_link_handlers.go`  
**Line**: 655-658  
**Function**: `UpdateSoHWithMagicLink`

#### Current Code
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

#### Updated Code
```go
record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
if err != nil {
    // Enhanced error logging for SoH endpoint
    tokenPrefix := tokenHash
    if len(tokenHash) > 8 {
        tokenPrefix = tokenHash[:8]
    }
    slog.Error("Failed to fetch magic link token from database",
        "error", err,
        "token_hash_prefix", tokenPrefix,
        "passport_id", passportID,
        "endpoint", "UpdateSoHWithMagicLink",
        "remote_addr", r.RemoteAddr,
    )
    respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
    return
}
```

#### Explanation
- Adds missing error logging (previously had none)
- Follows same pattern as other handlers
- Critical for diagnosing SoH update failures

---

### Optional Change 4: Repository Error Enhancement

**File**: `backend/internal/repository/magic_link.go`  
**Line**: 97-99  
**Function**: `GetMagicLinkTokenByHash`

#### Current Code
```go
if err != nil {
    return nil, fmt.Errorf("failed to fetch magic link token: %w", err)
}
```

#### Updated Code
```go
if err != nil {
    tokenPrefix := tokenHash
    if len(tokenHash) > 8 {
        tokenPrefix = tokenHash[:8]
    }
    return nil, fmt.Errorf("failed to fetch magic link token (hash_prefix=%s): %w", tokenPrefix, err)
}
```

#### Explanation
- Adds token hash prefix to repository error
- Helps correlate repository errors with handler logs
- Optional but recommended for complete traceability

---

## Testing Plan

### Unit Tests

No new unit tests required - these are logging-only changes. However, you can verify:

```go
// Test that error logging doesn't panic with short token hashes
func TestErrorLoggingWithShortToken(t *testing.T) {
    tokenHash := "abc"
    tokenPrefix := tokenHash
    if len(tokenHash) > 8 {
        tokenPrefix = tokenHash[:8]
    }
    assert.Equal(t, "abc", tokenPrefix)
}

// Test that error logging truncates long token hashes
func TestErrorLoggingWithLongToken(t *testing.T) {
    tokenHash := "abcdefghijklmnop"
    tokenPrefix := tokenHash
    if len(tokenHash) > 8 {
        tokenPrefix = tokenHash[:8]
    }
    assert.Equal(t, "abcdefgh", tokenPrefix)
}
```

### Integration Testing

1. **Deploy to Staging**
   ```bash
   # Deploy the changes
   git checkout -b fix/magic-link-error-logging
   # Apply changes
   git commit -m "Add enhanced error logging to magic link handlers"
   git push origin fix/magic-link-error-logging
   # Deploy to staging
   ```

2. **Generate Test Magic Link**
   ```bash
   curl -X POST https://staging-api.example.com/api/v1/auth/magic-link \
     -H "Content-Type: application/json" \
     -d '{
       "passport_id": "test-uuid",
       "email": "test@example.com",
       "role": "TECHNICIAN",
       "action": "INSTALL"
     }'
   ```

3. **Trigger Error Scenario**
   - Access magic link with invalid token
   - Access magic link after database migration rollback
   - Access magic link with expired token

4. **Verify Logs**
   ```bash
   # Check for enhanced error logs
   kubectl logs -f deployment/backend | grep "Failed to fetch magic link token from database"
   
   # Or using log aggregation
   curl "https://logs.example.com/api/search?q=Failed+to+fetch+magic+link+token"
   ```

### Expected Log Output

#### Success Case (No Error)
```json
{
  "level": "INFO",
  "msg": "HTTP request",
  "method": "GET",
  "path": "/api/v1/passport/abc-123/action-info",
  "status": 200
}
```

#### Error Case (With Enhanced Logging)
```json
{
  "level": "ERROR",
  "msg": "Failed to fetch magic link token from database",
  "error": "failed to fetch magic link token: column \"requires_otp\" does not exist",
  "token_hash_prefix": "a1b2c3d4",
  "passport_id": "abc-123-def-456",
  "endpoint": "GetPassportForAction",
  "remote_addr": "192.168.1.100:54321",
  "time": "2026-04-29T18:00:00Z"
}
```

---

## Deployment Procedure

### Pre-Deployment Checklist

- [ ] Code review completed
- [ ] Changes tested in local environment
- [ ] Database schema verified (see [Schema Verification Guide](./MAGIC_LINK_SCHEMA_VERIFICATION.md))
- [ ] Staging deployment successful
- [ ] Log aggregation system ready to capture new logs

### Deployment Steps

1. **Create Feature Branch**
   ```bash
   git checkout -b fix/magic-link-error-logging
   ```

2. **Apply Changes**
   - Modify `backend/internal/handlers/magic_link_handlers.go`
   - Optionally modify `backend/internal/repository/magic_link.go`

3. **Build and Test**
   ```bash
   cd backend
   go build ./cmd/server
   go test ./internal/handlers -v
   ```

4. **Commit Changes**
   ```bash
   git add backend/internal/handlers/magic_link_handlers.go
   git commit -m "feat: add enhanced error logging to magic link handlers

   - Add detailed error logging to GetPassportForAction
   - Add detailed error logging to TransitionWithMagicLink
   - Add detailed error logging to UpdateSoHWithMagicLink
   - Include token hash prefix, passport ID, and endpoint in logs
   - Truncate token hash to 8 chars for security
   
   This will help diagnose the 500 error when validating magic links
   by capturing the actual database error message."
   ```

5. **Push and Create PR**
   ```bash
   git push origin fix/magic-link-error-logging
   # Create PR in GitHub
   ```

6. **Deploy to Staging**
   ```bash
   # Via CI/CD or manual deployment
   kubectl set image deployment/backend backend=registry.example.com/backend:fix-magic-link-error-logging
   ```

7. **Verify Staging**
   - Generate test magic link
   - Access action page
   - Check logs for enhanced error messages

8. **Deploy to Production**
   ```bash
   # Merge PR and deploy
   git checkout main
   git pull origin main
   # Deploy via CI/CD
   ```

### Post-Deployment Verification

1. **Monitor Error Logs**
   ```bash
   # Watch for new error format
   kubectl logs -f deployment/backend --tail=100 | grep "Failed to fetch magic link token"
   ```

2. **Reproduce Original Issue**
   - Use the same magic link that was failing
   - Check if detailed error appears in logs
   - Document the actual error message

3. **Analyze Root Cause**
   Based on the error message, determine next steps:
   - If "column requires_otp does not exist" → Apply migration 000049
   - If "no rows in result set" → Investigate token generation
   - If connection error → Check database connectivity
   - Other errors → Investigate based on specific message

---

## Rollback Plan

If the changes cause issues:

### Quick Rollback
```bash
# Revert to previous deployment
kubectl rollout undo deployment/backend

# Or deploy previous version
kubectl set image deployment/backend backend=registry.example.com/backend:previous-version
```

### Code Rollback
```bash
git revert <commit-hash>
git push origin main
# Redeploy
```

### Risk Assessment

**Risk Level**: **LOW**

**Reasoning**:
- Changes are purely additive (logging only)
- No business logic modified
- No database schema changes
- No API contract changes
- Error responses to clients unchanged

**Potential Issues**:
- Increased log volume (minimal - only on errors)
- Slightly increased memory for string operations (negligible)

---

## Monitoring and Alerts

### Key Metrics

1. **Error Rate**
   ```
   rate(http_requests_total{status="500", path=~"/api/v1/passport/.*/action-info"}[5m])
   ```

2. **Magic Link Validation Failures**
   ```
   count_over_time({msg="Failed to fetch magic link token from database"}[1h])
   ```

3. **Error Types**
   ```
   sum by (error) (count_over_time({msg="Failed to fetch magic link token from database"}[1h]))
   ```

### Alert Rules

```yaml
# Prometheus alert rule
- alert: MagicLinkValidationFailures
  expr: rate(http_requests_total{status="500", path=~"/api/v1/passport/.*/action-info"}[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High rate of magic link validation failures"
    description: "{{ $value }} failures per second in the last 5 minutes"
```

---

## Log Analysis Queries

### Find All Magic Link Errors
```bash
# Using grep
grep "Failed to fetch magic link token from database" logs/app.log

# Using jq for JSON logs
cat logs/app.log | jq 'select(.msg == "Failed to fetch magic link token from database")'
```

### Group Errors by Type
```bash
cat logs/app.log | \
  jq -r 'select(.msg == "Failed to fetch magic link token from database") | .error' | \
  sort | uniq -c | sort -rn
```

### Find Errors for Specific Passport
```bash
cat logs/app.log | \
  jq 'select(.msg == "Failed to fetch magic link token from database" and .passport_id == "abc-123")'
```

### Count Errors by Endpoint
```bash
cat logs/app.log | \
  jq -r 'select(.msg == "Failed to fetch magic link token from database") | .endpoint' | \
  sort | uniq -c
```

---

## Success Criteria

The implementation is successful when:

1. ✅ All three handlers have enhanced error logging
2. ✅ Error logs include token hash prefix (8 chars)
3. ✅ Error logs include passport ID
4. ✅ Error logs include endpoint name
5. ✅ Error logs include remote address
6. ✅ Actual database error is captured in logs
7. ✅ No breaking changes to existing functionality
8. ✅ Staging deployment successful
9. ✅ Production deployment successful
10. ✅ Root cause identified from enhanced logs

---

## Next Steps After Implementation

Once the enhanced logging is deployed and the root cause is identified:

### If Schema Issue (requires_otp missing)
1. Apply migration 000049 to production
2. Verify column exists
3. Test magic link validation
4. Monitor for 24 hours

### If Token Generation Issue
1. Review token creation logic
2. Check token hash computation
3. Verify token storage
4. Add additional logging to token creation

### If Database Connection Issue
1. Check connection pool settings
2. Verify database credentials
3. Review network connectivity
4. Check for connection leaks

### If Other Issue
1. Analyze specific error message
2. Create targeted fix
3. Test in staging
4. Deploy to production

---

## Related Documentation

- [Magic Link Validation Fix Plan](./MAGIC_LINK_VALIDATION_FIX.md) - Overall fix strategy
- [Schema Verification Guide](./MAGIC_LINK_SCHEMA_VERIFICATION.md) - Database verification
- [Developer Onboarding](./DEVELOPER_ONBOARDING.md) - General development guide

---

## Support and Questions

For questions or issues during implementation:

1. Review this implementation plan
2. Check the [troubleshooting section](./MAGIC_LINK_VALIDATION_FIX.md#troubleshooting)
3. Consult the team lead
4. Document any deviations from this plan