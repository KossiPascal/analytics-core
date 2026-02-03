import { api } from '@/apis/api';
import { onlineOrOffline } from '@/stores/stores.config';
import { IndexedDbStorage } from '@services/storages/indexed-db.service';

type DbType = 'postgres' | 'mysql' | 'mssql' | 'mariadb' | 'sqlite' | 'couchdb' | 'mongodb' | 'oracle' | 'other';


export interface DbConnectionForm {
  id?: string|null;
  type: DbType;
  name: string;
  dbname: string;
  username: string;
  password?: string;
  host: string;
  port: number;
  ssh_enabled: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_user?: string;
  ssh_password?: string;
  ssh_key?: string;
  ssh_key_pass?: string;
}

export interface DbConnectionParams {
  id?: string|null;
  type: DbType;
  name: string;
  host: string;
  username: string;
  dbname: string;
  port: number;
  password?: string;
  ssh?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    key?: string;
    key_pass?: string;
  } | null;
}



export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type TestType = "test-ssh" | "test-ssh-db"

// Normalisation des erreurs API
function normalizeError(error: any) {
  if (error?.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error("Unknown API error");
}

// API Connexions & Query Builder
export const connService = {
  async list() {
    try {
      return await api.get("/connections");
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async create(data: DbConnectionParams) {
    try {
      return await api.post("/connections", data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async update(id: string, data: DbConnectionParams) {
    try {
      return await api.put(`/connections/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async patch(id: string, data: DbConnectionParams) {
    try {
      return await api.patch(`/connections/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async delete(id: string) {
    try {
      return await api.delete(`/connections/${id}`);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async test(type: TestType, data: DbConnectionParams) {
    try {
      return await api.post(`/connections/${type}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async makeTest(connId: string) {
    try {
      return await api.post(`/connections/test-ssh-db`, { connId });
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async schema(connectionId: string, table?: string) {
    try {
      const addTable = table ? `?table=${encodeURIComponent(table)}` : '';
      return await api.get(`/connections/schema/${connectionId}${addTable}`);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async schemaInfo(table?: string) {
    try {
      const addTable = table ? `?table=${encodeURIComponent(table)}` : '';
      return await api.get(`/connections/schema_info${addTable}`);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async run(payload: any) {
    try {
      return await api.post("/query-builder", payload);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  // Paginated GET request
  async getPaginated<T>(url: string, params?: PaginationParams & Record<string, unknown>) {
    try {
      return await api.get<PaginatedResponse<T>>(url, { params });
    } catch (e) {
      throw normalizeError(e);
    }
  },

  // Upload file
  async uploadFile<T>(url: string, file: File, fieldName = 'file') {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      return await api.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (e) {
      throw normalizeError(e);
    }
  },

  // Download file
  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      throw normalizeError(e);
    }
  }
};
