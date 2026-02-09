// // -------------------------------------------
// // api.ts
// // -------------------------------------------
// import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
// import { tokenProvider } from "@/apis/token.provider";
// import { extractErrorMessage } from "@/utils/error.utils";

// const API_URL = import.meta.env.VITE_API_URL ?? "/api";
// const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 120) * 1000;

// let refreshQueue: Array<(token: string) => void> = [];
// let isRefreshing = false;

// // ------------------------
// // TYPES
// // ------------------------
// export interface PayloadUser {
//   id: string;
//   username: string;
//   fullname: string;
//   tenant_id: string | undefined;
//   roles: string[];
// }

// export interface LoginResponse {
//   access_token: string;
//   access_token_exp: number;
//   refresh_token: string;
//   refresh_token_exp: number;
//   payload: PayloadUser;
// }

// export type ApiResponse<T = any> = {
//   status: number;
//   success: boolean;
//   data?: T;
//   message?: string;
//   headers?: any;
// };

// export type ApiMethods<UseFetch extends boolean> = {
//   get: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
//   post: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
//   put: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
//   patch: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
//   delete: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
//   options: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
//   head: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
// };

// // ------------------------
// // HELPERS
// // ------------------------
// const normalizeError = (err: unknown): ApiResponse => {
//   if (axios.isAxiosError(err)) {
//     const status = err.response?.status ?? 0;
//     const message = extractErrorMessage(err.response?.data, err.message ?? "Request failed");
//     return { status, success: false, message, headers: err.response?.headers };
//   }
//   if (err instanceof Error) return { status: 0, success: false, message: err.message };
//   return { status: 0, success: false, message: "Unknown error" };
// };

// const resolveQueue = (token: string | null) => {
//   refreshQueue.forEach(cb => token && cb(token));
//   refreshQueue = [];
// };

// const isTokenExpired = (): boolean => {
//   const tokenExp = tokenProvider.getExpiration();
//   if (!tokenExp) return true;
//   return Math.floor(Date.now() / 1000) >= tokenExp;
// };

// const getValidToken = async (): Promise<string | null> => {
//   const token = tokenProvider.get();

//   if (!token || isTokenExpired()) {
//     try {
//       return await withTokenRefresh(async (newToken) => newToken);
//     } catch {
//       tokenProvider.clear();
//       window.location.href = "/auth/login";
//       return null;
//     }
//   }

//   return token;
// };

// // ------------------------
// // TOKEN REFRESH
// // ------------------------
// const refreshAccessToken = async (): Promise<string> => {
//   const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
//   const newToken = res.data?.access_token;
//   const exp = res.data?.access_token_exp;
//   if (!newToken || !exp) throw new Error("No access token returned from refresh");
//   tokenProvider.set(newToken, exp);
//   return newToken;
// };

// const withTokenRefresh = async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
//   if (isRefreshing) {
//     return new Promise(resolve => refreshQueue.push(token => resolve(fn(token))));
//   }

//   isRefreshing = true;
//   try {
//     const token = await refreshAccessToken();
//     resolveQueue(token);
//     return fn(token);
//   } catch (err) {
//     resolveQueue(null);
//     tokenProvider.clear();
//     window.location.href = "/auth/login";
//     throw err;
//   } finally {
//     isRefreshing = false;
//   }
// };

// // ------------------------
// // AXIOS INSTANCE
// // ------------------------
// const axiosInstance: AxiosInstance = axios.create({
//   baseURL: API_URL,
//   timeout: TIMEOUT,
//   withCredentials: true,
// });

// axiosInstance.interceptors.request.use(async (config: any) => {
//   const token = await getValidToken();
//   config.headers = { "Content-Type": "application/json", ...(config.headers || {}) };
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// axiosInstance.interceptors.response.use(
//   res => res,
//   async (error: AxiosError) => {
//     const original = error.config as AxiosRequestConfig & { _retry?: boolean };
//     if (error.response?.status !== 401 || original._retry || original.url?.includes("/auth/refresh")) {
//       return Promise.reject(error);
//     }

//     original._retry = true;

//     const newToken = await getValidToken();
//     if (!newToken) return Promise.reject(error);

//     original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
//     return axiosInstance(original);
//   }
// );

// // ------------------------
// // FETCH WITH AUTH
// // ------------------------
// async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
//   const token = await getValidToken();
//   const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers || {}) } as any;
//   if (token) headers.Authorization = `Bearer ${token}`;

//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), TIMEOUT);

//   try {
//     const res = await fetch(`${API_URL}${url}`, { ...options, headers, signal: controller.signal, credentials: "include" });

//     if (res.status === 401) {
//       tokenProvider.clear();
//       window.location.href = "/auth/login";
//       throw new Error("Token expiré ou invalide");
//     }

//     const contentType = res.headers.get("content-type");
//     const data = contentType?.includes("application/json") ? await res.json() : await res.text();

//     if (!res.ok) throw { status: res.status, data, message: typeof data === "string" ? data : data?.message ?? res.statusText };
//     return data;
//   } finally {
//     clearTimeout(timeout);
//   }
// }

// // ------------------------
// // WRAPPER
// // ------------------------
// async function wrap<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
//   try {
//     const data = await fn();
//     return { status: 200, success: true, data };
//   } catch (err) {
//     return normalizeError(err);
//   }
// }

// // ------------------------
// // CREATE API
// // ------------------------
// const createApi = <UseFetch extends boolean = false>(useFetch?: UseFetch): ApiMethods<UseFetch> => {
//   const api: ApiMethods<UseFetch> = {
//     get: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "GET", ...options } as RequestInit) : axiosInstance.get<T>(url, options as AxiosRequestConfig).then(res => res.data)),

//     post: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "POST", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.post<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),

//     put: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "PUT", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.put<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),

//     patch: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "PATCH", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.patch<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),

//     delete: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "DELETE", ...options } as RequestInit) : axiosInstance.delete<T>(url, options as AxiosRequestConfig).then(res => res.data)),

//     options: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "OPTIONS", ...options } as RequestInit) : axiosInstance.options<T>(url, options as AxiosRequestConfig).then(res => res.data)),

//     head: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
//       wrap(() => useFetch ? fetchWithAuth(url, { method: "HEAD", ...options } as RequestInit) : axiosInstance.head<T>(url, options as AxiosRequestConfig).then(res => res.data)),
//   };

//   return api;
// };

// // ------------------------
// // EXPORT
// // ------------------------
// export const api = createApi(false);
