import api from "../api";

export type ComplianceDocKind = "pli" | "doc";

export interface StagingComplianceDoc {
  success: boolean;
  path: string;
  url?: string;
  kind: ComplianceDocKind;
}

/** Upload a pre-batch PLI CA cert or Declaration of Conformity. Persist `path` only. */
export async function uploadStagingComplianceDoc(
  file: File,
  kind: ComplianceDocKind,
  onProgress?: (pct: number) => void,
): Promise<StagingComplianceDoc> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const response = await api.post<StagingComplianceDoc>("/uploads/compliance-doc", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded / event.total) * 90));
      }
    },
  });
  onProgress?.(100);
  return response.data;
}

/** Open a tenant-owned compliance object via a freshly signed URL (S-10). */
export async function openStagingComplianceDoc(path: string): Promise<void> {
  const response = await api.get<{ url?: string }>("/uploads/compliance-doc", {
    params: { path },
    headers: { Accept: "application/json" },
  });
  const signed = typeof response.data?.url === "string" ? response.data.url : "";
  if (!signed) {
    throw new Error("No signed URL returned");
  }
  window.open(signed, "_blank", "noopener,noreferrer");
}
