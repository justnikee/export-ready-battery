-- Revert: Narrow carbon_performance_class back to A-E

ALTER TABLE public.batches
    DROP CONSTRAINT IF EXISTS batches_carbon_performance_class_check,
    ADD CONSTRAINT batches_carbon_performance_class_check
        CHECK (carbon_performance_class IN ('A', 'B', 'C', 'D', 'E'));

COMMENT ON COLUMN public.batches.carbon_performance_class IS 'Carbon footprint class A-E per Art 7(4); mandatory labelling from Aug 2025 (EV) / Feb 2026 (industrial)';
