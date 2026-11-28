import axios from "axios";
import {
  clearSupplierSession,
  getSupplierAccessToken,
  restoreSupplierAccessToken,
  setSupplierAccessToken,
} from "@/lib/supplier-session";
import { getApiV1Base } from "@/lib/api-origin";
import { prepareSupplierCache } from "@/lib/supplier-cache";

const baseURL = getApiV1Base();

/**
 * Axios instance for the supplier portal.
 * - withCredentials: true so the HttpOnly supplier_token cookie is stored/sent
 * - Authorization: Bearer from in-memory token when present (faster path)
 * - After reload, the same-origin session route restores the in-memory token.
 */
const supplierApi = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

supplierApi.interceptors.request.use(async (config) => {
  await prepareSupplierCache();
  const token = getSupplierAccessToken() ?? await restoreSupplierAccessToken(async () => {
    const { data } = await axios.post<{ token: string }>(`${baseURL}/supplier-auth?action=session`, {}, {
      withCredentials: true,
      timeout: 30000,
    });
    return data.token;
  });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

supplierApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearSupplierSession();
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/supplier") && !path.includes("/login")) {
          const tenant = new URLSearchParams(window.location.search).get(
            "tenant_id",
          );
          const q = tenant ? `?tenant_id=${encodeURIComponent(tenant)}` : "";
          window.location.href = `/supplier/login${q}`;
        }
      }
    }
    return Promise.reject(error);
  },
);

export interface SupplierLoginResult {
  token: string;
  supplier_id: string;
  tenant_id: string;
  email: string;
  company_name: string;
  expires_in: number;
}

export async function supplierLogin(
  email: string,
  password: string,
  tenantId: string,
): Promise<SupplierLoginResult> {
  const { data } = await axios.post<SupplierLoginResult>(
    `${baseURL}/supplier-auth?action=login`,
    { email, password, tenant_id: tenantId },
    { withCredentials: true, timeout: 30000 },
  );
  // Memory only — cookie is set by the API (HttpOnly).
  setSupplierAccessToken(data.token);
  return data;
}

export async function supplierLogout(): Promise<void> {
  clearSupplierSession();
  try {
    await axios.post(`${baseURL}/supplier-auth?action=logout`, {}, { withCredentials: true, timeout: 30000 });
  } catch {
    // Still clear local session if network fails.
  }
  clearSupplierSession();
}

export default supplierApi;
