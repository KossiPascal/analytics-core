import { Tenant, User } from "@/models/identity.model";
import { Team } from "@/models/team.model";

// ENUMS
export enum DirectionEnum {
  INCREASE = "increase",
  DECREASE = "decrease",
  MAINTAIN = "maintain",
  RANGE = "range"
}

export enum ActivityStatusEnum {
  DRAFT = "draft",
  PLANNED = "planned",
  APPROVED = "approved",
  IN_PROGRESS = "in_progress",
  BLOCKED = "blocked",
  ON_HOLD = "on_hold",
  DONE = "done",
  CANCELLED = "cancelled"
}

export enum ActivityPriorityEnum {
  VERY_LOW = "very_low",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum TaskStatusEnum {
  BACKLOG = "backlog",
  TODO = "todo",
  READY = "ready",
  DOING = "doing",
  REVIEW = "review",
  BLOCKED = "blocked",
  DONE = "done",
  CANCELLED = "cancelled"
}

export enum ProjectStatusEnum {
  DRAFT = "draft",
  PLANNED = "planned",
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum RiskLevelEnum {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum MilestoneStatusEnum {
  PENDING = "pending",
  ACHIEVED = "achieved",
  DELAYED = "delayed"
}

export enum OkrGlobalStatusEnum {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export type Currency = "USD" | "XOF" | "EUR" | string;


// BASE TYPES
export type ID = number | undefined | null;
export type DateType = string | null;
export type JSONType = Record<string, any>;

// STRATEGY
export interface OkrStrategy {
  id: ID;
  tenant_id: ID;
  name: string;
  description: string;

  tenant?: Tenant;
  axes?: OkrStrategicAxis[];
}

export interface OkrStrategicAxis {
  id: ID;
  tenant_id: ID;
  strategy_id: ID;
  name: string;
  description: string;

  tenant?: Tenant;
  strategy?: OkrStrategy;
  programs?: OkrProgram[];
}

// PROGRAM / PROJECT
export interface OkrProgram {
  id: ID;
  tenant_id: ID;
  team_id: ID | null;
  strategic_axis_id: ID | null;
  name: string;
  description: string;
  status: ProjectStatusEnum

  tenant?: Tenant;
  team?: Team;
  strategic_axis?: OkrStrategicAxis;
  projects?: OkrProject[];
}

export interface OkrProject {
  id: ID;
  tenant_id: ID;
  program_id: ID;
  team_id: ID;
  team_id: ID;
  name: string;
  description: string;
  start_date?: DateType;
  end_date?: DateType;
  budget?: number | null;
  donor?: string | null;
  currency: Currency
  spent_budget: number
  status: ProjectStatusEnum

  tenant?: Tenant;
  program?: OkrProgram;
  team?: Team;
  team?: OkrTeamScope;

  fundings?: Funding[];
  activities?: OkrActivity[];
  tasks?: OkrProjectTask[];
  milestones?: ProjectMilestone[];
  risks?: ProjectRisk[];
  phases?: ProjectPhase[];
  project_objectives?: OkrProjectObjective[]
}

export interface Funding {
  id: ID;
  tenant_id: ID;
  project_id: ID;
  donor: string;
  amount: number;
  currency: Currency;

  tenant?: Tenant;
  project?: OkrProject;
}

// OKR GLOBAL
export interface OkrGlobal {
  id: ID;
  tenant_id: ID;
  name: string;
  description: string;
  start_date: DateType;
  end_date: DateType;

  tenant?: Tenant;
  teams?: OkrTeamScope[];
  snapshots?: OkrSnapshot[];
}

export interface OkrTeamScope {
  id: ID;
  tenant_id: ID;
  team_id: ID;
  global_id: ID;
  name: string;
  description: string;
  status: OkrGlobalStatusEnum;

  tenant?: Tenant;
  team?: Team;
  global?: OkrGlobal;

  initiatives?: OkrInitiative[];
  projects?: OkrProject[];
  objectives?: OkrObjective[];
}

export interface OkrInitiative {
  id: ID;
  tenant_id: ID;
  team_id: ID;
  name: string;
  description: string;
  start_date: DateType;
  end_date: DateType;
  budget: number;
  currency: Currency;
  status: ProjectStatusEnum;

  tenant?: Tenant;
  team?: OkrTeamScope;
  objectives?: OkrObjective[];
}

export interface OkrObjective {
  id: ID;
  tenant_id: ID;
  initiative_id: ID | null;
  team_id: ID | null;
  name: string;
  description: string;
  start_date: DateType;
  end_date: DateType;
  status: OkrGlobalStatusEnum;

  tenant?: Tenant;
  initiative?: OkrInitiative;
  team?: OkrTeamScope;

  project_objectives?: OkrProjectObjective[]
  keyresults?: OkrKeyResult[];
}

export interface OkrProjectObjective {
  id: ID;
  project_id: ID;
  objective_id: ID;

  project?: OkrProject
  objective?: OkrObjective
}

// KEY RESULTS
export interface OkrKeyResult {
  id: ID;
  tenant_id: ID;
  objective_id: ID;
  name: string;
  description: string;
  direction?: DirectionEnum | null;
  target_value: number;
  current_value: number;
  status: OkrGlobalStatusEnum;

  type?: string | null;
  unit?: string | null;
  start_value?: number;
  progress?: number;
  weight?: number;
  impact?: number;

  tenant?: Tenant;
  objective?: OkrObjective;

  events?: KeyresultEvent[];
  activity_keyresults?: OkrActivityKeyResult[];
}

export interface KeyresultEvent {
  id: ID;
  tenant_id: ID;
  keyresult_id: ID;
  value: number;
  date?: DateType;
  source?: string | null;

  tenant?: Tenant;
  keyresult?: OkrKeyResult;
}

// ACTIVITIES
export interface Activity {
  id: ID;
  tenant_id: ID;
  project_id?: ID | null;
  team_id?: ID | null;

  name: string;
  description: string;
  start_date?: DateType;
  end_date?: DateType;
  due_date?: DateType;
  status?: ActivityStatusEnum;
  priority?: ActivityPriorityEnum | null;
  budget?: string | null;
  spent_budget?: number;
  progress?: number;
  currency: Currency;
  beneficiaries?: number | null;

  tenant?: Tenant;
  project?: OkrProject;
  team?: Team;

  owners?: ActivityOwner[];
  kr_links?: OkrActivityKeyResult[];
  indicator_values?: IndicatorValue[];
}

export interface ActivityOwner {
  id: ID;
  activity_id: ID;
  user_id: ID;

  activity?: OkrActivity;
  user?: User;
}

export interface OkrActivityKeyResult {
  id: ID;
  activity_id: ID;
  keyresult_id: ID;
  impact?: number;
  weight?: number;

  activity?: OkrActivity;
  keyresult?: OkrKeyResult;
}

export interface OkrActivityDependency {
  id: ID;
  activity_id: ID;
  depends_on_id: ID;
  type?: string | null;
}

// TASKS
export interface OkrProjectTask {
  id: ID;
  tenant_id: ID;
  project_id: ID;
  assigned_to_id?: ID | null;
  keyresult_id?: ID | null;
  parent_id?: ID | null;

  name: string;
  description?: string | null;
  status?: TaskStatusEnum;
  progress?: number | null;
  start_date?: DateType;
  end_date?: DateType;

  tenant?: Tenant;
  project?: OkrProject;
  assigned_to?: User;
  keyresult?: OkrKeyResult;
  parent_task?: OkrProjectTask;
  subtasks?: OkrProjectTask[];
}

// PROJECT MANAGEMENT
export interface ProjectMilestone {
  id: ID;
  tenant_id: ID;
  project_id: ID;
  name: string;
  description: string;
  due_date?: DateType;
  status: MilestoneStatusEnum;

  tenant?: Tenant;
  project?: OkrProject;
}

export interface ProjectRisk {
  id: ID;
  tenant_id: ID;
  project_id: ID;
  name: string;
  description: string;
  level: RiskLevelEnum;
  mitigation_plan?: string | null;
  probability?: number | null;
  impact?: number | null;

  tenant?: Tenant;
  project?: OkrProject;
}

export interface ProjectPhase {
  id: ID;
  tenant_id: ID;
  project_id: ID;
  name: string;
  description: string;
  start_date?: DateType;
  end_date?: DateType;

  tenant?: Tenant;
  project?: OkrProject;
}

export interface ProjectKeyResult {
  project_id: ID;
  objective_id: ID;
}

// INDICATORS
export interface Indicator {
  id: ID;
  tenant_id: ID;
  name: string;
  description: string;
  unit?: string | null;

  tenant?: Tenant;
  values?: IndicatorValue[];
}

export interface IndicatorValue {
  id: ID;
  tenant_id: ID;
  indicator_id: ID;
  activity_id?: ID | null;
  value: number;
  date?: DateType;

  tenant?: Tenant;
  indicator?: Indicator;
  activity?: OkrActivity;
}

// OUTCOMES
export interface Outcome {
  id: ID;
  tenant_id: ID;
  name: string;
  description: string;

  tenant?: Tenant;
  indicators?: OutcomeIndicator[];
}

export interface OutcomeIndicator {
  outcome_id: ID;
  indicator_id: ID;

  outcome?: Outcome;
  indicator?: Indicator;
}

// SNAPSHOT
export interface OkrSnapshot {
  id: ID;
  tenant_id: ID;
  global_id: ID;
  name: string;
  description: string;
  date?: DateType;
  breakdown: JSONType;
  progress?: number | null;

  tenant?: Tenant;
  global?: OkrGlobal;
}

export interface OkrProjectTimelineItem {
  id: ID;
  project_id: ID;
  name: string;
  description: string;
  start_date?: string;
  end_date?: string;
  status: ActivityStatusEnum;
}

export interface OkrActivityMap {
  strategy_id: number;
  strategy_name: string;
  global_id: number;
  global_name: string;
  project_id?: number;
  project_name?: string;
  activities: {
    id: number;
    name: string;
    status: ActivityStatusEnum;
    progress?: number;
    tasks?: {
      id: number;
      name: string;
      status: ActivityStatusEnum;
      progress?: number;
    }[];
  }[];
}