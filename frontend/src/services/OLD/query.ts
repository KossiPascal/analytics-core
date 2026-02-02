// src/api/query.ts
import { api } from "../../apis/api";
import { Query } from "@models/OLD/query";

/* ----------------------------------
 * Types
 * ---------------------------------- */

export type QueryCreatePayload = Partial<
  Omit<Query, "id" | "created_at" | "updated_at" | "last_executed_at">
>;

export type QueryUpdatePayload = Partial<
  Omit<Query, "id" | "created_at" | "updated_at" | "last_executed_at">
>;

export type QueryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  dataset_id?: string;
  dashboard_id?: string;
  status?: "draft" | "active" | "archived" | "failed";
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
};

/* ----------------------------------
 * Utils
 * ---------------------------------- */

function buildQuery(params?: QueryQueryParams): string {
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

export const queryApi = {
  // 📄 Get all queries (pagination + filters)
  async getAll(params?: QueryQueryParams) {
    const res = await  api.get<Query[]>(`/queries${buildQuery(params)}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔍 Get single query
  async getById(id: string) {
    const res = await  api.get<Query>(`/queries/${id}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📁 Get queries by dataset
  async getByDataset(datasetId: string) {
    const res = await  api.get<Query[]>(`/datasets/${datasetId}/queries`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📊 Get queries by dashboard
  async getByDashboard(dashboardId: string) {
    const res = await  api.get<Query[]>(`/dashboards/${dashboardId}/queries`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ➕ Create query
  async create(payload: QueryCreatePayload) {
    const res = await  api.post<Query>("/queries", payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ✏️ Full update (PUT)
  async update(id: string, payload: QueryUpdatePayload) {
    const res = await  api.put<Query>(`/queries/${id}`, payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🧩 Partial update (PATCH)
  async patch(id: string, payload: QueryUpdatePayload) {
    const res = await  api.patch<Query>(`/queries/${id}`, payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗑️ Delete query
  async delete(id: string) {
    const res = await  api.delete<void>(`/queries/${id}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🗂️ Bulk delete
  async bulkDelete(ids: string[]) {
    const res = await  api.post<void>("/queries/bulk-delete", { ids });
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ▶️ Execute query
  async execute(id: string, params?: Record<string, any>) {
    const res = await  api.post<{execution_id: string;status: "running" | "completed" | "failed";}>(`/queries/${id}/execute`, params);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📊 Get last execution result
  async lastResult(id: string) {
    const res = await  api.get<any[]>(`/queries/${id}/last-result`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🕒 Execution history
  async executions(id: string) {
    const res = await  api.get<Array<{id: string;status: string;started_at: string;finished_at?: string;error?: string;}>>(`/queries/${id}/executions`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔄 Re-run last execution
  async rerun(id: string) {
    const res = await  api.post<void>(`/queries/${id}/rerun`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🧪 Validate query syntax / config
  async validate(payload: QueryCreatePayload) {
    const res = await  api.post<{ valid: boolean; errors?: string[] }>("/queries/validate",payload);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 📈 Query statistics
  async stats() {
    const res = await  api.get<{total: number;active: number;archived: number;lastExecutedAt?: string;}>("/queries/stats");
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // 🔗 Attach query to dashboard
  async attachToDashboard(queryId: string, dashboardId: string) {
    const res = await  api.post<void>(`/dashboards/${dashboardId}/queries`, {query_id: queryId});
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },

  // ❌ Detach query from dashboard
  async detachFromDashboard(queryId: string, dashboardId: string) {
    const res = await  api.delete<void>(`/dashboards/${dashboardId}/queries/${queryId}`);
    if(!res.success) throw new Error(res.message || "Failed");
    return res.data;
  },
};

export default queryApi;


// const res = await queryApi.execute(queryId, { year: 2025 });

// if (!res.success) {
//   toast.error("Erreur lors de l’exécution de la requête");
//   return;
// }

// console.log("Execution ID:", res.data?.execution_id);
