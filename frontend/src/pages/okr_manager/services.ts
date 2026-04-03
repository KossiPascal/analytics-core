import { CRUDService } from "@/services/acrud.service";
import { OkrStrategy, OkrStrategicAxis, OkrProgram, OkrProject, OkrGlobal, OkrTeamScope, OkrActivity, OkrProjectTask, Indicator, Outcome, OkrSnapshot, OkrProjectTimelineItem, OkrObjective, OkrInitiative, ProjectRisk, ProjectMilestone, OkrKeyResult, Funding } from "./models";

// ----------------- STRATEGY -----------------
const strategies = new CRUDService("/strategies");
export const strategyService = {
  list: (tenant_id?: number) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return strategies.all<OkrStrategy>(``, { options: { params: { tenant_id } } });
  },
  get: (tenant_id: number, id: number) => strategies.all<OkrStrategy>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrStrategy) => strategies.create("", data),
  update: (id: number, data: OkrStrategy) => strategies.update("", id, data),
  remove: (id: number) => strategies.remove("", id),
};

// ----------------- STRATEGIC AXIS -----------------
const axes = new CRUDService("/strategic-axes");
export const strategicAxisService = {
  list: (tenant_id?: number) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return axes.all<OkrStrategicAxis>(``, { options: { params: { tenant_id } } });
  },
  get: (tenant_id: number, id: number) => axes.all<OkrStrategicAxis>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrStrategicAxis) => axes.create("", data),
  update: (id: number, data: OkrStrategicAxis) => axes.update("", id, data),
  remove: (id: number) => axes.remove("", id),
};

// ----------------- PROGRAM -----------------
const programs = new CRUDService("/programs");
export const programService = {
  list: (tenant_id?: number) => programs.all<OkrProgram>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => programs.all<OkrProgram>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrProgram) => programs.create("", data),
  update: (id: number, data: OkrProgram) => programs.update("", id, data),
  remove: (id: number) => programs.remove("", id),
};

// ----------------- PROJECT -----------------
const projects = new CRUDService("/projects");
export const projectService = {
  list: (tenant_id?: number) => projects.all<OkrProject>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => projects.all<OkrProject>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrProject) => projects.create("", data),
  update: (id: number, data: OkrProject) => projects.update("", id, data),
  remove: (id: number) => projects.remove("", id),
};

// ----------------- PROJECT RISK -----------------
const risks = new CRUDService("/risks");
export const risksService = {
  list: (tenant_id?: number) => risks.all<ProjectRisk>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => risks.all<ProjectRisk>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: ProjectRisk) => risks.create("", data),
  update: (id: number, data: ProjectRisk) => risks.update("", id, data),
  remove: (id: number) => risks.remove("", id),
};

// ----------------- PROJECT MILESTONE-----------------
const milestones = new CRUDService("/risks");
export const milestonesService = {
  list: (tenant_id?: number) => milestones.all<ProjectMilestone>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => milestones.all<ProjectMilestone>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: ProjectMilestone) => milestones.create("", data),
  update: (id: number, data: ProjectMilestone) => milestones.update("", id, data),
  remove: (id: number) => milestones.remove("", id),
};



// ----------------- OKR GLOBAL -----------------
const okrsGlobal = new CRUDService("/okrs-global");
export const okrGlobalService = {
  list: (tenant_id?: number) => okrsGlobal.all<OkrGlobal>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => okrsGlobal.all<OkrGlobal>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrGlobal) => okrsGlobal.create("", data),
  update: (id: number, data: OkrGlobal) => okrsGlobal.update("", id, data),
  remove: (id: number) => okrsGlobal.remove("", id),
};

// ----------------- OKR KEY RESULT -----------------
const keyResults = new CRUDService("/key-results");
export const keyResultsService = {
  list: (tenant_id?: number, team_id?: number) => keyResults.all<OkrKeyResult>(``, { options: { params: { tenant_id, team_id } } }),
  get: (tenant_id: number, id: number) => keyResults.all<OkrKeyResult>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrKeyResult) => keyResults.create("", data),
  update: (id: number, data: OkrKeyResult) => keyResults.update("", id, data),
  remove: (id: number) => keyResults.remove("", id),
};

// ----------------- OKR TEAM SCOPE -----------------
const okrsTeam = new CRUDService("/okrs-team");
export const teamScopeService = {
  list: (tenant_id?: number, team_id?: number) => okrsTeam.all<OkrTeamScope>(``, { options: { params: { tenant_id, team_id } } }),
  get: (tenant_id: number, id: number) => okrsTeam.all<OkrTeamScope>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrTeamScope) => okrsTeam.create("", data),
  update: (id: number, data: OkrTeamScope) => okrsTeam.update("", id, data),
  remove: (id: number) => okrsTeam.remove("", id),
};



// ----------------- ACTIVITY -----------------
const activities = new CRUDService("/activities");
export const activityService = {
  list: (tenant_id?: number, project_id?: number) => activities.all<OkrActivity>(``, { options: { params: { tenant_id, project_id } } }),
  get: (tenant_id: number, id: number) => activities.all<OkrActivity>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrActivity) => activities.create("", data),
  update: (id: number, data: OkrActivity) => activities.update("", id, data),
  remove: (id: number) => activities.remove("", id),
};

// ----------------- ACTIVITY -----------------
const initiatives = new CRUDService("/initiatives");
export const initiativeService = {
  list: (tenant_id?: number, project_id?: number) => initiatives.all<OkrInitiative>(``, { options: { params: { tenant_id, project_id } } }),
  get: (tenant_id: number, id: number) => initiatives.all<OkrInitiative>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrInitiative) => initiatives.create("", data),
  update: (id: number, data: OkrInitiative) => initiatives.update("", id, data),
  remove: (id: number) => initiatives.remove("", id),
};



// ----------------- TASK -----------------
const tasks = new CRUDService("/tasks");
export const taskService = {
  list: (tenant_id?: number, activity_id?: number) => tasks.all<OkrProjectTask>(``, { options: { params: { tenant_id, activity_id } } }),
  get: (tenant_id: number, id: number) => tasks.all<OkrProjectTask>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrProjectTask) => tasks.create("", data),
  update: (id: number, data: OkrProjectTask) => tasks.update("", id, data),
  remove: (id: number) => tasks.remove("", id),
};

// ----------------- INDICATOR -----------------
const indicators = new CRUDService("/indicators");
export const indicatorService = {
  list: (tenant_id?: number, id?: number) => indicators.all<Indicator>(``, { options: { params: { tenant_id, id } } }),
  get: (tenant_id: number, id: number) => indicators.all<Indicator>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: Indicator) => indicators.create("", data),
  update: (id: number, data: Indicator) => indicators.update("", id, data),
  remove: (id: number) => indicators.remove("", id),
};

// ----------------- OUTCOME -----------------
const outcomes = new CRUDService("/outcomes");
export const outcomeService = {
  list: (tenant_id?: number, id?: number) => outcomes.all<Outcome>(``, { options: { params: { tenant_id, id } } }),
  get: (tenant_id: number, id: number) => outcomes.all<Outcome>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: Outcome) => outcomes.create("", data),
  update: (id: number, data: Outcome) => outcomes.update("", id, data),
  remove: (id: number) => outcomes.remove("", id),
};

// ----------------- OBJECTIFS -----------------
const objectives = new CRUDService("/objectives");
export const objectivesService = {
  list: (tenant_id?: number) => objectives.all<OkrObjective>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => objectives.all<OkrObjective>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrObjective) => objectives.create("", data),
  update: (id: number, data: OkrObjective) => objectives.update("", id, data),
  remove: (id: number) => objectives.remove("", id),
};


// ----------------- SNAPSHOT -----------------
const snapshots = new CRUDService("/snapshots");
export const snapshotService = {
  list: (tenant_id?: number) => snapshots.all<OkrSnapshot>(``, { options: { params: { tenant_id } } }),
  get: (tenant_id: number, id: number) => snapshots.all<OkrSnapshot>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrSnapshot) => snapshots.create("", data),
  update: (id: number, data: OkrSnapshot) => snapshots.update("", id, data),
  remove: (id: number) => snapshots.remove("", id),
};

// ----------------- PROJECT TIMELINE -----------------
const projectTimeline = new CRUDService("/project-timeline");
export const timelineService = {
  list: (tenant_id?: number, project_id?: number) => projectTimeline.all<OkrProjectTimelineItem>(``, { options: { params: { tenant_id, project_id } } }),
  get: (tenant_id: number, id: number) => projectTimeline.all<OkrProjectTimelineItem>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: OkrProjectTimelineItem) => projectTimeline.create("", data),
  update: (id: number, data: OkrProjectTimelineItem) => projectTimeline.update("", id, data),
  remove: (id: number) => projectTimeline.remove("", id),
};

// ----------------- PROJECT TIMELINE -----------------
const fundings = new CRUDService("/fundings");
export const fundingService = {
  list: (tenant_id?: number, project_id?: number) => fundings.all<Funding>(``, { options: { params: { tenant_id, project_id } } }),
  get: (tenant_id: number, id: number) => fundings.all<Funding>(`/${id}`, { options: { params: { tenant_id } } }),
  create: (data: Funding) => fundings.create("", data),
  update: (id: number, data: Funding) => fundings.update("", id, data),
  remove: (id: number) => fundings.remove("", id),
};