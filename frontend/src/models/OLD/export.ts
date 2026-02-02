// src/models/export.ts
export interface ExportOptions {
  format: "pdf" | "excel" | "csv";
  dashboardId: string;
  charts?: string[]; // si subset
}
