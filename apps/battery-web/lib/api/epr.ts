import api from '../api';

// ============================================================================
// TYPES — synced with services/battery-api/internal/models/models.go
// ============================================================================

export interface EPRCertificate {
    id: string;
    tenant_id: string;
    certificate_number: string;
    recycler_name: string;
    recycler_epr_id?: string;
    weight_kg: number;
    battery_type?: string;
    financial_year: string;
    issued_date: string;
    expiry_date?: string;
    status: 'ACTIVE' | 'RETIRED' | 'EXPIRED' | 'REJECTED';
    retired_at?: string;
    document_path?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateEPRCertificateRequest {
    certificate_number: string;
    recycler_name: string;
    recycler_epr_id?: string;
    weight_kg: number;
    battery_type?: string;
    financial_year: string;
    issued_date: string;
    expiry_date?: string;
    document_path?: string;
    notes?: string;
}

export interface EPRLedgerSummary {
    financial_year: string;
    obligation_kg: number;
    certified_kg: number;
    deficit_kg: number;
    surplus_kg: number;
    certificate_count: number;
    compliance_status: string;
}

export interface EPRObligation {
    id: string;
    tenant_id: string;
    financial_year: string;
    battery_category: string;           // EV, PORTABLE, INDUSTRIAL, AUTOMOTIVE
    obligation_kg: number;              // Batteries placed on market (kg)
    batteries_placed_count: number;     // Unit count
    fulfilled_via_recycling_kg: number;
    fulfilled_via_refurbishment_kg: number;
    carried_forward_kg: number;         // Excess from prev year
    net_obligation_kg: number;          // After carry-forward
    shortfall_kg: number;               // Unfulfilled amount
    ecc_amount_inr: number;             // Environmental Compensation Charge
    ecc_status: 'NOT_APPLICABLE' | 'PENDING' | 'PAID' | 'WAIVED';
    status: 'DRAFT' | 'FILED' | 'AUDITED' | 'CLOSED';
    cpcb_return_reference?: string;
    cpcb_filed_at?: string;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const listCertificates = async (financialYear?: string): Promise<EPRCertificate[]> => {
    const params = financialYear ? { financial_year: financialYear } : {};
    const response = await api.get('/epr/certificates', { params });
    return response.data;
};

export const createCertificate = async (data: CreateEPRCertificateRequest): Promise<EPRCertificate> => {
    const response = await api.post('/epr/certificates', data);
    return response.data;
};

export const retireCertificate = async (id: string): Promise<void> => {
    await api.put(`/epr/certificates/${id}/retire`);
};

export const deleteCertificate = async (id: string): Promise<void> => {
    await api.delete(`/epr/certificates/${id}`);
};

export const getLedgerSummary = async (financialYear: string): Promise<EPRLedgerSummary> => {
    const response = await api.get('/epr/ledger', { params: { financial_year: financialYear } });
    return response.data;
};

export const getObligation = async (year: number): Promise<EPRObligation> => {
    const response = await api.get('/epr/obligation', { params: { year } });
    return response.data;
};

export const getMultiYearSummary = async (): Promise<EPRObligation[]> => {
    const response = await api.get('/epr/obligation/summary');
    return response.data;
};

export const getCPCBExportUrl = (financialYear: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    return `${baseUrl}/epr/cpcb-export?financial_year=${encodeURIComponent(financialYear)}`;
};

export const downloadCPCBExport = async (financialYear: string): Promise<void> => {
    const response = await api.get('/epr/cpcb-export', {
        params: { financial_year: financialYear },
        responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CPCB_Form3_${financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

// Helper: get current Indian FY string like "2025-26"
export const getCurrentFinancialYear = (): string => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${String(year + 1).slice(2)}`;
};

// Helper: generate FY options for dropdown
export const getFinancialYearOptions = (): string[] => {
    const current = new Date().getFullYear();
    const start = current - 2;
    return Array.from({ length: 5 }, (_, i) => {
        const y = start + i;
        return `${y}-${String(y + 1).slice(2)}`;
    });
};
