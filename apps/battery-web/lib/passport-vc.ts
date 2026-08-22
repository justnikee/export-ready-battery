import axios from "axios";
import type { PassportVCDocument, PassportVCStatus } from "./api/vcs";

export function isIssuedVC(status?: PassportVCStatus | null): boolean {
  return String(status ?? "").toLowerCase() === "issued";
}

/** Safe filename for a downloaded W3C VC JSON document. */
export function vcDownloadFilename(serialNumber: string): string {
  const safe = serialNumber.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safe || "passport"}-vc.json`;
}

export function vcErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function downloadPassportVC(serialNumber: string, vc: PassportVCDocument): void {
  const blob = new Blob([JSON.stringify(vc, null, 2)], {
    type: "application/ld+json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = vcDownloadFilename(serialNumber);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
