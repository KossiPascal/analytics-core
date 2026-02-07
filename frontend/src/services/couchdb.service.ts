import { api } from '@/apis/api';

export interface ChtCouchdbConnect {
  id?: string;
  name: string;
  description: string;
  host: string;
  port: string;
  username: string;
  password: string;
  test_db: string;
  auto_sync: boolean;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

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
export const couchdbService = {
  async create(params:ChtCouchdbConnect) {
    try {
      return await api.post("/couchdb", { ...params });
    } catch (e) {
      throw normalizeError(e);
    }
  },
  async connect(params:ChtCouchdbConnect) {
    try {
      return await api.post("/couchdb/connect", { ...params });
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async upsert(db_name: string, collection: string, doc: Record<string, any>) {
    try {
      return await api.post("/couchdb/upsert", { db_name, collection, doc });
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async lastseq(db_name: string, seq: string) {
    try {
      return await api.post("/couchdb/lastseq", { db_name, seq });
    } catch (e) {
      throw normalizeError(e);
    }
  },
};
