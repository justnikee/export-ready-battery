-- Migration 065 DOWN: Remove database-driven compliance rules

DROP INDEX IF EXISTS idx_compliance_rules_unique_active;
DROP INDEX IF EXISTS idx_compliance_rules_lookup;
DROP TABLE IF EXISTS compliance_rules;
