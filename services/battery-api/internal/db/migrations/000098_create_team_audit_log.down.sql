-- Migration 098: Rollback team audit log table
--

DROP TABLE IF EXISTS public.team_audit_log;
