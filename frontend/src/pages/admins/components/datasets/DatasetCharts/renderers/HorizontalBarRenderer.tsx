import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getDimensionKeys, getMetricKeys } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const HorizontalBarRenderer = ({ chart, data }:ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);
  
  if (!dimensions?.length || !metrics?.length)
    return <div>No configuration</div>;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart layout="vertical" data={data.rows}>
        <XAxis type="number" />
        {dimensions.map((dim) => (
          <YAxis key={dim.field} dataKey={dim.field} />
        ))}
        <Tooltip />
        {chart.options?.bar?.show_legend && <Legend />}
        {metrics.map(m=>m.field).map((metric) => (
          <Bar key={metric} dataKey={metric} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};