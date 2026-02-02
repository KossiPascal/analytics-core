// src/api/report.ts
import { api } from "../../apis/api";
import { Report } from "@models/OLD/report";

type ReportFilters = {
  reportId?: string;
  datasetId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
};

export default {
  // READ
  getAll: async (filters?: ReportFilters): Promise<Report[]> => {
    const res = await api.get(`/reports`, { params: filters });
    if (!res.success) throw new Error("Failed to fetch reports");
    return res.data;
  },

  getById: async (id: string): Promise<Report> => {
    const res = await api.get(`/reports/${id}`);
    if (!res.success) throw new Error("Failed to fetch report");
    return res.data;
  },

  // CREATE
  create: async (report: Partial<Report>): Promise<Report> => {
    const res = await api.post(`/reports`, report);
    if (!res.success) throw new Error("Failed to create report");
    return res.data;
  },

  // UPDATE
  update: async (id: string, report: Partial<Report>): Promise<Report> => {
    const res = await api.put(`/reports/${id}`, report);
    if (!res.success) throw new Error("Failed to update report");
    return res.data;
  },

  // DELETE
  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/reports/${id}`);
    if (!res.success) throw new Error("Failed to delete report");
  },

  // STATUS / ACTIONS
  publish: async (id: string): Promise<Report> => {
    const res = await api.post(`/reports/${id}/publish`);
    if (!res.success) throw new Error("Failed to publish report");
    return res.data;
  },

  archive: async (id: string): Promise<Report> => {
    const res = await api.post(`/reports/${id}/archive`);
    if (!res.success) throw new Error("Failed to archive report");
    return res.data;
  },

  // EXPORTS
  exportPDF: async (id: string): Promise<Blob> => {
    const res = await api.get(`/reports/${id}/export/pdf`, { responseType: "blob" });
    if (!res.success) throw new Error("Failed to export report as PDF");
    return res.data;
  },

  exportExcel: async (id: string): Promise<Blob> => {
    const res = await api.get(`/reports/${id}/export/excel`, { responseType: "blob" });
    if (!res.success) throw new Error("Failed to export report as Excel");
    return res.data;
  },
};
