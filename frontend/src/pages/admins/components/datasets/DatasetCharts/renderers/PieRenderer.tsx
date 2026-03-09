// import {
//   PieChart,
//   Pie,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Cell,
// } from "recharts";

// import {
//   getDimensionKeys,
//   getMetricKeys,
//   buildPieData,
// } from "./render-utils";

// import { ChartRenderProp } from "@/models/dataset.models";

// export const PieRenderer = ({ chart, data }: ChartRenderProp) => {
//   const dimensions = getDimensionKeys(chart);
//   const metrics = getMetricKeys(chart);

//   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
//     return (
//       <div className="text-gray-400 p-4">
//         No configuration or data
//       </div>
//     );
//   }

//   const dimension = dimensions[0].field;
//   const metric = metrics[0].field;

//   let pieData = buildPieData(data.rows, dimension, metric);

//   const options = chart.options?.pie ?? {};

//   const colors =
//     options.color_scheme ??
//     ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 400;

//   const innerRadius = options.inner_radius ?? 0;
//   const outerRadius = options.outer_radius ?? "80%";

//   const showTooltip = options.show_tooltip ?? true;
//   const showLegend = options.show_legend ?? true;
//   const showLabels = options.show_labels ?? false;

//   const paddingAngle = options.padding_angle ?? 0;

//   const startAngle = options.start_angle ?? 0;
//   const endAngle = options.end_angle ?? 360;

//   const animate = options.animate ?? true;

//   const cx = options.cx ?? "50%";
//   const cy = options.cy ?? "50%";

//   const minAngle = options.min_angle ?? 0;

//   if (options.sort) {
//     pieData = [...pieData].sort((a, b) => b.value - a.value);
//   }

//   return (
//     <ResponsiveContainer width={width} height={height}>
//       <PieChart>
//         <Pie
//           data={pieData}
//           dataKey="value"
//           nameKey="name"
//           cx={cx}
//           cy={cy}
//           innerRadius={innerRadius}
//           outerRadius={outerRadius}
//           paddingAngle={paddingAngle}
//           startAngle={startAngle}
//           endAngle={endAngle}
//           minAngle={minAngle}
//           label={showLabels}
//           isAnimationActive={animate}
//           animationDuration={options.animation_duration ?? 400}
//         >
//           {pieData.map((entry, idx) => (
//             <Cell
//               key={`cell-${idx}`}
//               fill={colors[idx % colors.length]}
//               stroke={options.slice_border_color ?? "#fff"}
//               strokeWidth={options.slice_border_width ?? 1}
//             />
//           ))}
//         </Pie>

//         {showTooltip && (
//           <Tooltip
//             formatter={(value: number, name: string) => {
//               if (options.show_percentage) {
//                 const total = pieData.reduce((a, b) => a + b.value, 0);
//                 const pct = ((value / total) * 100).toFixed(1);
//                 return [`${value} (${pct}%)`, name];
//               }
//               return [value, name];
//             }}
//           />
//         )}

//         {showLegend && (
//           <Legend
//             layout={options.legend_layout ?? "horizontal"}
//             verticalAlign={options.legend_vertical_align ?? "bottom"}
//             align={options.legend_align ?? "center"}
//           />
//         )}
//       </PieChart>
//     </ResponsiveContainer>
//   );
// };



import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { getDimensionKeys, getMetricKeys, buildPieData } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const PieRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return (<div className="text-gray-400 p-4">No configuration or data</div>);
  }

  // 🔥 Pie = 1 dimension + 1 metric
  const dimension = dimensions[0].field;
  const metric = metrics.map(m=>m.field)[0];

  const pieData = buildPieData(data.rows, dimension, metric);

  const options = chart.options?.pie ?? {};
  const colors = options.color_scheme ?? ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

  const width = options.width ?? "100%";
  const height = options.height ?? 400;

  return (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          label={options.show_labels ?? false}
          innerRadius={(options as any).inner_radius ?? 0} // support donut
        >
          {pieData.map((_, idx) => (
            <Cell key={idx} fill={colors[idx % colors.length]} />
          ))}
        </Pie>

        {options.show_tooltip && <Tooltip />}
        {options.show_legend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
};