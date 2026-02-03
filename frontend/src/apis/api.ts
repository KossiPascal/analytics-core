import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenProvider } from "@/apis/token.provider";
const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 120) * 1000;

export interface payloadUser {
  id: string;
  username: string;
  fullname: string;
  tenant_id: string | undefined;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  access_token_exp: number,
  refresh_token: string;
  refresh_token_exp: number,
  payload: payloadUser
}

export type ApiResponse<T = any> = {
  status: number;
  success: boolean;
  data?: T;
  message?: any;
  headers?: Headers | any;
};

type ApiMethods<UseFetch extends boolean> = {
  get: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  patch: <T = any>(url: string, data?: any, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  delete: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  options: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
  head: <T = any>(url: string, config?: UseFetch extends true ? RequestInit : AxiosRequestConfig) => Promise<ApiResponse<T>>;
};

/**
 * Wrapper universel pour toutes les requêtes Axios ou Fetch
 */
async function handleRequest<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { status: 200, success: true, data };
  } catch (err: any) {
    // Axios error
    if (err.isAxiosError) {
      if (err.response) {
        throw {
          status: err.response.status,
          success: false,
          message: err.response.data || err.message,
          headers: err.response.headers,
        };
      } else if (err.request) {
        throw { status: err.status, success: false, message: err.data || err.message || "No response received" };
      }
    } else if (err instanceof Error && err.name === "AbortError") {
      throw { status: 0, success: false, error: err.message || err || "Request timeout" };
    }
    throw err;
  }
}

/**
 * Création de l'API universelle
 * @param useFetch - si true, utilise fetch sinon axios
 */
export function createApi<UseFetch extends boolean = false>(useFetch?: UseFetch): ApiMethods<UseFetch> {

  const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: TIMEOUT,
  });

  // 🔐 Interceptor → token toujours à jour
  axiosInstance.interceptors.request.use((config:any) => {
    const token = tokenProvider.get();

    config.headers = {
    "Content-Type": "application/json",
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return config;
  });



  /**
   * Wrapper Fetch universel
   */
  async function fetchRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = tokenProvider.get();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);


    try {
      const res = await fetch(`${API_URL}${url}`, { ...options, headers, signal: controller.signal });
      clearTimeout(timeout);

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json") ? await res.json() : await res.text();

      if (!res.ok) throw { status: res.status, data, message: data?.error || res.statusText };
      return data;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  const api: ApiMethods<UseFetch> = {
    get: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "GET", ...options } as RequestInit) :
        axiosInstance.get<T>(url, options as AxiosRequestConfig).then(res => res.data)),

    post: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "POST", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.post<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),

    put: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "PUT", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.put<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),

    patch: async <T = any>(url: string, data?: any, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "PATCH", body: JSON.stringify(data), ...options } as RequestInit) : axiosInstance.patch<T>(url, data, options as AxiosRequestConfig).then(res => res.data)),

    delete: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "DELETE", ...options } as RequestInit) : axiosInstance.delete<T>(url, options as AxiosRequestConfig).then(res => res.data)),

    options: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "OPTIONS", ...options } as RequestInit) : axiosInstance.options<T>(url, options as AxiosRequestConfig).then(res => res.data)),

    head: async <T = any>(url: string, options?: UseFetch extends true ? RequestInit : AxiosRequestConfig): Promise<ApiResponse<T>> =>
      handleRequest(() => useFetch ? fetchRequest(url, { method: "HEAD", ...options } as RequestInit) : axiosInstance.head<T>(url, options as AxiosRequestConfig).then(res => res.data)),
  };

  return api;
}

// ------------------------
// Export par défaut
// ------------------------
export const api = createApi(false); // axios par défaut
