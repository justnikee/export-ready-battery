-- Create scan_events table for tracking QR code scans
CREATE TABLE public.scan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES public.passports(uuid) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    city VARCHAR(100),
    country VARCHAR(100),
    device_type VARCHAR(50),
    user_agent TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster passport lookups
CREATE INDEX idx_scan_events_passport_id ON public.scan_events(passport_id);

-- Index for faster recent scans queries (ordered by time)
CREATE INDEX idx_scan_events_scanned_at ON public.scan_events(scanned_at DESC);
