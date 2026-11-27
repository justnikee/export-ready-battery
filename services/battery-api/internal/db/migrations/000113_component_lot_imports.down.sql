-- Remove the component lot import schema in dependency order.
DROP TABLE public.lot_assignments;
DROP TABLE public.component_lots;
DROP TABLE public.component_lot_imports;
DROP INDEX public.passports_batch_traceability_key;
DROP INDEX public.batches_tenant_traceability_key;
