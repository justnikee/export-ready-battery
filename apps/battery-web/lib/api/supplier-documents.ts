import api from "@/lib/api";
import supplierApi from "@/lib/supplier-api";

export interface SupplierDocument {
  id: string;
  doc_type: string;
  file_name?: string;
  status: "pending" | "approved" | "rejected";
  uploaded_at: string;
  reviewer_notes?: string;
}

export async function listOwnSupplierDocuments() {
  const { data } = await supplierApi.get<{ documents: SupplierDocument[] | null }>("/supplier/documents");
  return data.documents ?? [];
}

export async function listManufacturerSupplierDocuments(supplierId: string) {
  const { data } = await api.get<{ documents: SupplierDocument[] | null }>("/supplier-documents", {
    params: { supplier_id: supplierId },
  });
  return data.documents ?? [];
}

export async function downloadSupplierDocument(id: string, scope: "supplier" | "manufacturer") {
  const client = scope === "supplier" ? supplierApi : api;
  const documentsPath = scope === "supplier" ? "/supplier/documents" : "/supplier-documents";
  const { data } = await client.post<Blob>(`${documentsPath}/${encodeURIComponent(id)}/download`, undefined, {
    responseType: "blob",
  });
  return data;
}
