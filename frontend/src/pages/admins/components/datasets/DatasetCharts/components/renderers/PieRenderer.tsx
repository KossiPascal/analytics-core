import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { ChartRenderProp, CHART_COLS_SEPARATOR } from "@/models/dataset.models";
import { useMemo } from "react";

export const PieRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys: string[] = header.rows ?? [];
  const allColumns: string[] = header._all_columns_order ?? [];

  const options = useMemo(() => ({
    ...(chart.options?.pie ?? {}),
    ...(chart.options ?? {}),
    show_percentage: chart.options?.pie?.show_percentage ?? true,
    animation_duration: chart.options?.pie?.animation_duration ?? 800,
    clockwise: chart.options?.pie?.clockwise ?? true
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"
  ];

  const width = options.width ?? "100%";
  const height = options.height ?? 400;

  const xKey = dimensionKeys[dimensionKeys.length - 1];
  const metric = allColumns[0];

  // ----- Préparation des données -----
  const chartData = useMemo(() => {
    return data.rows.map((row: any) => ({
      name: dimensionKeys
        .map(d => row[d])
        .filter(Boolean)
        .join(" / "),
      value: Number(row[metric]) || 0
    }));
  }, [data.rows, dimensionKeys, metric]);

  // ----- Label personnalisé -----
  const labelFormatter = (entry: any) => {
    if (!options.show_labels) return "";
    const name = entry.name;
    if (options.show_percentage) {
      const total = chartData.reduce((a, r) => a + r.value, 0);
      const pct = total ? ((entry.value / total) * 100).toFixed(1) + "%" : "";
      return `${name} (${pct})`;
    }
    return name;
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={options.inner_radius ?? 0}
          outerRadius={options.outer_radius ?? 120}
          label={labelFormatter}
          labelLine={options.show_label_lines ?? true}
          isAnimationActive={options.animation_duration > 0}
          animationDuration={options.animation_duration}
          // clockwise={options.clockwise}
        >
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={colors[i % colors.length]}
              stroke={options.stroke_color ?? "#fff"}
              strokeWidth={options.stroke_width ?? 1}
            />
          ))}
        </Pie>

        {options.show_tooltip !== false && (
          <Tooltip formatter={(value: any) => value.toLocaleString()} />
        )}
        {options.show_legend !== false && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
};