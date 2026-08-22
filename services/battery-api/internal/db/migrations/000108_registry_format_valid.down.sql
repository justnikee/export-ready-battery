UPDATE public.registry_verifications
   SET status = 'verified',
       trust_tier = 'registry_verified',
       updated_at = NOW()
 WHERE status = 'format_valid'
   AND trust_tier = 'format_valid';

ALTER TABLE public.registry_verifications
    DROP CONSTRAINT IF EXISTS registry_verifications_status_check;

ALTER TABLE public.registry_verifications
    ADD CONSTRAINT registry_verifications_status_check
    CHECK (status IN ('pending','verified','failed','error','not_found'));

ALTER TABLE public.registry_verifications
    DROP CONSTRAINT IF EXISTS registry_verifications_trust_tier_check;

ALTER TABLE public.registry_verifications
    ADD CONSTRAINT registry_verifications_trust_tier_check
    CHECK (trust_tier IN ('self_declared','registry_verified','official_api'));
