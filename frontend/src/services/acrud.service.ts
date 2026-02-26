import { api, ApiResponse } from '@/apis/api';
import { onlineOrOffline } from "@/stores/stores.config";

interface CrudMessage {
    offline?: string;
    error?: string;
}

const notEmpty = (val: any) => {
    return val !== undefined && val !== null && val !== "";
}

export class CRUDService {
    base_url: string

    constructor(base_url: string = "") {
        this.base_url = base_url;
    }

    all = async <T = any>(url: string, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T[]) => Promise<boolean> }): Promise<T[]> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.get<T[]>(`${this.base_url}${url}`);
                if (!res.success) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data ?? []);
                return res.data ?? [];
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `GET_ALL_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? 'GET_ALL_NOT_ALLOWED_ON_OFFLINE');
            },
        });
    }

    getBy = async <T = any>(url: string, id: number, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T | T[] | undefined) => Promise<boolean> }): Promise<T | T[] | undefined> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.get<T | T[] | undefined>(`${this.base_url}${url}/${id}`);
                if (!res.success) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `GET_BY_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `GET_BY_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    list = async <T = any>(url: string, param: Record<string, any>, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T[]) => Promise<boolean> }): Promise<T[]> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.post<T[]>(`${this.base_url}${url}`, { ...(param ?? {}) });
                if (!res.success) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data ?? []);
                return res.data ?? [];
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `GET_ALL_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `GET_ALL_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    create = async <T = any>(url: string, data: T, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T) => Promise<boolean> }): Promise<T> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.post<T>(`${this.base_url}${url}`, data);
                if (!res.success || !res.data) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `SAVE_ALL_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `SAVE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    get = async <T = any>(url: string, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T | T[] | undefined) => Promise<boolean>, }): Promise<T | T[] | undefined> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.get<T | T[] | undefined>(`${this.base_url}${url}`, { ...(params?.options ?? {}) });
                if (!res.success) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `GET_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `GET_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    post = async <T = any>(url: string, data?: T, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T | T[] | undefined) => Promise<boolean>, }): Promise<T | T[] | undefined> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.post<T | T[] | undefined>(`${this.base_url}${url}`, {...(data??{})}, { ...(params?.options ?? {}) });
                if (!res.success) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `MAKE_ALL_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `MAKE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    update = async <T = any>(url: string, id: number, data: T, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T) => Promise<boolean> }): Promise<T> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.put<T>(`${this.base_url}${url}/${id}`, data);
                if (!res.success || !res.data) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `UPDATE_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `UPDATE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    patch = async <T = any>(url: string, id: number, data: T, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T) => Promise<boolean> }): Promise<T> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.patch<T>(`${this.base_url}${url}/${id}`, data);
                if (!res.success || !res.data) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `UPDATE_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `UPDATE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    remove = async <T = any>(url: string, id: number, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T) => Promise<boolean> }): Promise<T> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.delete<T>(`${this.base_url}${url}/${id}`);
                if (!res.success || !res.data) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `DELETE_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `DELETE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }

    // Upload file
    uploadFile = async <T>(url: string, file: File, fieldName = 'file', params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T) => Promise<boolean> }): Promise<T> => {
        return onlineOrOffline({
            online: async () => {
                const formData = new FormData();
                formData.append(fieldName, file);
                const headers = { 'Content-Type': 'multipart/form-data' }
                const res = await api.post<T>(`${this.base_url}${url}`, formData, { headers });
                if (!res.success || !res.data) throw new Error(params?.msg?.error ?? res.message);
                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `UPLOAD_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `UPLOAD_FILE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });

    }

    // Download file
    downloadFile = async <T = any>(url: string, filename: string, params?: { msg?: CrudMessage, options?: Record<string, any>, callback?: (data: T) => Promise<boolean> }): Promise<T> => {
        return onlineOrOffline({
            online: async () => {
                const res = await api.get<T>(`${this.base_url}${url}`, { responseType: 'blob' });

                if (!res.success || !res.data) throw new Error(params?.msg?.error ?? res.message);

                const blob = new Blob([res.data as any]);
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);

                if (params?.callback) await params?.callback(res.data);
                return res.data;
            },
            error: (e) => {
                throw new Error(params?.msg?.error ?? `DOWNLOAD_FILE_ERROR: ${e}`);
            },
            offline: async () => {
                throw new Error(params?.msg?.offline ?? `DOWNLOAD_FILE_NOT_ALLOWED_ON_OFFLINE`);
            },
        });
    }
}