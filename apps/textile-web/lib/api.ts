import axios from "axios";
import { routesFromPathname } from "@/lib/routes";
import { clearProductCookies } from "@/lib/product-session";

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

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

      try {
        // The HttpOnly refresh_token cookie is sent automatically by the browser.
        // We just need to call the refresh endpoint with credentials included.
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {}, // no body needed
          { withCredentials: true }, // ensures cookies are sent cross-origin if needed
        );

        if (response.data.token) {
          // Store the new access token
          localStorage.setItem("token", response.data.token);
          // Sync cookie so Next.js middleware sees the fresh token
          document.cookie = `auth_token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          // Update defaults and original request
          api.defaults.headers.common["Authorization"] =
            `Bearer ${response.data.token}`;
          originalRequest.headers["Authorization"] =
            `Bearer ${response.data.token}`;
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }

      // Refresh failed — clear access token and redirect to the current product login.
      localStorage.removeItem("token");
      document.cookie = "auth_token=; path=/; max-age=0";
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

export default api;
