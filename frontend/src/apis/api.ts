/* ============================================================================
   ENTERPRISE API MODULE (SINGLE FILE)
   ============================================================================ */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenProvider } from "@/apis/token.provider";
import { extractErrorMessage } from "@/utils/error.utils";

/* ============================================================================
   CONFIG
   ============================================================================ */

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 120) * 1000;

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
];



/* ============================================================================
   GLOBAL AUTH STATE (CRITICAL SECTION)
   ============================================================================ */

let isRefreshing = false;
let authFailed = false;
let isLoggingOut = false;

type RefreshSubscriber = (token: string) => void;
let refreshQueue: RefreshSubscriber[] = [];

/* ============================================================================
   LOGOUT (SINGLE SOURCE OF TRUTH)
   ============================================================================ */

const logout = () => {
  if (isLoggingOut) return;

  isLoggingOut = true;
  authFailed = true;
  refreshQueue = [];

  tokenProvider.clear();

  // UI layer decides what to do
  window.dispatchEvent(new Event("auth:logout"));
};

/* ============================================================================
   TOKEN REFRESH (HARD GUARANTEES)
   ============================================================================ */

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenProvider.getRefreshToken();
  if (!refreshToken) {
    logout();
    throw new Error("NO_REFRESH_TOKEN");
  }

  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { withCredentials: true }
    );

    const {
      access_token,
      access_token_exp,
      refresh_token,
      refresh_token_exp,
    } = res.data ?? {};

    if (
      !access_token ||
      !access_token_exp ||
      !refresh_token ||
      !refresh_token_exp
    ) {
      throw new Error("INVALID_REFRESH_RESPONSE");
    }

    tokenProvider.set(
      access_token,
      access_token_exp,
      refresh_token,
      refresh_token_exp
    );

    return access_token;
  } catch (err) {
    logout();
    throw err;
  }
};

/* ============================================================================
   AXIOS INSTANCE
   ============================================================================ */

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  withCredentials: true,
});

/* ============================================================================
   REQUEST INTERCEPTOR
   ============================================================================ */

axiosInstance.interceptors.request.use((config:any) => {
  const url = config.url ?? "";

  config.headers = {
    "Content-Type": "application/json",
    ...(config.headers || {}),
  };

  if (PUBLIC_ENDPOINTS.some(p => url.includes(p))) {
    return config;
  }

  if (authFailed) {
    return Promise.reject(new Error("AUTH_FAILED"));
  }

  const token = tokenProvider.getAccessToken();
  if (token && !tokenProvider.isAccessTokenExpired()) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ============================================================================
   RESPONSE INTERCEPTOR (REFRESH CORE)
   ============================================================================ */

axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? "";

    // Refresh endpoint itself failed → logout immediately
    if (status === 401 && url.includes("/auth/refresh")) {
      logout();
      return Promise.reject(error);
    }

    if (
      status !== 401 ||
      original._retry ||
      PUBLIC_ENDPOINTS.some(p => url.includes(p)) ||
      authFailed
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (isRefreshing) {
        return new Promise(resolve => {
          refreshQueue.push(token => {
            original.headers = {
              ...(original.headers || {}),
              Authorization: `Bearer ${token}`,
            };
            resolve(axiosInstance(original));
          });
        });
      }

      isRefreshing = true;

      const newToken = await refreshAccessToken();

      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];

      original.headers = {
        ...(original.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };

      return axiosInstance(original);

    } catch (err) {
      logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

/* ============================================================================
   API RESPONSE CONTRACT
   ============================================================================ */

export type ApiResponse<T = any> = {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
};

/* ============================================================================
   ERROR NORMALIZATION
   ============================================================================ */

const normalizeError = (err: unknown): ApiResponse => {
  if (axios.isAxiosError(err)) {
    return {
      success: false,
      status: err.response?.status ?? 0,
      message:
        err.response?.data?.message ??
        err.message ??
        "Request failed",
    };
  }

  return {
    success: false,
    status: 0,
    message: err instanceof Error ? err.message : "Unknown error",
  };
};

/* ============================================================================
   SAFE API WRAPPER
   ============================================================================ */

async function wrap<T>(
  fn: () => Promise<AxiosResponse<T>>
): Promise<ApiResponse<T>> {
  try {
    const res = await fn();
    return {
      success: true,
      status: res.status,
      data: res.data,
    };
  } catch (err) {
    return normalizeError(err);
  }
}

/* ============================================================================
   PUBLIC API
   ============================================================================ */

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    wrap(() => axiosInstance.get<T>(url, config)),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    wrap(() => axiosInstance.post<T>(url, data, config)),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    wrap(() => axiosInstance.put<T>(url, data, config)),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    wrap(() => axiosInstance.patch<T>(url, data, config)),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    wrap(() => axiosInstance.delete<T>(url, config)),
};
