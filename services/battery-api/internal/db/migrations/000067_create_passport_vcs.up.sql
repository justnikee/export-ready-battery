-- Migration 067: W3C Verifiable Credentials scaffold for passport data
--
-- Stores cryptographically signed VC payloads per passport.
-- Real signing (DID + LD-Proof) is a future phase; this table scaffolds the data model.

CREATE TABLE IF NOT EXISTS passport_vcs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id     uuid NOT NULL REFERENCES passports(uuid),
    vc_type         text NOT NULL DEFAULT 'BatteryPassportCredential',
    issuer_did      text NOT NULL DEFAULT '',
    credential_subject jsonb NOT NULL DEFAULT '{}',
    proof           jsonb NOT NULL DEFAULT '{}',
    status          text NOT NULL DEFAULT 'draft', -- draft, issued, revoked
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_vcs_passport_id ON passport_vcs (passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_vcs_status ON passport_vcs (status);
