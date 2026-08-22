-- Format-only registry adapters (CPCB EPR regex, UN38.3 lab allowlist)
-- were stored as status=verified + trust_tier=registry_verified. That
-- overclaims portal/ledger confirmation. Allow format_valid and reclassify
-- existing CPCB/UN38 "verified" rows.

ALTER TABLE public.registry_verifications
    DROP CONSTRAINT IF EXISTS registry_verifications_status_check;

ALTER TABLE public.registry_verifications
    ADD CONSTRAINT registry_verifications_status_check
    CHECK (status IN ('pending','verified','failed','error','not_found','format_valid'));

ALTER TABLE public.registry_verifications
    DROP CONSTRAINT IF EXISTS registry_verifications_trust_tier_check;

ALTER TABLE public.registry_verifications
    ADD CONSTRAINT registry_verifications_trust_tier_check
    CHECK (trust_tier IN ('self_declared','format_valid','registry_verified','official_api'));

UPDATE public.registry_verifications
   SET status = 'format_valid',
       trust_tier = 'format_valid',
       updated_at = NOW()
 WHERE registry_type IN ('cpcb', 'un38_3')
   AND status = 'verified'
   AND trust_tier = 'registry_verified';
