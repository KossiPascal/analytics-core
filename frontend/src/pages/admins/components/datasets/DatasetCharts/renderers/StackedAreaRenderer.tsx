import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { getDimensionKeys, getMetricKeys } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const StackedAreaRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return (
      <div className="text-gray-400 p-4">
        No configuration or data
      </div>
    );
  }

  // 🔥 1 seule dimension
  const dimension = dimensions[0];

  const options = chart.options?.stacked_area ?? {};

  const colors = options.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"];

  const width = options.width ?? "100%";
  const height = options.height ?? 350;

  const isCurved = (options as any).curved ?? true;

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data.rows}>
        {options.show_grid && (
          <CartesianGrid strokeDasharray="3 3" />
        )}

        <XAxis dataKey={dimension.field} />
        <YAxis />

        {options.show_tooltip && <Tooltip />}
        {options.show_legend && <Legend />}

        {metrics.map(m=>m.field).map((metric, i) => (
          <Area
            key={metric}
            type={isCurved ? "monotone" : "linear"}
            dataKey={metric}
            stackId="stack"
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};