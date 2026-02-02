// src/api/chart.ts
import { api } from "../../apis/api";
import { Chart } from "@models/OLD/chart";

// Types utilitaires
export type ChartCreatePayload = Partial<Omit<Chart, "id" | "created_at" | "updated_at">>;
export type ChartUpdatePayload = Partial<Omit<Chart, "id" | "created_at" | "updated_at">>;

export type ChartQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  owner_id?: string;
  from?: string;
  to?: string;
};

// Helpers
function buildQuery(params?: ChartQueryParams) {
  if (!params) return "";
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  return qs.toString() ? `?${qs}` : "";
}

export const chartApi = {
  // 📊 Get all charts
  async getAll(params?: ChartQueryParams) {
    const res = await  api.get<Chart[]>(`/charts${buildQuery(params)}`);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📈 Get single chart by ID
  async getById(id: string) {
    const res = await  api.get<Chart>(`/charts/${id}`);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ➕ Create chart
  async create(payload: ChartCreatePayload) {
    const res = await  api.post<Chart>("/charts", payload);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ✏️ Update chart
  async update(id: string, payload: ChartUpdatePayload) {
    const res = await  api.put<Chart>(`/charts/${id}`, payload);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🧩 Partial update (PATCH)
  async patch(id: string, payload: ChartUpdatePayload) {
    const res = await  api.patch<Chart>(`/charts/${id}`, payload);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗑️ Delete chart
  async delete(id: string) {
    const res = await  api.delete<void>(`/charts/${id}`);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📤 Bulk create
  async bulkCreate(charts: ChartCreatePayload[]) {
    const res = await  api.post<Chart[]>("/charts/bulk", { charts });
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗑️ Bulk delete
  async bulkDelete(ids: string[]) {
    const res = await  api.post<void>("/charts/bulk-delete", { ids });
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔄 Duplicate chart
  async duplicate(id: string) {
    const res = await  api.post<Chart>(`/charts/${id}/duplicate`);
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📊 Stats / analytics
  async stats() {
    const res = await  api.get<{ total: number; byType: Record<string, number>; lastUpdated?: string; }>("/charts/stats");
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ⬇️ Export charts
  async export(format: "csv" | "xlsx" | "json" = "csv") {
    const res = await  api.get<Blob>(`/charts/export`, { responseType: "blob", params: { format } });
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📥 Import charts
  async import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const headers = { "Content-Type": "multipart/form-data" };
    const res = await  api.post<Chart[]>("/charts/import", formData, { headers });
    if(!res.status) throw new Error(res.message || "Failed");
    return res.data;
  },
};

export default chartApi;


// const res = await chartApi.getAll({ page: 1, limit: 20 });

// if (!res.success) {
//   toast.error("Impossible de charger les graphiques");
//   return;
// }

// setCharts(res.data ?? []);
