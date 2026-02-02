// src/types/report.ts
export interface Report {
  id: string;                 // UUID
  name: string;
  tenant_id?: string;         // UUID du tenant
  dashboard_ids?: string[];   // Dashboards inclus dans ce report
  description?: string;
  layout?: any;               // JSON pour agencement du report
  filters?: any;              // JSON pour filtres appliqués
  created_at?: string;        // ISO timestamp
  updated_at?: string;
  [key: string]: any;         // pour propriétés dynamiques
}
