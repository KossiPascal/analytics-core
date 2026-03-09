import { ChartRenderProp } from "@/models/dataset.models";
import { getDimensionKeys, getMetricKeys } from "./render-utils";

export const HeatmapRenderer = ({ chart, data }: ChartRenderProp) => {
  // if (!data.length) return null;


  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  const colors = chart.options?.heatmap?.color_scheme ?? ["#4caf50", "#2196f3", "#ff9800", "#9c27b0"];

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return <div className="text-gray-400 p-4">No configuration or data</div>;
  }

  const columns = Object.keys(data.rows[0]);
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {data.rows.map((row, i) => (
        <div key={i} style={{ display: "flex" }}>
          {columns.map((col, i) => {
            const val = Number(row[i]) || 0;
            const intensity = Math.min(255, val * 10);

            return (
              <div key={col} style={{ width: 40, height: 40, background: `rgb(0, ${intensity}, 150)` }} />
            );
          })}
        </div>
      ))}
    </div>
  );
};