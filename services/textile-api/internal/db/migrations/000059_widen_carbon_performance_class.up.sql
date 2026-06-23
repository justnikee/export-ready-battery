-- Migration: Widen carbon_performance_class to accept A-G (matches calculator output)
-- The EU delegated act proposals include classes A-G; the DB constraint was previously A-E.

ALTER TABLE public.batches
    DROP CONSTRAINT IF EXISTS batches_carbon_performance_class_check,
    ADD CONSTRAINT batches_carbon_performance_class_check
        CHECK (carbon_performance_class IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

COMMENT ON COLUMN public.batches.carbon_performance_class IS 'Carbon footprint class A-G per EU Battery Regulation Art 7(4) and delegated act proposals';
