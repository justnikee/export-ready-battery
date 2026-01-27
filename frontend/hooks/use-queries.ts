import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// Query keys factory for consistent cache management
export const queryKeys = {
    batches: (tenantId: string) => ['batches', tenantId] as const,
    batch: (id: string) => ['batch', id] as const,
    dashboardStats: (tenantId: string) => ['dashboardStats', tenantId] as const,
    templates: (tenantId: string) => ['templates', tenantId] as const,
    analytics: (tenantId: string) => ['analytics', tenantId] as const,
    billingBalance: () => ['billingBalance'] as const,
    billingPackages: () => ['billingPackages'] as const,
    apiKeys: () => ['apiKeys'] as const,
}

// Batches hooks
export function useBatches(tenantId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.batches(tenantId || ''),
        queryFn: async () => {
            const response = await api.get(`/batches?tenant_id=${tenantId}`)
            const batches = response.data.batches || []
            return batches.sort((a: any, b: any) =>
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

// Templates hooks
export function useTemplates(tenantId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.templates(tenantId || ''),
        queryFn: async () => {
            const response = await api.get(`/templates?tenant_id=${tenantId}`)
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
