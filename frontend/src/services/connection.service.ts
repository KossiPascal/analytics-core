import { api } from '@/apis/api';
import { PaginationParams, PaginatedResponse } from '@/models/OLD/old';
import { DbConnectionParams, TestType } from '@/pages/builders/builders.models';


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
export const connectionService = {
  async list<T=any>() {
    try {
      return await api.get<T[]>(`/connections`);
    } catch (e) {
      throw normalizeError(e);
    }
  },
  async listWithDetails<T=any>() {
    try {
      return await api.get<T[]>(`/connections/with-details`);
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

  async update(id: number, data: DbConnectionParams) {
    try {
      return await api.put(`/connections/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async patch(id: number, data: DbConnectionParams) {
    try {
      return await api.patch(`/connections/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async delete(id: number) {
    try {
      return await api.delete(`/connections/${id}`);
    } catch (e) {
      throw normalizeError(e);
    }
  },


  // ---------------------- TYPES ---------------------- 
  async typesList<T=any>() {
    try {
      return await api.get<T[]>("/conn-types");
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async typesCreate(data: DbConnectionParams) {
    try {
      return await api.post("/conn-types", data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async typesUpdate(id: string, data: DbConnectionParams) {
    try {
      return await api.put(`/conn-types/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async typesPatch(id: string, data: DbConnectionParams) {
    try {
      return await api.patch(`/conn-types/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async typesDelete(id: string) {
    try {
      return await api.delete(`/conn-types/${id}`);
    } catch (e) {
      throw normalizeError(e);
    }
  },


  // API Connexions & Query Builder

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



