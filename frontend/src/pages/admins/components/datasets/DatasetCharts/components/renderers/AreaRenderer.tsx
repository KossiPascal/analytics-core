import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  LabelList
} from "recharts";
import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const AreaRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys = header.rows ?? [];
  const metrics = header._all_columns_order ?? [];
  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const options = useMemo(() => ({
    ...(chart.options?.area ?? {}),
    ...(chart.options ?? {})
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4", "#8bc34a", "#ffc107"
  ];

  const smoothType = options.curved ?? true ? "monotone" : "linear";
  const stacked = options.stacked ?? false;
  const height = options.height ?? 350;
  const showMarkers = options.show_markers ?? true;
  const pointSize = options.point_size ?? 4;

  const tooltipFormatter = (value: any, name: any) => {
    if (options.y_axis_format === "percent") return [(value * 100).toFixed(2) + "%", name];
    if (options.y_axis_format === "number") return [Number(value).toLocaleString(), name];
    return [value, name];
  };

  return (
    <div style={{ width: "100%", height }}>
      {options.title && <div className="text-lg font-semibold mb-1 text-center">{options.title}</div>}
      {options.subtitle && <div className="text-gray-500 text-sm mb-3 text-center">{options.subtitle}</div>}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.rows} margin={{
          top: options.margin_top ?? 20,
          bottom: options.margin_bottom ?? 20,
          left: options.margin_left ?? 20,
          right: options.margin_right ?? 20
        }}>

          {options.show_grid && (
            <CartesianGrid
              stroke={options.grid_stroke ?? "#e0e0e0"}
              strokeDasharray={options.grid_dasharray ?? "3 3"}
              vertical={options.grid_vertical ?? true}
              horizontal={options.grid_horizontal ?? true}
            />
          )}

          <XAxis dataKey={xKey} angle={options.rotate_x_labels ?? 0} height={options.x_label_height ?? 60} />
          <YAxis tickFormatter={(v) => {
            if (options.y_axis_format === "percent") return `${(v*100).toFixed(1)}%`;
            if (options.y_axis_format === "currency") return `$${v}`;
            return v;
          }}/>

          {options.show_tooltip !== false && <Tooltip formatter={tooltipFormatter} />}
          {options.show_legend !== false && <Legend />}

          {options.show_brush && <Brush dataKey={xKey} height={30} stroke="#8884d8" />}

          {options.reference_lines?.map((ref, idx:number) => (
            <ReferenceLine
              key={idx}
              x={ref.x}
              y={ref.y}
              stroke={ref.stroke ?? "#ff0000"}
              strokeDasharray={ref.dash ?? "3 3"}
              label={ref.label}
            />
          ))}

          {metrics.map((m,i) => (
            <Area
              key={m}
              type={smoothType}
              dataKey={m}
              stroke={colors[i % colors.length]}
              fill={options.gradient_fill ? `url(#gradient-${i})` : colors[i % colors.length]}
              fillOpacity={options.fill_opacity ?? 0.25}
              stackId={stacked ? "stack" : undefined}
              strokeWidth={options.line_width ?? 2}
              dot={showMarkers ? { r: pointSize, stroke: "#fff", strokeWidth: 1 } : false}
              animationDuration={options.animation_duration ?? 500}
            >
              {options.show_labels && <LabelList dataKey={m} position={options.label_position ?? "top"} />}
            </Area>
          ))}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};