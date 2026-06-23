import api from "@/lib/api";
import type {
  BatchVerificationSummary,
  RegistryVerification,
  VerifyBatchRegistryRequest,
} from "@/lib/types";

export async function getBatchRegistryVerifications(
  batchId: string,
): Promise<BatchVerificationSummary> {
  const res = await api.get<BatchVerificationSummary>(
    `/batches/${batchId}/verifications`,
  );
  return res.data;
}

export async function verifyBatchRegistry(
  batchId: string,
  req: VerifyBatchRegistryRequest,
): Promise<RegistryVerification> {
  const res = await api.post<RegistryVerification>(
    `/batches/${batchId}/verify-registry`,
    req,
  );
  return res.data;
}

export async function autoVerifyBatch(
  batchId: string,
): Promise<{ verifications: RegistryVerification[]; count: number }> {
  const res = await api.post<{ verifications: RegistryVerification[]; count: number }>(
    `/batches/${batchId}/auto-verify`,
  );
  return res.data;
}
