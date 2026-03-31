import { useState } from "react";
import { InitiativeTab } from "../pages/InitiativeTab";
import { KeyResultTab } from "../pages/KeyResultTab";
import { ObjectiveTab } from "../pages/ObjectivesTab";
import { GlobalOkrTab } from "../pages/GlobalOkrTab";
import { TeamScopesTab } from "../pages/TeamScopesTab";

type Tab =
  | "global"
  | "teams"
  | "objectives"
  | "keyResults"
  | "initiatives";

export default function OkrWorkspace() {
  const [tab, setTab] = useState<Tab>("global");

  return (
    <div>
      <h2>OKR</h2>

      <div>
        <button onClick={() => setTab("global")}>Global</button>
        <button onClick={() => setTab("teams")}>Teams</button>
        <button onClick={() => setTab("objectives")}>Objectives</button>
        <button onClick={() => setTab("keyResults")}>Key Results</button>
        <button onClick={() => setTab("initiatives")}>Initiatives</button>
      </div>

      {tab === "global" && <GlobalOkrTab />}
      {tab === "teams" && <TeamScopesTab />}
      {tab === "objectives" && <ObjectiveTab />}
      {tab === "keyResults" && <KeyResultTab />}
      {tab === "initiatives" && <InitiativeTab />}
    </div>
  );
}