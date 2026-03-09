import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { buildPieData, getDimensionKeys, getMetricKeys } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const DonutRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);
  const makeMetrics = metrics.map(m=>m.field);

  const pieData = buildPieData(data.rows, dimensions[0].field, makeMetrics[0]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={120}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};