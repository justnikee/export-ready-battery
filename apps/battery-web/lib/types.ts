// Auto-generated types matching backend models
// SYNC WITH: services/battery-api/internal/models/models.go
// Last updated: 2026-05-14

// ============================================================================
// PASSPORT LIFECYCLE
// ============================================================================

export type PassportStatus =
  | "CREATED"
  | "ACTIVE"
  | "SHIPPED"
  | "IN_SERVICE"
  | "RECALLED"
  | "RECYCLED"
  | "END_OF_LIFE";

export type TransitionAction =
  | "ACTIVATE"
  | "SHIP"
  | "INSTALL"
  | "RECYCLE"
  | "CLOSE"
  | "RECALL";

export interface TransitionEvidence {
  shipment_reference?: string;
  shipment_date?: string;
  installation_date?: string;
  installer_id?: string;
  recycler_epr_id?: string;
  recycling_date?: string;
  certificate_reference?: string;
  recall_reason?: string;
  recall_reference?: string;
}

export const PASSPORT_STATUS_LABELS: Record<PassportStatus, string> = {
  CREATED: "Created",
  ACTIVE: "Active",
  SHIPPED: "Shipped",
  IN_SERVICE: "In Service",
  RECALLED: "Recalled",
  RECYCLED: "Recycled",
  END_OF_LIFE: "End of Life",
};

export const TRANSITION_ACTION_LABELS: Record<TransitionAction, string> = {
  ACTIVATE: "Activate",
  SHIP: "Ship",
  INSTALL: "Install",
  RECYCLE: "Recycle",
  CLOSE: "Close",
  RECALL: "Recall",
};

export interface Passport {
  uuid: string;
  batch_id: string;
  serial_number: string;
  manufacture_date: string;
  status: PassportStatus;
  created_at: string;
  updated_at?: string;
  batch_snapshot?: Record<string, unknown>;

  // Lifecycle tracking
  shipped_at?: string;
  installed_at?: string;
  returned_at?: string;
  recycled_at?: string;

  // Dynamic compliance field (EU requirement)
  state_of_health?: number | null; // 0-100, stored as literal percentage (e.g., 95.5 = 95.5%)
  last_soh_update_timestamp?: string | null;

  // Ownership tracking
  owner_id?: string;
  current_owner_identifier?: string;
  current_owner_email?: string;
  ownership_history?: Record<string, unknown>[];

  // EU compliance events
  repair_events?: Record<string, unknown>[];
  replacement_events?: Record<string, unknown>[];

  // India recycling fields
  recycling_status?: string;
  recycler_epr_id?: string;
  recycling_date?: string;

  // EU Battery Passport ID & Circularity Status
  battery_passport_id?: string;
  circularity_status?: "ORIGINAL" | "REPURPOSED" | "REUSED" | "REMANUFACTURED" | "WASTE";

  // BMS Telemetry summary
  cycle_count?: number;
  last_temperature?: number;
  last_voltage?: number;
  thermal_event_count?: number;
  last_telemetry_at?: string | null;

  // v2: Product-agnostic
  product_type?: ProductType;
  telemetry?: Record<string, unknown>;
}

export type PassportEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "SCANNED"
  | "SHIPPED"
  | "INSTALLED"
  | "RECALLED"
  | "RECYCLED"
  | "END_OF_LIFE"
  | "SOH_UPDATED"
  | "REPAIR_LOGGED"
  | "REPLACEMENT_LOGGED";

export interface PassportEvent {
  id: string;
  passport_id: string;
  event_type: PassportEventType;
  action?: string;
  actor: string;
  actor_identifier?: string;
  actor_role?: string;
  actor_type?: string;
  status_from?: string;
  status_to?: string;
  source?: string;
  ip_address?: string;
  hash?: string;
  previous_hash?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// BATCH & SPECS
// ============================================================================

export type MarketRegion = "INDIA" | "EU" | "GLOBAL";

export type BatchStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

// MaterialComposition uses float64 percentages (stored as literal: 12.5 = 12.5%)
export interface MaterialComposition {
  cobalt_pct?: number;
  lithium_pct?: number;
  nickel_pct?: number;
  lead_pct?: number;
  manganese_pct?: number;
  graphite_pct?: number;

  // Per-material recycled content (EU 2023/1542 Art. 8)
  recycled_cobalt_pct?: number;
  recycled_lithium_pct?: number;
  recycled_nickel_pct?: number;
  recycled_lead_pct?: number;
}

// HazardousSubstances for REACH/RoHS compliance
export interface HazardousSubstances {
  lead_present: boolean;
  mercury_present: boolean;
  cadmium_present: boolean;
  declaration?: string;
  exemptions?: string;
}

export interface BatchSpec {
  chemistry: string;
  voltage: string;
  capacity: string;
  manufacturer: string;
  manufacturer_email?: string;
  weight: string;
  recyclable: boolean;
  carbon_footprint: string;
  country_of_origin: string;
  material_profile?: string;
  lot_size?: string;
  production_stage?: string;
  cell_source?: "IMPORTED" | "DOMESTIC";
  domestic_value_add?: number;
  hsn_code?: string;
  bis_number?: string;
  epr_number?: string;

  // EU Battery Regulation 2023/1542 - MANDATORY FIELDS
  material_composition?: MaterialComposition;
  certifications?: string[];
  bis_certificate_issue_date?: string;
  un38_3_test_date?: string;
  iec_62133_test_date?: string;
  msds_issue_date?: string;
  manufacturer_address?: string;
  eu_representative?: string;
  eu_representative_email?: string;
  eu_representative_address?: string;
  expected_lifetime_cycles?: number | null;
  warranty_months?: number | null;
  recycled_content_pct?: number | null;
  hazardous_substances?: HazardousSubstances;

  // India PLI Compliance Fields - Financial data for DVA calculation
  sale_price_inr?: number;
  import_cost_inr?: number;

  battery_category?: string;

  // v2: Fields migrated from top-level Batch columns
  bill_of_entry_no?: string;
  customs_date?: string;
  dva_source?: string;
  audited_domestic_value_add?: number;
  pli_certificate_url?: string;

  // GS1 Digital Link GTIN for EU Battery Passport QR code compliance
  gtin?: string;
}

export interface Batch {
  id: string;
  tenant_id: string;
  batch_name: string;
  model_name?: string;
  specs: BatchSpec;
  created_at: string;
  status: BatchStatus;

  manufacturing_start_date?: string;
  manufacturing_end_date?: string;

  // Dual-Mode Compliance Fields
  market_region: MarketRegion;
  pli_compliant: boolean;
  domestic_value_add: number;
  total_passports: number;

  // EU Battery Regulation 2023/1542 compliance fields
  ce_marking?: boolean;
  notified_body_number?: string;
  carbon_performance_class?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  removable_and_replaceable?: boolean;
  declaration_of_conformity_path?: string;

  // EU Carbon Calculator Result (Article 7)
  carbon_footprint_result?: Record<string, unknown> | null;

  // v2: Product-agnostic fields
  product_type?: ProductType;
  schema_version?: number;
  compliance_score?: number;
  compliance_gaps?: ComplianceGap[];

  // GS1 Digital Link GTIN for EU Battery Passport QR code compliance
  gtin?: string;
}

// Minimal per-batch fields returned by GET /batches/chart-data, used for the
// dashboard production chart and compliance score card.
export interface BatchChartData {
  id: string;
  created_at: string;
  status: string;
  total_passports: number;
}

// ============================================================================
// PRODUCT SCHEMA & COMPLIANCE TYPES (v2 Dynamic Engine)
// ============================================================================

export type ProductType = "BATTERY" | "ELECTRONICS";

export interface ComplianceGap {
  field: string;
  message: string;
  severity: "ERROR" | "WARNING" | "INFO";
  regulation: string;
}

export interface ComplianceCheckResult {
  product_type: ProductType;
  market_region: MarketRegion;
  score: number;
  passed: boolean;
  gaps: ComplianceGap[];
  checked_at: string;
}

export interface ComplianceRule {
  id: string;
  product_type: string;
  market_region: string;
  rule_key: string;
  rule_type: "threshold" | "required_field" | "format_regex";
  threshold_value?: number;
  error_message: string;
  required: boolean;
  effective_from: string;
  effective_until?: string;
  version: number;
  created_at: string;
}

export interface SchemaFieldConstraint {
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  enum?: string[];
}

export interface SchemaField {
  type: string;
  label: string;
  description?: string;
  required?: boolean;
  unit?: string;
  constraints?: SchemaFieldConstraint;
  properties?: Record<string, SchemaField>; // nested object
  items?: SchemaField; // array items
}

export interface ProductSchemaDefinition {
  product_type: ProductType;
  version: number;
  fields: Record<string, SchemaField>;
}

export interface ProductSchemaListItem {
  product_type: ProductType;
  version: number;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface TransitionRequest {
  action: TransitionAction;
  actor?: string;
  evidence?: TransitionEvidence;
}

export interface TransitionResult {
  success: boolean;
  passport?: Passport;
  previous_status: PassportStatus;
  new_status: PassportStatus;
  action?: TransitionAction;
  event_id: string;
  error?: string;
}

export interface BulkTransitionRequest {
  passport_ids: string[];
  action: TransitionAction;
  actor?: string;
  evidence?: TransitionEvidence;
}

export interface BulkTransitionResult {
  total: number;
  succeeded: number;
  failed: number;
  failed_ids?: string[];
  errors?: string[];
}

export interface AllowedActionsResponse {
  current_status: PassportStatus;
  allowed_actions: TransitionAction[];
}

export interface PassportEventsResponse {
  passport_id: string;
  events: PassportEvent[];
  count: number;
}

// ============================================================================
// BLOG SYSTEM TYPES
// ============================================================================

export type BlogPostStatus = "draft" | "published" | "archived";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string; // Markdown/MDX
  cover_image?: string;
  author: string;
  status: BlogPostStatus;
  tags: string[];
  category?: string;
  seo_title?: string;
  seo_description?: string;
  reading_time_minutes?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogFormData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  status: BlogPostStatus;
  tags: string[];
  category?: string;
  seo_title?: string;
  seo_description?: string;
}

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type TeamStatus = "PENDING" | "ACTIVE" | "REVOKED";

export interface TeamMember {
  id: string;
  tenant_id: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  user_id?: string;
  created_at: string;
  accepted_at?: string;
}

export interface InviteUserRequest {
  email: string;
  role: TeamRole;
}

export interface TeamListResponse {
  members: TeamMember[];
  seat_count: number;
  seat_limit: number;
  plan_type: string;
  tier: "free" | "pro" | "enterprise";
}

export interface SeatLimitError {
  error: "seat_limit_reached";
  message: string;
  upgrade_url: string;
}

// ============================================================================
// CERTIFICATE ANCHOR (Blockchain Timestamping)
// ============================================================================

export type AnchorStatus = "pending" | "anchored" | "confirmed" | "failed";

export interface CertificateAnchor {
  id: string;
  batch_id: string;
  tenant_id: string;
  cert_type: string;
  file_url: string;
  file_hash: string;
  ots_proof?: string;
  bitcoin_tx_id?: string;
  status: AnchorStatus;
  anchored_at?: string;
  created_at: string;
}

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertType = "CERTIFICATE_EXPIRY" | "COMPLIANCE_DEGRADED" | "QUOTA_LOW";

// ============================================================================
// REGISTRY VERIFICATION (External Registry Integrations)
// ============================================================================

export type RegistryType = "bis" | "cpcb" | "eu_nando" | "un38_3" | "custom";

export type RegistryVerificationStatus =
  | "pending"
  | "verified"
  | "failed"
  | "error"
  | "not_found";

export type TrustTier = "self_declared" | "registry_verified" | "official_api";

export interface RegistryVerification {
  id: string;
  tenant_id: string;
  batch_id: string;
  registry_type: RegistryType;
  certificate_no?: string;
  status: RegistryVerificationStatus;
  trust_tier: TrustTier;
  verified_data?: Record<string, unknown>;
  error_message?: string;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BatchVerificationSummary {
  batch_id: string;
  verifications: RegistryVerification[];
  overall_trust: TrustTier;
}

export interface VerifyBatchRegistryRequest {
  registry_type: RegistryType;
  certificate_no?: string;
}

export interface TenantAlert {
  id: string;
  tenant_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  resource_type?: string;
  resource_id?: string;
  read_at?: string;
  emailed_at?: string;
  created_at: string;
}

// ============================================================================
// DUE DILIGENCE ENGINE (Phase B)
// ============================================================================

export interface SupplierRiskProfile {
  id: string;
  supplier_id: string;
  tenant_id: string;
  overall_score: number;
  country_risk_tier: number;
  mineral_risk_flags: string[];
  rmap_valid?: boolean;
  last_audit_date?: string;
  next_audit_due?: string;
  computed_at: string;
}

export interface DueDiligenceAssessment {
  id: string;
  supplier_id: string;
  tenant_id: string;
  batch_id?: string;
  step: string;
  status: string;
  evidence_docs: string[];
  completed_by?: string;
  completed_at?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CorrectiveAction {
  id: string;
  supplier_id: string;
  tenant_id: string;
  assessment_id?: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  due_date: string;
  remediated_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface CMRTSmelter {
  name: string;
  country: string;
  mineral: string;
  smelter_ref?: string;
  rmi_status?: string;
}

export interface SupplierCMRTReport {
  id: string;
  supplier_id: string;
  tenant_id: string;
  reporting_year: number;
  file_url: string;
  smelters: CMRTSmelter[];
  unknown_smelters: number;
  rmi_conformant_pct?: number;
  parsed_at?: string;
  created_at: string;
}


// ============================================================================
// REGULATORY INTELLIGENCE (Phase E)
// ============================================================================

export type RegulatorySourceType = "rss" | "api" | "scraper";

export interface RegulatorySource {
  id: string;
  name: string;
  source_type: RegulatorySourceType;
  url: string;
  config?: Record<string, string>;
  fetch_interval: string;
  is_active: boolean;
  last_fetched_at?: string;
  last_etag?: string;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryItem {
  id: string;
  source_id: string;
  external_id: string;
  title: string;
  summary?: string;
  url?: string;
  published_at?: string;
  product_type?: "BATTERY" | "TEXTILE" | "GENERAL";
  market_region?: "EU" | "INDIA" | "GLOBAL";
  urgency: "low" | "normal" | "high" | "critical";
  tags?: string[];
  deadline?: string;
  raw_content?: string;
  classified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantRegulatoryAlert {
  id: string;
  tenant_id: string;
  regulatory_item_id: string;
  is_read: boolean;
  is_dismissed: boolean;
  read_at?: string;
  dismissed_at?: string;
  emailed_at?: string;
  created_at: string;
  // Join fields
  title?: string;
  summary?: string;
  urgency?: string;
  deadline?: string;
  market_region?: string;
  product_type?: string;
}

export interface RegulationGapCount {
  regulation: string;
  severity: string;
  count: number;
}

export interface ActionFeedItem {
  type: string;
  title: string;
  batch_id: string | null;
  severity: "ERROR" | "WARNING";
  due_date: string | null;
}

export interface SchemeValue {
  scheme: string;
  claimed_value: number;
  eligible_value: number;
  count: number;
}

export interface DGFTValueSummary {
  total_claimed_value: number;
  total_eligible_value: number;
  approval_rate: number;
  avg_approval_days: number;
  scheme_breakdown: SchemeValue[];
}

export interface ComplianceTrendPoint {
  period: string;
  avg_score: number;
  batch_count: number;
}

export interface CertExpiryItem {
  cert_type: string;
  expiring_30d: number;
  expiring_7d: number;
  expired: number;
}

export interface RegionItem {
  region: string;
  count: number;
}

export interface StatusCountItem {
  status: string;
  count: number;
}

export interface ExpiringCertDetail {
  batch_id: string;
  batch_name: string;
  cert_type: string;
  expiry_date: string;
  days_left: number;
}

export interface AnalyticsOverview {
  compliance_trend: ComplianceTrendPoint[];
  certificate_expiry: CertExpiryItem[];
  expiring_certificates: ExpiringCertDetail[];
  carbon_distribution: { class: string; count: number }[];
  batch_status_breakdown: Record<string, number>;
  compliance_ready_count: number;
  market_region_split: RegionItem[];
  supplier_document_status: Record<string, number>;
  dgft_claim_funnel: StatusCountItem[];
  alert_severity_breakdown: Record<string, number>;
}
