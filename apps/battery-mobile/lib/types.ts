// ============================================================================
// Passport & Lifecycle Types
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

export interface Passport {
  uuid: string;
  batch_id: string;
  serial_number: string;
  manufacture_date: string;
  status: PassportStatus;
  created_at: string;
  updated_at?: string;

  shipped_at?: string;
  installed_at?: string;
  returned_at?: string;
  recycled_at?: string;

  state_of_health?: number | null;
  last_soh_update_timestamp?: string | null;

  owner_id?: string;
  current_owner_identifier?: string;
  current_owner_email?: string;

  cycle_count?: number;
  last_temperature?: number;
  last_voltage?: number;
  thermal_event_count?: number;
  last_telemetry_at?: string | null;

  batch_snapshot?: Record<string, unknown>;
  repair_events?: Record<string, unknown>[];
  replacement_events?: Record<string, unknown>[];
}

export interface PassportEvent {
  id: string;
  passport_id: string;
  event_type: string;
  action?: string;
  actor: string;
  actor_identifier?: string;
  actor_role?: string;
  actor_type?: string;
  status_from?: string;
  status_to?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AllowedActionsResponse {
  current_status: PassportStatus;
  allowed_actions: TransitionAction[];
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

// ============================================================================
// Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  tenant_id?: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ============================================================================
// Offline Queue Types
// ============================================================================

export type PendingActionType = "lifecycle_transition" | "soh_update" | "repair_log";
export type PendingActionStatus = "pending" | "synced" | "failed";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: string;
  status: PendingActionStatus;
  retry_count: number;
  created_at: number;
}
