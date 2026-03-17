import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from "recharts";
import { ChartRenderProp, CHART_COLS_SEPARATOR } from "@/models/dataset.models";
import { useMemo } from "react";

export const HorizontalBarRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys = header.rows ?? [];
  const allColumns = header._all_columns_order ?? [];
  const colDimsLabel = header.column_label_maps ?? {};

  const options = useMemo(() => ({
    ...(chart.options?.bar ?? {}),
    ...(chart.options ?? {}),
    width: chart.options?.width ?? "100%",
    height: chart.options?.height ?? 400,
    stacked: chart.options?.stacked ?? false,
    show_labels: chart.options?.show_labels ?? false,
    rotate_x_labels: chart.options?.bar?.rotate_x_labels ?? 0,
    x_label_height: chart.options?.bar?.x_label_height ?? 60,
    bar_width: chart.options?.bar?.bar_width ?? 30,
    animation_duration: chart.options?.animation_duration ?? 500,
    y_axis_format: chart.options?.y_axis_format ?? "number",
    color_scheme: chart.options?.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4","#8bc34a","#ffc107"]
  }), [chart.options]);

  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const metricColumns = useMemo(() => {
    return allColumns.filter(c => !c.startsWith("SUBTOTALS") && !c.startsWith("TOTALS"));
  }, [allColumns]);

  const chartData = useMemo(() => {
    return data.rows.map((row: any) => {
      const r: Record<string, string | number> = {};
      r[xKey] = dimensionKeys
        .map(d => {
          const field = row[d];
          return ((options.renames ?? {})[d]?.[field]) ?? field;
        })
        .filter(Boolean)
        .join(" / ");

      metricColumns.forEach(col => {
        const v = row[col];
        const n = Number(v);
        r[col] = Number.isFinite(n) ? n : 0;
      });

      return r;
    });
  }, [data.rows, metricColumns, dimensionKeys, options.renames, xKey]);

  const formatLabel = (mc: string) => {
    const cols = mc.split(CHART_COLS_SEPARATOR);
    const labels = cols.map((c, j) => {
      const key = colDimsLabel[j];
      return ((options.renames ?? {})[key]?.[c]) ?? c;
    });
    return labels.join(" ").replace("SUBTOTALS","Subtotal").replace("TOTALS","Total");
  };

  const tooltipFormatter = (value: any, name: any) => {
    const label = formatLabel(name);
    if (options.y_axis_format === "number") return [Number(value).toLocaleString(), label];
    if (options.y_axis_format === "percent") return [(Number(value) * 100).toFixed(2) + "%", label];
    return [value, label];
  };

  return (
    <div style={{ width: options.width, height: options.height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{
          top: options.margin_top ?? 20,
          bottom: options.margin_bottom ?? 20,
          left: options.margin_left ?? 20,
          right: options.margin_right ?? 20
        }}>
          {options.show_grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis type="number" />
          <YAxis type="category" dataKey={xKey} width={150} />
          {options.show_tooltip !== false && <Tooltip formatter={tooltipFormatter} />}
          {options.show_legend !== false && <Legend formatter={formatLabel} />}
          {metricColumns.map((col, i) => (
            <Bar
              key={col}
              dataKey={col}
              fill={options.color_scheme[i % options.color_scheme.length]}
              stackId={options.stacked ? "stack" : undefined}
              barSize={options.bar_width}
              animationDuration={options.animation_duration}
            >
              {options.show_labels && <LabelList dataKey={col} position="right" />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};