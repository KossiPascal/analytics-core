import { useState } from "react";
import { ActivityMapTab } from "../pages/ActivityMapTab";
import { IndicatorTab } from "../pages/IndicatorTab";
import { SnapshotTab } from "../pages/SnapshotTab";
import { OutcomeTab } from "../pages/OutcomeTab";
import {GlobalPerformanceTab} from "../pages/GlobalPerformanceTab";

type Tab =
  | "dashboard"
  | "indicators"
  | "outcomes"
  | "snapshots"
  | "map";

export default function AnalyticsWorkspace() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div>
      <h2>Analytics</h2>

      <div>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("indicators")}>Indicators</button>
        <button onClick={() => setTab("outcomes")}>Outcomes</button>
        <button onClick={() => setTab("snapshots")}>Snapshots</button>
        <button onClick={() => setTab("map")}>Map</button>
      </div>

      {tab === "dashboard" && <GlobalPerformanceTab />}
      {tab === "indicators" && <IndicatorTab />}
      {tab === "outcomes" && <OutcomeTab />}
      {tab === "snapshots" && <SnapshotTab />}
      {tab === "map" && <ActivityMapTab />}
    </div>
  );
}