import api from "../api";

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

export const adminVerifyDocument = async (
  req: VerifyDocRequest
): Promise<{ success: boolean; new_status: string }> => {
  const response = await api.post("/admin/verify-doc", req);
  return response.data;
};

export const runDailyAlerts = async (): Promise<{ message: string }> => {
  const response = await api.post("/jobs/daily-alerts");
  return response.data;
};

export const upgradeCertificateAnchors = async (): Promise<{
  message: string;
}> => {
  const response = await api.post("/jobs/upgrade-anchors");
  return response.data;
};
