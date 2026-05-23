import api from '../api';

export const duplicateBatch = async (id: string) => {
    const response = await api.post(`/batches/${id}/duplicate`);
    return response.data;
};

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export const bulkImportBatches = async (file: File): Promise<BulkImportResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/batches/bulk-import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
