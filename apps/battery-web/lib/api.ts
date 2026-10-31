import axios from "axios";
import { routesFromPathname } from "@/lib/routes";
import { clearProductCookies } from "@/lib/product-session";
import { getApiV1Base } from "@/lib/api-origin";

// The access token is held in memory only (never localStorage) so an XSS
// payload can't read it out of persistent storage. It's re-hydrated on page
// load via the HttpOnly refresh_token cookie (see auth-context's checkAuth).
let accessToken: string | null = null;
let sessionVersion = 0;
let refreshPromise: Promise<string | null> | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  sessionVersion += 1;
  if (!token) delete api.defaults.headers.common["Authorization"];
};

const api = axios.create({
  baseURL: getApiV1Base(),
  withCredentials: true,
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
const exchangeRefreshCookie = async (): Promise<string | null> => {
  const startedAtVersion = sessionVersion;
  try {
    const rotate = () => axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 15000 },
    );
    // Web Locks serialize refresh-cookie rotation across tabs when available.
    // The shared promise below serializes requests within this tab.
    const response = typeof navigator !== "undefined" && navigator.locks?.request
      ? await navigator.locks.request("battery-api-refresh", rotate)
      : await rotate();
    if (startedAtVersion === sessionVersion && response.data.token) {
      setAccessToken(response.data.token);
    } else if (startedAtVersion === sessionVersion) {
      setAccessToken(null);
    }
  } catch {
    // A missing/expired refresh session is handled below. A later login or
    // logout wins over this older request's response.
    if (startedAtVersion === sessionVersion) setAccessToken(null);
  }
  return accessToken;
};

export const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    const inFlight = exchangeRefreshCookie();
    refreshPromise = inFlight;
    void inFlight.finally(() => {
      if (refreshPromise === inFlight) refreshPromise = null;
    });
  }
  return refreshPromise;
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
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // An overlapping request may already have installed a newer token.
      const sentToken = originalRequest.headers?.Authorization;
      const currentToken = getAccessToken();
      const newToken = currentToken && sentToken !== `Bearer ${currentToken}`
        ? currentToken
        : await refreshAccessToken();
      if (newToken) {
        // Update defaults and original request, then retry
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
  baseURL: getApiV1Base(),
  withCredentials: true,
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

// Anonymous API instance — never attaches the Authorization header, even if a
// manufacturer happens to be logged in (e.g. scanning their own product's QR
// code). Use this for truly public pages like /p/[uuid] so a logged-in viewer
// doesn't get a privileged tier-aware response or pollute public scan analytics.
export const apiAnonymous = axios.create({
  baseURL: getApiV1Base(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export default api;
