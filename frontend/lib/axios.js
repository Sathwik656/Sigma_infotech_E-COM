import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Configured Axios instance for all backend API calls.
 *
 * - Base URL points to Express backend
 * - Credentials (cookies) included
 * - Request interceptor: injects Authorization header from localStorage
 * - Response interceptor: handles 401 by clearing local session
 */
const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

/* -------------------------------------------------------
   Request Interceptor — Attach Bearer token
   ------------------------------------------------------- */
axiosInstance.interceptors.request.use(
  (config) => {
    // Read the stored access token on every request
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sigma_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------
   Response Interceptor — Handle 401 / token expiry
   ------------------------------------------------------- */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not a retry, try refreshing the token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      const refreshToken = localStorage.getItem('sigma_refresh_token');

      // If we have a refresh token, attempt silent refresh
      if (refreshToken && !originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;

        try {
          const { data } = await axios.post(`${BACKEND_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (data.access_token) {
            localStorage.setItem('sigma_access_token', data.access_token);
            localStorage.setItem('sigma_refresh_token', data.refresh_token);
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return axiosInstance(originalRequest);
          }
        } catch {
          // Refresh failed — clear session and let the error propagate
          localStorage.removeItem('sigma_access_token');
          localStorage.removeItem('sigma_refresh_token');
          localStorage.removeItem('sigma_user');
        }
      } else {
        // No refresh token — clear session
        localStorage.removeItem('sigma_access_token');
        localStorage.removeItem('sigma_refresh_token');
        localStorage.removeItem('sigma_user');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
