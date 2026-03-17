import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList
} from "recharts";

import { CHART_COLS_SEPARATOR, ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const BarRenderer = ({ chart, query, data }: ChartRenderProp) => {

  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;

  const dimensionKeys: string[] = header.rows ?? [];
  const allColumns: string[] = header._all_columns_order ?? [];
  const colDimsLabel = header.column_label_maps ?? {};

  /* ---------------- OPTIONS ---------------- */

  const options = useMemo(() => ({
    ...(chart.options?.bar ?? {}),
    ...(chart.options ?? {})
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50",
    "#2196f3",
    "#ff9800",
    "#9c27b0",
    "#f44336",
    "#00bcd4",
    "#8bc34a",
    "#ffc107"
  ];

  const width = options.width ?? "100%";
  const height = options.height ?? 400;

  const isHorizontal = options.horizontal ?? false;
  const isStacked = options.stacked ?? false;

  const margin = {
    top: options.margin_top ?? 20,
    bottom: options.margin_bottom ?? 20,
    left: options.margin_left ?? 20,
    right: options.margin_right ?? 20
  };

  const barSize = options.bar_width ?? 30;

  const showSubtotal =
    options.show_subtotal ??
    chart.structure?.pivot?.cols_subtotal ??
    chart.structure?.pivot?.rows_subtotal ??
    false;

  const showTotal =
    options.show_total ??
    chart.structure?.pivot?.cols_total ??
    chart.structure?.pivot?.rows_total ??
    false;

  const xKey = dimensionKeys[dimensionKeys.length - 1];

  /* ---------------- METRIC COLUMNS ---------------- */
  const metricColumns = useMemo(() => {

    return allColumns.filter((c) => {
      if (!showSubtotal && c.startsWith("SUBTOTALS")) return false;
      if (!showTotal && c.startsWith("TOTALS")) return false;
      return true;
    });

  }, [allColumns, showSubtotal, showTotal]);

  /* ---------------- CLEAN ROWS ---------------- */
  const cleanRows = useMemo(() => {

    return data.rows.filter((row: any) => {
      const lastDim = row[xKey];
      if (!showSubtotal && lastDim === "SUBTOTALS") return false;
      if (!showTotal && lastDim === "TOTALS") return false;
      return true;
    });

  }, [data.rows, showSubtotal, showTotal, xKey]);

  /* ---------------- CHART DATA ---------------- */
  const chartData = useMemo(() => {

    return cleanRows.map((row: any) => {

      const r: any = {};

      r[xKey] = dimensionKeys
        .map((d) => {
          const field = row[d];
          return ((options.renames ?? {})[d] ?? {})[field] ?? field;
        })
        .filter(Boolean)
        .join(" / ");

      metricColumns.forEach((col) => {
        const v = row[col];
        if (v === null || v === undefined) {
          r[col] = 0;
        } else {
          const n = Number(v);
          r[col] = Number.isFinite(n) ? n : 0;
        }
      });

      return r;
    });

  }, [cleanRows, metricColumns, dimensionKeys, options.renames, xKey]);

  /* ---------------- LABEL FORMAT ---------------- */
  const formatLabel = (mc: string) => {

    const sep = CHART_COLS_SEPARATOR;

    const cols = mc.split(sep);

    const labels = cols.map((c, j) => {
      const key = colDimsLabel[j];
      return ((options.renames ?? {})[key] ?? {})[c] ?? c;
    });

    const col = labels.join(sep);

    if (col.startsWith("SUBTOTALS")) {
      return col.replace("SUBTOTALS" + sep, "").replaceAll(sep, " ") + " subtotal";
    }

    if (col.startsWith("TOTALS")) {
      return "Total";
    }

    return col.replaceAll(sep, " ");
  };

  /* ---------------- TOOLTIP ---------------- */
  const tooltipFormatter = (value: any, name: any) => {

    const label = formatLabel(name);

    if (options.y_axis_format === "number") {
      return [Number(value).toLocaleString(), label];
    }

    if (options.y_axis_format === "percent") {
      return [(Number(value) * 100).toFixed(2) + "%", label];
    }

    return [value, label];
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div style={{ width, height }}>

      {options.title && (
        <div className="text-lg font-semibold mb-1 text-center">
          {options.title}
        </div>
      )}

      {options.subtitle && (
        <div className="text-gray-500 text-sm mb-3 text-center">
          {options.subtitle}
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">

        <BarChart
          data={chartData}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={margin}
        >

          {options.show_grid && (
            <CartesianGrid strokeDasharray="3 3" />
          )}

          {isHorizontal ? (
            <>
              <XAxis type="number" />
              <YAxis type="category" dataKey={xKey} width={150} />
            </>
          ) : (
            <>
              <XAxis
                type="category"
                dataKey={xKey}
                interval={0}
                angle={options.rotate_x_labels ?? 0}
                height={options.x_label_height ?? 60}
              />
              <YAxis />
            </>
          )}

          {options.show_tooltip !== false && (
            <Tooltip
              formatter={tooltipFormatter}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />
          )}

          {options.show_legend !== false && (
            <Legend formatter={formatLabel} />
          )}

          {metricColumns.map((col: string, i: number) => (

            <Bar
              key={col}
              dataKey={col}
              fill={colors[i % colors.length]}
              stackId={isStacked ? "stack" : undefined}
              barSize={barSize}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            >
              {options.show_labels && (
                <LabelList
                  dataKey={col}
                  position={isHorizontal ? "right" : "top"}
                />
              )}
            </Bar>

          ))}

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
};