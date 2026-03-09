// ❌ Mauvais import. Lucide-react fournit des icônes, pas Recharts.  
// ✅ Il faut importer depuis `"recharts"`.
// 2. `dimension.map(...)` → Un BarChart n’a **qu’une seule dimension**. Mettre plusieurs XAxis ne fonctionnera pas.
// 3. Pas de vérification de la config / data (`dimensions`, `metrics`, `data`).
// 4. Pas de gestion des options visuelles (couleurs, tooltip, legend, grid, width, height).
// # ✅ Version corrigée et robuste
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { getDimensionKeys, getMetricKeys } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const StackedBarRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return <div className="text-gray-400 p-4">No configuration or data</div>;
  }

  const dimension = dimensions[0]; // 🔥 Une seule dimension pour le BarChart
  const options = chart.options?.stacked_bar ?? {};

  const colors = options.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"];

  return (
    <ResponsiveContainer
      width={options.width ?? "100%"}
      height={options.height ?? 350}
    >
      <BarChart data={data.rows}>
        {options.show_grid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={dimension.field} />
        <YAxis />
        {options.show_tooltip && <Tooltip />}
        {options.show_legend && <Legend />}

        {metrics.map(m=>m.field).map((metric, i) => (
          <Bar
            key={metric}
            dataKey={metric}
            stackId="stack"
            fill={colors[i % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};