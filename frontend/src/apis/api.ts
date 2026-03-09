// ENTERPRISE API MODULE (SINGLE FILE)

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenProvider } from "@/apis/token.provider";
import { extractErrorMessage } from "@/utils/error.utils";
import { AuthManager } from "./auth.manager";
// import { authScheduler } from "@/services/auth.scheduler";

// CONFIG
const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 120) * 1000;

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
];

// API RESPONSE CONTRACT
export interface UserPayload {
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
  payload: UserPayload;
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

// GLOBAL AUTH STATE (CRITICAL SECTION)
let isLoggingOut = false;
let refreshQueue: ((token: string) => void)[] = [];

// LOGOUT (SINGLE SOURCE OF TRUTH)


// GENERATE HEADERS
const generateHeaders = (original: AxiosRequestConfig<any> & { _retry?: boolean; }, token: string) => {
  return { ...(original.headers || {}), Authorization: `Bearer ${token}`, };
}

// AXIOS INSTANCE
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  withCredentials: true,
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(async (config) => {
  const url = config.url ?? "";

  // // Don't force JSON Content-Type for FormData — let the browser set
  // // multipart/form-data with the correct boundary automatically.
  // if (!(config.data instanceof FormData)) {
  //   config.headers = { 
  //     "Content-Type": "application/json", 
  //     ...(config.headers || {}) 
  //   };
  // }

  // 🚫 PAS DE TOKEN pour les routes publiques
  if (PUBLIC_ENDPOINTS.some(p => url.includes(p))) {
    // console.log(`[API] Public endpoint, no auth needed: ${url}`);
    return config;
  }

  // if (authFailed) {
  //   console.warn(`[API] Auth previously failed, blocking request to: ${url}`);
  //   return Promise.reject(new Error("AUTH_FAILED"));
  // }

  if (tokenProvider.isExpiringSoon(30)) {
    console.log("REFRESH TRIGGERED REQUEST")
    await AuthManager.ensureValidToken(axiosInstance);
  }

  const token = tokenProvider.getAccessToken();
  // if (token && !tokenProvider.isExpired()) {
  if (token) {
    // console.log(`[API] Attaching access token to request: ${url}`);
    config.headers = generateHeaders(config, token) as any;
  }

  // console.log(`[API] Request config for ${url}:`, config);
  return config;
});

// RESPONSE INTERCEPTOR (REFRESH CORE)

axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? "";

    if (!original) return Promise.reject(error);

    // Refresh endpoint itself failed → logout immediately
    if (status === 401 && url.includes("/auth/refresh")) {
      AuthManager.logout();
      return Promise.reject(error);
    }

    // Only refresh on 401
    if (status !== 401 || original._retry || PUBLIC_ENDPOINTS.some(p => url.includes(p))) {
      return Promise.reject(error);
    }

    try {
      original._retry = true;

      if (tokenProvider.isExpiringSoon(30)) {
        console.log("REFRESH TRIGGERED RESPONSE")
        await AuthManager.ensureValidToken(axiosInstance);
      }
      
      const token = tokenProvider.getAccessToken();
      if (!token) throw new Error("NO_TOKEN_AFTER_REFRESH");

      original.headers = generateHeaders(original, token);

      return axiosInstance(original);

    } catch (err) {
      AuthManager.logout();
      return Promise.reject(err);
    }
  }
);

// ERROR NORMALIZATION
const normalizeError = (err: unknown): ApiResponse => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const message = extractErrorMessage(err.response?.data?.message, err.message ?? "Request failed");
    return { status, success: false, message, headers: err.response?.headers };
  }
  if (err instanceof Error) return { status: 0, success: false, message: err.message };
  return { status: 0, success: false, message: "Unknown error" };
};

// SAFE API WRAPPER
async function wrap<T>(fn: () => Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> {
  try {
    const res = await fn();
    return { success: true, status: res.status, data: res.data, headers: res.headers };
  } catch (err) {
    return normalizeError(err);
  }
}

// PUBLIC API
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
