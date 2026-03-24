import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const RadarRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys = header.rows ?? [];
  const metrics = header._all_columns_order ?? [];
  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const options = useMemo(() => ({
    ...(chart.options?.radar ?? {}),
    ...(chart.options ?? {}),
    animation_duration: chart.options?.radar?.animation_duration ?? 800,
    stroke_width: chart.options?.radar?.stroke_width ?? 2,
    fill_opacity: chart.options?.radar?.fill_opacity ?? 0.4,
    show_dots: chart.options?.radar?.show_dots ?? true,
  }), [chart.options]);

  const colors = options.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0"];

  return (
    <ResponsiveContainer width="100%" height={options.height ?? 350}>
      <RadarChart data={data.rows} outerRadius={options.outer_radius ?? "80%"}>
        <PolarGrid strokeDasharray={options.grid_dasharray ?? "3 3"} />
        <PolarAngleAxis 
          dataKey={xKey} 
          tick={{ fontSize: options.label_font_size ?? 12 }}
          tickFormatter={(value: any) => {
            if (!options.label_formatter) return value;
            return options.label_formatter(value);
          }}
          angle={options.angle ?? 0}
        />
        <PolarRadiusAxis 
          angle={options.radius_angle ?? 30} 
          tickCount={options.tick_count ?? 5} 
        />

        {options.show_tooltip !== false && <Tooltip />}
        {options.show_legend !== false && <Legend />}

        {metrics.map((m, i) => (
          <Radar
            key={m}
            dataKey={m}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={options.fill_opacity}
            strokeWidth={options.stroke_width}
            dot={options.show_dots ? { r: options.dot_size ?? 3 } : false}
            isAnimationActive={options.animation_duration > 0}
            animationDuration={options.animation_duration}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
};