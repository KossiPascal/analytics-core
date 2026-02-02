import { api } from '@/apis/api';
import { onlineOrOffline } from '@/stores/stores.config';
import { IndexedDbStorage } from '@services/storages/indexed-db.service';


// Normalisation des erreurs API
function normalizeError(error:any) {
  if (error?.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error("Unknown API error");
}

// API Connexions & Query Builder
export const ConnectionAPI = {
  async list() {
    try {
      return await api.get("/connections");
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async create(data:any) {
    try {
      return await api.post("/connections", data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async update(id:string, data:any) {
    try {
      return await api.put(`/connections/${id}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async delete(id:string) {
    try {
      return await api.delete(`/connections/${id}`);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async test(type:string, data:any) {
    try {
      return await api.post(`/connections/${type}`, data);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async makeTest(connId:string) {
    try {
      return await api.post(`/connections/test-ssh-db`, {connId});
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async schema(connectionId:string, table:string) {
    try {
      const addTable = table ? `?table=${encodeURIComponent(table)}` : '';
      const url = `/schema/${connectionId}${addTable}`;
      return await api.get(url);
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async schemaInfo(table?:string) {
    try {
      return await api.get('/schema/schema_info');
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async run(payload:any) {
    try {
      return await api.post("/query-builder", payload);
    } catch (e) {
      throw normalizeError(e);
    }
  }
};
