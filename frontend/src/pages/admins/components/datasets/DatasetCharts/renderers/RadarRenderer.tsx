import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getDimensionKeys, getMetricKeys } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const RadarRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return (
      <div className="text-gray-400 p-4">
        No configuration or data
      </div>
    );
  }

  // 🔥 Radar = 1 dimension obligatoire
  const dimension = dimensions[0];

  const options = chart.options?.radar ?? {};

  const colors = options.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"];

  const width = options.width ?? "100%";
  const height = options.height ?? 350;

  return (
    <ResponsiveContainer width={width} height={height}>
      <RadarChart data={data.rows}>
        <PolarGrid />

        <PolarAngleAxis dataKey={dimension.field} />
        <PolarRadiusAxis />

        {options.show_tooltip && <Tooltip />}
        {options.show_legend && <Legend />}

        {metrics.map(m=>m.field).map((metric, i) => (
          <Radar
            key={metric}
            dataKey={metric}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.4}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
};