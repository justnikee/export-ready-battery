-- Revert: restore original (incorrect) FK if needed for rollback testing only.
ALTER TABLE public.audit_chain_alerts
  DROP CONSTRAINT IF EXISTS audit_chain_alerts_passport_id_fkey;
