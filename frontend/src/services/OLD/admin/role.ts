import { api } from "../../../apis/api";
import { Role } from "@models/OLD/admin";

type RoleFilters = {
  tenant_id?: string;
  is_system?: boolean;
  deleted?: boolean;
};

export default {
  getAll: async (filters?: RoleFilters): Promise<Role[]> => {
    const res = await api.get(`/roles`, { params: filters });
    if (!res.success) throw new Error("Failed to fetch roles");
    return res.data;
  },

  getById: async (id: string): Promise<Role> => {
    const res = await api.get(`/roles/${id}`);
    if (!res.success) throw new Error("Failed to fetch role");
    return res.data;
  },

  create: async (role: Partial<Role>): Promise<Role> => {
    const res = await api.post(`/roles`, role);
    if (!res.success) throw new Error("Failed to create role");
    return res.data;
  },

  update: async (id: string, role: Partial<Role>): Promise<Role> => {
    const res = await api.put(`/roles/${id}`, role);
    if (!res.success) throw new Error("Failed to update role");
    return res.data;
  },

  partialUpdate: async (id: string, role: Partial<Role>): Promise<Role> => {
    const res = await api.patch(`/roles/${id}`, role);
    if (!res.success) throw new Error("Failed to partially update role");
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/roles/${id}`);
    if (!res.success) throw new Error("Failed to delete role");
  },

  // Manage role permissions
  getPermissions: async (roleId: string) => {
    const res = await api.get(`/roles/${roleId}/permissions`);
    if (!res.success) throw new Error("Failed to fetch role permissions");
    return res.data;
  },

  addPermission: async (roleId: string, permissionId: string) => {
    const res = await api.post(`/roles/${roleId}/permissions`, { permissionId });
    if (!res.success) throw new Error("Failed to add permission to role");
    return res.data;
  },

  removePermission: async (roleId: string, permissionId: string) => {
    const res = await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
    if (!res.success) throw new Error("Failed to remove permission from role");
  }
};
