import api from '../api';

export const duplicateBatch = async (id: string) => {
    const response = await api.post(`/batches/${id}/duplicate`);
    return response.data;
};

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  errors: { row: number; field?: string; message: string }[];
}

type BulkImportResponse = Omit<BulkImportResult, "errors"> & {
  errors: BulkImportResult["errors"] | null;
};

export const bulkImportBatches = async (file: File): Promise<BulkImportResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<BulkImportResponse>("/batches/bulk-import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { ...data, errors: data.errors ?? [] };
};
