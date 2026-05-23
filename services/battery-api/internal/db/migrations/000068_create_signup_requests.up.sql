-- Migration 068: Signup request gating table
--
-- Stores qualification form submissions for manual/auto review before account creation.
-- Prevents spam, competitor reconnaissance, and unqualified signups.

CREATE TABLE IF NOT EXISTS signup_requests (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name      text NOT NULL,
    email             text NOT NULL,
    gstin             text,
    iec_code          text,
    product_type      text NOT NULL CHECK (product_type IN ('battery', 'textile', 'both')),
    estimated_batches text CHECK (estimated_batches IN ('<5', '5-20', '20-50', '50+')),
    market_region     text CHECK (market_region IN ('eu', 'india', 'both', 'other')),
    phone             text,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    rejection_reason  text,
    reviewed_at       timestamptz,
    reviewed_by       uuid,
    created_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests (status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_requests (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_signup_requests_unique_email ON signup_requests (email) WHERE status IN ('pending', 'approved', 'auto_approved');
