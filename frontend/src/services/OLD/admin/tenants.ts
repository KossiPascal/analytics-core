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

  getById: async (id: number): Promise<Tenant> => {
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
  update: async (id: number, tenant: Partial<Tenant>): Promise<Tenant> => {
    const res = await api.put(`/tenants/${id}`, tenant);
    if (!res.success) throw new Error("Failed to update tenant");
    return res.data;
  },

  partialUpdate: async (id: number, tenant: Partial<Tenant>): Promise<Tenant> => {
    const res = await api.patch(`/tenants/${id}`, tenant);
    if (!res.success) throw new Error("Failed to partially update tenant");
    return res.data;
  },

  // DELETE
  delete: async (id: number): Promise<void> => {
    const res = await api.delete(`/tenants/${id}`);
    if (!res.success) throw new Error("Failed to delete tenant");
  },

  // STATUS / ACTIONS
  activate: async (id: number): Promise<Tenant> => {
    const res = await api.post(`/tenants/${id}/activate`);
    if (!res.success) throw new Error("Failed to activate tenant");
    return res.data;
  },

  deactivate: async (id: number): Promise<Tenant> => {
    const res = await api.post(`/tenants/${id}/deactivate`);
    if (!res.success) throw new Error("Failed to deactivate tenant");
    return res.data;
  },

  // MEMBERS / ACCESS
  getUsers: async (tenant_id: number) => {
    const res = await api.get(`/tenants/users`, { params:{tenant_id} });
    if (!res.success) throw new Error("Failed to fetch tenant users");
    return res.data;
  },

  addUser: async (tenant_id: number, user_id: number) => {
    const res = await api.post(`/tenants/users`, { tenant_id, user_id });
    if (!res.success) throw new Error("Failed to add user to tenant");
    return res.data;
  },

  removeUser: async (tenant_id: number, user_id: number) => {
    const res = await api.delete(`/tenants/users`, { params:{tenant_id, user_id} });
    if (!res.success) throw new Error("Failed to remove user from tenant");
  },
};
