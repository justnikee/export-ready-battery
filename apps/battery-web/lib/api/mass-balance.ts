import api from '../api';

export type MaterialType = 'cobalt' | 'lithium' | 'nickel' | 'lead';

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  cobalt: 'Cobalt',
  lithium: 'Lithium',
  nickel: 'Nickel',
  lead: 'Lead',
};

export const MATERIAL_TYPE_COLORS: Record<MaterialType, string> = {
  cobalt: 'bg-blue-500/10 text-blue-700 border-blue-200',
  lithium: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  nickel: 'bg-amber-500/10 text-amber-700 border-amber-200',
  lead: 'bg-slate-500/10 text-slate-700 border-slate-200',
};

export interface MassBalanceLedger {
  id: string;
  tenant_id: string;
  material_type: MaterialType;
  incoming_kg: number;
  incoming_source: string;
  allocated_kg: number;
  balance_kg: number;
  certificate_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MassBalanceAllocation {
  id: string;
  ledger_id: string;
  batch_id: string;
  passport_id?: string;
  material_type: MaterialType;
  allocated_kg: number;
  created_at: string;
}

export interface LedgerListResponse {
  ledgers: MassBalanceLedger[];
  count: number;
}

export interface AllocationListResponse {
  allocations: MassBalanceAllocation[];
  count: number;
}

export interface CreateLedgerRequest {
  material_type: MaterialType;
  incoming_kg: number;
  incoming_source?: string;
  certificate_url?: string;
  notes?: string;
}

export interface UpdateLedgerRequest {
  incoming_delta: number;
  allocated_delta: number;
}

export interface CreateAllocationRequest {
  ledger_id: string;
  batch_id: string;
  passport_id?: string;
  material_type: MaterialType;
  allocated_kg: number;
}

// List ledgers (optionally filtered by material_type)
export const listLedgers = async (materialType?: MaterialType): Promise<LedgerListResponse> => {
  const params = new URLSearchParams();
  if (materialType) params.set('material_type', materialType);
  const response = await api.get(`/mass-balance/ledgers?${params.toString()}`);
  return response.data;
};

// Get a single ledger by ID
export const getLedger = async (id: string): Promise<MassBalanceLedger> => {
  const response = await api.get(`/mass-balance/ledgers/${id}`);
  return response.data;
};

// Create a new ledger
export const createLedger = async (request: CreateLedgerRequest): Promise<MassBalanceLedger> => {
  const response = await api.post('/mass-balance/ledgers', request);
  return response.data;
};

// Update a ledger (delta-based)
export const updateLedger = async (id: string, request: UpdateLedgerRequest): Promise<MassBalanceLedger> => {
  const response = await api.patch(`/mass-balance/ledgers/${id}`, request);
  return response.data;
};

// List allocations for a batch
export const listAllocations = async (batchId: string): Promise<AllocationListResponse> => {
  const params = new URLSearchParams();
  params.set('batch_id', batchId);
  const response = await api.get(`/mass-balance/allocations?${params.toString()}`);
  return response.data;
};

// Create an allocation
export const createAllocation = async (request: CreateAllocationRequest): Promise<MassBalanceAllocation> => {
  const response = await api.post('/mass-balance/allocations', request);
  return response.data;
};
