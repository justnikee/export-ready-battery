import axios from "axios";
import {
  clearSupplierSession,
  getSupplierAccessToken,
  setSupplierAccessToken,
} from "@/lib/supplier-session";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * Axios instance for the supplier portal.
 * - withCredentials: true so the HttpOnly supplier_token cookie is stored/sent
 * - Authorization: Bearer from in-memory token when present (faster path)
 * - Cookie alone is enough after reload (middleware reads supplier_token)
 */
const supplierApi = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

supplierApi.interceptors.request.use((config) => {
  const token = getSupplierAccessToken();
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
  const { data } = await supplierApi.post<SupplierLoginResult>(
    "/supplier/login",
    { email, password, tenant_id: tenantId },
  );
  // Memory only — cookie is set by the API (HttpOnly).
  setSupplierAccessToken(data.token);
  return data;
}

export async function supplierLogout(): Promise<void> {
  try {
    await supplierApi.post("/supplier/logout");
  } catch {
    // Still clear local session if network fails.
  }
  clearSupplierSession();
}

export default supplierApi;
