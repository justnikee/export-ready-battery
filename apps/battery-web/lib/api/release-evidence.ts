import api from "@/lib/api";
import { prepareSupplierCache } from "@/lib/supplier-cache";
import type { TracePage } from "./traceability";

export type ReleaseEvidence = {
  id: string;
  batch_id: string;
  source_system: string;
  record_ref: string;
  revision: number;
  current: boolean;
  source_revision: string;
  disposition: string;
  reviewer: string;
  recorded_on: string;
  scope: "batch" | "sampled_packs";
  sample_serials: string[];
  file_name: string;
  created_at: string;
};

export const releaseEvidencePageSize = 25;

export async function listReleaseEvidence(kind: "batch" | "pack", id: string, page: number, signal: AbortSignal) {
  await prepareSupplierCache();
  const root = kind === "batch" ? "/batches" : "/traceability/packs";
  const { data } = await api.get<TracePage<ReleaseEvidence>>(`${root}/${encodeURIComponent(id)}/release-evidence`, {
    params: { limit: releaseEvidencePageSize, offset: page * releaseEvidencePageSize },
    signal,
  });
  return data;
}

export async function appendReleaseEvidence(batchId: string, form: FormData) {
  await prepareSupplierCache();
  await api.post(`/batches/${encodeURIComponent(batchId)}/release-evidence`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadReleaseEvidence(id: string, signal: AbortSignal) {
  await prepareSupplierCache();
  const { data } = await api.post<Blob>(`/release-evidence/${encodeURIComponent(id)}/download`, undefined, {
    responseType: "blob",
    signal,
  });
  return data;
}
