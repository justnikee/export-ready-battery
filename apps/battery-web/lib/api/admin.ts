import api from "../api";
import axios from "axios";

export interface SignupRequest {
  id: string;
  company_name: string;
  email: string;
  gstin?: string;
  iec_code?: string;
  product_type: string;
  estimated_batches?: string;
  market_region?: string;
  phone?: string;
  status: string;
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface SignupRequestsResponse {
  requests: SignupRequest[];
  total: number;
}

export const listSignupRequests = async (
  status = "pending"
): Promise<SignupRequestsResponse> => {
  const response = await api.get("/admin/signup-requests", {
    params: { status },
  });
  return response.data;
};

export const approveSignupRequest = async (id: string): Promise<void> => {
  await api.post(`/admin/signup-requests/${id}/approve`);
};

export const rejectSignupRequest = async (
  id: string,
  reason: string
): Promise<void> => {
  await api.post(`/admin/signup-requests/${id}/reject`, { reason });
};

export interface VerifyDocRequest {
  tenant_id: string;
  doc_type: "epr" | "bis" | "pli";
  action: "APPROVE" | "REJECT";
}

const apiBaseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * Platform-admin helpers (S-01 / S-03).
 *
 * Auth is **X-Admin-API-Key** (server-side ADMIN_API_KEY), never tenant JWT
 * and never NEXT_PUBLIC_*. For ops scripts / future admin-web server routes only.
 * Do not call from the manufacturer browser UI with a bundled secret.
 */
async function platformAdminPost<T>(
  path: string,
  adminApiKey: string,
  body?: unknown
): Promise<T> {
  if (!adminApiKey) {
    throw new Error(
      "adminApiKey is required for platform admin routes (X-Admin-API-Key)"
    );
  }
  const response = await axios.post(`${apiBaseURL}${path}`, body ?? {}, {
    headers: {
      "Content-Type": "application/json",
      "X-Admin-API-Key": adminApiKey,
    },
    timeout: 300000, // jobs can run longer (anchor upgrade up to 5m server-side)
  });
  return response.data;
}

export const adminVerifyDocument = async (
  req: VerifyDocRequest,
  adminApiKey: string
): Promise<{ success: boolean; new_status: string }> => {
  return platformAdminPost("/admin/verify-doc", adminApiKey, req);
};

/** Manual trigger for daily alert scan (S-03). Background ticker still runs in API. */
export const runDailyAlerts = async (
  adminApiKey: string
): Promise<{ message: string }> => {
  return platformAdminPost("/jobs/daily-alerts", adminApiKey);
};

/** Manual trigger for OTS anchor upgrade (S-03). Background ticker still runs in API. */
export const upgradeCertificateAnchors = async (
  adminApiKey: string
): Promise<{ message: string }> => {
  return platformAdminPost("/jobs/upgrade-anchors", adminApiKey);
};
