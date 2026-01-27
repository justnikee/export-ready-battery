import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout to prevent infinite loading
});

// Helper to get base URL without /api/v1 suffix (for static files like uploads)
export const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors (token expired)
// Add a response interceptor to handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Call refresh endpoint
          // We use axios directly to avoid interceptors loop if this fails (though strict loop avoidance needs more care, this is a distinct call)
          // Actually, using a separate instance or just avoiding the detailed interceptor logic is safer.
          // But here, we just make a post call.
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          if (response.data.token) {
            // Update tokens
            localStorage.setItem('token', response.data.token);
            // Update defaults and original request
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;

            // Retry original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      // If refresh failed or no refresh token, logout
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
