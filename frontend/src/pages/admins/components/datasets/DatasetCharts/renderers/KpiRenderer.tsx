import { ChartRenderProp } from "@/models/dataset.models";
import { getMetricKeys, sumMetric, getDimensionKeys } from "./render-utils";

export const KpiRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  const colors = chart.options?.kpi?.color_scheme ?? ["#4caf50", "#2196f3", "#ff9800", "#9c27b0"];

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return <div className="text-gray-400 p-4">No configuration or data</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {metrics.map(m=>m.field).map((metric, index) => (
        <div
          key={metric}
          className="p-4 border rounded text-center"
          style={{ backgroundColor: colors[index % colors.length] + "20" }} // légère transparence
        >
          <div className="text-gray-700">{metric}</div>
          <div className="text-3xl font-bold mt-2">{sumMetric(data.rows, metric).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};