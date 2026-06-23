-- Fix incorrect foreign key reference in audit_chain_alerts.
-- The passports table uses 'uuid' as its primary key column, not 'id'.
ALTER TABLE public.audit_chain_alerts
  DROP CONSTRAINT IF EXISTS audit_chain_alerts_passport_id_fkey;

ALTER TABLE public.audit_chain_alerts
  ADD CONSTRAINT audit_chain_alerts_passport_id_fkey
    FOREIGN KEY (passport_id) REFERENCES public.passports(uuid);
