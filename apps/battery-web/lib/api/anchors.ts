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

/**
 * Compute SHA-256 hash of a file in the browser using Web Crypto API.
 */
export async function computeFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
