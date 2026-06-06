import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Batch } from '@/lib/types'

// Query keys factory for consistent cache management
export const queryKeys = {
    batches: (tenantId: string, productType?: string) => ['batches', tenantId, productType] as const,
    batch: (id: string) => ['batch', id] as const,
    dashboardStats: (tenantId: string) => ['dashboardStats', tenantId] as const,
    templates: (tenantId: string, productType?: string) => ['templates', tenantId, productType] as const,
    analytics: (tenantId: string) => ['analytics', tenantId] as const,
    billingBalance: () => ['billingBalance'] as const,
    billingPackages: () => ['billingPackages'] as const,
    apiKeys: () => ['apiKeys'] as const,
    supplierRisk: (id: string) => ['supplierRisk', id] as const,
    ddAssessments: (id: string) => ['ddAssessments', id] as const,
    correctiveActions: () => ['correctiveActions'] as const,
}

// Batches hooks
export function useBatches(tenantId: string | undefined, productType?: string) {
    return useQuery({
        queryKey: queryKeys.batches(tenantId || '', productType),
        queryFn: async () => {
            const params = new URLSearchParams({ tenant_id: tenantId || '' })
            if (productType) {
                params.append('product_type', productType)
            }
            const response = await api.get(`/batches?${params.toString()}`)
            const batches = (response.data.batches || []) as Batch[]
            return batches.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        },
        enabled: !!tenantId,
    })
}

export function useBatch(id: string) {
    return useQuery({
        queryKey: queryKeys.batch(id),
        queryFn: async () => {
            const response = await api.get(`/batches/${id}`)
            return response.data
        },
        enabled: !!id,
    })
}

// Dashboard hooks
export function useDashboardStats(tenantId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.dashboardStats(tenantId || ''),
        queryFn: async () => {
            const response = await api.get(`/dashboard/stats?tenant_id=${tenantId}`)
            return response.data
        },
        enabled: !!tenantId,
    })
}

export interface Template {
    id: string;
    name: string;
    market_region: string;
    product_type?: string;
    specs: Record<string, unknown>;
    created_at: string;
}

// Templates hooks
export function useTemplates(tenantId: string | undefined, productType?: string) {
    return useQuery<Template[]>({
        queryKey: queryKeys.templates(tenantId || '', productType),
        queryFn: async () => {
            const params = new URLSearchParams({ tenant_id: tenantId || '' })
            if (productType) {
                params.append('product_type', productType)
            }
            const response = await api.get(`/templates?${params.toString()}`)
            return response.data.templates || []
        },
        enabled: !!tenantId,
    })
}

// Billing hooks
export function useBillingBalance() {
    return useQuery({
        queryKey: queryKeys.billingBalance(),
        queryFn: async () => {
            const response = await api.get('/billing/balance')
            return response.data
        },
    })
}

export function useBillingPackages() {
    return useQuery({
        queryKey: queryKeys.billingPackages(),
        queryFn: async () => {
            const response = await api.get('/billing/packages')
            return response.data.packages || []
        },
    })
}

// API Keys hooks
export function useApiKeys() {
    return useQuery({
        queryKey: queryKeys.apiKeys(),
        queryFn: async () => {
            const response = await api.get('/api-keys')
            return response.data.api_keys || []
        },
    })
}

// Mutation hooks with cache invalidation
export function useDeleteBatch() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (batchId: string) => {
            await api.delete(`/batches/${batchId}`)
        },
        onSuccess: () => {
            // Invalidate all batch queries
            queryClient.invalidateQueries({ queryKey: ['batches'] })
        },
    })
}

export function useActivateBatch() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (batchId: string) => {
            const response = await api.post(`/batches/${batchId}/activate`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] })
            queryClient.invalidateQueries({ queryKey: ['billingBalance'] })
        },
    })
}

export function useCreateApiKey() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { name: string; scope: string; rate_limit_tier: string }) => {
            const response = await api.post('/api-keys', data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys() })
        },
    })
}

export function useDeleteApiKey() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (keyId: string) => {
            await api.delete(`/api-keys/${keyId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys() })
        },
    })
}


// ============================================================================
// Due Diligence Engine hooks (Phase B)
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

export function useSupplierRisk(supplierId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.supplierRisk(supplierId || ''),
        queryFn: async () => {
            const response = await api.get(`/suppliers/${supplierId}/risk-profile`)
            return response.data as SupplierRiskProfile
        },
        enabled: !!supplierId,
    })
}

export function useDueDiligenceAssessments(supplierId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.ddAssessments(supplierId || ''),
        queryFn: async () => {
            const response = await api.get(`/suppliers/${supplierId}/dd-assessments`)
            return (response.data || []) as DueDiligenceAssessment[]
        },
        enabled: !!supplierId,
    })
}

export function useCorrectiveActions(status?: string) {
    return useQuery({
        queryKey: queryKeys.correctiveActions(),
        queryFn: async () => {
            const params = status ? `?status=${status}` : ''
            const response = await api.get(`/corrective-actions${params}`)
            return (response.data || []) as CorrectiveAction[]
        },
    })
}

export function useCreateDDAssessment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ supplierId, data }: { supplierId: string; data: { step: string; notes?: string } }) => {
            const response = await api.post(`/suppliers/${supplierId}/dd-assessments`, data)
            return response.data
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.ddAssessments(vars.supplierId) })
        },
    })
}

export function useTransitionDDAssessment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { status: string; notes?: string } }) => {
            const response = await api.post(`/dd-assessments/${id}/transition`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ddAssessments'] })
        },
    })
}

export function useCreateCorrectiveAction() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { supplier_id: string; title: string; description: string; severity: string; due_date: string; assessment_id?: string }) => {
            const response = await api.post('/corrective-actions', data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.correctiveActions() })
        },
    })
}

export function useUpdateCAStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const response = await api.put(`/corrective-actions/${id}/status`, { status })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.correctiveActions() })
        },
    })
}

export function useUploadEvidence() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            const formData = new FormData()
            formData.append('file', file)
            const response = await api.post(`/dd-assessments/${id}/evidence`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ddAssessments'] })
        },
    })
}
