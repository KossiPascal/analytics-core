import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { tokenProvider } from "@/apis/token.provider";
import { extractErrorMessage } from "@/utils/error.utils";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 120) * 1000;
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
];


let refreshQueue: Array<(token: string) => void> = [];
let isRefreshing = false;

// ------------------------
// TYPES
// ------------------------
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

// ------------------------
// HELPERS
// ------------------------
const normalizeError = (err: unknown): ApiResponse => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const message = extractErrorMessage(err.response?.data, err.message ?? "Request failed");
    return { status, success: false, message, headers: err.response?.headers };
  }
  if (err instanceof Error) return { status: 0, success: false, message: err.message };
  return { status: 0, success: false, message: "Unknown error" };
};

const resolveQueue = (token: string | null) => {
  refreshQueue.forEach(cb => token && cb(token));
  refreshQueue = [];
};

const isTokenExpired = (): boolean => {
  const tokenExp = tokenProvider.getTokenExpiration();
  if (!tokenExp) return true;
  return Math.floor(Date.now() / 1000) >= tokenExp;
};

const isRefreshTokenExpired = (): boolean => {
  const tokenExp = tokenProvider.getRefreshTokenExpiration();
  if (!tokenExp) return true;
  return Math.floor(Date.now() / 1000) >= tokenExp;
};

// const getValidToken = async (): Promise<string | null> => {
//   if (!tokenProvider.get()) {
//     return null; // 👈 PAS DE REFRESH SI PAS DE TOKEN
//   }

//   if (isTokenExpired()) {
//     try {
//       // return await withTokenRefresh(async (newToken) => newToken);
//       return await withTokenRefresh(t => Promise.resolve(t));
//     } catch (e) {
//       tokenProvider.clear();
//       // window.location.href = "/auth/login";
//       // return null;
//       throw new Error(`UNAUTHORIZED -> ${e}`);
//     }
//   }
//   return tokenProvider.get();
// };

const getValidToken = async (): Promise<string | null> => {
  const accessToken = tokenProvider.get();
  if (!accessToken) return null;

  // Access token encore valide → OK
  if (!isTokenExpired()) {
    return accessToken;
  }

  // ⛔ Refresh token expiré → logout direct
  if (isRefreshTokenExpired()) {
    tokenProvider.clear();
    throw new Error("REFRESH_TOKEN_EXPIRED");
  }

  // 🔄 Refresh autorisé
  try {
    return await withTokenRefresh(t => Promise.resolve(t));
  } catch (e) {
    tokenProvider.clear();
    throw e;
  }
};


// ------------------------
// TOKEN REFRESH
// ------------------------
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenProvider.getRefreshToken();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

  const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken }, { withCredentials: true });
  const { access_token, access_token_exp, refresh_token_exp, refresh_token } = res.data;
  if (!access_token || !access_token_exp) {
    throw new Error("INVALID_REFRESH_RESPONSE");
  }
  tokenProvider.set(access_token, access_token_exp, refresh_token, refresh_token_exp);
  return access_token;
};

const withTokenRefresh = async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
  if (isRefreshing) {
    return new Promise(resolve => refreshQueue.push(token => resolve(fn(token))));
  }

  isRefreshing = true;
  try {
    const token = await refreshAccessToken();
    resolveQueue(token);
    return fn(token);
  } catch (err) {
    resolveQueue(null);
    tokenProvider.clear();
    // window.location.href = "/auth/login";
    throw new Error(`UNAUTHORIZED -> ${err}`);
  } finally {
    isRefreshing = false;
  }
};

// ------------------------
// AXIOS INSTANCE
// ------------------------
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async (config: any) => {
  const url = config.url ?? "";
  config.headers = { "Content-Type": "application/json", ...(config.headers || {}) };

  // 🚫 PAS DE TOKEN pour les routes publiques
  if (PUBLIC_ENDPOINTS.some(p => url.includes(p))) {
    return config;
  }

  const token = await getValidToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry || original.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    original._retry = true;
    const newToken = await getValidToken();
    if (!newToken) return Promise.reject(error);

    original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
    return axiosInstance(original);
  }
);

// ------------------------
// FETCH WITH AUTH
// ------------------------
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers || {}) } as any;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_URL}${url}`, { ...options, headers, signal: controller.signal, credentials: "include" });
    if (res.status === 401) {
      tokenProvider.clear();
      // window.location.href = "/auth/login";
      throw new Error("UNAUTHORIZED -> Token expiré ou invalide");
    }
    const contentType = res.headers.get("content-type");
    const data = contentType?.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) throw { status: res.status, data, message: typeof data === "string" ? data : data?.message ?? res.statusText };
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------
// WRAPPER
// ------------------------
async function wrap<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { status: 200, success: true, data };
  } catch (err) {
    return normalizeError(err);
  }
}

// ------------------------
// CREATE API
// ------------------------
const createApi = <UseFetch extends boolean = false>(useFetch?: UseFetch): ApiMethods<UseFetch> => {
  const api: ApiMethods<UseFetch> = {
    get: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "GET", ...options } as RequestInit) : axiosInstance.get<T>(url, options as AxiosRequestConfig).then(res => res.data)),
    post: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "POST", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.post<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),
    put: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "PUT", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.put<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),
    patch: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "PATCH", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.patch<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),
    delete: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "DELETE", ...options } as RequestInit) : axiosInstance.delete<T>(url, options as AxiosRequestConfig).then(res => res.data)),
    options: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "OPTIONS", ...options } as RequestInit) : axiosInstance.options<T>(url, options as AxiosRequestConfig).then(res => res.data)),
    head: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      wrap(() => useFetch ? fetchWithAuth(url, { method: "HEAD", ...options } as RequestInit) : axiosInstance.head<T>(url, options as AxiosRequestConfig).then(res => res.data)),
  };

  return api;
};

export const api = createApi(false);
