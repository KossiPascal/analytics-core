import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList
} from "recharts";
import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const StackedAreaRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys: string[] = header.rows ?? [];
  const metrics: string[] = header._all_columns_order ?? [];
  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const options = useMemo(() => ({
    ...(chart.options?.stacked_area ?? {}),
    ...(chart.options ?? {}),
    animation_duration: chart.options?.stacked_area?.animation_duration ?? 500,
    fill_opacity: chart.options?.stacked_area?.fill_opacity ?? 0.5,
    stroke_width: chart.options?.stacked_area?.stroke_width ?? 2,
    show_markers: chart.options?.stacked_area?.show_markers ?? false,
    point_size: chart.options?.stacked_area?.point_size ?? 4,
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"
  ];

  const width = options.width ?? "100%";
  const height = options.height ?? 350;

  const margin = {
    top: options.margin_top ?? 20,
    bottom: options.margin_bottom ?? 20,
    left: options.margin_left ?? 20,
    right: options.margin_right ?? 20
  };

  const isCurved = options.curved ?? true;

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data.rows} margin={margin}>
        {options.show_grid && <CartesianGrid strokeDasharray={options.grid_dasharray ?? "3 3"} />}
        <XAxis 
          dataKey={xKey} 
          interval={0} 
          angle={options.rotate_x_labels ?? 0} 
          height={options.x_label_height ?? 60} 
        />
        <YAxis />
        {options.show_tooltip !== false && <Tooltip />}
        {options.show_legend !== false && <Legend />}

        {metrics.map((m, i) => (
          <Area
            key={m}
            type={isCurved ? "monotone" : "linear"}
            dataKey={m}
            stackId="stack"
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={options.fill_opacity}
            strokeWidth={options.stroke_width}
            dot={options.show_markers ? { r: options.point_size } : false}
            animationDuration={options.animation_duration}
          >
            {options.show_labels && (
              <LabelList dataKey={m} position="top" />
            )}
          </Area>
        ))}

      </AreaChart>
    </ResponsiveContainer>
  );
};