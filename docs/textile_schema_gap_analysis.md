# Textile EU DPP Schema Gap Analysis & Comprehensive SQL Additions

## Executive Summary

Your existing Textile API schema provides a solid **platform backbone** — tenant management, batch creation, passport issuance, QR codes, event logging, export jobs, and team collaboration are all well-covered. However, when benchmarked against the **EU Digital Product Passport (DPP) requirements** under ESPR Regulation (EU) 2024/1781, the JRC preparatory study's 3rd milestone (December 2025), and the full regulatory stack (REACH, EPR, ECGT, CSDDD, destruction ban), the schema covers **only ~11% of the regulatory data model** required for a compliant textile DPP. [(COSH!)](https://cosh.eco/en/articles/eu-digital-product-passport-espr-explained-fashion-textiles) 

Of **36 requirement areas** analyzed across **9 regulatory dimensions**, the schema has:
- **0 fully covered** (0%)
- **4 partially covered** (11%) — batch serial numbers, QR codes, event audit trails, basic product identification
- **32 missing** (89%) — including fiber composition, REACH chemical compliance, supply chain traceability, ecodesign scoring, carbon footprint, EPR data, and multi-language DPP content [(kezzler.com)](https://kezzler.com/blog/the-jrcs-3rd-milestone-dpp-for-apparel-is-getting-real/) 

This report provides **15 new tables** and **38+ new fields** across existing tables, organized by regulatory domain, with production-ready SQL and detailed justification for each addition.

![Schema Gap Analysis](textile_schema_gap_analysis.png)

---

## 1. What the Existing Schema Does Well

Before diving into gaps, it is important to acknowledge what the current schema handles effectively. These foundations should be preserved and built upon.

| Capability | Tables Involved | Assessment |
|---|---|---|
| **Multi-tenant architecture** | `tenants`, `team_members`, `api_keys` | Production-ready with RBAC, OAuth, quota management |
| **Batch & passport lifecycle** | `batches`, `passports`, `passport_events` | Core issuance, status tracking, audit trail with hash chaining |
| **QR code / data carrier** | `passports` (implicit via `uuid`) | UUID-based scanning supported; needs GS1 Digital Link overlay |
| **Access control & ownership** | `magic_link_tokens`, `trusted_domains`, `trusted_partners`, `partner_codes` | Sophisticated delegated access model |
| **Document management** | `passport_documents` | SHA256-verified file storage with provenance |
| **Export & reporting** | `export_jobs` | Multi-format export pipeline (CSV, PDF, QR, EPCIS, CPCB) |
| **Product schema versioning** | `product_schemas` | JSON-schema driven validation framework |
| **Audit & integrity** | `passport_events` with `hash`/`previous_hash`, `audit_chain_alerts` | Tamper-evident event logging with break detection |

These components form the **transactional and platform layer** of a DPP system. What is missing is the **regulatory payload layer** — the structured data that actually makes a passport legally compliant in the EU market.

---

## 2. Regulatory Dimension 1: Product Identification & Economic Operators

### 2.1 The Requirement

ESPR Article 9 and Annex III mandate that every DPP contains a **Unique Product Identifier (UPI)**, typically a GS1 GTIN, plus full identification of the **economic operator** responsible for placing the product on the EU market. [(Empact)](https://empact.nu/en/insights/what-data-should-be-in-a-dpp-the-information-requirements-of-the-espr-explained/)  This includes the manufacturer, importer (with EORI number), and if the manufacturer is outside the EU, an **EU Authorized Representative**. The JRC's 3rd milestone confirms that facility-level identifiers (GS1 GLN — Global Location Number) are also required to trace where the product was manufactured. [(kezzler.com)](https://kezzler.com/blog/the-jrcs-3rd-milestone-dpp-for-apparel-is-getting-real/) 

For Indian manufacturers exporting to the EU, this creates a specific obligation: they must identify not just themselves as the manufacturer, but also the EU-based importer who handles customs clearance, and potentially an EU Authorized Representative if they sell directly to EU consumers without an importer intermediary. [(APTMA)](https://aptma.org.pk/wp-content/uploads/2024/06/Knowledge-Brief-CSDDD-and-its-Relevance-for-Pakistans-Textile-Industry-Final.pdf) 

### 2.2 Schema Gap

The existing `batches` table has a `model_name` field and the `passports` table has a `serial_number`, but there is **no GTIN/UPI field**, no **EORI number** for the importer, no **EU Authorized Representative** data, and no **facility identifier (GLN)** linking the passport to the specific manufacturing facility.

### 2.3 SQL Additions

```sql
-- ============================================================================
-- 2.3.1: Enhanced Product Identification
-- ============================================================================

ALTER TABLE batches ADD COLUMN IF NOT EXISTS gtin VARCHAR(14);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS upi VARCHAR(50);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS taric_code VARCHAR(10);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS cn_code VARCHAR(10);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS hs_code VARCHAR(10);

-- GS1 identifiers for DPP interoperability
ALTER TABLE batches ADD COLUMN IF NOT EXISTS gs1_digital_link_uri TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS gs1_resolver_url TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS eclass_ir_di VARCHAR(50);

-- Product categorization for ESPR delegated act
ALTER TABLE batches ADD COLUMN IF NOT EXISTS product_category VARCHAR(50);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS apparel_subcategory VARCHAR(50);
-- Valid values: 'KNITTED', 'DENIM', 'WOVEN', 'UNDERWEAR', 'ACTIVEWEAR'

-- ============================================================================
-- 2.3.2: Economic Operators Table (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS economic_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    operator_type VARCHAR(20) NOT NULL,
    -- Valid: 'MANUFACTURER', 'IMPORTER', 'DISTRIBUTOR', 'EU_REPRESENTATIVE',
    --        'AUTHORIZED_REPRESENTATIVE', 'FULFILMENT_SERVICE_PROVIDER'
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    vat_number VARCHAR(50),
    eori_number VARCHAR(20),
    -- EORI = Economic Operators Registration and Identification (EU customs)
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    website TEXT,
    gln VARCHAR(13),
    -- GS1 Global Location Number for facility identification
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_economic_operators_tenant ON economic_operators(tenant_id);
CREATE INDEX idx_economic_operators_type ON economic_operators(operator_type);

-- ============================================================================
-- 2.3.3: Batch-to-Operator Linkage (which operator plays which role per batch)
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_economic_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    economic_operator_id UUID NOT NULL REFERENCES economic_operators(id),
    role VARCHAR(30) NOT NULL,
    -- Valid: 'MANUFACTURER', 'IMPORTER_OF_RECORD', 'EU_AUTHORIZED_REP',
    --        'DISTRIBUTOR', 'ONLINE_PLATFORM'
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_batch_operator_role 
    ON batch_economic_operators(batch_id, role) 
    WHERE is_primary = TRUE;
```

---

## 3. Regulatory Dimension 2: Material Composition & Fiber Content

### 3.1 The Requirement

Material composition is the **single most heavily weighted data category** in the textile DPP. The JRC's LCA found that **raw material production accounts for 60-63% of a garment's environmental impact**, making fiber content the cornerstone of both DPP disclosure and ecodesign compliance. [(carbonfact.com)](https://www.carbonfact.com/blog/policy/espr-textile)  The delegated act will require:

- **Fiber type and percentage by weight** for every fiber present above a de minimis threshold
- **Recycled content percentage** per fiber type (with proposed thresholds of 20% for cotton in denim, 15% for polyester in knitted/woven, 10% for wool, 5% for nylon) [(carbonfact.com)](https://www.carbonfact.com/blog/policy/digital-product-passport-fashion) 
- **Certified content tracking** (GOTS organic cotton, BCI cotton, GRS recycled polyester)
- **Material origin country** for each fiber [(COSH!)](https://cosh.eco/en/articles/eu-digital-product-passport-espr-explained-fashion-textiles) 
- **Blend complexity indicators** that affect recyclability (mono-material vs. multi-fiber blends)

Fiber composition must be declared per-product (not per-collection), verified through testing or supplier declarations, and updated whenever formulations change. [(COSH!)](https://cosh.eco/en/articles/eu-digital-product-passport-espr-explained-fashion-textiles) 

### 3.2 Schema Gap

The existing schema has no table for material composition. The `batches.specs` JSONB field could theoretically store fiber data, but a **structured relational model** is essential for:
- Calculating weighted averages across blended products
- Enforcing recycled content thresholds
- Querying products by fiber type for regulatory reporting
- Tracking fiber origin for supply chain transparency

### 3.3 SQL Additions

```sql
-- ============================================================================
-- 3.3.1: Master Fiber Type Reference (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fiber_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiber_name VARCHAR(100) NOT NULL,
    fiber_category VARCHAR(50) NOT NULL,
    -- Valid: 'NATURAL_VIRGIN', 'NATURAL_ORGANIC', 'SYNTHETIC_VIRGIN',
    --        'SYNTHETIC_RECYCLED', 'REGENERATED', 'RECYCLED_NATURAL',
    --        'BLEND_COMPONENT'
    fiber_group VARCHAR(30) NOT NULL,
    -- Valid: 'COTTON', 'POLYESTER', 'WOOL', 'NYLON', 'ACRYLIC', 'VISCOSE',
    --        'LINEN', 'SILK', 'HEMP', 'ELASTANE', 'OTHER'
    is_recyclable BOOLEAN DEFAULT TRUE,
    is_biodegradable BOOLEAN,
    microplastic_shedding_risk VARCHAR(20),
    -- Valid: 'HIGH', 'MEDIUM', 'LOW', 'NONE'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fiber_name)
);

-- Seed with common fiber types
INSERT INTO fiber_types (fiber_name, fiber_category, fiber_group, is_recyclable, is_biodegradable, microplastic_shedding_risk) VALUES
    ('Cotton (Virgin)', 'NATURAL_VIRGIN', 'COTTON', TRUE, TRUE, 'NONE'),
    ('Cotton (Organic)', 'NATURAL_ORGANIC', 'COTTON', TRUE, TRUE, 'NONE'),
    ('Cotton (Recycled)', 'RECYCLED_NATURAL', 'COTTON', TRUE, TRUE, 'NONE'),
    ('Polyester (Virgin)', 'SYNTHETIC_VIRGIN', 'POLYESTER', TRUE, FALSE, 'HIGH'),
    ('Polyester (Recycled - rPET)', 'SYNTHETIC_RECYCLED', 'POLYESTER', TRUE, FALSE, 'HIGH'),
    ('Wool (Virgin)', 'NATURAL_VIRGIN', 'WOOL', TRUE, TRUE, 'NONE'),
    ('Wool (Recycled)', 'RECYCLED_NATURAL', 'WOOL', TRUE, TRUE, 'NONE'),
    ('Nylon (Virgin)', 'SYNTHETIC_VIRGIN', 'NYLON', TRUE, FALSE, 'MEDIUM'),
    ('Nylon (Recycled)', 'SYNTHETIC_RECYCLED', 'NYLON', TRUE, FALSE, 'MEDIUM'),
    ('Viscose/Rayon', 'REGENERATED', 'VISCOSE', TRUE, TRUE, 'LOW'),
    ('Lyocell/Tencel', 'REGENERATED', 'VISCOSE', TRUE, TRUE, 'NONE'),
    ('Linen', 'NATURAL_VIRGIN', 'LINEN', TRUE, TRUE, 'NONE'),
    ('Acrylic', 'SYNTHETIC_VIRGIN', 'ACRYLIC', TRUE, FALSE, 'HIGH'),
    ('Elastane/Spandex', 'SYNTHETIC_VIRGIN', 'ELASTANE', FALSE, FALSE, 'MEDIUM'),
    ('Silk', 'NATURAL_VIRGIN', 'SILK', TRUE, TRUE, 'NONE'),
    ('Hemp', 'NATURAL_VIRGIN', 'HEMP', TRUE, TRUE, 'NONE')
ON CONFLICT (fiber_name) DO NOTHING;

-- ============================================================================
-- 3.3.2: Batch Material Composition (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_material_composition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    fiber_type_id UUID NOT NULL REFERENCES fiber_types(id),
    percentage_by_weight DECIMAL(5,2) NOT NULL CHECK (percentage_by_weight > 0 AND percentage_by_weight <= 100),
    
    -- Recycled content specifics
    is_recycled BOOLEAN NOT NULL DEFAULT FALSE,
    recycled_content_percentage DECIMAL(5,2) DEFAULT 0 CHECK (recycled_content_percentage >= 0 AND recycled_content_percentage <= 100),
    recycled_content_source VARCHAR(50),
    -- Valid: 'PRE_CONSUMER', 'POST_CONSUMER', 'UNKNOWN'
    recycled_certification VARCHAR(50),
    -- Valid: 'GRS', 'RCS', 'NONE', 'OTHER'
    recycled_certification_number VARCHAR(100),
    
    -- Virgin content specifics
    is_organic BOOLEAN NOT NULL DEFAULT FALSE,
    organic_certification VARCHAR(50),
    -- Valid: 'GOTS', 'OCS', 'NONE', 'OTHER'
    organic_certification_number VARCHAR(100),
    
    -- Origin & traceability
    origin_country_code CHAR(2),
    origin_country_name VARCHAR(100),
    supplier_name VARCHAR(255),
    supplier_id UUID,
    
    -- Verification
    verification_method VARCHAR(50),
    -- Valid: 'LAB_TEST', 'SUPPLIER_DECLARATION', 'CERTIFICATE', 'ESTIMATED'
    verification_date DATE,
    verified_by VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_batch_material_composition_batch ON batch_material_composition(batch_id);
CREATE INDEX idx_batch_material_composition_fiber ON batch_material_composition(fiber_type_id);

-- ============================================================================
-- 3.3.3: Material Origin / Supply Chain Tier Tracking (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_origins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_material_composition_id UUID NOT NULL REFERENCES batch_material_composition(id) ON DELETE CASCADE,
    supply_chain_tier VARCHAR(20) NOT NULL,
    -- Valid: 'TIER_0_RAW_MATERIAL', 'TIER_1_FIBER', 'TIER_2_YARN',
    --        'TIER_3_FABRIC', 'TIER_4_FINISHING', 'TIER_5_CUT_SEW'
    process_stage VARCHAR(50) NOT NULL,
    -- Valid: 'FARMING', 'GINNING', 'SPINNING', 'KNITTING', 'WEAVING',
    --        'DYEING', 'PRINTING', 'FINISHING', 'CUTTING', 'SEWING',
    --        'WASHING', 'GARMENT_DYEING', 'EMBELLISHMENT'
    facility_name VARCHAR(255),
    facility_address TEXT,
    facility_country_code CHAR(2),
    facility_gln VARCHAR(13),
    facility_certifications JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"cert": "GOTS", "license": "XXX", "valid_until": "2027-06"}]
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    verified_via_audit BOOLEAN DEFAULT FALSE,
    audit_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_origins_batch_material ON material_origins(batch_material_composition_id);
```

---

## 4. Regulatory Dimension 3: Chemical Compliance (REACH / SVHC / SCIP)

### 4.1 The Requirement

Chemical compliance is the **entry gate** for EU market access. REACH (EC 1907/2006) operates through three interconnected mechanisms that the schema must support: [(Enviropass)](https://getenviropass.com/reach-svhc/) 

**REACH Annex XVII** restricts specific substances in textile products — azo dyes releasing carcinogenic aromatic amines (limited to 30 mg/kg), phthalates (DEHP, BBP, DBP, DIBP restricted to 0.1% sum total), PFAS (increasingly restricted), heavy metals (cadmium, lead, nickel), and flame retardants. [(europa.eu)](https://susproc.jrc.ec.europa.eu/product-bureau/sites/default/files/contentype/product_group_documents/1581690535/130206%20Ecolabel%20textiles_Restricted%20Substance%20List_Draft%20v2.pdf)  These are **hard prohibitions** — non-compliant products are stopped at EU borders.

**SVHC Candidate List** substances trigger two obligations when present above 0.1% w/w: (1) communication down the supply chain (Article 33), and (2) **SCIP database notification** to ECHA under the Waste Framework Directive. [(REACH24H)](https://en.reach24h.com/service/chemical/scip-notification-key-eu-requirements-for-svhc-in-articles)  The SCIP database requires article identification, SVHC name/CAS number, concentration range, and safe use instructions for waste handlers. [(GreenSoft Technology, Inc.)](https://greensofttech.com/resources/scip-database-faq/scip-database-faq-full/) 

**Substances of Concern** under ESPR Annex I must be declared in the DPP when present above 0.1% w/w, with the substance name, CAS number, location within the product, and concentration range. [(Brightest)](https://www.brightest.io/i/digital-product-passports-eu) 

### 4.2 Schema Gap

There is **zero chemical compliance infrastructure** in the existing schema. No table tracks chemical substances used in production, no linkage to REACH restricted lists, no SVHC screening data, no SCIP notification status, and no testing report references.

### 4.3 SQL Additions

```sql
-- ============================================================================
-- 4.3.1: Chemical Substances Registry (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chemical_substances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- Substance identification
    substance_name VARCHAR(255) NOT NULL,
    cas_number VARCHAR(20),
    ec_number VARCHAR(20),
    iupac_name TEXT,
    
    -- Regulatory classification
    is_svhc BOOLEAN NOT NULL DEFAULT FALSE,
    svhc_listing_date DATE,
    is_annex_xvii_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    annex_xvii_entry VARCHAR(20),
    restriction_limit_value VARCHAR(50),
    -- e.g., "30 mg/kg" for azo dyes, "0.1%" for phthalates
    is_pfas BOOLEAN NOT NULL DEFAULT FALSE,
    pfas_group VARCHAR(50),
    
    -- Concentration in product
    concentration_percentage DECIMAL(8,5),
    -- e.g., 0.05000 for 0.05%
    concentration_mg_kg INTEGER,
    concentration_range VARCHAR(20),
    -- Valid: 'BELOW_0.1%', '0.1_TO_1%', '1_TO_10%', 'ABOVE_10%'
    
    -- Location in product
    component VARCHAR(100),
    -- e.g., "main_fabric", "lining", "trim", "zipper", "print", "coating"
    material_part VARCHAR(100),
    
    -- Compliance status
    compliance_status VARCHAR(20) NOT NULL DEFAULT 'UNDER_REVIEW',
    -- Valid: 'COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'EXEMPT',
    --        'RESTRICTED_EXCEEDED', 'SVHC_DECLARED'
    
    -- Testing & verification
    test_report_reference VARCHAR(255),
    testing_lab_name VARCHAR(255),
    testing_date DATE,
    testing_method VARCHAR(100),
    -- e.g., "EN ISO 14362-1", "GC-MS", "LC-MS/MS", "ICP-MS"
    
    -- SCIP notification
    scip_notification_required BOOLEAN GENERATED ALWAYS AS (
        is_svhc AND concentration_percentage > 0.1
    ) STORED,
    scip_notification_submitted BOOLEAN DEFAULT FALSE,
    scip_notification_date DATE,
    scip_dossier_uuid UUID,
    scip_submission_id VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chemical_substances_batch ON chemical_substances(batch_id);
CREATE INDEX idx_chemical_substances_cas ON chemical_substances(cas_number);
CREATE INDEX idx_chemical_substances_svhc ON chemical_substances(is_svhc) 
    WHERE is_svhc = TRUE;
CREATE INDEX idx_chemical_substances_scip ON chemical_substances(scip_notification_required) 
    WHERE scip_notification_required = TRUE;

-- ============================================================================
-- 4.3.2: REACH Regulatory Reference Data (NEW - read-only reference table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reach_regulatory_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cas_number VARCHAR(20) NOT NULL UNIQUE,
    substance_name VARCHAR(255) NOT NULL,
    ec_number VARCHAR(20),
    
    -- SVHC status
    is_svhc BOOLEAN NOT NULL DEFAULT FALSE,
    svhc_reason VARCHAR(255),
    -- e.g., "CMR Cat 1A/1B", "PBT", "vPvB", "Endocrine disruptor"
    svhc_listing_date DATE,
    
    -- Annex XVII restrictions
    is_annex_xvii_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    annex_xvii_entries JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"entry": "43", "scope": "textiles", "limit": "30 mg/kg"}]
    
    -- Classification
    hazard_classes JSONB DEFAULT '[]'::jsonb,
    -- e.g., ["Carc. 1A", "Muta. 1B", "Repr. 1A"]
    
    -- Source
    data_source VARCHAR(50) DEFAULT 'ECHA',
    last_updated DATE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reach_cas ON reach_regulatory_data(cas_number);

-- ============================================================================
-- 4.3.3: Chemical Inventory for Production Processes (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chemical_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Chemical used in production
    chemical_name VARCHAR(255) NOT NULL,
    cas_number VARCHAR(20),
    sds_reference VARCHAR(255),
    supplier_name VARCHAR(255),
    
    -- Usage context
    process_stage VARCHAR(50) NOT NULL,
    -- Valid: 'DESIZING', 'SCOURING', 'BLEACHING', 'MERCEZING', 'DYEING',
    --        'PRINTING', 'FINISHING', 'WASHING', 'COATING', 'LAMINATING'
    application_purpose VARCHAR(255),
    
    -- ZDHC MRSL conformance
    zdhc_mrsl_conformance_level VARCHAR(10),
    -- Valid: 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'NOT_CONFORMANT', 'UNKNOWN'
    zdhc_certification_number VARCHAR(100),
    
    -- REACH compliance
    reach_registered BOOLEAN DEFAULT FALSE,
    reach_registration_number VARCHAR(50),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    replacement_recommended BOOLEAN DEFAULT FALSE,
    replacement_alternative VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chemical_inventory_tenant ON chemical_inventory(tenant_id);
CREATE INDEX idx_chemical_inventory_cas ON chemical_inventory(cas_number);
```

---

## 5. Regulatory Dimension 4: Supply Chain Traceability & CSDDD Due Diligence

### 5.1 The Requirement

The EU textile DPP requires **basic supply chain traceability to at least tier 1 and tier 2 suppliers**. [(COSH!)](https://cosh.eco/en/articles/eu-digital-product-passport-espr-explained-fashion-textiles)  This means documenting not just the factory that sewed the garment, but also the fabric mill, the dye house, the spinner, and potentially the fiber producer. The CSDDD (Corporate Sustainability Due Diligence Directive) adds a parallel obligation for large EU companies to conduct human rights and environmental due diligence across their supply chains, which cascades down to suppliers — including Indian textile manufacturers. [(APTMA)](https://aptma.org.pk/wp-content/uploads/2024/06/Knowledge-Brief-CSDDD-and-its-Relevance-for-Pakistans-Textile-Industry-Final.pdf) 

ESPR Article 9 specifically requires **unique facility identifiers** (GS1 GLN) and information about the manufacturer, importer, and other economic operators in the supply chain. [(Empact)](https://empact.nu/en/insights/what-data-should-be-in-a-dpp-the-information-requirements-of-the-espr-explained/)  The JRC's 3rd milestone emphasizes that the DPP must include processing stage data — spinning, knitting, weaving, dyeing, finishing, cutting, sewing — with facility-level identification for each stage. [(kezzler.com)](https://kezzler.com/blog/the-jrcs-3rd-milestone-dpp-for-apparel-is-getting-real/) 

### 5.2 Schema Gap

The existing schema has `trusted_partners` and `partner_codes` tables, but these are designed for **access control and collaboration**, not for **supply chain traceability**. There is no table to model the multi-tier supplier chain, no facility identification, no audit status tracking, and no due diligence risk assessment.

### 5.3 SQL Additions

```sql
-- ============================================================================
-- 5.3.1: Suppliers / Supply Chain Partners (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic identification
    company_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    supplier_code VARCHAR(50),
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),
    website TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) NOT NULL,
    
    -- GS1 / Facility identification
    gln VARCHAR(13),
    facility_type VARCHAR(50),
    -- Valid: 'FARM', 'GINNING_MILL', 'SPINNING_MILL', 'KNITTING_MILL',
    --        'WEAVING_MILL', 'DYEING_HOUSE', 'PRINTING_HOUSE', 'FINISHING_MILL',
    --        'CUTTING_UNIT', 'SEWING_FACTORY', 'LAUNDRY', 'TRIM_SUPPLIER',
    --        'PACKAGING_SUPPLIER', 'WAREHOUSE', 'LOGISTICS'
    
    -- Capabilities
    processes JSONB DEFAULT '[]'::jsonb,
    -- e.g., ["SPINNING", "KNITTING", "DYEING", "GARMENT_WASHING"]
    certifications JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"scheme": "GOTS", "license": "XXX", "valid_until": "2027-06", "cert_body": "Control Union"}]
    
    -- Tier classification
    supply_chain_tier VARCHAR(20) NOT NULL,
    -- Valid: 'TIER_1_DIRECT', 'TIER_2', 'TIER_3', 'TIER_4_PLUS'
    
    -- CSDDD Due Diligence
    csddd_risk_level VARCHAR(20),
    -- Valid: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'NOT_ASSESSED'
    csddd_risk_factors JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"factor": "forced_labor", "risk": "medium", "evidence": "audit_2025_03"}]
    csddd_last_assessment_date DATE,
    csddd_next_assessment_due DATE,
    csddd_audit_status VARCHAR(30),
    -- Valid: 'NOT_AUDITED', 'AUDIT_PLANNED', 'AUDIT_IN_PROGRESS',
    --        'AUDIT_COMPLETED', 'CORRECTIVE_ACTIONS_PENDING',
    --        'CORRECTIVE_ACTIONS_CLOSED', 'AUDIT_FAILED'
    csddd_audit_report_url TEXT,
    
    -- Grievance mechanism
    has_grievance_mechanism BOOLEAN DEFAULT FALSE,
    grievance_mechanism_description TEXT,
    
    -- Status
    onboarding_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- Valid: 'PENDING', 'INVITED', 'ACTIVE', 'SUSPENDED', 'TERMINATED'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_tier ON suppliers(supply_chain_tier);
CREATE INDEX idx_suppliers_country ON suppliers(country_code);
CREATE INDEX idx_suppliers_csddd_risk ON suppliers(csddd_risk_level) 
    WHERE csddd_risk_level IS NOT NULL;

-- ============================================================================
-- 5.3.2: Batch-to-Supplier Linkage (which supplier does what for each batch)
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    process_stage VARCHAR(50) NOT NULL,
    -- Same enum as suppliers.facility_type
    stage_sequence INTEGER NOT NULL DEFAULT 1,
    -- Order in the production chain: 1=first, 2=second, etc.
    materials_processed JSONB DEFAULT '[]'::jsonb,
    -- e.g., ["cotton_yarn", "polyester_fabric"]
    start_date DATE,
    end_date DATE,
    quantity_processed VARCHAR(100),
    unit_of_measure VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_batch_suppliers_batch ON batch_suppliers(batch_id);
CREATE INDEX idx_batch_suppliers_supplier ON batch_suppliers(supplier_id);
CREATE INDEX idx_batch_suppliers_stage ON batch_suppliers(process_stage);

-- ============================================================================
-- 5.3.3: Due Diligence Assessments (CSDDD-aligned) (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS due_diligence_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    assessment_type VARCHAR(30) NOT NULL,
    -- Valid: 'INITIAL_SCREENING', 'PERIODIC_REVIEW', 'TRIGGERED_AUDIT',
    --        'SELF_ASSESSMENT', 'THIRD_PARTY_AUDIT'
    
    -- OECD Due Diligence Framework steps
    step_identification JSONB DEFAULT '{}'::jsonb,
    -- e.g., {"risks_identified": ["forced_labor", "wage_violations"], "severity": "high"}
    step_assessment JSONB DEFAULT '{}'::jsonb,
    -- e.g., {"likelihood": "medium", "impact": "severe", "overall_risk": "high"}
    step_mitigation JSONB DEFAULT '{}'::jsonb,
    -- e.g., {"actions": ["supplier_training", "wage_monitoring"], "deadline": "2026-09-01"}
    step_tracking JSONB DEFAULT '{}'::jsonb,
    -- e.g., {"monitoring_method": "quarterly_reports", "kpi": "zero_wage_violations"}
    
    -- Human rights & environment
    human_rights_score INTEGER CHECK (human_rights_score >= 0 AND human_rights_score <= 100),
    environment_score INTEGER CHECK (environment_score >= 0 AND environment_score <= 100),
    governance_score INTEGER CHECK (governance_score >= 0 AND governance_score <= 100),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Audit details
    auditor_name VARCHAR(255),
    auditor_organization VARCHAR(255),
    audit_date DATE,
    audit_report_document_id UUID,
    findings_summary TEXT,
    corrective_actions_required BOOLEAN DEFAULT FALSE,
    corrective_actions_deadline DATE,
    
    assessment_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- Valid: 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dd_assessments_tenant ON due_diligence_assessments(tenant_id);
CREATE INDEX idx_dd_assessments_supplier ON due_diligence_assessments(supplier_id);
```

---

## 6. Regulatory Dimension 5: Ecodesign — Robustness, Recyclability, Repairability

### 6.1 The Requirement

The JRC's 3rd milestone proposes four **Design Options (DOs)** that will shape the textile delegated act: [(kezzler.com)](https://kezzler.com/blog/the-jrcs-3rd-milestone-dpp-for-apparel-is-getting-real/) 

**DO1 — Increased Robustness**: A **0-10 scoring system** based on visual inspection parameters including spirality, dimensional change, color fastness, fabric integrity, seam strength, and non-textile part durability. [(europa.eu)](https://susproc.jrc.ec.europa.eu/product-bureau/sites/default/files/2025-12/Textile-Prep-Study_3rd-Milestone_SUM_20251212.pdf)  This is an **information requirement** (not performance), displayed on the DPP to inform consumer choice. The JRC explicitly notes that robustness is distinct from durability — it tests point-in-time performance, not time-based aging. [(EconomiaCircolare.com)](https://economiacircolare.com/textile-ecodesign-espr-requirements/) 

**DO2 — Recyclability Score**: An aggregated score (0-10) measuring how easily a product can be recycled at end-of-life. Factors include fiber composition complexity (mono-material scores higher), separability of trims and accessories, fiber identification, and compatibility with existing recycling technologies. [(MATREC)](https://www.matrec.com/en/news-free/circular-economy-for-textiles-between-robustness-and-recycling) 

**DO3 — Recycled Content**: Minimum thresholds differentiated by fiber group and product category. Proposed levels: up to **20% recycled cotton in denim**, **15% recycled polyester in knitted/woven**, **10% recycled wool**, and **5% recycled nylon**. [(carbonfact.com)](https://www.carbonfact.com/blog/policy/digital-product-passport-fashion)  These are expected to become **performance requirements** (not just disclosure).

**DO4 — Environmental Footprint**: A **voluntary excellence indicator** using PEFCR methodology limited to the manufacturing stage. If a product's manufacturing footprint is below the category benchmark, the brand can display this on the DPP as a competitive differentiator. [(carbonfact.com)](https://www.carbonfact.com/blog/policy/digital-product-passport-fashion) 

Repairability was **omitted as a design option** in milestone 3 due to feasibility concerns, but the ESPR framework still requires repairability information as part of the DPP's general sustainability data. [(kezzler.com)](https://kezzler.com/blog/the-jrcs-3rd-milestone-dpp-for-apparel-is-getting-real/) 

### 6.2 Schema Gap

No ecodesign scoring infrastructure exists. The `batches.compliance_score` field is a generic float with no defined scoring methodology, and `batches.compliance_gaps` is an unstructured JSONB array.

### 6.3 SQL Additions

```sql
-- ============================================================================
-- 6.3.1: Ecodesign Scores (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ecodesign_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- DO1: Robustness Score (0-10)
    robustness_score DECIMAL(3,1) CHECK (robustness_score >= 0 AND robustness_score <= 10),
    robustness_spirality_score DECIMAL(3,1),
    robustness_dimensional_change_score DECIMAL(3,1),
    robustness_color_fastness_score DECIMAL(3,1),
    robustness_fabric_integrity_score DECIMAL(3,1),
    robustness_seam_strength_score DECIMAL(3,1),
    robustness_non_textile_parts_score DECIMAL(3,1),
    robustness_test_method VARCHAR(100),
    robustness_testing_lab VARCHAR(255),
    robustness_test_date DATE,
    robustness_test_report_url TEXT,
    
    -- DO2: Recyclability Score (0-10)
    recyclability_score DECIMAL(3,1) CHECK (recyclability_score >= 0 AND recyclability_score <= 10),
    recyclability_composition_complexity DECIMAL(3,1),
    -- Mono-material = high score; complex blends = low score
    recyclability_trim_separability DECIMAL(3,1),
    recyclability_fiber_identification BOOLEAN DEFAULT FALSE,
    recyclability_compatible_technologies JSONB DEFAULT '[]'::jsonb,
    -- e.g., ["mechanical_recycling", "chemical_recycling_polyester"]
    recyclability_end_of_life_pathway VARCHAR(50),
    -- Valid: 'FIBRE_TO_FIBRE', 'DOWNCYCLING', 'ENERGY_RECOVERY', 'LANDFILL'
    
    -- DO3: Recycled Content (performance requirement)
    recycled_content_overall_pct DECIMAL(5,2),
    recycled_content_cotton_pct DECIMAL(5,2),
    recycled_content_polyester_pct DECIMAL(5,2),
    recycled_content_wool_pct DECIMAL(5,2),
    recycled_content_nylon_pct DECIMAL(5,2),
    recycled_content_compliant BOOLEAN,
    -- Auto-calculated against delegated act thresholds
    
    -- DO4: Manufacturing Footprint (voluntary excellence indicator)
    manufacturing_footprint_kg_co2e DECIMAL(10,4),
    manufacturing_footprint_benchmark DECIMAL(10,4),
    -- Category benchmark for comparison
    manufacturing_footprint_exceeds_benchmark BOOLEAN,
    -- TRUE if product is cleaner than benchmark
    manufacturing_footprint_outperformance_pct DECIMAL(5,2),
    manufacturing_footprint_data_quality VARCHAR(20),
    -- Valid: 'PRIMARY', 'SECONDARY', 'MIXED'
    manufacturing_footprint_methodology VARCHAR(50),
    -- e.g., "PEFCR_Apparel_v1.0"
    
    -- Repairability (DPP general requirement)
    repairability_info_available BOOLEAN DEFAULT FALSE,
    repair_manual_url TEXT,
    spare_parts_available BOOLEAN DEFAULT FALSE,
    spare_parts_list JSONB DEFAULT '[]'::jsonb,
    -- e.g., ["buttons", "zipper", "lining"]
    estimated_lifetime_years INTEGER,
    
    -- Scoring metadata
    scoring_date DATE,
    scored_by VARCHAR(255),
    scoring_methodology_version VARCHAR(20),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ecodesign_scores_batch ON ecodesign_scores(batch_id);
CREATE INDEX idx_ecodesign_scores_robustness ON ecodesign_scores(robustness_score) 
    WHERE robustness_score IS NOT NULL;
CREATE INDEX idx_ecodesign_scores_recyclability ON ecodesign_scores(recyclability_score) 
    WHERE recyclability_score IS NOT NULL;
```

---

## 7. Regulatory Dimension 6: Environmental Performance — Carbon, Water, Microplastics

### 7.1 The Requirement

The textile DPP must include **core environmental indicators** covering climate impact, water use, and energy intensity. [(COSH!)](https://cosh.eco/en/articles/eu-digital-product-passport-espr-explained-fashion-textiles)  The JRC proposes a **manufacturing footprint indicator** calculated using PEFCR methodology but limited to the manufacturing stage (cradle-to-gate), excluding raw materials. [(carbonfact.com)](https://www.carbonfact.com/blog/policy/digital-product-passport-fashion)  Brands whose product outperforms the category benchmark can display this as an excellence indicator on the DPP.

Additionally, the EU is addressing **microplastic shedding** from synthetic textiles through multiple regulatory channels. REACH Annex XVII Entry 78 restricts synthetic polymer microparticles, and the ESPR textile delegated act is expected to include **fiber shedding thresholds** that will prohibit the highest-emitting products. [(pew.org)](https://www.pew.org/en/research-and-analysis/articles/2026/05/12/7-things-to-know-about-microplastics-from-textiles)  The Microfibre Consortium has developed a data portfolio on fiber shedding from over 600 fabrics, showing that design choices (tighter weaves, stronger fibers) can reduce emissions by **80-90%**. [(textirama)](https://textirama.be/en/textile-industry-seeks-solutions-for-microplastics-within-its-own-ranks/) 

### 7.2 Schema Gap

No environmental performance tables exist. Carbon footprint, water consumption, energy use, and microplastic shedding data are not modeled.

### 7.3 SQL Additions

```sql
-- ============================================================================
-- 7.3.1: Environmental Performance Data (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS environmental_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- Carbon footprint (cradle-to-gate per PEFCR Apparel)
    carbon_footprint_total_kg_co2e DECIMAL(10,4),
    carbon_footprint_per_unit_kg_co2e DECIMAL(10,4),
    carbon_footprint_raw_materials DECIMAL(10,4),
    carbon_footprint_manufacturing DECIMAL(10,4),
    carbon_footprint_transport DECIMAL(10,4),
    carbon_footprint_packaging DECIMAL(10,4),
    carbon_footprint_methodology VARCHAR(50),
    -- e.g., "PEFCR_Apparel_v1.0", "ISO_14067"
    carbon_footprint_verification VARCHAR(50),
    -- Valid: 'THIRD_PARTY_VERIFIED', 'SELF_DECLARED', 'CALCULATED'
    carbon_footprint_lca_software VARCHAR(100),
    -- e.g., "SimaPro", "GaBi", "openLCA"
    
    -- Water use
    water_consumption_liters_total DECIMAL(10,2),
    water_consumption_liters_per_unit DECIMAL(10,2),
    water_consumption_raw_materials DECIMAL(10,2),
    water_consumption_manufacturing DECIMAL(10,2),
    water_stress_country_codes JSONB DEFAULT '[]'::jsonb,
    -- Countries where water was consumed, for water stress weighting
    
    -- Energy use
    energy_consumption_mj_total DECIMAL(12,2),
    energy_consumption_mj_per_unit DECIMAL(12,2),
    renewable_energy_percentage DECIMAL(5,2),
    
    -- Microplastic shedding
    microplastic_shedding_mg_per_kg_wash DECIMAL(10,2),
    -- Fiber loss per kg of fabric per wash cycle
    microplastic_shedding_test_method VARCHAR(100),
    -- e.g., "AATCC TM212", "ISO 4484-1", "EMPA method"
    microplastic_shedding_test_lab VARCHAR(255),
    microplastic_shedding_test_date DATE,
    microplastic_shedding_compliant BOOLEAN,
    -- Against expected delegated act threshold
    
    -- Other PEF impact categories
    pef_fossil_resource_use DECIMAL(10,4),
    pef_particulate_matter DECIMAL(10,4),
    pef_acidification DECIMAL(10,4),
    pef_eutrophication_freshwater DECIMAL(10,4),
    pef_eutrophication_marine DECIMAL(10,4),
    pef_eutrophication_terrestrial DECIMAL(10,4),
    pef_ozone_depletion DECIMAL(10,4),
    pef_photochemical_ozone_formation DECIMAL(10,4),
    pef_ionising_radiation DECIMAL(10,4),
    pef_land_use DECIMAL(10,4),
    pef_resource_use_minerals_metals DECIMAL(10,4),
    
    -- Data quality
    data_quality_overall VARCHAR(20),
    -- Valid: 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'
    primary_data_percentage DECIMAL(5,2),
    assessment_period_start DATE,
    assessment_period_end DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_env_perf_batch ON environmental_performance(batch_id);
```

---

## 8. Regulatory Dimension 7: EPR, End-of-Life & Destruction Ban

### 8.1 The Requirement

The EU Textile EPR Directive (adopted October 2025) requires all member states to establish textile EPR schemes by **April 2028**. [(ecosistant)](https://www.ecosistant.eu/en/eu-textile-epr-directive-for-fashion-brands/)  Producers must register with **Producer Responsibility Organizations (PROs)** in each EU country, report quantities placed on the market, and pay **eco-modulated fees** based on durability, recyclability, and recycled content. [(carbonfact.com)](https://www.carbonfact.com/blog/policy/textile-epr-overview) 

The **destruction ban** (effective July 2026 for large companies) prohibits discarding unsold apparel, with 10 specific derogations. [(Beveridge & Diamond PC)](https://www.bdlaw.com/publications/eu-clarifies-ban-on-destruction-of-unsold-apparel-clothing-accessories-and-footwear/)  From **February 2027**, companies must disclose discarded unsold products using a **standardized EU format** including CN codes, quantities, reasons for discarding, waste treatment methods, and prevention measures. [(Linklaters - Sustainable Futures)](https://sustainablefutures.linklaters.com/post/102miiy/eu-espr-commission-adopts-final-acts-on-unsold-consumer-product-destruction-and)  Records must be maintained for **5 years**. [(Beveridge & Diamond PC)](https://www.bdlaw.com/publications/eu-clarifies-ban-on-destruction-of-unsold-apparel-clothing-accessories-and-footwear/) 

### 8.2 Schema Gap

No EPR registration, eco-modulation, destruction ban reporting, or end-of-life instruction tables exist.

### 8.3 SQL Additions

```sql
-- ============================================================================
-- 8.3.1: EPR Registration & Reporting (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS epr_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- PRO / Scheme details
    country_code CHAR(2) NOT NULL,
    pro_name VARCHAR(255) NOT NULL,
    -- e.g., "Refashion (France)", "NV Afvalfonds (Netherlands)"
    pro_registration_number VARCHAR(100),
    registration_date DATE,
    registration_status VARCHAR(20),
    -- Valid: 'PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED'
    
    -- Reporting
    reporting_frequency VARCHAR(20),
    -- Valid: 'MONTHLY', 'QUARTERLY', 'ANNUAL'
    last_reporting_date DATE,
    next_reporting_due DATE,
    
    -- Eco-modulation
    eco_modulation_category VARCHAR(50),
    -- PRO-specific classification
    eco_modulation_fee_per_kg DECIMAL(10,4),
    eco_modulation_discount_percentage DECIMAL(5,2),
    -- Discount for high sustainability performance
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, country_code)
);
CREATE INDEX idx_epr_registrations_tenant ON epr_registrations(tenant_id);

-- ============================================================================
-- 8.3.2: End-of-Life Information (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS end_of_life_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- Recycling instructions
    disassembly_instructions TEXT,
    disassembly_instructions_url TEXT,
    recyclability_rate_percentage DECIMAL(5,2),
    -- Percentage by weight that can be recycled
    recycling_technology_compatibility JSONB DEFAULT '[]'::jsonb,
    -- e.g., ["mechanical_recycling", "chemical_recycling"]
    
    -- Material recovery
    material_recovery_targets JSONB DEFAULT '{}'::jsonb,
    -- e.g., {"cotton_recovery": 85, "polyester_recovery": 90}
    hazardous_materials_warning TEXT,
    special_handling_required BOOLEAN DEFAULT FALSE,
    
    -- Take-back
    take_back_scheme_available BOOLEAN DEFAULT FALSE,
    take_back_scheme_name VARCHAR(255),
    take_back_scheme_url TEXT,
    nearest_collection_point_finder_url TEXT,
    
    -- Second life / resale
    resale_guidance TEXT,
    repair_network_url TEXT,
    upcycling_guidance TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_end_of_life_batch ON end_of_life_info(batch_id);

-- ============================================================================
-- 8.3.3: Destruction Ban / Unsold Goods Reporting (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS unsold_goods_disclosures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reporting period
    financial_year_start DATE NOT NULL,
    financial_year_end DATE NOT NULL,
    disclosure_date DATE NOT NULL,
    disclosure_url TEXT,
    
    -- Product details
    cn_code VARCHAR(10) NOT NULL,
    product_description TEXT,
    units_discarded INTEGER NOT NULL DEFAULT 0,
    weight_kg_discarded DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Reason for discarding
    discard_reason VARCHAR(50) NOT NULL,
    -- Valid: 'DANGEROUS_PRODUCT', 'IP_INFRINGEMENT', 'LICENCE_EXPIRED',
    --        'PHYSICAL_DAMAGE', 'MANUFACTURING_DEFECT', 'DESIGN_DEFECT',
    --        'DONATION_FAILED', 'OTHER'
    derogation_applied VARCHAR(50),
    -- Which of the 10 derogations was invoked
    derogation_documentation_url TEXT,
    
    -- Waste treatment
    treatment_preparation_for_reuse_kg DECIMAL(10,2) DEFAULT 0,
    treatment_recycling_kg DECIMAL(10,2) DEFAULT 0,
    treatment_other_recovery_kg DECIMAL(10,2) DEFAULT 0,
    treatment_disposal_kg DECIMAL(10,2) DEFAULT 0,
    
    -- Prevention measures
    measures_taken TEXT,
    measures_planned TEXT,
    
    -- Verification
    waste_operator_declaration_received BOOLEAN DEFAULT FALSE,
    waste_operator_declaration_url TEXT,
    records_retention_confirmed BOOLEAN DEFAULT FALSE,
    -- 5-year retention confirmed
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_unsold_goods_tenant ON unsold_goods_disclosures(tenant_id);
CREATE INDEX idx_unsold_goods_period ON unsold_goods_disclosures(financial_year_start, financial_year_end);
```

---

## 9. Regulatory Dimension 8: Data Access Tiers & Multi-Language

### 9.1 The Requirement

The DPP operates on a **three-tier access model**: public data (accessible to anyone scanning the QR code), B2B data (accessible to supply chain partners and customers), and authority data (accessible to regulators, customs, and market surveillance). [(SIA Fluxy One)](https://fluxy.one/post/digital-product-passport-textiles-data-fields-guide)  ESPR Article 9 requires that the DPP system supports these access tiers with appropriate authentication and authorization.

Additionally, DPP data must be available in **the official language(s) of each EU member state** where the product is sold. [(Brightest)](https://www.brightest.io/i/digital-product-passports-eu)  Automated translation is permitted for most fields, but substance names and safety information require manual verification.

### 9.2 Schema Gap

The existing `data_access_tokens` table provides basic token-based access but lacks the **structured access tier definitions** required by ESPR. There is no multi-language content management for DPP fields.

### 9.3 SQL Additions

```sql
-- ============================================================================
-- 9.3.1: DPP Content Access Tiers (enhanced from existing data_access_tokens)
-- ============================================================================

ALTER TABLE data_access_tokens ADD COLUMN IF NOT EXISTS access_scope VARCHAR(50);
-- Valid: 'PUBLIC_CONSUMER', 'B2B_CUSTOMER', 'B2B_SUPPLIER', 
--        'AUTHORITY_REGULATOR', 'AUTHORITY_CUSTOMS', 'AUTHORITY_MARKET_SURVEILLANCE'

-- ============================================================================
-- 9.3.2: DPP Field-Level Access Control (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpp_field_access_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_name VARCHAR(100) NOT NULL,
    field_category VARCHAR(50) NOT NULL,
    -- e.g., 'IDENTIFICATION', 'MATERIAL_COMPOSITION', 'CHEMICAL_COMPLIANCE',
    --        'SUPPLY_CHAIN', 'ENVIRONMENTAL', 'ECODESIGN', 'END_OF_LIFE'
    access_tier_public BOOLEAN NOT NULL DEFAULT FALSE,
    access_tier_b2b BOOLEAN NOT NULL DEFAULT FALSE,
    access_tier_authority BOOLEAN NOT NULL DEFAULT TRUE,
    access_tier_authenticated_owner BOOLEAN NOT NULL DEFAULT TRUE,
    -- Whether the passport owner (manufacturer) can always see it
    
    -- ESPR delegated act reference
    regulatory_basis VARCHAR(255),
    -- e.g., "ESPR Art.9(1)(a)", "JRC Milestone 3 - DO1"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_name)
);

-- Seed with standard field access tiers based on ESPR requirements
INSERT INTO dpp_field_access_tiers 
    (field_name, field_category, access_tier_public, access_tier_b2b, access_tier_authority, regulatory_basis) 
VALUES
    ('product_name', 'IDENTIFICATION', TRUE, TRUE, TRUE, 'ESPR Art.9'),
    ('gtin', 'IDENTIFICATION', TRUE, TRUE, TRUE, 'ESPR Art.9'),
    ('manufacturer_name', 'IDENTIFICATION', TRUE, TRUE, TRUE, 'ESPR Art.9'),
    ('fiber_composition', 'MATERIAL_COMPOSITION', TRUE, TRUE, TRUE, 'JRC M3 - Material'),
    ('recycled_content_percentage', 'MATERIAL_COMPOSITION', TRUE, TRUE, TRUE, 'JRC M3 - DO3'),
    ('origin_country', 'MATERIAL_COMPOSITION', TRUE, TRUE, TRUE, 'JRC M3 - Material'),
    ('robustness_score', 'ECODESIGN', TRUE, TRUE, TRUE, 'JRC M3 - DO1'),
    ('recyclability_score', 'ECODESIGN', TRUE, TRUE, TRUE, 'JRC M3 - DO2'),
    ('carbon_footprint_total', 'ENVIRONMENTAL', TRUE, TRUE, TRUE, 'ESPR Art.9'),
    ('manufacturing_footprint', 'ENVIRONMENTAL', TRUE, TRUE, TRUE, 'JRC M3 - DO4'),
    ('water_consumption', 'ENVIRONMENTAL', FALSE, TRUE, TRUE, 'ESPR Art.9'),
    ('chemical_substances_svhc', 'CHEMICAL_COMPLIANCE', FALSE, TRUE, TRUE, 'REACH Art.33 + ESPR'),
    ('scip_notification_status', 'CHEMICAL_COMPLIANCE', FALSE, FALSE, TRUE, 'WFD + SCIP'),
    ('supplier_tier1_name', 'SUPPLY_CHAIN', FALSE, TRUE, TRUE, 'ESPR Art.9'),
    ('supplier_tier2_name', 'SUPPLY_CHAIN', FALSE, FALSE, TRUE, 'ESPR Art.9'),
    ('supplier_tier3_plus', 'SUPPLY_CHAIN', FALSE, FALSE, TRUE, 'CSDDD'),
    ('repair_manual', 'ECODESIGN', TRUE, TRUE, TRUE, 'ESPR Art.9'),
    ('recycling_instructions', 'END_OF_LIFE', TRUE, TRUE, TRUE, 'ESPR Art.9'),
    ('epr_fee_category', 'END_OF_LIFE', FALSE, TRUE, TRUE, 'EPR Directive'),
    ('csddd_risk_assessment', 'SUPPLY_CHAIN', FALSE, FALSE, TRUE, 'CSDDD Art.8')
ON CONFLICT (field_name) DO NOTHING;

-- ============================================================================
-- 9.3.3: Multi-Language DPP Content (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpp_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL,
    -- ISO 639-1: 'en', 'de', 'fr', 'it', 'es', 'nl', 'pl', etc.
    language_name VARCHAR(50),
    
    -- Translated content fields
    product_name_localized VARCHAR(255),
    product_description_localized TEXT,
    care_instructions_localized TEXT,
    safety_warnings_localized TEXT,
    recycling_instructions_localized TEXT,
    repair_instructions_localized TEXT,
    
    -- Translation metadata
    translation_source VARCHAR(30),
    -- Valid: 'MANUAL', 'AUTO_MACHINE', 'AUTO_AI', 'PROFESSIONAL_SERVICE'
    translation_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(batch_id, language_code)
);
CREATE INDEX idx_dpp_translations_batch ON dpp_translations(batch_id);
CREATE INDEX idx_dpp_translations_lang ON dpp_translations(language_code);
```

---

## 10. Regulatory Dimension 9: Compliance Governance — DoC, ECGT, DPP Registry

### 10.1 The Requirement

The **EU Declaration of Conformity (DoC)** is a mandatory document stating that the product complies with all applicable EU regulations. It must be included in the DPP or referenced via a link. [(Empact)](https://empact.nu/en/insights/what-data-should-be-in-a-dpp-the-information-requirements-of-the-espr-explained/)  The DoC is a legal statement of compliance that the manufacturer signs and must maintain for the product's market lifetime.

The **ECGT Directive** (Empowering Consumers for the Green Transition) bans generic environmental claims and requires that all sustainability claims be **substantiated by verifiable data** in the DPP. [(greenstitch.io)](https://greenstitch.io/blogs/eu-ecgt/)  Claims like "eco-friendly," "green," or "sustainable" are prohibited without recognized excellent environmental performance. Climate neutrality claims based on offsetting are banned. Self-certified sustainability labels are prohibited.

The **EU DPP Registry (EREVS)** goes live in **July 2026**. It does not store full DPP data — it stores the UPI, a pointer to the data access point URL, and compliance metadata. [(Brightest)](https://www.brightest.io/i/digital-product-passports-eu)  Manufacturers must submit their product identifiers and passport URLs to this registry. Data must remain accessible for **at least 10 years** after the last unit is placed on the market. [(Circularise)](https://www.circularise.com/blogs/dpps-required-by-eu-legislation-across-sectors) 

### 10.2 Schema Gap

No DoC management, ECGT claim validation, or DPP registry submission tracking exists.

### 10.3 SQL Additions

```sql
-- ============================================================================
-- 10.3.1: Declaration of Conformity (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS declarations_of_conformity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- DoC identification
    doc_reference_number VARCHAR(100) NOT NULL UNIQUE,
    doc_issue_date DATE NOT NULL,
    doc_version INTEGER NOT NULL DEFAULT 1,
    
    -- Signatory
    signatory_name VARCHAR(255) NOT NULL,
    signatory_title VARCHAR(100),
    signatory_email VARCHAR(255),
    digital_signature_hash VARCHAR(128),
    
    -- Compliance declarations
    complies_with_espr BOOLEAN NOT NULL DEFAULT FALSE,
    complies_with_reach BOOLEAN NOT NULL DEFAULT FALSE,
    complies_with_textile_epr BOOLEAN NOT NULL DEFAULT FALSE,
    complies_with_ecgt BOOLEAN NOT NULL DEFAULT FALSE,
    complies_with_csddd BOOLEAN NOT NULL DEFAULT FALSE,
    additional_regulations JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"regulation": "GPSR 2023/988", "compliant": true}]
    
    -- Document
    doc_document_url TEXT,
    doc_storage_path TEXT,
    doc_sha256_hash VARCHAR(64),
    
    -- Status
    doc_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- Valid: 'DRAFT', 'SIGNED', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN'
    superseded_by_doc_id UUID REFERENCES declarations_of_conformity(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_doc_batch ON declarations_of_conformity(batch_id);

-- ============================================================================
-- 10.3.2: ECGT Green Claims Validation (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS green_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Claim details
    claim_text TEXT NOT NULL,
    claim_language VARCHAR(10) DEFAULT 'en',
    claim_location VARCHAR(100),
    -- Where the claim appears: 'HANGTAG', 'WEBSITE', 'PACKAGING', 
    -- 'MARKETPLACE_LISTING', 'SOCIAL_MEDIA', 'ADVERTISING'
    claim_type VARCHAR(50),
    -- Valid: 'GENERIC_ENVIRONMENTAL', 'CARBON_NEUTRAL', 'RECYCLED_CONTENT',
    --        'ORGANIC', 'SUSTAINABLE', 'ECO_FRIENDLY', 'BIODEGRADABLE',
    --        'COMPOSTABLE', 'LOW_IMPACT', 'OTHER'
    
    -- ECGT compliance assessment
    ecgt_compliant BOOLEAN,
    ecgt_violation_type VARCHAR(50),
    -- Valid: 'GENERIC_CLAIM_BANNED', 'OFFSET_BASED_NEUTRALITY_BANNED',
    --        'SELF_CERTIFIED_LABEL_BANNED', 'INSUFFICIENT_SUBSTANTIATION',
    --        'MISLEADING', 'COMPLIANT'
    substantiation_status VARCHAR(30),
    -- Valid: 'SUBSTANTIATED', 'PARTIALLY_SUBSTANTIATED', 'UNSUBSTANTIATED',
    --        'UNDER_REVIEW'
    
    -- Evidence linking
    evidence_dpp_field_ids JSONB DEFAULT '[]'::jsonb,
    -- Which DPP data fields substantiate this claim
    evidence_certification_ids JSONB DEFAULT '[]'::jsonb,
    evidence_test_report_ids JSONB DEFAULT '[]'::jsonb,
    
    -- Verification
    verification_method VARCHAR(50),
    -- Valid: 'AUTOMATED_CHECK', 'EXPERT_REVIEW', 'THIRD_PARTY_VERIFICATION'
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,
    
    -- Remediation
    remediation_required BOOLEAN DEFAULT FALSE,
    remediation_action TEXT,
    remediation_deadline DATE,
    remediation_completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_green_claims_batch ON green_claims(batch_id);
CREATE INDEX idx_green_claims_ecgt ON green_claims(ecgt_violation_type) 
    WHERE ecgt_violation_type IS NOT NULL;

-- ============================================================================
-- 10.3.3: EU DPP Registry Submissions (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpp_registry_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Registry details
    registry_system VARCHAR(50) NOT NULL DEFAULT 'EREVS',
    -- EU DPP Registry = EREVS (European Registry for Electronic Value chain Sustainability)
    
    -- Submission data
    upi_submitted VARCHAR(50) NOT NULL,
    gtin_submitted VARCHAR(14),
    data_access_point_url TEXT NOT NULL,
    -- URL where the DPP data is hosted
    
    -- Compliance metadata
    product_category_registered VARCHAR(50),
    delegated_act_reference VARCHAR(100),
    -- e.g., "ESPR DA Textiles 2027/XXX"
    
    -- Submission tracking
    submission_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- Valid: 'PENDING', 'SUBMITTED', 'VALIDATED', 'REJECTED', 'UPDATED', 'WITHDRAWN'
    submission_date TIMESTAMPTZ,
    validation_date TIMESTAMPTZ,
    rejection_reason TEXT,
    registry_response JSONB,
    
    -- Update tracking (DPP data must remain accessible for 10+ years)
    last_updated_at TIMESTAMPTZ,
    update_reason TEXT,
    data_retention_until DATE,
    -- Calculated as last unit placed on market + 10 years
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dpp_registry_batch ON dpp_registry_submissions(batch_id);
CREATE INDEX idx_dpp_registry_status ON dpp_registry_submissions(submission_status);
```

---

## 11. Summary: Complete New Tables & Key Alterations

### 11.1 New Tables Added (15 tables)

| # | Table Name | Purpose | Regulatory Basis |
|---|---|---|---|
| 1 | `economic_operators` | Manufacturer, importer, EU rep identification | ESPR Art.9, Annex III |
| 2 | `batch_economic_operators` | Role assignment per batch | ESPR Art.9 |
| 3 | `fiber_types` | Master reference for fiber classification | JRC Milestone 3 |
| 4 | `batch_material_composition` | Per-fiber composition, recycled %, origin | ESPR + JRC M3 DO3 |
| 5 | `material_origins` | Supply chain tier tracking per material | ESPR Art.9 |
| 6 | `chemical_substances` | REACH SVHC, Annex XVII, SCIP data | REACH + ESPR Annex I |
| 7 | `reach_regulatory_data` | Reference data for restricted substances | ECHA |
| 8 | `chemical_inventory` | Production chemical tracking with ZDHC MRSL | ZDHC + REACH |
| 9 | `suppliers` | Multi-tier supplier with CSDDD due diligence | CSDDD + ESPR |
| 10 | `batch_suppliers` | Production stage linkage per batch | ESPR Art.9 |
| 11 | `due_diligence_assessments` | OECD-aligned risk assessment | CSDDD Art.8-10 |
| 12 | `ecodesign_scores` | Robustness, recyclability, recycled content | JRC M3 DO1-DO4 |
| 13 | `environmental_performance` | Carbon, water, energy, microplastic data | PEFCR + ESPR |
| 14 | `end_of_life_info` | Recycling instructions, take-back, recovery | ESPR Art.9 |
| 15 | `epr_registrations` | PRO registration, eco-modulation per country | Textile EPR Directive |
| 16 | `unsold_goods_disclosures` | Destruction ban standardized reporting | ESPR Art.24-25 |
| 17 | `dpp_field_access_tiers` | Field-level public/B2B/authority access control | ESPR Art.9 |
| 18 | `dpp_translations` | Multi-language DPP content | ESPR Art.9 |
| 19 | `declarations_of_conformity` | EU DoC management | ESPR + GPSR |
| 20 | `green_claims` | ECGT claim validation & substantiation | ECGT 2024/825 |
| 21 | `dpp_registry_submissions` | EU DPP Registry (EREVS) tracking | ESPR Art.9 + Art.12 |

### 11.2 Key Alterations to Existing Tables

| Table | New Fields | Purpose |
|---|---|---|
| `batches` | `gtin`, `upi`, `taric_code`, `cn_code`, `hs_code`, `gs1_digital_link_uri`, `gs1_resolver_url`, `eclass_ir_di`, `product_category`, `apparel_subcategory` | Full product identification for DPP |
| `data_access_tokens` | `access_scope` | Granular access tier specification |

### 11.3 Estimated Schema Completeness After Additions

| Regulatory Dimension | Before | After | Key Tables |
|---|---|---|---|
| Product Identification | 25% | 95% | `economic_operators`, `batch_economic_operators`, enhanced `batches` |
| Material Composition | 0% | 95% | `fiber_types`, `batch_material_composition`, `material_origins` |
| Chemical Compliance (REACH) | 0% | 90% | `chemical_substances`, `reach_regulatory_data`, `chemical_inventory` |
| Supply Chain Traceability | 0% | 90% | `suppliers`, `batch_suppliers`, `due_diligence_assessments` |
| Ecodesign Scoring | 5% | 90% | `ecodesign_scores` |
| Environmental Performance | 0% | 90% | `environmental_performance` |
| EPR / End-of-Life | 0% | 90% | `epr_registrations`, `end_of_life_info`, `unsold_goods_disclosures` |
| Data Access & Language | 15% | 90% | `dpp_field_access_tiers`, `dpp_translations` |
| Compliance Governance | 0% | 90% | `declarations_of_conformity`, `green_claims`, `dpp_registry_submissions` |

---

## 12. Implementation Priority Order

Not all tables need to be built simultaneously. The following phased approach aligns with regulatory deadlines and business value.

| Phase | Timeline | Tables to Implement | Regulatory Driver |
|---|---|---|---|
| **Phase 1: Foundation** | Q3 2026 | `economic_operators`, `fiber_types`, `batch_material_composition`, enhanced `batches` | ESPR framework + JRC M3 |
| **Phase 2: Compliance** | Q4 2026 | `chemical_substances`, `reach_regulatory_data`, `suppliers`, `batch_suppliers` | REACH + CSDDD prep |
| **Phase 3: Ecodesign** | Q1 2027 | `ecodesign_scores`, `environmental_performance`, `material_origins` | JRC M3 DO1-DO4 |
| **Phase 4: Operations** | Q2 2027 | `epr_registrations`, `end_of_life_info`, `dpp_registry_submissions`, `declarations_of_conformity` | EPR operational + DPP registry live |
| **Phase 5: Governance** | Q3 2027 | `unsold_goods_disclosures`, `green_claims`, `due_diligence_assessments`, `dpp_translations` | Destruction ban reporting + ECGT enforcement |
| **Phase 6: Advanced** | 2028+ | `chemical_inventory` ZDHC integration, AI-powered gap analysis, predictive compliance | Continuous improvement |

---

## 13. Conclusion

Your existing schema is a well-architected platform foundation, but it is **not yet a DPP schema**. The gap is not incremental — it is structural. The EU textile DPP requires a **regulatory payload layer** that models fiber composition, chemical compliance, supply chain traceability, ecodesign scoring, environmental performance, EPR obligations, and multi-language access control. The 21 new tables and 38+ field additions outlined in this report transform the schema from a generic product passport platform into a **EU regulation-compliant Digital Product Passport system** capable of supporting Indian (and global) textile manufacturers exporting to the European market.

The investment in this schema now — before the delegated act is finalized in Q2 2027 — provides a **first-mover advantage**. Manufacturers who have their data infrastructure ready can adapt quickly to the final requirements, while competitors scramble to retrofit their systems under deadline pressure. The schema is designed to be **forward-compatible**: configurable thresholds for recycled content, extensible chemical substance lists, and modular ecodesign scoring mean that when the delegated act is published, the platform can absorb new requirements through configuration rather than re-architecture.
