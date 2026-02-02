// src/api/dashboard.ts
import { api } from "../../apis/api";
import { Dashboard } from "@models/OLD/dashboard";

/* ----------------------------------
 * Types
 * ---------------------------------- */

export type DashboardCreatePayload = Partial<
  Omit<Dashboard, "id" | "created_at" | "updated_at">
>;

export type DashboardUpdatePayload = Partial<
  Omit<Dashboard, "id" | "created_at" | "updated_at">
>;

export type DashboardQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  owner_id?: string;
  is_public?: boolean;
  from?: string;
  to?: string;
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
};

/* ----------------------------------
 * Utils
 * ---------------------------------- */

function buildQuery(params?: DashboardQueryParams): string {
  if (!params) return "";

  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );

  return qs.toString() ? `?${qs}` : "";
}

/* ----------------------------------
 * API
 * ---------------------------------- */

export const dashboardApi = {
  // 📊 Get dashboards (paginated / filtered)
  async getAll(params?: DashboardQueryParams) {
    const res = await api.get<Dashboard[]>(`/dashboards${buildQuery(params)}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📁 Get dashboards owned by current user
  async getMine() {
    const res = await api.get<Dashboard[]>("/dashboards/mine");
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🌍 Get public dashboards
  async getPublic() {
    const res = await api.get<Dashboard[]>("/dashboards/public");
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📄 Get single dashboard
  async getById(id: string) {
    const res = await api.get<Dashboard>(`/dashboards/${id}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ➕ Create dashboard
  async create(payload: DashboardCreatePayload) {
    const res = await api.post<Dashboard>("/dashboards", payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ✏️ Update dashboard (PUT)
  async update(id: string, payload: DashboardUpdatePayload) {
    const res = await api.put<Dashboard>(`/dashboards/${id}`, payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🧩 Partial update (PATCH)
  async patch(id: string, payload: DashboardUpdatePayload) {
    const res = await api.patch<Dashboard>(`/dashboards/${id}`, payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗑️ Delete dashboard
  async remove(id: string) {
    const res = await api.delete<void>(`/dashboards/${id}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📤 Duplicate dashboard
  async duplicate(id: string) {
    const res = await api.post<Dashboard>(`/dashboards/${id}/duplicate`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 👥 Share dashboard
  async share(id: string, users: string[]) {
    const res = await api.post<void>(`/dashboards/${id}/share`, { users });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔒 Change visibility
  async setVisibility(id: string, is_public: boolean) {
    const res = await api.patch<Dashboard>(`/dashboards/${id}/visibility`, { is_public });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗂️ Bulk delete dashboards
  async bulkDelete(ids: string[]) {
    const res = await api.post<void>("/dashboards/bulk-delete", { ids });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📈 Dashboard statistics
  async stats() {
    const res = await api.get<{total: number;public: number;private: number;lastUpdated?: string;}>("/dashboards/stats");
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ⬇️ Export dashboards
  async export(format: "json" | "csv" = "json") {
    const res = await api.get<Blob>("/dashboards/export", {responseType: "blob",params: { format },});
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📥 Import dashboards
  async import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const headers = { "Content-Type": "multipart/form-data" };

    const res = await api.post<Dashboard[]>("/dashboards/import", formData, {headers});
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },
};

export default dashboardApi;




// const res = await dashboardApi.getAll({ page: 1, limit: 10 });

// if (!res.success) {
//   notify("Erreur de chargement des dashboards");
//   return;
// }

// setDashboards(res.data ?? []);
