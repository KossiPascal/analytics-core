import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { useStore } from '@/stores/OLD';
import { LOGIN_ROUTE } from '@routes/routes';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
            { refreshToken }
          );

          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          // Update store with new tokens
          useStore.getState().setToken(newToken);
          useStore.getState().setRefreshToken(newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useStore.getState().logout();
          window.location.href = LOGIN_ROUTE;
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        useStore.getState().logout();
        window.location.href = LOGIN_ROUTE;
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

export { axiosInstance };
