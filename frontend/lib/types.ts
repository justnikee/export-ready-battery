// Auto-generated types matching backend models
// SYNC WITH: backend/internal/models/models.go
// Last updated: 2026-02-07

// ============================================================================
// PASSPORT LIFECYCLE
// ============================================================================

export type PassportStatus =
    | 'CREATED'
    | 'ACTIVE'
    | 'SHIPPED'
    | 'IN_SERVICE'
    | 'RECALLED'
    | 'RECYCLED'
    | 'END_OF_LIFE';

export type TransitionAction =
    | 'ACTIVATE'
    | 'SHIP'
    | 'INSTALL'
    | 'RECYCLE'
    | 'CLOSE'
    | 'RECALL';

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
    CREATED: 'Created',
    ACTIVE: 'Active',
    SHIPPED: 'Shipped',
    IN_SERVICE: 'In Service',
    RECALLED: 'Recalled',
    RECYCLED: 'Recycled',
    END_OF_LIFE: 'End of Life',
};

export const TRANSITION_ACTION_LABELS: Record<TransitionAction, string> = {
    ACTIVATE: 'Activate',
    SHIP: 'Ship',
    INSTALL: 'Install',
    RECYCLE: 'Recycle',
    CLOSE: 'Close',
    RECALL: 'Recall',
};

export interface Passport {
    uuid: string;
    batch_id: string;
    serial_number: string;
    manufacture_date: string;
    status: PassportStatus;
    created_at: string;
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
}

export type PassportEventType =
    | 'CREATED'
    | 'STATUS_CHANGED'
    | 'SCANNED'
    | 'SHIPPED'
    | 'INSTALLED'
    | 'RECALLED'
    | 'RECYCLED'
    | 'END_OF_LIFE'
    | 'SOH_UPDATED'
    | 'REPAIR_LOGGED'
    | 'REPLACEMENT_LOGGED';

export interface PassportEvent {
    id: string;
    passport_id: string;
    event_type: PassportEventType;
    actor: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

// ============================================================================
// BATCH & SPECS
// ============================================================================

export type MarketRegion = 'INDIA' | 'EU' | 'GLOBAL';

export type BatchStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

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
    weight: string;
    carbon_footprint: string;
    country_of_origin: string;
    cell_source?: 'IMPORTED' | 'DOMESTIC';
    domestic_value_add?: number;
    hsn_code?: string;
    bis_number?: string;
    epr_number?: string;

    // EU Battery Regulation 2023/1542 - MANDATORY FIELDS
    material_composition?: MaterialComposition;
    certifications?: string[];
    manufacturer_address?: string;
    eu_representative?: string;
    eu_representative_email?: string;
    expected_lifetime_cycles?: number | null; // e.g., 1000
    warranty_months?: number | null;          // e.g., 24
    recycled_content_pct?: number | null;     // stored as literal: 15.5 = 15.5%
    hazardous_substances?: HazardousSubstances;

    // India PLI Compliance Fields - Financial data for DVA calculation
    sale_price_inr?: number;   // Sale price in INR for DVA calculation
    import_cost_inr?: number;  // Import material cost in INR
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
    domestic_value_add: number; // stored as literal: 45.5 = 45.5%
    cell_source?: 'IMPORTED' | 'DOMESTIC';
    total_passports: number;

    // India Import/Customs Fields
    bill_of_entry_no?: string;
    country_of_origin?: string;
    customs_date?: string;

    // India Compliance Fields
    hsn_code?: string; // e.g., "8507.60"
    bis_number?: string;
    epr_number?: string;

    // PLI/DVA Audit Compliance Fields
    dva_source?: string;
    audited_domestic_value_add?: number | null;
    pli_certificate_url?: string;

    // EU Carbon Calculator Result (Article 7)
    carbon_footprint_result?: Record<string, unknown> | null;
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

export type BlogPostStatus = 'draft' | 'published' | 'archived';

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

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TeamStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

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
}

export interface SeatLimitError {
    error: 'seat_limit_reached';
    message: string;
    upgrade_url: string;
}
