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
export type EquipmentStatus =
  | 'PENDING'
  | 'FUNCTIONAL'
  | 'FAULTY'
  | 'UNDER_REPAIR'
  | 'COMPLETELY_DAMAGED'
  | 'LOST'
  | 'STOLEN'
  | 'TAKEN_AWAY';
export type AccessoryStatus = 'FUNCTIONAL' | 'FAULTY' | 'MISSING';

export const INACTIVE_STATUSES = new Set<string>(['COMPLETELY_DAMAGED', 'LOST', 'STOLEN', 'TAKEN_AWAY']);

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING:            'En attente',
  FUNCTIONAL:         'Fonctionnel',
  FAULTY:             'Défaillant',
  UNDER_REPAIR:       'En réparation',
  COMPLETELY_DAMAGED: 'Complètement gâté',
  LOST:               'Perdu',
  STOLEN:             'Volé',
  TAKEN_AWAY:         'Emporté',
};

export const EQUIPMENT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'info'> = {
  PENDING:            'secondary',
  FUNCTIONAL:         'success',
  FAULTY:             'warning',
  UNDER_REPAIR:       'info',
  COMPLETELY_DAMAGED: 'danger',
  LOST:               'danger',
  STOLEN:             'danger',
  TAKEN_AWAY:         'danger',
};

export const HISTORY_ACTION_LABELS: Record<string, string> = {
  CREATED:                    'Création',
  ASSIGNED:                   'Assigné (ASC)',
  ASSIGNED_TO_EMPLOYEE:       'Assigné (Employé)',
  ASSIGNED_RESERVE:           'Assigné en réserve',
  STATUS_CHANGED:             'Changement de statut',
  TRANSFERRED:                'Transfert',
  RETIRED:                    'Retraité',
  DECLARED_LOST:              'Déclaré perdu',
  DECLARED_STOLEN:            'Déclaré volé',
  DECLARED_TAKEN_AWAY:        'Déclaré emporté',
  DECLARED_COMPLETELY_DAMAGED:'Déclaré complètement gâté',
  DECLARATION_CANCELLED:      'Déclaration annulée',
};

export interface EquipmentCategoryGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface EquipmentCategory {
  id: string;
  category_group_id: string | null;
  category_group_name: string | null;
  category_group_code: string | null;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface EquipmentBrand {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Accessory {
  id: string;
  equipment_id: string;
  name: string;
  description: string;
  serial_number: string;
  status: AccessoryStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface EquipmentImeiEntry {
  id: string;
  equipment_id: string;
  imei: string;
  slot_number: number;
}

export interface Equipment {
  id: string;
  equipment_code: string | null;
  equipment_type: EquipmentType;
  category_id: string | null;
  category_name: string | null;
  brand: string;
  brand_id: string | null;
  brand_name: string | null;
  model_name: string;
  imei: string | null;
  serial_number: string;
  has_sim: boolean;
  imeis: EquipmentImeiEntry[];
  owner_id: string | null;
  owner_name: string | null;
  employee_id: string | null;
  employee_name: string | null;
  status: EquipmentStatus;
  is_active: boolean;
  is_unique: boolean;
  acquisition_date: string | null;
  warranty_expiry_date: string | null;
  assignment_date: string | null;
  reception_form_path: string;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
  history?: EquipmentHistory[];
  tickets?: RepairTicket[];
  accessories?: Accessory[];
  sibling_equipment?: Equipment[];
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

export interface Position {
  id: string;
  parent_id: string | null;
  parent_name: string | null;
  department_id: string | null;
  department_name: string | null;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  is_zone_assignable: boolean;
  created_at: string | null;
  updated_at: string | null;
}

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

export interface GeneratedCredentials {
  username: string;
  password: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id_code: string;
  gender: string;
  phone: string;
  email: string;
  position_id: string | null;
  position_name: string | null;
  position_code: string | null;
  position_is_zone_assignable: boolean;
  hire_date: string | null;
  // end_date: string | null;
  is_active: boolean;
  notes: string;
  equipment_count: number;
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
  employee_id: string;
  employee_name: string | null;
  status: TicketStatus;
  current_stage: TicketStage;
  current_stage_label: string;
  current_department_code: string | null;
  current_department_name: string | null;
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
  department_code: string | null;
  user_id: string | null;
  user_name: string | null;
  recipient_employee_id: string | null;
  recipient_name: string | null;
  timestamp: string | null;
  comment: string;
  attachment_path: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  user_name: string | null;
  comment: string;
  created_at: string | null;
}

// ─── EMAIL & ALERT CONFIG ────────────────────────────────────────────────────

export interface EmailConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AlertConfig {
  id: string | null;
  warning_days: number;
  escalation_days: number;
  frequency_hours: number;
  is_active: boolean;
}

export type AlertLevel = 'WARNING' | 'ESCALATION' | 'BCC';
export type RecipientType = 'EMPLOYEE' | 'POSITION';

export interface AlertRecipientConfig {
  id: string;
  stage: string | null;
  stage_label: string;
  alert_level: AlertLevel;
  recipient_type: RecipientType;
  employee_id: string | null;
  employee_name: string | null;
  position_id: string | null;
  position_name: string | null;
  is_active: boolean;
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

// ─── IDENTITIES (orgunits, roles, comptes) ───────────────────────────────────

export interface OrgUnit {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  description: string;
  is_active: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
}

export interface UserAccount {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  phone: string;
  is_active: boolean;
  tenant_id: string;
  role_ids: string[];
  roles: Role[];
  orgunit_ids: string[];
  orgunits: OrgUnit[];
}
