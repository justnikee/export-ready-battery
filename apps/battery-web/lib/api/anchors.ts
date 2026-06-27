import api from "@/lib/api";
import type { CertificateAnchor } from "@/lib/types";

export interface CreateAnchorRequest {
  cert_type: string;
  file_url: string;
  file_hash: string;
}

export interface CreateAnchorResponse {
  id: string;
  status: string;
  message: string;
}

export interface ListAnchorsResponse {
  anchors: CertificateAnchor[];
}

export async function createCertificateAnchor(
  batchId: string,
  req: CreateAnchorRequest,
): Promise<CreateAnchorResponse> {
  const response = await api.post(`/batches/${batchId}/anchors`, req);
  return response.data;
}

export async function getCertificateAnchors(
  batchId: string,
): Promise<CertificateAnchor[]> {
  const response = await api.get(`/batches/${batchId}/anchors`);
  return (response.data.anchors as CertificateAnchor[]) || [];
}

export interface CertificateAnchorWithBatch extends CertificateAnchor {
  batch_name: string;
}

export interface TenantAnchorFilters {
  certType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getTenantCertificateAnchors(
  filters: TenantAnchorFilters = {},
): Promise<CertificateAnchorWithBatch[]> {
  const params = new URLSearchParams();
  if (filters.certType) params.set("cert_type", filters.certType);
  if (filters.status) params.set("status", filters.status);
  params.set("limit", String(filters.limit ?? 100));
  params.set("offset", String(filters.offset ?? 0));
  const response = await api.get(`/anchors?${params.toString()}`);
  return (response.data.anchors as CertificateAnchorWithBatch[]) || [];
}

/**
 * Compute SHA-256 hash of a file in the browser using Web Crypto API.
 */
export async function computeFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
