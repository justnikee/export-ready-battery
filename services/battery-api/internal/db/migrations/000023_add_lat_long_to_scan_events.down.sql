-- Remove latitude and longitude columns from scan_events
DROP INDEX IF EXISTS idx_scan_events_coordinates;

ALTER TABLE public.scan_events
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;
