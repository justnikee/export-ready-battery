import axios from "axios";
import { routesFromPathname } from "@/lib/routes";
import { clearProductCookies } from "@/lib/product-session";

// The access token is held in memory only (never localStorage) so an XSS
// payload can't read it out of persistent storage. It's re-hydrated on page
// load via the HttpOnly refresh_token cookie (see auth-context's checkAuth).
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout to prevent infinite loading
});

// Helper to get base URL without /api/v1 suffix (for static files like uploads)
export const getBaseUrl = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "");
};

// Exchanges the HttpOnly refresh_token cookie for a new access token, storing
// it in memory. Returns the token on success, or null if there's no valid
// refresh session (e.g. first visit, expired/revoked session).
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    if (response.data.token) {
      setAccessToken(response.data.token);
      return response.data.token;
    }
  } catch {
    // No valid refresh cookie — caller treats this as logged out.
  }
  setAccessToken(null);
  return null;
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // The HttpOnly refresh_token cookie is sent automatically by the browser.
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Update defaults and original request, then retry
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Refresh failed — redirect to the current product login.
      // Auth cookie is HttpOnly — backend clears it on logout
      clearProductCookies();
      if (typeof window !== "undefined") {
        const { pathname } = window.location;
        const productRoutes = routesFromPathname(pathname);
        const isAuthPath =
          pathname === productRoutes.login ||
          pathname === productRoutes.register ||
          pathname === productRoutes.forgotPassword ||
          pathname === productRoutes.resetPassword;

        if (!isAuthPath) {
          window.location.href = productRoutes.login;
        }
      }
    }
    return Promise.reject(error);
  },
);

// Public-safe API instance — same auth headers, but NO 401 redirect interceptor.
// Use this for endpoints that may be called from public/unauthenticated views
// or where the caller wants to handle 401 gracefully instead of being redirected.
export const apiPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiPublic.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
