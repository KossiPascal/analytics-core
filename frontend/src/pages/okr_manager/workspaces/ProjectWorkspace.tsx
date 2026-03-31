import { useState } from "react";
import ProjectTab from "../pages/ProjectTab";
import { RiskTab } from "../pages/RiskTab";
import { TaskTab } from "../pages/TaskTab";
import { KeyResultTab } from "../pages/KeyResultTab";
import { MilestoneTab } from "../pages/MilestoneTab";
import { FieldActivitiesTab } from "../pages/FieldActivitiesTab";
import { FundingBudgetTab } from "../pages/FundingBudgetTab";
import { TimelineTab } from "../pages/TimelineTab";

type Tab =
  | "overview"
  | "tasks"
  | "milestones"
  | "keyResults"
  | "activities"
  | "timeline"
  | "risks"
  | "budget";

export default function ProjectWorkspace() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <h2>Projects</h2>

      <div>
        <button onClick={() => setTab("overview")}>Overview</button>
        <button onClick={() => setTab("tasks")}>Tasks</button>
        <button onClick={() => setTab("milestones")}>Milestones</button>
        <button onClick={() => setTab("keyResults")}>Key Results</button>
        <button onClick={() => setTab("activities")}>Activities</button>
        <button onClick={() => setTab("timeline")}>Timeline</button>
        <button onClick={() => setTab("risks")}>Risks</button>
        <button onClick={() => setTab("budget")}>Budget</button>
      </div>

      {tab === "overview" && <ProjectTab />}
      {tab === "tasks" && <TaskTab />}
      {tab === "milestones" && <MilestoneTab />}
      {tab === "keyResults" && <KeyResultTab />}
      {tab === "activities" && <FieldActivitiesTab />}
      {tab === "timeline" && <TimelineTab />}
      {tab === "risks" && <RiskTab />}
      {tab === "budget" && <FundingBudgetTab />}
    </div>
  );
}