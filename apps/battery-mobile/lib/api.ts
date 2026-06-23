import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Helper to get token from SecureStore
async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("token");
  } catch {
    return null;
  }
}

// Request interceptor — inject auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data.token) {
          await SecureStore.setItemAsync("token", response.data.token);
          api.defaults.headers.common["Authorization"] =
            `Bearer ${response.data.token}`;
          originalRequest.headers["Authorization"] =
            `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }

      // Refresh failed — clear token
      await SecureStore.deleteItemAsync("token");
    }

    return Promise.reject(error);
  }
);

export default api;

export { API_BASE_URL };
