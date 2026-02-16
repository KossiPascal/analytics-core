// ============================================================================
// Equipment Manager - TypeScript Interfaces
// ============================================================================

// ─── LOCATIONS ──────────────────────────────────────────────────────────────

export interface Region {
  id: string;
  name: string;
  code: string;
  created_at: string | null;
  updated_at: string | null;
  districts?: District[];
}

export interface District {
  id: string;
  region_id: string;
  name: string;
  code: string;
  region_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  sites?: Site[];
}

export interface Site {
  id: string;
  district_id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  district_name: string | null;
  region_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  zones?: ZoneASC[];
}

export interface ZoneASC {
  id: string;
  site_id: string;
  name: string;
  code: string;
  site_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── ASC & SUPERVISOR ───────────────────────────────────────────────────────

export interface ASC {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  code: string;
  gender: string;
  phone: string;
  email: string;
  site_id: string | null;
  site_name: string | null;
  zone_asc_id: string | null;
  zone_asc_name: string | null;
  supervisor_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
  equipments?: Equipment[];
  tickets?: RepairTicket[];
}

export interface Supervisor {
  id: string;
  user_id: string;
  code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  sites: { id: string; name: string; code: string }[];
  created_at: string | null;
  updated_at: string | null;
  username?: string;
  password?: string;
}

// ─── EQUIPMENT ──────────────────────────────────────────────────────────────

export type EquipmentType = 'PHONE' | 'TABLET' | 'OTHER';
export type EquipmentStatus = 'FUNCTIONAL' | 'FAULTY' | 'UNDER_REPAIR';

export interface Equipment {
  id: string;
  equipment_type: EquipmentType;
  brand: string;
  model_name: string;
  imei: string;
  serial_number: string;
  owner_id: string | null;
  owner_name: string | null;
  employee_id: string | null;
  employee_name: string | null;
  status: EquipmentStatus;
  acquisition_date: string | null;
  warranty_expiry_date: string | null;
  assignment_date: string | null;
  reception_form_path: string;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
  history?: EquipmentHistory[];
  tickets?: RepairTicket[];
}

export interface EquipmentHistory {
  id: string;
  equipment_id: string;
  action: string;
  old_value: string;
  new_value: string;
  notes: string;
  created_by_id: string | null;
  created_at: string | null;
}

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  parent_id: string | null;
  parent_name: string | null;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  is_root: boolean;
  created_at: string | null;
  updated_at: string | null;
  children?: Department[];
  employees?: Employee[];
}

export interface Employee {
  id: string;
  department_id: string;
  department_name: string | null;
  root_department_name: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id_code: string;
  gender: string;
  phone: string;
  email: string;
  position: string;
  hire_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
  history?: EmployeeHistory[];
  equipments?: Equipment[];
}

export interface EmployeeHistory {
  id: string;
  employee_id: string;
  action: string;
  old_department_id: string | null;
  old_department_name: string | null;
  new_department_id: string | null;
  new_department_name: string | null;
  notes: string;
  user_id: string | null;
  timestamp: string | null;
}

// ─── TICKETS ────────────────────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'REPAIRED' | 'RETURNING' | 'CLOSED' | 'CANCELLED';
export type TicketStage =
  | 'SUPERVISOR' | 'PROGRAM' | 'LOGISTICS' | 'REPAIRER' | 'ESANTE'
  | 'RETURNING_LOGISTICS' | 'RETURNING_PROGRAM' | 'RETURNING_SUPERVISOR' | 'RETURNED_ASC';

export const STAGE_LABELS: Record<string, string> = {
  SUPERVISOR: 'Superviseur',
  PROGRAM: 'Programme',
  LOGISTICS: 'Logistique',
  REPAIRER: 'Reparateur',
  ESANTE: 'E-Sante',
  RETURNING_LOGISTICS: 'Retour - Logistique',
  RETURNING_PROGRAM: 'Retour - Programme',
  RETURNING_SUPERVISOR: 'Retour - Superviseur',
  RETURNED_ASC: "Retourne a l'ASC",
};

export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  REPAIRED: 'Repare',
  RETURNING: 'En retour',
  CLOSED: 'Ferme',
  CANCELLED: 'Annule',
};

export interface ProblemType {
  id: string;
  name: string;
  code: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'OTHER';
  display_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface RepairTicket {
  id: string;
  ticket_number: string;
  equipment_id: string;
  equipment_imei: string | null;
  equipment_brand: string | null;
  equipment_model: string | null;
  asc_id: string;
  asc_name: string | null;
  status: TicketStatus;
  current_stage: TicketStage;
  current_stage_label: string;
  current_holder_id: string | null;
  initial_send_date: string | null;
  repair_completed_date: string | null;
  closed_date: string | null;
  cancelled_date: string | null;
  cancellation_reason: string;
  created_by_id: string | null;
  initial_problem_description: string;
  resolution_notes: string;
  delay_days: number;
  delay_color: 'green' | 'yellow' | 'red';
  days_at_current_stage: number;
  is_blocked: boolean;
  created_at: string | null;
  updated_at: string | null;
  events?: TicketEvent[];
  comments?: TicketComment[];
  issues?: Issue[];
}

export interface Issue {
  id: string;
  ticket_id: string;
  problem_type_id: string;
  problem_type_name: string | null;
  problem_type_category: string | null;
  description: string;
  created_at: string | null;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  from_role: string;
  to_role: string;
  from_role_label: string;
  to_role_label: string;
  user_id: string | null;
  timestamp: string | null;
  comment: string;
  attachment_path: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  comment: string;
  created_at: string | null;
}

// ─── ALERTS ─────────────────────────────────────────────────────────────────

export interface DelayAlertRecipient {
  id: string;
  user_id: string;
  email: string;
  recipient_type: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface DelayAlertLog {
  id: string;
  ticket_id: string;
  ticket_number: string | null;
  stage: string;
  days_in_stage: number;
  recipients: string;
  sent_at: string | null;
  email_sent_successfully: boolean;
  error_message: string;
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  repaired_tickets: number;
  closed_tickets: number;
  cancelled_tickets: number;
  total_ascs: number;
  total_equipment: number;
  avg_duration_days: number | null;
}

export interface TicketsByStatus {
  OPEN: number;
  IN_PROGRESS: number;
  REPAIRED: number;
  RETURNING: number;
  CLOSED: number;
  CANCELLED: number;
}

export interface TicketsByDelay {
  green: number;
  yellow: number;
  red: number;
}

export interface BlockagePoint {
  stage: string;
  count: number;
}

// ─── SYNC ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  created: number;
  updated: number;
  errors: number;
  message?: string;
  error?: string;
}
