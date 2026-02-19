// ============================================================================
// Equipment Manager - Centralized API Functions
// ============================================================================

import { api } from '@/apis/api';
import type {
  Region, District, Site, ZoneASC,
  ASC, Supervisor, Equipment, EquipmentHistory, Accessory,
  EquipmentCategory, EquipmentBrand,
  Department, Position, Employee,
  RepairTicket, ProblemType, TicketComment,
  DelayAlertRecipient,
  DashboardStats, TicketsByStatus, TicketsByDelay, BlockagePoint,
  SyncResult,
} from './types';

const BASE = '/equipment';

// ─── LOCATIONS ──────────────────────────────────────────────────────────────

export const locationsApi = {
  // Regions
  getRegions: () => api.get<Region[]>(`${BASE}/locations/regions`),
  createRegion: (data: { name: string; code: string }) => api.post<Region>(`${BASE}/locations/regions`, data),
  getRegion: (id: string) => api.get<Region & { districts: District[] }>(`${BASE}/locations/regions/${id}`),
  updateRegion: (id: string, data: Partial<Region>) => api.put<Region>(`${BASE}/locations/regions/${id}`, data),
  deleteRegion: (id: string) => api.delete(`${BASE}/locations/regions/${id}`),

  // Districts
  getDistricts: (regionId?: string) => api.get<District[]>(`${BASE}/locations/districts${regionId ? `?region_id=${regionId}` : ''}`),
  createDistrict: (data: { name: string; code: string; region_id: string }) => api.post<District>(`${BASE}/locations/districts`, data),
  getDistrict: (id: string) => api.get<District & { sites: Site[] }>(`${BASE}/locations/districts/${id}`),
  updateDistrict: (id: string, data: Partial<District>) => api.put<District>(`${BASE}/locations/districts/${id}`, data),

  // Sites
  getSites: (districtId?: string) => api.get<Site[]>(`${BASE}/locations/sites${districtId ? `?district_id=${districtId}` : ''}`),
  createSite: (data: { name: string; code: string; district_id: string; address?: string; phone?: string }) => api.post<Site>(`${BASE}/locations/sites`, data),
  getSite: (id: string) => api.get<Site & { zones: ZoneASC[] }>(`${BASE}/locations/sites/${id}`),
  updateSite: (id: string, data: Partial<Site>) => api.put<Site>(`${BASE}/locations/sites/${id}`, data),

  // Zones
  getZones: (siteId?: string) => api.get<ZoneASC[]>(`${BASE}/locations/zones${siteId ? `?site_id=${siteId}` : ''}`),
  createZone: (data: { name: string; code: string; site_id: string }) => api.post<ZoneASC>(`${BASE}/locations/zones`, data),
  updateZone: (id: string, data: Partial<ZoneASC>) => api.put<ZoneASC>(`${BASE}/locations/zones/${id}`, data),
};

// ─── ASCs ───────────────────────────────────────────────────────────────────

export const ascsApi = {
  getAll: (params?: { supervisor_id?: string; site_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.supervisor_id) query.set('supervisor_id', params.supervisor_id);
    if (params?.site_id) query.set('site_id', params.site_id);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<ASC[]>(`${BASE}/ascs${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<ASC>(`${BASE}/ascs`, data),
  get: (id: string) => api.get<ASC & { equipments: Equipment[]; tickets: RepairTicket[] }>(`${BASE}/ascs/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<ASC>(`${BASE}/ascs/${id}`, data),
  delete: (id: string) => api.delete(`${BASE}/ascs/${id}`),
};

// ─── SUPERVISORS ────────────────────────────────────────────────────────────

export const supervisorsApi = {
  getAll: () => api.get<Supervisor[]>(`${BASE}/supervisors`),
  create: (data: Record<string, unknown>) => api.post<Supervisor>(`${BASE}/supervisors`, data),
  get: (id: string) => api.get<Supervisor>(`${BASE}/supervisors/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<Supervisor>(`${BASE}/supervisors/${id}`, data),
};

// ─── EQUIPMENT ──────────────────────────────────────────────────────────────

export const equipmentApi = {
  // Categories (Types)
  getCategories: () => api.get<EquipmentCategory[]>(`${BASE}/assets/categories`),
  createCategory: (data: Record<string, unknown>) => api.post<EquipmentCategory>(`${BASE}/assets/categories`, data),
  updateCategory: (id: string, data: Record<string, unknown>) => api.put<EquipmentCategory>(`${BASE}/assets/categories/${id}`, data),

  // Brands (Marques)
  getBrands: () => api.get<EquipmentBrand[]>(`${BASE}/assets/brands`),
  createBrand: (data: Record<string, unknown>) => api.post<EquipmentBrand>(`${BASE}/assets/brands`, data),
  updateBrand: (id: string, data: Record<string, unknown>) => api.put<EquipmentBrand>(`${BASE}/assets/brands/${id}`, data),

  getAll: (params?: { asc_id?: string; employee_id?: string; status?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.asc_id) query.set('asc_id', params.asc_id);
    if (params?.employee_id) query.set('employee_id', params.employee_id);
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return api.get<Equipment[]>(`${BASE}/assets${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<Equipment>(`${BASE}/assets`, data),
  get: (id: string) => api.get<Equipment & { history: EquipmentHistory[]; tickets: RepairTicket[] }>(`${BASE}/assets/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<Equipment>(`${BASE}/assets/${id}`, data),
  assign: (id: string, data: { asc_id?: string; employee_id?: string; notes?: string }) => api.post<Equipment>(`${BASE}/assets/${id}/assign`, data),
  transfer: (id: string, data: { employee_id: string; notes?: string }) => api.post<Equipment>(`${BASE}/assets/${id}/transfer`, data),
  getHistory: (id: string) => api.get<EquipmentHistory[]>(`${BASE}/assets/${id}/history`),

  /** Télécharge la fiche d'accusé de réception (PDF) pour un équipement. */
  downloadReceptionPdf: async (id: string): Promise<void> => {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${apiBase}/equipment/assets/${id}/pdf/reception`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Erreur lors de la génération du PDF');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `fiche_reception_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  },

  declare: (id: string, data: { declaration: string; reason: string; notes?: string }) =>
    api.post<Equipment>(`${BASE}/assets/${id}/declare`, data),

  cancelDeclaration: (id: string, data?: { notes?: string }) =>
    api.post<Equipment>(`${BASE}/assets/${id}/cancel-declaration`, data ?? {}),

  // Accessories
  getAccessories: (equipmentId: string) => api.get<Accessory[]>(`${BASE}/assets/${equipmentId}/accessories`),
  createAccessory: (equipmentId: string, data: Record<string, unknown>) => api.post<Accessory>(`${BASE}/assets/${equipmentId}/accessories`, data),
  updateAccessory: (equipmentId: string, accId: string, data: Record<string, unknown>) => api.put<Accessory>(`${BASE}/assets/${equipmentId}/accessories/${accId}`, data),
  deleteAccessory: (equipmentId: string, accId: string) => api.delete(`${BASE}/assets/${equipmentId}/accessories/${accId}`),
};

// ─── TICKETS ────────────────────────────────────────────────────────────────

export const ticketsApi = {
  getAll: (params?: { status?: string; stage?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.stage) query.set('stage', params.stage);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<RepairTicket[]>(`${BASE}/tickets${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<RepairTicket>(`${BASE}/tickets`, data),
  get: (id: string) => api.get<RepairTicket & { events: import('./types').TicketEvent[]; comments: TicketComment[]; issues: import('./types').Issue[] }>(`${BASE}/tickets/${id}`),
  receive: (id: string, data?: { comment?: string }) => api.post<RepairTicket>(`${BASE}/tickets/${id}/receive`, data),
  send: (id: string, data: { to_role: string; comment?: string; recipient_email?: string }) => api.post<RepairTicket>(`${BASE}/tickets/${id}/send`, data),
  markRepaired: (id: string, data: { resolution_notes: string }) => api.post<RepairTicket>(`${BASE}/tickets/${id}/mark-repaired`, data),
  cancel: (id: string, data: { cancellation_reason: string }) => api.post<RepairTicket>(`${BASE}/tickets/${id}/cancel`, data),
  addComment: (id: string, data: { comment: string }) => api.post<TicketComment>(`${BASE}/tickets/${id}/comment`, data),
  getOverdue: () => api.get<RepairTicket[]>(`${BASE}/tickets/overdue`),
  getWarning: () => api.get<RepairTicket[]>(`${BASE}/tickets/warning`),

  // Problem types
  getProblemTypes: () => api.get<ProblemType[]>(`${BASE}/tickets/problem-types`),
  createProblemType: (data: Record<string, unknown>) => api.post<ProblemType>(`${BASE}/tickets/problem-types`, data),

  // Alert recipients
  getAlertRecipients: () => api.get<DelayAlertRecipient[]>(`${BASE}/tickets/alert-recipients`),
  createAlertRecipient: (data: { user_id: string; email: string; recipient_type?: string }) => api.post<DelayAlertRecipient>(`${BASE}/tickets/alert-recipients`, data),
  toggleAlertRecipient: (id: string) => api.patch<DelayAlertRecipient>(`${BASE}/tickets/alert-recipients/${id}`),
};

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────

export const employeesApi = {
  // Departments
  getDepartments: () => api.get<(Department & { children: Department[] })[]>(`${BASE}/employees/departments`),
  createDepartment: (data: Record<string, unknown>) => api.post<Department>(`${BASE}/employees/departments`, data),
  getDepartment: (id: string) => api.get<Department & { children: Department[]; employees: Employee[] }>(`${BASE}/employees/departments/${id}`),
  updateDepartment: (id: string, data: Record<string, unknown>) => api.put<Department>(`${BASE}/employees/departments/${id}`, data),

  // Positions
  getPositions: () => api.get<Position[]>(`${BASE}/employees/positions`),
  createPosition: (data: Record<string, unknown>) => api.post<Position>(`${BASE}/employees/positions`, data),
  updatePosition: (id: string, data: Record<string, unknown>) => api.put<Position>(`${BASE}/employees/positions/${id}`, data),

  // Employees
  getAll: (params?: { department_id?: string; active?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.department_id) query.set('department_id', params.department_id);
    if (params?.active) query.set('active', params.active);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<Employee[]>(`${BASE}/employees${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => api.post<Employee>(`${BASE}/employees`, data),
  get: (id: string) => api.get<Employee & { history: import('./types').EmployeeHistory[]; equipments: Equipment[] }>(`${BASE}/employees/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<Employee>(`${BASE}/employees/${id}`, data),
  toggleActive: (id: string) => api.patch<Employee>(`${BASE}/employees/${id}/toggle-active`),
};

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>(`${BASE}/dashboard/stats`),
  getTicketsByStatus: () => api.get<TicketsByStatus>(`${BASE}/dashboard/tickets-by-status`),
  getTicketsByDelay: () => api.get<TicketsByDelay>(`${BASE}/dashboard/tickets-by-delay`),
  getBlockagePoints: () => api.get<BlockagePoint[]>(`${BASE}/dashboard/blockage-points`),
  getRecentOverdue: () => api.get<RepairTicket[]>(`${BASE}/dashboard/recent-overdue`),
};

// ─── SYNC ───────────────────────────────────────────────────────────────────

export const syncApi = {
  syncOrgUnits: (data?: { program_id?: string; org_unit_id?: string }) => api.post<SyncResult>(`${BASE}/sync/organizational-units`, data),
  syncAscs: (data?: { program_id?: string; org_unit_id?: string }) => api.post<SyncResult>(`${BASE}/sync/ascs`, data),
};
