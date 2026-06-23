import api, { getAccessToken, setAccessToken } from "./api";
import { clearProductCookies } from "@/lib/product-session";

export interface AuthResponse {
  token: string;
  tenant_id: string;
  email: string;
  company_name: string;
  product_type?: string;
  expires_in: number;
  error?: string;
}

// Returned from POST /auth/register (202 — no tokens issued until email is verified)
export interface RegisterResponse {
  message?: string;
  error?: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  company_name: string;
  product_type?: string;
  invite_token?: string;
}

// Login error detail — server sends this when email_not_verified
export interface LoginErrorResponse {
  error: string;
  code?: string;
}

const emptyAuth = (error: string): AuthResponse => ({
  error,
  token: "",
  tenant_id: "",
  email: "",
  company_name: "",
  expires_in: 0,
});

export const authApi = {
  login: async (
    email: string,
    password: string,
  ): Promise<AuthResponse & { code?: string }> => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: LoginErrorResponse };
        };
        return {
          ...emptyAuth(
            axiosError.response?.data?.error ||
              "Login failed. Please try again.",
          ),
          code: axiosError.response?.data?.code,
        };
      }
      return emptyAuth("An unexpected error occurred.");
    }
  },

  register: async (params: RegisterParams): Promise<RegisterResponse> => {
    try {
      const response = await api.post("/auth/register", params);
      // 202 — no tokens, just a message
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        return {
          error:
            axiosError.response?.data?.error ||
            "Registration failed. Please try again.",
        };
      }
      return { error: "An unexpected error occurred." };
    }
  },

  resendVerification: async (
    email: string,
  ): Promise<{ message?: string; error?: string }> => {
    try {
      const response = await api.post("/auth/resend-verification", { email });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        return {
          error:
            axiosError.response?.data?.error ||
            "Failed to resend. Please try again.",
        };
      }
      return { error: "An unexpected error occurred." };
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Revoke refresh token server-side
      const token = getAccessToken();
      if (token) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
    } catch {
      // Silently ignore — still clear local state
    } finally {
      setAccessToken(null);
      // Auth cookie is HttpOnly — backend clears it on logout.
      clearProductCookies();
      // The HttpOnly refresh_token cookie is cleared by the backend Set-Cookie header
    }
  },
};
