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
   API RESPONSE CONTRACT
   ============================================================================ */
export interface PayloadUser {
  id: string;
  username: string;
  fullname: string;
  tenant_id?: string;
  roles: string[];
  permissions?: string[];
}

export interface LoginResponse {
  access_token: string;
  access_token_exp: number;
  refresh_token: string;
  refresh_token_exp: number;
  payload: PayloadUser;
}

export type ApiResponse<T = any> = {
  status: number;
  success: boolean;
  data?: T;
  message?: string;
  headers?: any;
};

export type ApiMethods<UseFetch extends boolean> = {
  get: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  patch: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  delete: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  options: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  head: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
};

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
    const res = await axios.post(`${API_URL}/auth/refresh`,{ refresh_token: refreshToken },{ withCredentials: true });

    const {access_token,access_token_exp,refresh_token,refresh_token_exp} = res.data ?? {};

    if (!access_token ||!access_token_exp ||!refresh_token ||!refresh_token_exp) {
      throw new Error("INVALID_REFRESH_RESPONSE");
    }

    tokenProvider.set(access_token,access_token_exp,refresh_token,refresh_token_exp);

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
axiosInstance.interceptors.request.use((config: any) => {
  const url = config.url ?? "";

  config.headers = { "Content-Type": "application/json", ...(config.headers || {}) };
  
  // 🚫 PAS DE TOKEN pour les routes publiques
  if (PUBLIC_ENDPOINTS.some(p => url.includes(p))) {
    console.log(`[API] Public endpoint, no auth needed: ${url}`);
    return config;
  }

  // if (authFailed) {
  //   console.warn(`[API] Auth previously failed, blocking request to: ${url}`);
  //   return Promise.reject(new Error("AUTH_FAILED"));
  // }

  const token = tokenProvider.getAccessToken();

  if (token && !tokenProvider.isAccessTokenExpired()) {
    console.log(`[API] Attaching access token to request: ${url}`);
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`[API] Request config for ${url}:`, config);

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

    // if (status !== 401 || original._retry || PUBLIC_ENDPOINTS.some(p => url.includes(p)) || authFailed) {
    if (status !== 401 || original._retry || PUBLIC_ENDPOINTS.some(p => url.includes(p))) {
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
   ERROR NORMALIZATION
   ============================================================================ */
const normalizeError = (err: unknown): ApiResponse => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const message = extractErrorMessage(err.response?.data?.message, err.message ?? "Request failed");
    return { status, success: false, message, headers: err.response?.headers };
  }
  if (err instanceof Error) return { status: 0, success: false, message: err.message };
  return { status: 0, success: false, message: "Unknown error" };
};


/* ============================================================================
   SAFE API WRAPPER
   ============================================================================ */
async function wrap<T>(fn: () => Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> {
  try {
    const res = await fn();
    return { success: true, status: res.status, data: res.data, headers: res.headers };
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
