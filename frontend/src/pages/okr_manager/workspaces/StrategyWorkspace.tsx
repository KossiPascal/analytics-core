import { useState } from "react";
import StrategicAxisTab from "../pages/StrategicAxisTab";
import StrategyTab from "../pages/StrategyTab";

type Tab = "strategies" | "axes";

export default function StrategyWorkspace() {
  const [tab, setTab] = useState<Tab>("strategies");

  return (
    <div>
      <h2>Strategy</h2>

      <div>
        <button onClick={() => setTab("strategies")}>Strategies</button>
        <button onClick={() => setTab("axes")}>Strategic Axes</button>
      </div>

      {tab === "strategies" && (<StrategyTab tenant_id={0} />)}

      {tab === "axes" && (<StrategicAxisTab strategies={[]} />)}
    </div>
  );
}