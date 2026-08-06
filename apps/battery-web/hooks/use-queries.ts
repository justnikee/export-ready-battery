import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Batch } from '@/lib/types'
import { getFleetStats, getFleetWorstHealth, getFleetEvents, getFleetGeo, getFleetThermalEvents } from '@/lib/api/fleet'

// Query keys factory for consistent cache management
export const queryKeys = {
    batches: (tenantId: string, productType?: string, page?: number, limit?: number) =>
        ['batches', tenantId, productType, page, limit] as const,
    batch: (id: string) => ['batch', id] as const,
    dashboardStats: (tenantId: string) => ['dashboardStats', tenantId] as const,
    templates: (tenantId: string, productType?: string) => ['templates', tenantId, productType] as const,
    analytics: {
        overview: (tenantId: string) => ['analytics', 'overview', tenantId] as const,
        gapsByRegulation: (tenantId: string) => ['analytics', 'gaps', tenantId] as const,
        actionFeed: (tenantId: string) => ['analytics', 'action-feed', tenantId] as const,
        dgftValue: (tenantId: string) => ['analytics', 'dgft-value', tenantId] as const,
    },
    billingBalance: () => ['billingBalance'] as const,
    billingPackages: () => ['billingPackages'] as const,
    apiKeys: () => ['apiKeys'] as const,
    supplierRisk: (id: string) => ['supplierRisk', id] as const,
    ddAssessments: (id: string) => ['ddAssessments', id] as const,
    correctiveActions: () => ['correctiveActions'] as const,
    suppliers: () => ['suppliers'] as const,
    supplierDDStats: (supplierIds: string[]) => ['supplierDDStats', supplierIds] as const,
}

// Batches hooks. Backend paginates server-side (page/limit, default limit 50,
// max 200) and already orders by created_at desc, so no client-side re-sort.
export function useBatches(tenantId: string | undefined, options?: { page?: number; limit?: number; productType?: string }) {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 50
    return useQuery({
        queryKey: queryKeys.batches(tenantId || '', options?.productType, page, limit),
        queryFn: async () => {
            const params = new URLSearchParams({
                tenant_id: tenantId || '',
                page: String(page),
                limit: String(limit),
            })
            if (options?.productType) {
                params.append('product_type', options.productType)
            }
            const response = await api.get(`/batches?${params.toString()}`)
            return response.data as { batches: Batch[]; total: number; total_pages: number; has_more: boolean }
        },
        enabled: !!tenantId,
        staleTime: 60_000,
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
        staleTime: 60_000,
    })
}

// Active EU/GLOBAL batches — the dataset the EU Compliance Hub's Carbon and
// Overview tabs both need (carbon class distribution, Declaration of
// Conformity status). One shared query so both tabs hit cache, not the API.
// P-07: market_region filter is applied server-side (no client-side filter).
export function useEuActiveBatches() {
    return useQuery({
        queryKey: ['euActiveBatches'],
        queryFn: async () => {
            const response = await api.get(
                '/batches?limit=200&status=ACTIVE&market_region=EU,GLOBAL',
            )
            return (response.data.batches || []) as Batch[]
        },
        staleTime: 60_000,
    })
}

export interface ComplianceGap {
    field: string;
    message: string;
    severity: string;
}

export interface MarketReadiness {
    score: number;
    valid: boolean;
    gaps?: ComplianceGap[];
}

// EU readiness score for the EU Compliance Hub's Overview tab. Cached like every
// other data hook so switching tabs doesn't re-hit /auth/readiness each time.
export function useEuReadiness() {
    return useQuery<MarketReadiness | null>({
        queryKey: ['euReadiness'],
        queryFn: async () => {
            const response = await api.post('/auth/readiness', { primary_market: 'eu' })
            return (response.data?.eu ?? null) as MarketReadiness | null
        },
        staleTime: 60_000,
    })
}

export interface DeviceToken {
    id: string;
    name: string;
    batch_id: string | null;
    is_active: boolean;
    last_used_at: string | null;
}

// Registered BMS device tokens for the Telemetry dashboard. TanStack Query so it
// caches + retries like the fleet hooks alongside it, instead of a raw useEffect.
export function useDeviceTokens() {
    return useQuery<DeviceToken[]>({
        queryKey: ['deviceTokens'],
        queryFn: async () => {
            const response = await api.get('/device-tokens')
            return (response.data.tokens || []) as DeviceToken[]
        },
        staleTime: 60_000,
    })
}

// Fleet Health hooks
export function useFleetStats() {
    return useQuery({
        queryKey: ['fleetStats'],
        queryFn: getFleetStats,
        staleTime: 60_000,
    })
}

export function useFleetWorstHealth(limit = 20) {
    return useQuery({
        queryKey: ['fleetWorstHealth', limit],
        queryFn: () => getFleetWorstHealth(limit),
        staleTime: 60_000,
    })
}

export function useFleetEvents(days = 30) {
    return useQuery({
        queryKey: ['fleetEvents', days],
        queryFn: () => getFleetEvents(days),
        staleTime: 60_000,
    })
}

export function useFleetGeo() {
    return useQuery({
        queryKey: ['fleetGeo'],
        queryFn: getFleetGeo,
        staleTime: 60_000,
    })
}

export function useFleetThermalEvents(days = 30, limit = 20) {
    return useQuery({
        queryKey: ['fleetThermalEvents', days, limit],
        queryFn: () => getFleetThermalEvents(days, limit),
        staleTime: 60_000,
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
        staleTime: 5 * 60_000,
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
        staleTime: 10 * 60_000,
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
        staleTime: 10 * 60_000,
    })
}

export function useBillingPackages() {
    return useQuery({
        queryKey: queryKeys.billingPackages(),
        queryFn: async () => {
            const response = await api.get('/billing/packages')
            return response.data.packages || []
        },
        staleTime: 10 * 60_000,
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
        staleTime: 10 * 60_000,
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

export interface Supplier {
    id: string;
    email: string;
    company_name: string;
    contact_phone?: string;
    country?: string;
    status: "invited" | "active" | "blocked";
    invited_at: string;
    accepted_at?: string;
}

export function useSuppliers() {
    return useQuery({
        queryKey: queryKeys.suppliers(),
        queryFn: async () => {
            const response = await api.get('/suppliers')
            return (response.data.suppliers || []) as Supplier[]
        },
        staleTime: 60_000,
    })
}

// The 5-step OECD due diligence framework — see oecd-wizard-dialog.tsx, the
// canonical place these step keys are defined and walked interactively.
const OECD_STEP_COUNT = 5

export interface SupplierDDStats {
    totalSuppliers: number;
    avgRiskScore: number | null;
    /** Average % of the 5 OECD steps completed, across all suppliers. */
    avgStepCompletionPct: number | null;
    /** % of suppliers that have completed all 5 OECD steps. */
    suppliersFullyCompletePct: number | null;
    openCorrectiveActionsCount: number;
}

// Aggregates risk + DD-assessment data across every supplier. There's no
// backend aggregate endpoint for this, so it's a client-side Promise.all over
// the per-supplier endpoints — fine at the supplier counts this product
// expects (tens, not thousands); revisit with a real backend aggregate if
// that assumption stops holding.
export function useSupplierDDStats() {
    const { data: suppliers = [] } = useSuppliers()
    const supplierIds = suppliers.map((s) => s.id)

    return useQuery({
        queryKey: queryKeys.supplierDDStats(supplierIds),
        queryFn: async (): Promise<SupplierDDStats> => {
            const [openActionsRes, perSupplier] = await Promise.all([
                api.get('/corrective-actions?status=open').catch(() => ({ data: [] as CorrectiveAction[] })),
                Promise.all(
                    supplierIds.map((id) =>
                        Promise.all([
                            api.get(`/suppliers/${id}/risk-profile`)
                                .then((r) => r.data?.overall_score as number | undefined)
                                .catch(() => undefined),
                            api.get(`/suppliers/${id}/dd-assessments`)
                                .then((r) => (Array.isArray(r.data) ? r.data : []) as DueDiligenceAssessment[])
                                .catch(() => [] as DueDiligenceAssessment[]),
                        ]),
                    ),
                ),
            ])

            const scores = perSupplier.map(([score]) => score).filter((s): s is number => typeof s === 'number')
            const avgRiskScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

            const completedCounts = perSupplier.map(([, assessments]) => assessments.filter((a) => a.status === 'complete').length)
            const totalSteps = supplierIds.length * OECD_STEP_COUNT
            const avgStepCompletionPct = totalSteps > 0
                ? Math.round((completedCounts.reduce((a, b) => a + b, 0) / totalSteps) * 100)
                : null
            const fullyCompleteCount = completedCounts.filter((c) => c === OECD_STEP_COUNT).length
            const suppliersFullyCompletePct = supplierIds.length > 0
                ? Math.round((fullyCompleteCount / supplierIds.length) * 100)
                : null

            return {
                totalSuppliers: supplierIds.length,
                avgRiskScore,
                avgStepCompletionPct,
                suppliersFullyCompletePct,
                openCorrectiveActionsCount: (openActionsRes.data || []).length,
            }
        },
        staleTime: 60_000,
    })
}

export function useSupplierRisk(supplierId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.supplierRisk(supplierId || ''),
        queryFn: async () => {
            const response = await api.get(`/suppliers/${supplierId}/risk-profile`)
            return response.data as SupplierRiskProfile
        },
        enabled: !!supplierId,
        staleTime: 60_000,
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
        staleTime: 60_000,
    })
}

export function useCorrectiveActions(status?: string) {
    const normalizedStatus = status ?? 'all'
    return useQuery({
        queryKey: ['correctiveActions', normalizedStatus],
        queryFn: async () => {
            const params = status ? `?status=${status}` : ''
            const response = await api.get(`/corrective-actions${params}`)
            return (response.data || []) as CorrectiveAction[]
        },
        staleTime: 60_000,
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


export function useSupplierCMRTReports(supplierId: string | undefined) {
    return useQuery({
        queryKey: ['cmrtReports', supplierId],
        queryFn: async () => {
            const response = await api.get(`/suppliers/${supplierId}/cmrt-reports`)
            return response.data
        },
        enabled: !!supplierId,
        staleTime: 60_000,
    })
}

export function useUploadCMRT() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ supplierId, file, reportingYear }: { supplierId: string; file: File; reportingYear: number }) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('reporting_year', reportingYear.toString())
            const response = await api.post(`/suppliers/${supplierId}/cmrt-upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return response.data
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cmrtReports', variables.supplierId] })
        },
    })
}

export function useAnalyticsOverview(tenantId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: queryKeys.analytics.overview(tenantId || ''),
        queryFn: async () => {
            const response = await api.get('/analytics/overview')
            return response.data
        },
        enabled: !!tenantId && enabled,
        staleTime: 30_000,
    })
}

export function useGapsByRegulation(tenantId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: queryKeys.analytics.gapsByRegulation(tenantId || ''),
        queryFn: async () => {
            const response = await api.get('/analytics/gaps-by-regulation')
            return response.data
        },
        enabled: !!tenantId && enabled,
        staleTime: 30_000,
    })
}

export function useActionFeed(tenantId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: queryKeys.analytics.actionFeed(tenantId || ''),
        queryFn: async () => {
            const response = await api.get('/analytics/action-feed')
            return response.data
        },
        enabled: !!tenantId && enabled,
        staleTime: 30_000,
    })
}

export function useDGFTValue(tenantId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: queryKeys.analytics.dgftValue(tenantId || ''),
        queryFn: async () => {
            const response = await api.get('/analytics/dgft-value')
            return response.data
        },
        enabled: !!tenantId && enabled,
        staleTime: 30_000,
    })
}
