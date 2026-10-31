# ADR 033 — Activation gate and carbon screening labels

Date: 2026-10-31. Status: proposed for draft review.

## Decision

The battery activation gate should block only on fields currently required for the selected product category and market. EU carbon estimates from our calculator are screening aids, not certified Article 7 declarations or Commission carbon classes. India BIS CRS checks apply to portable sealed secondary cells/batteries; MoRTH traction checks apply to EV/LMT. The UI and API should agree on these categories and on EU/EEA establishment when deciding whether an EU authorized representative is needed.

Keep generated reports and sales copy explicit about these limits. A draft PR is suitable for technical review, but production compliance wording needs a current legal review before merge.

## Primary references checked 31 Oct 2026

- Consolidated EU Batteries Regulation: https://eur-lex.europa.eu/eli/reg/2023/1542/2026-08-13/eng/
- EU due-diligence date amendment: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025R1561
- BIS product certification: https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en
- MoRTH traction-battery AIS-156 standard: https://morth.nic.in/sites/default/files/ASI/AIS-156.pdf

These sources support the category distinctions; they do not certify this product's full regulatory interpretation.
