-- Add latitude and longitude columns to scan_events for map visualization
ALTER TABLE public.scan_events
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Create index for efficient geo queries
CREATE INDEX idx_scan_events_coordinates ON public.scan_events (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
