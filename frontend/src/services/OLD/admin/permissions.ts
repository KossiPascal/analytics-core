import { api } from "../../../apis/api";
import { Permission } from "@models/OLD/admin";

type PermissionFilters = {
  resource?: string;
  action?: string;
  deleted?: boolean;
};

export default {
  getAll: async (filters?: PermissionFilters): Promise<Permission[]> => {
    const res = await api.get(`/permissions`, { params: filters });
    if (!res.success) throw new Error("Failed to fetch permissions");
    return res.data;
  },

  getById: async (id: string): Promise<Permission> => {
    const res = await api.get(`/permissions/${id}`);
    if (!res.success) throw new Error("Failed to fetch permission");
    return res.data;
  },

  create: async (permission: Partial<Permission>): Promise<Permission> => {
    const res = await api.post(`/permissions`, permission);
    if (!res.success) throw new Error("Failed to create permission");
    return res.data;
  },

  update: async (id: string, permission: Partial<Permission>): Promise<Permission> => {
    const res = await api.put(`/permissions/${id}`, permission);
    if (!res.success) throw new Error("Failed to update permission");
    return res.data;
  },

  partialUpdate: async (id: string, permission: Partial<Permission>): Promise<Permission> => {
    const res = await api.patch(`/permissions/${id}`, permission);
    if (!res.success) throw new Error("Failed to partially update permission");
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/permissions/${id}`);
    if (!res.success) throw new Error("Failed to delete permission");
  }
};
