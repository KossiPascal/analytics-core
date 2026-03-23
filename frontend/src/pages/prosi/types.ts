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

// ─── PILIER STRATÉGIQUE ───────────────────────────────────────────────────────

export interface StrategicPillar {
  id: string;
  tenant_id: string;
  project_id: string;
  project_name: string | null;
  name: string;
  code: string;
  description: string;
  order_index: number;
  fiscal_year: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ─── ORC ─────────────────────────────────────────────────────────────────────

export type ORCStatus = 'DRAFT' | 'ACTIVE' | 'AT_RISK' | 'COMPLETED' | 'CANCELLED';
export type OrcType   = 'OBJECTIF' | 'RESULTAT_CLE';
export type Quarter   = 'T1' | 'T2' | 'T3' | 'T4' | 'YEARLY';

export interface ORC {
  id: string;
  tenant_id: string;
  project_id: string;
  project_name: string | null;
  pillar_id: string | null;
  pillar_name: string | null;
  pillar_code: string | null;
  parent_id: string | null;
  parent_name: string | null;
  department_id: string | null;
  department_name: string | null;
  orc_type: OrcType;
  code: string;
  name: string;
  description: string;
  target_indicator: string;
  target_value: number | null;
  current_value: number;
  unit: string;
  score: number | null;
  progress_percent: number;
  status: ORCStatus;
  priority: Priority;
  weight: number;
  start_date: string | null;
  end_date: string | null;
  fiscal_year: number | null;
  quarter: Quarter | null;
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
  OBJECTIF:     'primary',
  RESULTAT_CLE: 'info',
};

export const QUARTER_LABELS: Record<Quarter, string> = {
  T1: 'Trimestre 1', T2: 'Trimestre 2',
  T3: 'Trimestre 3', T4: 'Trimestre 4',
  YEARLY: 'Annuel',
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

// ─── OBJECTIFS EMPLOYÉ ───────────────────────────────────────────────────────

export type ObjectiveStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface EmployeeObjective {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string | null;
  user_id: string | null;
  project_id: string | null;
  project_name: string | null;
  orc_id: string | null;
  orc_name: string | null;
  title: string;
  description: string;
  target_indicator: string;
  target_value: number | null;
  current_value: number;
  unit: string;
  score: number | null;
  progress_percent: number;
  fiscal_year: number;
  quarter: Quarter;
  priority: Priority;
  status: ObjectiveStatus;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  review_notes: string;
  notes: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeamSummary {
  fiscal_year: number;
  quarter: Quarter;
  total: number;
  by_status: Record<ObjectiveStatus, number>;
  avg_score: number | null;
  completion_rate: number;
}

export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  DRAFT:     'Brouillon',
  SUBMITTED: 'Soumis',
  APPROVED:  'Approuvé',
  REJECTED:  'Rejeté',
  COMPLETED: 'Complété',
};

export const OBJECTIVE_STATUS_VARIANT: Record<ObjectiveStatus, string> = {
  DRAFT:     'secondary',
  SUBMITTED: 'warning',
  APPROVED:  'success',
  REJECTED:  'danger',
  COMPLETED: 'info',
};

export const MONTHS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
