// ============================================================================
// PROSI — Fonctions API centralisées
// ============================================================================

import { api } from '@/apis/api';
import type {
  Project, ProjectStats,
  StrategicPillar,
  ORC,
  Activity, ProgressLog,
  MonthlyReport,
  DashboardStats,
  EmployeeObjective, TeamSummary,
} from './types';

const BASE = '/prosi';

// ─── PROJETS ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  getAll: (params?: { status?: string; priority?: string; search?: string; active?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.status)   q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.search)   q.set('search', params.search);
    if (params?.active !== undefined) q.set('active', String(params.active));
    const qs = q.toString();
    return api.get<Project[]>(`${BASE}/projects${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<Project>(`${BASE}/projects`, data),
  get: (id: string) => api.get<Project>(`${BASE}/projects/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<Project>(`${BASE}/projects/${id}`, data),
  delete: (id: string) => api.delete(`${BASE}/projects/${id}`),
  stats: (id: string) => api.get<ProjectStats>(`${BASE}/projects/${id}/stats`),
};

// ─── ORCs ─────────────────────────────────────────────────────────────────────

export const orcsApi = {
  getAll: (params?: { project_id?: string; status?: string; orc_type?: string; root_only?: boolean; parent_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.status)     q.set('status', params.status);
    if (params?.orc_type)   q.set('orc_type', params.orc_type);
    if (params?.root_only)  q.set('root_only', 'true');
    if (params?.parent_id)  q.set('parent_id', params.parent_id);
    const qs = q.toString();
    return api.get<ORC[]>(`${BASE}/orcs${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<ORC>(`${BASE}/orcs`, data),
  get: (id: string) => api.get<ORC>(`${BASE}/orcs/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<ORC>(`${BASE}/orcs/${id}`, data),
  delete: (id: string) => api.delete(`${BASE}/orcs/${id}`),
};

// ─── ACTIVITES ───────────────────────────────────────────────────────────────

export const activitiesApi = {
  getAll: (params?: {
    project_id?: string;
    orc_id?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    search?: string;
    month?: string;
    overdue?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.project_id)  q.set('project_id', params.project_id);
    if (params?.orc_id)      q.set('orc_id', params.orc_id);
    if (params?.status)      q.set('status', params.status);
    if (params?.priority)    q.set('priority', params.priority);
    if (params?.assignee_id) q.set('assignee_id', params.assignee_id);
    if (params?.search)      q.set('search', params.search);
    if (params?.month)       q.set('month', params.month);
    if (params?.overdue)     q.set('overdue', 'true');
    const qs = q.toString();
    return api.get<Activity[]>(`${BASE}/activities${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<Activity>(`${BASE}/activities`, data),
  get: (id: string) => api.get<Activity>(`${BASE}/activities/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<Activity>(`${BASE}/activities/${id}`, data),
  delete: (id: string) => api.delete(`${BASE}/activities/${id}`),
  logProgress: (id: string, data: { progress_percent: number; notes?: string; log_date?: string }) =>
    api.post<ProgressLog>(`${BASE}/activities/${id}/progress`, data),
};

// ─── RAPPORTS ─────────────────────────────────────────────────────────────────

export const reportsApi = {
  getAll: (params?: { project_id?: string; year?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.year)       q.set('year', String(params.year));
    if (params?.status)     q.set('status', params.status);
    const qs = q.toString();
    return api.get<MonthlyReport[]>(`${BASE}/reports${qs ? `?${qs}` : ''}`);
  },
  generate: (data: { project_id: string; year: number; month: number; summary?: string; overwrite?: boolean }) =>
    api.post<MonthlyReport>(`${BASE}/reports/generate`, data),
  get: (id: string) => api.get<MonthlyReport>(`${BASE}/reports/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<MonthlyReport>(`${BASE}/reports/${id}`, data),
  delete: (id: string) => api.delete(`${BASE}/reports/${id}`),

  downloadPdf: async (id: string, filename: string): Promise<void> => {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
    const token   = localStorage.getItem('access_token');
    const response = await fetch(`${apiBase}${BASE}/reports/${id}/pdf`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Erreur lors de la génération du PDF');
    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>(`${BASE}/dashboard`),
};

// ─── PILIERS STRATÉGIQUES ─────────────────────────────────────────────────────

export const pillarsApi = {
  getAll: (params?: { project_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    const qs = q.toString();
    return api.get<StrategicPillar[]>(`${BASE}/pillars${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<StrategicPillar>(`${BASE}/pillars`, data),
  update: (id: string, data: Record<string, unknown>) => api.put<StrategicPillar>(`${BASE}/pillars/${id}`, data),
  delete: (id: string) => api.delete(`${BASE}/pillars/${id}`),
};

// ─── OBJECTIFS EMPLOYÉ ───────────────────────────────────────────────────────

export const employeeObjectivesApi = {
  getAll: (params?: {
    employee_id?: string; user_id?: string; project_id?: string;
    fiscal_year?: number; quarter?: string; status?: string;
    reviewer_id?: string; pending_review?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.employee_id)   q.set('employee_id',   params.employee_id);
    if (params?.user_id)       q.set('user_id',       params.user_id);
    if (params?.project_id)    q.set('project_id',    params.project_id);
    if (params?.fiscal_year)   q.set('fiscal_year',   String(params.fiscal_year));
    if (params?.quarter)       q.set('quarter',       params.quarter);
    if (params?.status)        q.set('status',        params.status);
    if (params?.reviewer_id)   q.set('reviewer_id',   params.reviewer_id);
    if (params?.pending_review) q.set('pending_review', 'true');
    const qs = q.toString();
    return api.get<EmployeeObjective[]>(`${BASE}/employee-objectives${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) =>
    api.post<EmployeeObjective>(`${BASE}/employee-objectives`, data),
  get: (id: string) =>
    api.get<EmployeeObjective>(`${BASE}/employee-objectives/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<EmployeeObjective>(`${BASE}/employee-objectives/${id}`, data),
  delete: (id: string) =>
    api.delete(`${BASE}/employee-objectives/${id}`),
  submit: (id: string) =>
    api.post<EmployeeObjective>(`${BASE}/employee-objectives/${id}/submit`, {}),
  review: (id: string, data: { decision: 'APPROVED' | 'REJECTED'; review_notes?: string; score?: number; current_value?: number }) =>
    api.post<EmployeeObjective>(`${BASE}/employee-objectives/${id}/review`, data),
  complete: (id: string, data: { score?: number; current_value?: number }) =>
    api.post<EmployeeObjective>(`${BASE}/employee-objectives/${id}/complete`, data),
  teamSummary: (fiscal_year: number, quarter: string) =>
    api.get<TeamSummary>(`${BASE}/employee-objectives/team-summary?fiscal_year=${fiscal_year}&quarter=${quarter}`),
};

// ─── IMPORT EXCEL ─────────────────────────────────────────────────────────────

export const importApi = {
  /** Lit les noms de feuilles d'un fichier Excel sans importer. */
  getSheets: async (file: File): Promise<string[]> => {
    const form = new FormData();
    form.append('file', file);
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
    const token   = localStorage.getItem('access_token');
    const res = await fetch(`${apiBase}${BASE}/import/sheets`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erreur');
    return json.sheets as string[];
  },

  /** Lance l'import OKR avec les feuilles sélectionnées. */
  importOkr: async (params: {
    file: File;
    project_id: string;
    fiscal_year?: number;
    quarter?: string;
    sheets?: string[];
    overwrite?: boolean;
  }): Promise<{ message: string; stats: Record<string, number> }> => {
    const form = new FormData();
    form.append('file', params.file);
    form.append('project_id', params.project_id);
    if (params.fiscal_year) form.append('fiscal_year', String(params.fiscal_year));
    if (params.quarter)     form.append('quarter', params.quarter);
    if (params.overwrite)   form.append('overwrite', 'true');
    (params.sheets ?? []).forEach((s) => form.append('sheets[]', s));

    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
    const token   = localStorage.getItem('access_token');
    const res = await fetch(`${apiBase}${BASE}/import/okr`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erreur import');
    return json;
  },
};
