import api from '../api';

// Types for export jobs
export interface ExportJob {
    id: string;
    batch_id: string;
    batch_name: string;
    job_type: 'QR_ZIP' | 'LABELS_PDF' | 'CSV' | 'DUE_DILIGENCE' | 'COMPLIANCE_DECLARATION' | 'AUDIT_CSV' | 'AUDIT_PDF' | 'EPCIS';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    passport_count: number;
    file_size_bytes?: number;
    download_url?: string;
    error_message?: string;
    requested_at: string;
    completed_at?: string;
    expires_at?: string;
    download_count: number;
}

export interface ExportJobListResponse {
    jobs: ExportJob[];
    total: number;
    limit: number;
    offset: number;
}

export interface CreateExportJobRequest {
    batch_id: string;
    job_type: 'QR_ZIP' | 'LABELS_PDF' | 'CSV' | 'DUE_DILIGENCE' | 'COMPLIANCE_DECLARATION' | 'AUDIT_CSV' | 'AUDIT_PDF' | 'EPCIS';
}

// Create a new async export job
export const createExportJob = async (request: CreateExportJobRequest) => {
    const response = await api.post('/export-jobs', request);
    return response.data;
};

// List export jobs with pagination
export const listExportJobs = async (limit = 20, offset = 0): Promise<ExportJobListResponse> => {
    const response = await api.get('/export-jobs', { params: { limit, offset } });
    return response.data;
};

// Get a single export job by ID
export const getExportJob = async (id: string): Promise<ExportJob> => {
    const response = await api.get(`/export-jobs/${id}`);
    return response.data;
};

// Download an export job (redirects to presigned URL)
export const getExportDownloadUrl = (id: string): string => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/export-jobs/${id}/download`;
};

// Refresh download URL (if expired)
export const refreshExportDownload = async (id: string): Promise<{ download_url: string }> => {
    const response = await api.post(`/export-jobs/${id}/refresh`);
    return response.data;
};

// Helper to format file size
export const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to format job type for display
export const formatJobType = (type: ExportJob['job_type']): string => {
    switch (type) {
        case 'QR_ZIP': return 'QR Codes (ZIP)';
        case 'LABELS_PDF': return 'Labels (PDF)';
        case 'CSV': return 'Data Export (CSV)';
        case 'DUE_DILIGENCE': return 'Due Diligence Report (PDF)';
        case 'COMPLIANCE_DECLARATION': return 'Carbon Declaration (PDF)';
        case 'AUDIT_CSV': return 'Audit Trail (CSV)';
        case 'AUDIT_PDF': return 'Audit Trail (PDF)';
        case 'EPCIS': return 'EPCIS 2.0 (JSON-LD)';
        default: return type;
    }
};
