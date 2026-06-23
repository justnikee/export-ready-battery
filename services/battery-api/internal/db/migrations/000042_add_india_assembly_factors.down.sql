-- Rollback: Remove India & additional carbon factors added in 000042
DELETE FROM public.carbon_factors
WHERE (category = 'ASSEMBLY' AND subcategory IN ('IN', 'CN', 'KR', 'DE', 'US', 'JP'))
   OR (category = 'ENERGY_MIX' AND subcategory IN (
       'GB', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'HU', 'CZ', 'RO', 'SK', 'FI', 'DK', 'NO', 'CH',
       'VN', 'MY', 'ID', 'TH', 'TW', 'AU',
       'MX', 'BR', 'ZA', 'TR',
       'GLOBAL'
   ));
