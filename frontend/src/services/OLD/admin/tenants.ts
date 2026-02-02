// src/api/tenant.ts
import { api } from "../../../apis/api";
import { Tenant } from "@models/OLD/admin";

type TenantFilters = {
  isActive?: boolean;
  name?: string;
  createdBy?: string;
};

export default {
  // READ
  getAll: async (filters?: TenantFilters): Promise<Tenant[]> => {
    const res = await api.get(`/tenants`, { params: filters });
    if (!res.success) throw new Error("Failed to fetch tenants");
    return res.data;
  },

  getById: async (id: string): Promise<Tenant> => {
    const res = await api.get(`/tenants/${id}`);
    if (!res.success) throw new Error("Failed to fetch tenant");
    return res.data;
  },

  // CREATE
  create: async (tenant: Partial<Tenant>): Promise<Tenant> => {
    const res = await api.post(`/tenants`, tenant);
    if (!res.success) throw new Error("Failed to create tenant");
    return res.data;
  },

  // UPDATE
  update: async (id: string, tenant: Partial<Tenant>): Promise<Tenant> => {
    const res = await api.put(`/tenants/${id}`, tenant);
    if (!res.success) throw new Error("Failed to update tenant");
    return res.data;
  },

  partialUpdate: async (id: string, tenant: Partial<Tenant>): Promise<Tenant> => {
    const res = await api.patch(`/tenants/${id}`, tenant);
    if (!res.success) throw new Error("Failed to partially update tenant");
    return res.data;
  },

  // DELETE
  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/tenants/${id}`);
    if (!res.success) throw new Error("Failed to delete tenant");
  },

  // STATUS / ACTIONS
  activate: async (id: string): Promise<Tenant> => {
    const res = await api.post(`/tenants/${id}/activate`);
    if (!res.success) throw new Error("Failed to activate tenant");
    return res.data;
  },

  deactivate: async (id: string): Promise<Tenant> => {
    const res = await api.post(`/tenants/${id}/deactivate`);
    if (!res.success) throw new Error("Failed to deactivate tenant");
    return res.data;
  },

  // MEMBERS / ACCESS
  getUsers: async (tenantId: string) => {
    const res = await api.get(`/tenants/${tenantId}/users`);
    if (!res.success) throw new Error("Failed to fetch tenant users");
    return res.data;
  },

  addUser: async (tenantId: string, userId: string) => {
    const res = await api.post(`/tenants/${tenantId}/users`, { userId });
    if (!res.success) throw new Error("Failed to add user to tenant");
    return res.data;
  },

  removeUser: async (tenantId: string, userId: string) => {
    const res = await api.delete(`/tenants/${tenantId}/users/${userId}`);
    if (!res.success) throw new Error("Failed to remove user from tenant");
  },
};
