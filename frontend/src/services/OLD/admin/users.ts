import { api } from "../../../apis/api";
import { User } from "@models/OLD/auth";

type UserFilters = {
  tenant_id?: string;
  username?: string;
  email?: string;
  is_active?: boolean;
};

export default {
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const res = await api.get(`/users`, { params: filters });
    if (!res.success) throw new Error("Failed to fetch users");
    return res.data;
  },

  getById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    if (!res.success) throw new Error("Failed to fetch user");
    return res.data;
  },

  create: async (user: Partial<User>): Promise<User> => {
    const res = await api.post(`/users`, user);
    if (!res.success) throw new Error("Failed to create user");
    return res.data;
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const res = await api.put(`/users/${id}`, user);
    if (!res.success) throw new Error("Failed to update user");
    return res.data;
  },

  partialUpdate: async (id: string, user: Partial<User>): Promise<User> => {
    const res = await api.patch(`/users/${id}`, user);
    if (!res.success) throw new Error("Failed to partially update user");
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/users/${id}`);
    if (!res.success) throw new Error("Failed to delete user");
  },

  // Manage user roles
  getRoles: async (userId: string) => {
    const res = await api.get(`/users/${userId}/roles`);
    if (!res.success) throw new Error("Failed to fetch user roles");
    return res.data;
  },

  addRole: async (userId: string, roleId: string) => {
    const res = await api.post(`/users/${userId}/roles`, { roleId });
    if (!res.success) throw new Error("Failed to add role to user");
    return res.data;
  },

  removeRole: async (userId: string, roleId: string) => {
    const res = await api.delete(`/users/${userId}/roles/${roleId}`);
    if (!res.success) throw new Error("Failed to remove role from user");
  }
};
