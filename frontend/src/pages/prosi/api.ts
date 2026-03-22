// ============================================================================
// PROSI — Fonctions API centralisées
// ============================================================================

import { api } from '@/apis/api';
import type {
  Project, ProjectStats,
  ORC,
  Activity, ProgressLog,
  MonthlyReport,
  DashboardStats,
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
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>(`${BASE}/dashboard`),
};
