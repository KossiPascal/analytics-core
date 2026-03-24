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
import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const StackedBarRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys: string[] = header.rows ?? [];
  const metrics: string[] = header._all_columns_order ?? [];
  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const options = useMemo(() => ({
    ...(chart.options?.stacked_bar ?? {}),
    ...(chart.options ?? {}),
    animation_duration: chart.options?.stacked_bar?.animation_duration ?? 500,
    bar_width: chart.options?.stacked_bar?.bar_width ?? 30,
    radius: chart.options?.stacked_bar?.radius ?? [4, 4, 0, 0],
    show_labels: chart.options?.stacked_bar?.show_labels ?? false,
    rotate_x_labels: chart.options?.stacked_bar?.rotate_x_labels ?? 0,
    x_label_height: chart.options?.stacked_bar?.x_label_height ?? 60
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"
  ];

  const width = options.width ?? "100%";
  const height = options.height ?? 400;

  const margin = {
    top: options.margin_top ?? 20,
    bottom: options.margin_bottom ?? 20,
    left: options.margin_left ?? 20,
    right: options.margin_right ?? 20
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data.rows} margin={margin}>
        {options.show_grid && <CartesianGrid strokeDasharray={options.grid_dasharray ?? "3 3"} />}
        <XAxis 
          dataKey={xKey} 
          interval={0} 
          angle={options.rotate_x_labels} 
          height={options.x_label_height} 
        />
        <YAxis />
        {options.show_tooltip !== false && <Tooltip />}
        {options.show_legend !== false && <Legend />}

        {metrics.map((m, i) => (
          <Bar
            key={m}
            dataKey={m}
            stackId="stack"
            fill={colors[i % colors.length]}
            barSize={options.bar_width}
            radius={options.radius}
            animationDuration={options.animation_duration}
          >
            {options.show_labels && <LabelList dataKey={m} position="top" />}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};