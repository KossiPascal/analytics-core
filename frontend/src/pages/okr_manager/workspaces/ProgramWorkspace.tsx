import { useState } from "react";
import ProgramsByAxisTab from "../pages/ProgramsByAxisTab";
import ProgramsTab from "../pages/ProgramsTab";

type Tab = "programs" | "structure";

export default function ProgramWorkspace() {
  const [tab, setTab] = useState<Tab>("programs");

  return (
    <div>
      <h2>Programs</h2>

      <div>
        <button onClick={() => setTab("programs")}>Programs</button>
        <button onClick={() => setTab("structure")}>By Axis</button>
      </div>

      {tab === "programs" && (<ProgramsTab />)}

      {tab === "structure" && (<ProgramsByAxisTab />)}
    </div>
  );
}