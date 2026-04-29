# Generic Digital Product Passport (DPP) Engine — Architecture Design

> **Status:** NOT YET IMPLEMENTED — This document defines the target architecture  
> **Purpose:** Extend the current battery-only passport engine into a domain-agnostic DPP platform that supports batteries, textiles, electronics, and any future product category  
> **Based on:** Full review of the existing codebase as of 2026-03-29

---

## Table of Contents

1. [Current State: What's Hardcoded for Batteries](#1-current-state-whats-hardcoded-for-batteries)
2. [The Problem We're Solving](#2-the-problem-were-solving)
3. [Core Design Principle: Domain Registry Pattern](#3-core-design-principle-domain-registry-pattern)
4. [New Data Models Required](#4-new-data-models-required)
5. [What Stays vs What Changes vs What's New](#5-what-stays-vs-what-changes-vs-whats-new)
6. [Domain Definitions: Battery, Textile, Electronics](#6-domain-definitions-battery-textile-electronics)
7. [Generic Lifecycle Engine Design](#7-generic-lifecycle-engine-design)
8. [Generic Compliance Gate Design](#8-generic-compliance-gate-design)
9. [Database Migration Strategy](#9-database-migration-strategy)
10. [API Changes](#10-api-changes)
11. [Serial Number (DPP ID) Strategy](#11-serial-number-dpp-id-strategy)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Current State: What's Hardcoded for Batteries

Every layer of the current engine is battery-specific. This table shows exactly what needs to change:

| Component | Battery-Specific Code | Location |
|-----------|----------------------|----------|
| `BatchSpec` struct | `Chemistry`, `NominalVoltage`, `Capacity`, `CellSource` | `models/models.go` |
| `MaterialComposition` | `CobaltPct`, `LithiumPct`, `NickelPct`, `GraphitePct` | `models/models.go` |
| `HazardousSubstances` | Lead/Mercury/Cadmium — EU Battery/REACH specific | `models/models.go` |
| Compliance gate | AIS-156, AIS-038, BIS R-Number, EPR, PLI, DVA | `services/activation_compliance.go` |
| Carbon calculator | Cell chemistry factors (LFP/NMC/NCA…) | `services/carbon_calculator.go` |
| BPAN serial format | `{REGION}-{MFR}-{CHEM}-{YEAR}-{NNNNN}` — chemistry in serial | `services/bpan_service.go` |
| Lifecycle states | `RECYCLED`, `IN_SERVICE` — battery semantics | `models/models.go` |
| Evidence requirements | `recycler_epr_id`, `bill_of_entry_no` | `models/evidence.go` |
| Passport events | `SOH_UPDATED`, `REPAIR_LOGGED` | `models/models.go` |
| DB schema (38 migrations) | `carbon_footprint_result`, `bis_r_number`, `epr_registration_number` | `db/migrations/` |

**Bottom line:** The domain is tightly coupled into typed Go structs and SQL columns. Supporting textiles or electronics would require either duplicating the entire codebase (bad) or refactoring to a domain-configurable architecture (the right approach).

---

## 2. The Problem We're Solving

The EU's Digital Product Passport (DPP) regulation under the **Ecodesign for Sustainable Products Regulation (ESPR 2024/1781)** will mandate DPPs for:

| Product Category | EU Mandate Deadline |
|-----------------|-------------------|
| Batteries | Feb 2027 (already law) |
| Textiles & Apparel | 2026–2027 |
| Electronics & ICT | 2027–2028 |
| Construction Products | 2028 |
| Furniture | 2028–2029 |
| Chemicals | 2030 |

**All categories share the same DPP architecture requirements:**
- Unique product identifier (UUID + QR)
- Three-tier data access (Public / Authorized / Regulator)
- Immutable audit trail
- Carbon/environmental footprint
- Material composition / supply chain traceability
- Lifecycle state tracking

**Only the _domain-specific compliance rules_ differ** between product types.

The correct engineering response is: **build one passport engine, configure it per domain**.

---

## 3. Core Design Principle: Domain Registry Pattern

Instead of a fixed `BatchSpec` struct with battery fields, introduce a **Domain Registry** — a database-driven configuration that defines:

1. **What attributes a product in this domain has** (its "schema")
2. **What compliance rules must pass before activation**
3. **What lifecycle states and transitions are valid**
4. **What evidence is required for each transition**
5. **What the serial number format encodes**

```
┌─────────────────────────────────────────────────────────────┐
│                    Domain Registry                           │
│                                                              │
│  Domain: BATTERY                                             │
│    attributes_schema: { chemistry, voltage, capacity, ... }  │
│    compliance_rules: [ battery_eu_2023_1542, india_bwm ]     │
│    lifecycle_states: [ CREATED → ACTIVE → SHIPPED → ... ]    │
│    serial_format: REGION-MFR-CHEM-YEAR-SEQ                   │
│                                                              │
│  Domain: TEXTILE                                             │
│    attributes_schema: { fiber_composition, dyestuff, ... }   │
│    compliance_rules: [ eu_espr_textile, gots_standard ]      │
│    lifecycle_states: [ CREATED → ACTIVE → SOLD → RETURNED ]  │
│    serial_format: REGION-MFR-CAT-YEAR-SEQ                    │
│                                                              │
│  Domain: ELECTRONICS                                         │
│    attributes_schema: { chip_type, rare_earth_metals, ... }  │
│    compliance_rules: [ eu_weee, rohs_recast ]                │
│    lifecycle_states: [ CREATED → ACTIVE → IN_USE → E_WASTE ] │
│    serial_format: REGION-MFR-CAT-YEAR-SEQ                    │
└─────────────────────────────────────────────────────────────┘
```

The rest of the engine — passports, events, QR codes, three-tier access, hash chain — stays **completely unchanged**.

---

## 4. New Data Models Required

### 4.1 `ProductDomain` — The domain registry entry

```go
// ProductDomain defines a product category and its DPP configuration.
// Each domain is configured once; all batches and passports belong to a domain.
type ProductDomain struct {
    ID           uuid.UUID       `json:"id"`
    Code         string          `json:"code"`         // "BATTERY", "TEXTILE", "ELECTRONICS"
    Name         string          `json:"name"`         // "Lithium-Ion Battery"
    Version      string          `json:"version"`      // "1.0", "2.0" for schema evolution
    
    // JSON Schema for domain-specific product attributes (validates ProductAttributes)
    AttributesSchema json.RawMessage `json:"attributes_schema"`
    
    // Ordered list of compliance rule IDs to run at activation
    ComplianceRules  []string        `json:"compliance_rules"`
    
    // Lifecycle configuration (if nil, uses default battery lifecycle)
    LifecycleConfig  *DomainLifecycleConfig `json:"lifecycle_config,omitempty"`
    
    // Serial number template (if nil, uses default BPAN-style)
    SerialTemplate   *DomainSerialTemplate  `json:"serial_template,omitempty"`
    
    // EU regulation reference
    EURegulation     string          `json:"eu_regulation,omitempty"` // "2023/1542", "ESPR/TEXTILE"
    
    CreatedAt    time.Time       `json:"created_at"`
    IsActive     bool            `json:"is_active"`
}
```

### 4.2 `ProductAttributes` — Replaces `BatchSpec`

```go
// ProductAttributes is a domain-flexible replacement for the battery-only BatchSpec.
// Common fields are typed; domain-specific fields live in the Attributes JSONB blob.
type ProductAttributes struct {
    // Universal fields — present for ALL domains
    Manufacturer        string `json:"manufacturer"`
    ManufacturerAddress string `json:"manufacturer_address,omitempty"`
    CountryOfOrigin     string `json:"country_of_origin"`
    Weight              string `json:"weight,omitempty"`
    CarbonFootprint     string `json:"carbon_footprint,omitempty"`
    Certifications      []string `json:"certifications,omitempty"`
    
    // EU Universal DPP fields (ESPR 2024/1781)
    EURepresentative      string `json:"eu_representative,omitempty"`
    EURepresentativeEmail string `json:"eu_representative_email,omitempty"`
    WarrantyMonths        *int   `json:"warranty_months,omitempty"`
    RecycledContentPct    *float64 `json:"recycled_content_pct,omitempty"`
    
    // Domain-specific attributes (validated against domain's AttributesSchema)
    // For BATTERY: { "chemistry": "LFP", "voltage": "3.7V", "capacity": "5000mAh", ... }
    // For TEXTILE: { "fiber_composition": "80% cotton, 20% polyester", "dyestuff": "AZO-free", ... }
    // For ELECTRONICS: { "chip_type": "ARM Cortex-M4", "display_type": "OLED", ... }
    Attributes json.RawMessage `json:"attributes"`
    
    // Carbon footprint calculator result (domain-specific calculator)
    CarbonFootprintResult json.RawMessage `json:"carbon_footprint_result,omitempty"`
}
```

### 4.3 Updated `Batch` — Now domain-aware

```go
// Batch now has a DomainID instead of hardcoded battery fields
type Batch struct {
    ID        uuid.UUID `json:"id"`
    TenantID  uuid.UUID `json:"tenant_id"`
    DomainID  uuid.UUID `json:"domain_id"`   // NEW: links to ProductDomain
    BatchName string    `json:"batch_name"`
    ModelName string    `json:"model_name"`
    
    // Flexible specs (replaces the battery-only BatchSpec)
    Attributes ProductAttributes `json:"attributes"`
    
    Status    string       `json:"status"`        // DRAFT, ACTIVE, ARCHIVED
    MarketRegion MarketRegion `json:"market_region"` // INDIA, EU, GLOBAL
    
    // Manufacturing window
    ManufacturingStartDate *time.Time `json:"manufacturing_start_date,omitempty"`
    ManufacturingEndDate   *time.Time `json:"manufacturing_end_date,omitempty"`
    
    // India import/customs fields (relevant to ANY import product, not just batteries)
    BillOfEntryNo   string     `json:"bill_of_entry_no,omitempty"`
    CountryOfOrigin string     `json:"country_of_origin,omitempty"`
    CustomsDate     *time.Time `json:"customs_date,omitempty"`
    HSNCode         string     `json:"hsn_code,omitempty"`
    
    TotalPassports int       `json:"total_passports"`
    CreatedAt      time.Time `json:"created_at"`
}
```

### 4.4 `DomainLifecycleConfig` — Configurable states per domain

```go
// DomainLifecycleConfig defines domain-specific lifecycle states and transitions.
// If a domain uses the default battery lifecycle, this is nil.
type DomainLifecycleConfig struct {
    States      []DomainState      `json:"states"`
    Transitions []DomainTransition `json:"transitions"`
}

type DomainState struct {
    Code        string `json:"code"`        // e.g. "MANUFACTURED", "IN_STORE", "SOLD"
    Description string `json:"description"`
    IsFinal     bool   `json:"is_final"`    // No further transitions from this state
}

type DomainTransition struct {
    Action      string   `json:"action"`       // e.g. "SELL", "RETURN", "DONATE"
    FromStates  []string `json:"from_states"`  // Allowed source states
    ToState     string   `json:"to_state"`     // Target state
    AllowedRoles []string `json:"allowed_roles"` // Which roles can perform this
    RequiredEvidence []string `json:"required_evidence,omitempty"` // Evidence fields
}
```

### 4.5 `ComplianceRule` — Pluggable validation rules

```go
// ComplianceRule is a named validation rule that can be attached to a domain.
// Rules are evaluated at batch activation time.
type ComplianceRule struct {
    ID          string                 `json:"id"`   // "battery_eu_2023_1542", "textile_reach"
    Name        string                 `json:"name"`
    Market      string                 `json:"market"` // "EU", "INDIA", "GLOBAL"
    
    // Validator function registered at startup (not serialized)
    // Signature: func(batch *Batch, tenant *Tenant) ActivationComplianceResult
    Validator   ComplianceValidatorFn  `json:"-"`
}

type ComplianceValidatorFn func(batch *Batch, tenant *Tenant) ActivationComplianceResult

// ComplianceRuleRegistry maps rule IDs to their validator functions.
// New domains register their rules here at startup.
var ComplianceRuleRegistry = map[string]ComplianceValidatorFn{}
```

---

## 5. What Stays vs What Changes vs What's New

### ✅ Stays Exactly the Same (Zero Changes)

These components are already domain-agnostic:

| Component | Why It's Safe |
|-----------|--------------|
| `Passport` struct (UUID, SerialNumber, Status, lifecycle timestamps) | Domain-neutral identity |
| `PassportEvent` + SHA-256 hash chain | Domain-neutral audit trail |
| Three-tier data access (Public/Partner/Regulator) | EU DPP mandate applies to ALL domains |
| Magic-link external access | Domain-neutral |
| QR code generation service | URL-based, domain-neutral |
| Tenant / Team / Quota system | Domain-neutral |
| Auth / JWT / API keys | Domain-neutral |
| Audit CSV/PDF export | Domain-neutral |
| `ActorContext` + Role enforcement pattern | Domain-neutral |
| DB migration runner | Infrastructure, domain-neutral |

### 🔄 Changes (Refactor, No Rewrite)

| Component | Change Required |
|-----------|----------------|
| `BatchSpec` struct | Replace with `ProductAttributes` (typed common fields + JSONB `attributes`) |
| `Batch` struct | Add `DomainID uuid.UUID` field |
| `ActivationCompliance` | Replace hardcoded battery checks with pluggable `ComplianceRule` registry |
| `access_views.go` (BuildPublicView etc.) | Render `attributes` JSONB instead of typed battery fields |
| BPAN serial service | Replace `{CHEM}` segment with `{DOMAIN_CODE}` for non-battery domains |
| Carbon calculator | Wrap behind a `CarbonCalculatorProvider` interface — battery uses existing JRC calc |
| `CreateBatchRequest` | Replace battery-only fields with domain-id + generic attributes |
| DB schema | Add `domain_id` to `batches`; rename `specs` → `attributes` JSONB |

### 🆕 New (Build Fresh)

| Component | Purpose |
|-----------|---------|
| `ProductDomain` model + DB table | Domain registry |
| `DomainLifecycleConfig` | Per-domain state machine config |
| `ComplianceRuleRegistry` | Pluggable rule map, initialized at startup |
| `TextileComplianceValidator` | EU ESPR textile rules, GOTS, OEKO-TEX |
| `ElectronicsComplianceValidator` | WEEE, RoHS Recast rules |
| Domain admin UI | Create/manage domains (superadmin feature) |
| JSON Schema validator | Validate `attributes` blob against domain's schema |

---

## 6. Domain Definitions: Battery, Textile, Electronics

### 6.1 Battery Domain (current, translated to new model)

```json
{
  "code": "BATTERY",
  "name": "Rechargeable Battery",
  "eu_regulation": "EU 2023/1542",
  "attributes_schema": {
    "required": ["chemistry", "voltage", "capacity"],
    "properties": {
      "chemistry":       { "type": "string", "enum": ["LFP", "NMC", "NCA", "LCO", "LTO", "SODIUM"] },
      "voltage":         { "type": "string" },
      "capacity":        { "type": "string" },
      "cell_source":     { "type": "string", "enum": ["IMPORTED", "DOMESTIC"] },
      "material_composition": {
        "type": "object",
        "properties": {
          "cobalt_pct":   { "type": "number" },
          "lithium_pct":  { "type": "number" },
          "nickel_pct":   { "type": "number" },
          "graphite_pct": { "type": "number" }
        }
      },
      "expected_lifetime_cycles": { "type": "integer" }
    }
  },
  "compliance_rules": ["battery_india_bwm", "battery_eu_2023_1542"],
  "lifecycle_config": null,
  "serial_template": {
    "format": "{REGION}-{MFR}-{DOMAIN_CODE}-{YEAR}-{SEQ5}",
    "domain_code_field": "chemistry"
  }
}
```

### 6.2 Textile Domain (new)

```json
{
  "code": "TEXTILE",
  "name": "Textile & Apparel",
  "eu_regulation": "ESPR 2024/1781 (Textile Annex)",
  "attributes_schema": {
    "required": ["fiber_composition", "country_of_manufacture"],
    "properties": {
      "fiber_composition": {
        "type": "string",
        "description": "e.g. '80% organic cotton, 20% recycled polyester'"
      },
      "dyestuff":          { "type": "string", "description": "AZO-free, GOTS-certified, etc." },
      "chemical_treatment":{ "type": "string" },
      "microplastics_risk":{ "type": "string", "enum": ["LOW", "MEDIUM", "HIGH"] },
      "gots_certified":    { "type": "boolean" },
      "oeko_tex_class":    { "type": "string", "enum": ["I", "II", "III", "IV"] },
      "recycled_fiber_pct":{ "type": "number" },
      "care_instructions": { "type": "string" },
      "end_of_life_instructions": { "type": "string" }
    }
  },
  "compliance_rules": ["textile_eu_espr", "textile_reach"],
  "lifecycle_config": {
    "states": [
      { "code": "CREATED",      "description": "Passport generated" },
      { "code": "ACTIVE",       "description": "Ready for sale" },
      { "code": "IN_STORE",     "description": "In retail inventory" },
      { "code": "SOLD",         "description": "Purchased by consumer" },
      { "code": "RETURNED",     "description": "Returned by consumer" },
      { "code": "DONATED",      "description": "Donated for reuse" },
      { "code": "RECYCLED",     "description": "Collected for fiber recycling", "is_final": false },
      { "code": "END_OF_LIFE",  "description": "Lifecycle closed", "is_final": true }
    ],
    "transitions": [
      { "action": "ACTIVATE", "from_states": ["CREATED"],   "to_state": "ACTIVE",    "allowed_roles": ["SYSTEM"] },
      { "action": "STOCK",    "from_states": ["ACTIVE"],    "to_state": "IN_STORE",  "allowed_roles": ["INTERNAL_OPERATOR"] },
      { "action": "SELL",     "from_states": ["IN_STORE"],  "to_state": "SOLD",      "allowed_roles": ["INTERNAL_OPERATOR", "PARTNER"],
        "required_evidence": ["sale_date", "retailer_id"] },
      { "action": "RETURN",   "from_states": ["SOLD"],      "to_state": "RETURNED",  "allowed_roles": ["INTERNAL_OPERATOR", "PARTNER"],
        "required_evidence": ["return_date", "return_reason"] },
      { "action": "DONATE",   "from_states": ["RETURNED"],  "to_state": "DONATED",   "allowed_roles": ["INTERNAL_OPERATOR"] },
      { "action": "RECYCLE",  "from_states": ["RETURNED", "DONATED"], "to_state": "RECYCLED", "allowed_roles": ["RECYCLER"],
        "required_evidence": ["recycler_id", "recycling_date", "certificate_reference"] },
      { "action": "CLOSE",    "from_states": ["RECYCLED"],  "to_state": "END_OF_LIFE", "allowed_roles": ["SYSTEM", "RECYCLER"] }
    ]
  },
  "serial_template": {
    "format": "{REGION}-{MFR}-TX-{YEAR}-{SEQ5}"
  }
}
```

### 6.3 Electronics Domain (new)

```json
{
  "code": "ELECTRONICS",
  "name": "Electronic Equipment",
  "eu_regulation": "WEEE 2012/19/EU + RoHS Recast",
  "attributes_schema": {
    "required": ["product_category", "rare_earth_content"],
    "properties": {
      "product_category":  { "type": "string", "description": "LAPTOP, PHONE, TABLET, etc." },
      "chip_architecture": { "type": "string" },
      "display_type":      { "type": "string" },
      "battery_type":      { "type": "string", "description": "Built-in battery chemistry" },
      "rare_earth_content":{ "type": "object", "description": "Neodymium %, Dysprosium %, etc." },
      "repairability_score": { "type": "number", "minimum": 0, "maximum": 10 },
      "spare_parts_availability_years": { "type": "integer" },
      "rohs_compliant":    { "type": "boolean" },
      "weee_category":     { "type": "integer", "minimum": 1, "maximum": 11 }
    }
  },
  "compliance_rules": ["electronics_weee", "electronics_rohs"],
  "lifecycle_config": {
    "states": [
      { "code": "CREATED" },
      { "code": "ACTIVE" },
      { "code": "IN_USE" },
      { "code": "REPAIRED" },
      { "code": "REFURBISHED" },
      { "code": "E_WASTE" },
      { "code": "END_OF_LIFE", "is_final": true }
    ],
    "transitions": [
      { "action": "ACTIVATE",   "from_states": ["CREATED"],             "to_state": "ACTIVE",      "allowed_roles": ["SYSTEM"] },
      { "action": "DEPLOY",     "from_states": ["ACTIVE"],              "to_state": "IN_USE",      "allowed_roles": ["INTERNAL_OPERATOR"] },
      { "action": "REPAIR",     "from_states": ["IN_USE"],              "to_state": "REPAIRED",    "allowed_roles": ["TECHNICIAN"],
        "required_evidence": ["repair_date", "technician_id", "parts_replaced"] },
      { "action": "REFURBISH",  "from_states": ["IN_USE", "REPAIRED"],  "to_state": "REFURBISHED", "allowed_roles": ["TECHNICIAN"] },
      { "action": "DISPOSE",    "from_states": ["IN_USE", "REPAIRED"],  "to_state": "E_WASTE",     "allowed_roles": ["RECYCLER"],
        "required_evidence": ["weee_certificate", "disposal_date"] },
      { "action": "CLOSE",      "from_states": ["E_WASTE"],             "to_state": "END_OF_LIFE", "allowed_roles": ["SYSTEM"] }
    ]
  }
}
```

---

## 7. Generic Lifecycle Engine Design

The `LifecycleService` must be refactored to load transitions from the domain config instead of the hardcoded `TransitionMap`:

```go
// GenericLifecycleService replaces the battery-specific LifecycleService
type GenericLifecycleService struct {
    repo         LifecycleRepository
    domainRepo   DomainRepository
    // Cache of loaded domain configs to avoid DB hit per transition
    domainCache  map[uuid.UUID]*models.ProductDomain
}

// ApplyTransition — now loads allowed transitions from domain config
func (s *GenericLifecycleService) ApplyTransition(ctx context.Context, req TransitionRequest) (*TransitionResult, error) {
    passport, _ := s.repo.GetPassportByUUID(ctx, req.PassportID)
    
    // Load the domain config for this passport's batch
    domain, _ := s.domainRepo.GetDomainForPassport(ctx, req.PassportID)
    
    // Get transition rules: use domain's config if present, else fall back to default (battery)
    transitions := s.resolveTransitions(domain)
    
    // Validate action exists in THIS domain's transition map
    transition, ok := transitions[req.Action]
    if !ok {
        return nil, ErrUnknownAction
    }
    
    // Validate state, role, evidence — same logic, now driven by domain config
    // ...
}

func (s *GenericLifecycleService) resolveTransitions(domain *models.ProductDomain) map[string]DomainTransition {
    if domain.LifecycleConfig != nil {
        // Build map from domain's custom lifecycle
        return buildTransitionMap(domain.LifecycleConfig.Transitions)
    }
    // Fall back to default battery lifecycle (backward compatible)
    return DefaultBatteryTransitions
}
```

---

## 8. Generic Compliance Gate Design

Replace the hardcoded `ValidateActivationCompliance` with a rule registry:

```go
// ValidateActivationCompliance — now domain-driven
func ValidateActivationCompliance(batch *models.Batch, tenant *models.Tenant, domain *models.ProductDomain) ActivationComplianceResult {
    missing := []string{}
    errors  := []string{}

    // 1. Universal rules — apply to ALL domains
    if batch.ModelName == "" {
        missing = append(missing, "batch.model_name")
    }
    if batch.ManufacturingStartDate == nil {
        missing = append(missing, "batch.manufacturing_start_date")
    }

    // 2. Domain-specific rules from registry
    for _, ruleID := range domain.ComplianceRules {
        validator, exists := ComplianceRuleRegistry[ruleID]
        if !exists {
            errors = append(errors, fmt.Sprintf("Unknown compliance rule: %s", ruleID))
            continue
        }
        result := validator(batch, tenant)
        missing = append(missing, result.Missing...)
        errors  = append(errors, result.Errors...)
    }

    return ActivationComplianceResult{
        Valid:   len(missing) == 0 && len(errors) == 0,
        Missing: missing,
        Errors:  errors,
    }
}

// --- Startup: Register rules for each domain ---

func init() {
    // Battery rules (current logic, moved into named functions)
    ComplianceRuleRegistry["battery_india_bwm"]    = validateBatteryIndia
    ComplianceRuleRegistry["battery_eu_2023_1542"] = validateBatteryEU
    
    // Textile rules (new)
    ComplianceRuleRegistry["textile_eu_espr"]  = validateTextileEU
    ComplianceRuleRegistry["textile_reach"]    = validateTextileREACH
    
    // Electronics rules (new)
    ComplianceRuleRegistry["electronics_weee"] = validateElectronicsWEEE
    ComplianceRuleRegistry["electronics_rohs"] = validateElectronicsRoHS
}

// Battery EU validator — extracted from current activation_compliance.go
func validateBatteryEU(batch *models.Batch, tenant *models.Tenant) ActivationComplianceResult {
    // Same logic as current validateEUActivation()
}

// Textile EU validator — new
func validateTextileEU(batch *models.Batch, tenant *models.Tenant) ActivationComplianceResult {
    missing := []string{}
    attrs := batch.Attributes.GetDomainAttributes() // Parses the attributes JSONB
    
    if attrs["fiber_composition"] == "" {
        missing = append(missing, "attributes.fiber_composition")
    }
    if attrs["dyestuff"] == "" {
        missing = append(missing, "attributes.dyestuff (EU ESPR chemical transparency)")
    }
    // ... etc
    
    return ActivationComplianceResult{Valid: len(missing) == 0, Missing: missing}
}
```

---

## 9. Database Migration Strategy

**Migration 000039 — Add domain registry:**

```sql
-- New table: product_domains
CREATE TABLE product_domains (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(50) NOT NULL UNIQUE,  -- "BATTERY", "TEXTILE"
    name              VARCHAR(200) NOT NULL,
    version           VARCHAR(20) NOT NULL DEFAULT '1.0',
    attributes_schema JSONB NOT NULL,
    compliance_rules  JSONB NOT NULL DEFAULT '[]',
    lifecycle_config  JSONB,
    serial_template   JSONB,
    eu_regulation     VARCHAR(200),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: insert the battery domain (migrates existing data with zero downtime)
INSERT INTO product_domains (code, name, attributes_schema, compliance_rules, eu_regulation)
VALUES (
    'BATTERY',
    'Rechargeable Battery',
    '{}',  -- attributes_schema populated separately
    '["battery_india_bwm", "battery_eu_2023_1542"]',
    'EU 2023/1542'
);

-- Add domain_id to batches (nullable for backward compat, filled by migration job)
ALTER TABLE batches ADD COLUMN domain_id UUID REFERENCES product_domains(id);

-- Backfill all existing batches to the BATTERY domain
UPDATE batches b
SET domain_id = (SELECT id FROM product_domains WHERE code = 'BATTERY');

-- Add attributes JSONB column (mirrors existing specs but domain-agnostic name)
ALTER TABLE batches ADD COLUMN attributes_v2 JSONB;

-- Backfill: copy existing specs → attributes_v2 (same JSONB content)
UPDATE batches SET attributes_v2 = specs;
```

**Migration 000040 — Swap column names (zero-downtime):**
```sql
-- After code is deployed reading attributes_v2, drop old specs
ALTER TABLE batches RENAME COLUMN specs TO specs_battery_legacy;
ALTER TABLE batches RENAME COLUMN attributes_v2 TO attributes;
-- Keep legacy column for 30 days, then drop in migration 000041
```

**Key principle:** All existing battery data is preserved. The migration is purely additive until the swap, which is a fast rename operation.

---

## 10. API Changes

### New endpoints

```
GET  /api/v1/domains                          — List all active product domains
GET  /api/v1/domains/{code}                   — Get domain config (schema, rules, lifecycle)
POST /api/v1/admin/domains                    — Create new domain (superadmin only)
PUT  /api/v1/admin/domains/{code}             — Update domain schema/rules (superadmin)
```

### Changed endpoints

```
POST /api/v1/batches
  Before: { batch_name, specs: { chemistry, voltage, ... }, market_region }
  After:  { batch_name, domain_id, attributes: { ...domain-specific... }, market_region }

GET /api/v1/passports/{uuid}
  Response now includes domain_code in the view (PUBLIC/PARTNER/REGULATOR)
  Public attributes rendered based on domain's schema, not hardcoded battery fields
```

### Backward compatibility

The existing battery API shape (`specs.chemistry`, `specs.voltage`, etc.) is maintained as an alias during a transition period. The backend maps `specs.chemistry` → `attributes.chemistry` transparently. No breaking change for existing integrations.

---

## 11. Serial Number (DPP ID) Strategy

Current BPAN format encodes battery chemistry in the serial: `IN-TEN-LFP-2026-00001`

Generic DPP format should encode domain code instead:

```
{REGION}-{MFR}-{DOMAIN_CODE}-{YEAR}-{NNNNN}
```

| Domain | Domain Code | Example Serial |
|--------|------------|----------------|
| Battery (LFP) | `LFP` (chemistry, backward compat) | `IN-TEN-LFP-2026-00001` |
| Battery (NMC) | `NMC` | `EU-TEN-NMC-2026-00042` |
| Textile | `TX` | `EU-ABS-TX-2026-00001` |
| Electronics | `EL` | `EU-SAM-EL-2026-00099` |
| Furniture | `FN` | `EU-IKE-FN-2027-00001` |

Battery serials retain full backward compatibility (chemistry code IS the domain code for batteries).

---

## 12. Implementation Roadmap

### Phase 1 — Foundation (no breaking changes, 2–3 weeks)
- [ ] Add `product_domains` table and seed the BATTERY domain
- [ ] Add `domain_id` to batches (nullable, backfill to BATTERY)
- [ ] Add `attributes` JSONB column (copy of `specs`, read from both)
- [ ] Extract `validateBatteryEU` and `validateBatteryIndia` into named functions
- [ ] Create `ComplianceRuleRegistry` and register battery rules
- [ ] Wrap existing `TransitionMap` as `DefaultBatteryTransitions`
- [ ] All tests pass unchanged

### Phase 2 — Generic Engine (2–3 weeks)
- [ ] Implement `GenericLifecycleService` with domain-config-driven transitions
- [ ] Implement domain-driven `ValidateActivationCompliance`
- [ ] Implement `DomainRepository` (load domain, cache it)
- [ ] Update `BuildPublicView` / `BuildPartnerView` to render JSONB attributes generically
- [ ] Update `CreateBatchRequest` to accept `domain_id` (battery fields become backward-compat aliases)

### Phase 3 — Textile Domain (1–2 weeks)
- [ ] Write `TextileComplianceValidator` (EU ESPR textile rules, GOTS)
- [ ] Register textile domain in `product_domains` table
- [ ] Define textile lifecycle config
- [ ] Add textile-specific attributes to JSON schema
- [ ] Frontend: domain-aware batch creation form (show textile fields when domain = TEXTILE)

### Phase 4 — Electronics Domain (1–2 weeks)
- [ ] Write `ElectronicsComplianceValidator` (WEEE, RoHS Recast)
- [ ] Register electronics domain
- [ ] Define electronics lifecycle config
- [ ] Frontend: electronics-specific batch form

### Phase 5 — Admin UI (1 week)
- [ ] Superadmin domain management panel
- [ ] JSON Schema editor for domain attributes
- [ ] Compliance rule builder

---

## Summary

| | Battery (today) | Generic Engine (after refactor) |
|--|--|--|
| New domain support | ❌ Requires code change | ✅ Register domain in DB |
| New compliance rule | ❌ Hardcoded in Go | ✅ Implement + register function |
| New lifecycle states | ❌ Hardcoded enum | ✅ Configured per domain |
| Battery backward compat | N/A | ✅ 100% — no API change |
| Core engine reuse | N/A | ✅ 80% — only spec model changes |
| Estimated effort | N/A | ~6–8 weeks |

---

*This document should be read alongside `docs/PRODUCT_PASSPORT_ENGINE.md` which describes the current battery-specific implementation in detail.*
