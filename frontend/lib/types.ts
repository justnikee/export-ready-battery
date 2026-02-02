// Auto-generated types matching backend models
// SYNC WITH: backend/internal/models/models.go
// Last updated: 2026-01-24

// ============================================================================
// PASSPORT LIFECYCLE
// ============================================================================

export type PassportStatus =
    | 'CREATED'
    | 'SHIPPED'
    | 'IN_SERVICE'
    | 'RETURNED'
    | 'RECALLED'
    | 'RECYCLED'
    | 'END_OF_LIFE';

export const PASSPORT_STATUS_LABELS: Record<PassportStatus, string> = {
    CREATED: 'Created',
    SHIPPED: 'Shipped',
    IN_SERVICE: 'In Service',
    RETURNED: 'Returned',
    RECALLED: 'Recalled',
    RECYCLED: 'Recycled',
    END_OF_LIFE: 'End of Life',
};

// Valid transitions from each status
export const VALID_PASSPORT_TRANSITIONS: Record<PassportStatus, PassportStatus[]> = {
    CREATED: ['SHIPPED'],
    SHIPPED: ['IN_SERVICE', 'RETURNED', 'RECALLED'],
    IN_SERVICE: ['RETURNED', 'RECALLED'],
    RETURNED: ['RECYCLED', 'IN_SERVICE'], // Can return to service after repair
    RECALLED: ['RECYCLED'],
    RECYCLED: ['END_OF_LIFE'],
    END_OF_LIFE: [],
};

export interface Passport {
    uuid: string;
    batch_id: string;
    serial_number: string;
    manufacture_date: string;
    status: PassportStatus;
    created_at: string;

    // Lifecycle tracking
    shipped_at?: string;
    installed_at?: string;
    returned_at?: string;

    // Dynamic compliance field (EU requirement)
    state_of_health: number; // 0-100, stored as literal percentage (e.g., 95.5 = 95.5%)

    // Ownership tracking
    owner_id?: string;
}

export type PassportEventType =
    | 'CREATED'
    | 'STATUS_CHANGED'
    | 'SCANNED'
    | 'SHIPPED'
    | 'INSTALLED'
    | 'RETURNED'
    | 'RECALLED'
    | 'RECYCLED'
    | 'END_OF_LIFE';

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

    // EU Battery Regulation 2023/1542 - MANDATORY FIELDS
    material_composition?: MaterialComposition;
    certifications?: string[];
    manufacturer_address?: string;
    eu_representative?: string;
    eu_representative_email?: string;
    expected_lifetime_cycles?: number; // e.g., 1000
    warranty_months?: number;          // e.g., 24
    recycled_content_pct?: number;     // stored as literal: 15.5 = 15.5%
    hazardous_substances?: HazardousSubstances;

    // India PLI Compliance Fields - Financial data for DVA calculation
    sale_price_inr?: number;   // Sale price in INR for DVA calculation
    import_cost_inr?: number;  // Import material cost in INR
}

export interface Batch {
    id: string;
    tenant_id: string;
    batch_name: string;
    specs: BatchSpec;
    created_at: string;
    status: BatchStatus;

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
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface TransitionRequest {
    to_status: PassportStatus;
    actor?: string;
    metadata?: Record<string, unknown>;
}

export interface TransitionResult {
    success: boolean;
    passport?: Passport;
    previous_status: PassportStatus;
    new_status: PassportStatus;
    event_id: string;
    error?: string;
}

export interface BulkTransitionRequest {
    passport_ids: string[];
    to_status: PassportStatus;
    actor?: string;
    metadata?: Record<string, unknown>;
}

export interface BulkTransitionResult {
    total: number;
    succeeded: number;
    failed: number;
    failed_ids?: string[];
    errors?: string[];
}

export interface AllowedTransitionsResponse {
    current_status: PassportStatus;
    allowed_transitions: PassportStatus[];
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
