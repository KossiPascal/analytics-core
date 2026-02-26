// src/api/dataset.ts
import { api } from "../../apis/api";
import { Dataset } from "@/models/dataset.models";

/* ----------------------------------
 * Types
 * ---------------------------------- */

export type DatasetCreatePayload = Partial<
  Omit<Dataset, "id" | "created_at" | "updated_at">
>;

export type DatasetUpdatePayload = Partial<
  Omit<Dataset, "id" | "created_at" | "updated_at">
>;

export type DatasetQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  owner_id?: string;
  dashboard_id?: string;
  from?: string;
  to?: string;
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
};

/* ----------------------------------
 * Utils
 * ---------------------------------- */

function buildQuery(params?: DatasetQueryParams): string {
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

export const datasetApi = {
  // 📊 Get all datasets (pagination + filters)
  async getAll(params?: DatasetQueryParams) {
    const res = await  api.get<Dataset[]>(`/datasets${buildQuery(params)}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📄 Get single dataset
  async getById(id: string) {
    const res = await  api.get<Dataset>(`/datasets/${id}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📁 Get datasets linked to a dashboard
  async getByDashboard(dashboardId: string) {
    const res = await  api.get<Dataset[]>(`/dashboards/${dashboardId}/datasets`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ➕ Create dataset
  async create(payload: DatasetCreatePayload) {
    const res = await  api.post<Dataset>("/datasets", payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ✏️ Full update (PUT)
  async update(id: string, payload: DatasetUpdatePayload) {
    const res = await  api.put<Dataset>(`/datasets/${id}`, payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🧩 Partial update (PATCH)
  async patch(id: string, payload: DatasetUpdatePayload) {
    const res = await  api.patch<Dataset>(`/datasets/${id}`, payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗑️ Delete dataset
  async delete(id: string) {
    const res = await  api.delete<void>(`/datasets/${id}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗂️ Bulk delete
  async bulkDelete(ids: string[]) {
    const res = await  api.post<void>("/datasets/bulk-delete", { ids });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📈 Dataset statistics
  async stats() {
    const res = await  api.get<{ total: number; linked: number; orphan: number; lastUpdated?: string; }>("/datasets/stats");
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📤 Export dataset
  async export(id: string, format: "json" | "csv" = "json") {
    const res = await  api.get<Blob>(`/datasets/${id}/export`, { responseType: "blob", params: { format } });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📥 Import dataset
  async import(file: File, dashboard_id?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (dashboard_id) formData.append("dashboard_id", dashboard_id);
    const headers = { "Content-Type": "multipart/form-data" };

    const res = await  api.post<Dataset>("/datasets/import", formData, { headers });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔄 Refresh dataset (recompute / reload)
  async refresh(id: string) {
    const res = await  api.post<Dataset>(`/datasets/${id}/refresh`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📊 Preview dataset rows
  async preview(id: string, limit = 20) {
    const res = await  api.get<any[]>(`/datasets/${id}/preview`, { params: { limit } });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔗 Link dataset to dashboard
  async attachToDashboard(datasetId: string, dashboardId: string) {
    const res = await  api.post<void>(`/dashboards/${dashboardId}/datasets`, { dataset_id: datasetId });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ❌ Unlink dataset from dashboard
  async detachFromDashboard(datasetId: string, dashboardId: string) {
    const res = await  api.delete<void>(`/dashboards/${dashboardId}/datasets/${datasetId}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },
};

export default datasetApi;




// const res = await datasetApi.getAll({ page: 1, limit: 20 });

// if (!res.success) {
//   toast.error("Impossible de charger les datasets");
//   return;
// }

// setDatasets(res.data ?? []);
