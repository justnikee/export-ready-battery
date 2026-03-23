import api from '../api';
import type {
    ProductType,
    MarketRegion,
    ComplianceCheckResult,
    ComplianceGap,
    ProductSchemaDefinition,
    ProductSchemaListItem,
} from '../types';

// ============================================================================
// SCHEMA APIs
// ============================================================================

export const listSchemas = async (): Promise<ProductSchemaListItem[]> => {
    const response = await api.get('/schemas');
    return response.data.schemas ?? [];
};

export const getSchemaByType = async (
    productType: ProductType
): Promise<ProductSchemaDefinition> => {
    const response = await api.get(`/schemas/${productType}`);
    return response.data;
};

// ============================================================================
// COMPLIANCE APIs
// ============================================================================

export interface ComplianceCheckRequest {
    product_type: ProductType;
    market_region: MarketRegion;
    specs: Record<string, unknown>;
}

export const complianceCheck = async (
    req: ComplianceCheckRequest
): Promise<ComplianceCheckResult> => {
    const response = await api.post('/compliance/check', req);
    return response.data;
};

export const getBatchCompliance = async (
    batchId: string
): Promise<{
    batch_id: string;
    compliance_score: number;
    compliance_gaps: ComplianceGap[];
}> => {
    const response = await api.get(`/batches/${batchId}/compliance`);
    return response.data;
};

export const downloadComplianceReport = async (
    batchId: string
): Promise<Blob> => {
    const response = await api.get(`/batches/${batchId}/compliance-report`, {
        responseType: 'blob',
    });
    return response.data;
};
