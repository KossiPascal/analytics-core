// ============================================================================
// PROSI — Types TypeScript
// ============================================================================

// ─── PROJET ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  priority: Priority;
  budget: number | null;
  budget_currency: string;
  owner_id: string | null;
  owner_name: string | null;
  notes: string;
  is_active: boolean;
  orcs_count?: number;
  activities_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectStats {
  project_id: string;
  orcs_total: number;
  orcs_by_status: Record<string, number>;
  activities_total: number;
  activities_by_status: Record<string, number>;
  activities_avg_progress: number;
}

// ─── ORC ─────────────────────────────────────────────────────────────────────

export type ORCStatus = 'DRAFT' | 'ACTIVE' | 'AT_RISK' | 'COMPLETED' | 'CANCELLED';
export type OrcType = 'OBJECTIF' | 'RESULTAT_CLE';

export interface ORC {
  orc_type: OrcType;
  id: string;
  tenant_id: string;
  project_id: string;
  project_name: string | null;
  parent_id: string | null;
  parent_name: string | null;
  name: string;
  description: string;
  target_value: number | null;
  current_value: number;
  unit: string;
  progress_percent: number;
  status: ORCStatus;
  weight: number;
  start_date: string | null;
  end_date: string | null;
  responsible_id: string | null;
  responsible_name: string | null;
  notes: string;
  is_active: boolean;
  children?: ORC[];
  activities?: Activity[];
  created_at: string | null;
  updated_at: string | null;
}

// ─── ACTIVITE ─────────────────────────────────────────────────────────────────

export type ActivityStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED';

export interface Activity {
  id: string;
  tenant_id: string;
  project_id: string;
  project_name: string | null;
  orc_id: string | null;
  orc_name: string | null;
  name: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  status: ActivityStatus;
  priority: Priority;
  progress: number;
  assignee_id: string | null;
  assignee_name: string | null;
  notes: string;
  tags: string[];
  is_active: boolean;
  progress_logs?: ProgressLog[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ProgressLog {
  id: string;
  activity_id: string;
  progress_percent: number;
  notes: string;
  log_date: string;
  created_at: string | null;
}

// ─── RAPPORT ──────────────────────────────────────────────────────────────────

export type ReportStatus = 'DRAFT' | 'PUBLISHED';

export interface MonthlyReport {
  id: string;
  tenant_id: string;
  project_id: string;
  project_name: string | null;
  year: number;
  month: number;
  title: string;
  summary: string;
  content: ReportContent;
  status: ReportStatus;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportContent {
  period: { year: number; month: number; label: string };
  project: { id: string; name: string; code: string; status: string };
  summary_stats: {
    activities_this_month: number;
    activities_by_status: Record<string, number>;
    avg_progress_this_month: number;
    orcs_total: number;
    orcs_by_status: Record<string, number>;
    overall_completion_rate: number;
  };
  activities: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    progress: number;
    due_date: string | null;
    assignee_name: string | null;
    orc_name: string | null;
  }>;
  orcs: Array<{
    id: string;
    name: string;
    status: string;
    progress_percent: number;
    current_value: number;
    target_value: number | null;
    unit: string;
  }>;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  projects: {
    total: number;
    by_status: Record<string, number>;
    active: number;
  };
  orcs: {
    total: number;
    by_status: Record<string, number>;
    avg_progress: number;
    at_risk: number;
    completed: number;
  };
  activities: {
    total: number;
    by_status: Record<string, number>;
    overdue: number;
    avg_progress: number;
    due_soon: Activity[];
  };
  reports_count: number;
  activity_trend: Array<{ year: number; month: number; total: number; done: number }>;
}

// ─── LABELS & CONSTANTES ─────────────────────────────────────────────────────

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, string> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'info',
  CANCELLED: 'danger',
};

export const ORC_TYPE_LABELS: Record<OrcType, string> = {
  OBJECTIF:     'Objectif',
  RESULTAT_CLE: 'Résultat Clé',
};

export const ORC_TYPE_VARIANT: Record<OrcType, string> = {
  OBJECTIF:     'purple',
  RESULTAT_CLE: 'info',
};

export const ORC_STATUS_LABELS: Record<ORCStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  AT_RISK: 'À risque',
  COMPLETED: 'Atteint',
  CANCELLED: 'Annulé',
};

export const ORC_STATUS_VARIANT: Record<ORCStatus, string> = {
  DRAFT: 'secondary',
  ACTIVE: 'primary',
  AT_RISK: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminé',
  BLOCKED: 'Bloqué',
  CANCELLED: 'Annulé',
};

export const ACTIVITY_STATUS_VARIANT: Record<ActivityStatus, string> = {
  TODO: 'secondary',
  IN_PROGRESS: 'primary',
  DONE: 'success',
  BLOCKED: 'danger',
  CANCELLED: 'secondary',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

export const PRIORITY_VARIANT: Record<Priority, string> = {
  LOW: 'info',
  MEDIUM: 'secondary',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export const MONTHS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
