// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
//   ResponsiveContainer,
//   Brush,
//   ReferenceLine,
//   Label,
// } from "recharts";

// import { getDimensionKeys, getMetricKeys } from "./render-utils";
// import { ChartRenderProp } from "@/models/dataset.models";

// export const AreaRenderer = ({ chart, data }: ChartRenderProp) => {
//   const dimensions = getDimensionKeys(chart);
//   const metrics = getMetricKeys(chart);

//   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
//     return (
//       <div className="text-gray-400 p-4">
//         No configuration or data
//       </div>
//     );
//   }

//   const dimension = dimensions[0];

//   const options = chart.options?.area ?? {};

//   const colors =
//     options.color_scheme ??
//     ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 350;

//   const isCurved = options.curved ?? true;
//   const isStacked = options.stacked ?? false;
//   const showGrid = options.show_grid ?? true;
//   const showLegend = options.show_legend ?? true;
//   const showTooltip = options.show_tooltip ?? true;
//   const showBrush = options.show_brush ?? false;
//   const showDots = options.show_dots ?? false;
//   const animate = options.animate ?? true;

//   const opacity = options.opacity ?? 0.4;

//   return (
//     <ResponsiveContainer width={width} height={height}>
//       <AreaChart
//         data={data.rows}
//         margin={{
//           top: options.margin_top ?? 10,
//           right: options.margin_right ?? 30,
//           left: options.margin_left ?? 0,
//           bottom: options.margin_bottom ?? 0,
//         }}
//         syncId={options.sync_id}
//       >
//         {/* GRID */}
//         {showGrid && <CartesianGrid strokeDasharray="3 3" />}

//         {/* AXES */}
//         <XAxis
//           dataKey={dimension.field}
//           tick={{ fontSize: options.x_tick_size ?? 12 }}
//         >
//           {options.x_label && (
//             <Label
//               value={options.x_label}
//               position="insideBottom"
//               offset={-5}
//             />
//           )}
//         </XAxis>

//         <YAxis
//           tick={{ fontSize: options.y_tick_size ?? 12 }}
//         >
//           {options.y_label && (
//             <Label
//               value={options.y_label}
//               angle={-90}
//               position="insideLeft"
//             />
//           )}
//         </YAxis>

//         {/* TOOLTIP */}
//         {showTooltip && <Tooltip />}

//         {/* LEGEND */}
//         {showLegend && <Legend />}

//         {/* REFERENCE LINE */}
//         {options.reference_line && (
//           <ReferenceLine
//             y={options.reference_line}
//             stroke="red"
//             strokeDasharray="3 3"
//           />
//         )}

//         {/* AREAS */}
//         {metrics.map((m) => m.field).map((metric, i) => {
//           const color = colors[i % colors.length];

//           return (
//             <Area
//               key={metric}
//               type={isCurved ? "monotone" : "linear"}
//               dataKey={metric}
//               stroke={color}
//               fill={color}
//               fillOpacity={opacity}
//               strokeWidth={options.stroke_width ?? 2}
//               dot={showDots}
//               activeDot={{ r: 6 }}
//               stackId={isStacked ? "stack" : undefined}
//               isAnimationActive={animate}
//               animationDuration={options.animation_duration ?? 400}
//             />
//           );
//         })}

//         {/* ZOOM / RANGE */}
//         {showBrush && (
//           <Brush
//             dataKey={dimension.field}
//             height={20}
//             stroke="#8884d8"
//           />
//         )}
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// };


import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { getDimensionKeys, getMetricKeys } from "./render-utils";
import { ChartRenderProp } from "@/models/dataset.models";

export const AreaRenderer = ({ chart, data }: ChartRenderProp) => {
  const dimensions = getDimensionKeys(chart);
  const metrics = getMetricKeys(chart);

  if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
    return (
      <div className="text-gray-400 p-4">
        No configuration or data
      </div>
    );
  }

  // 🔥 Area chart = 1 dimension obligatoire
  const dimension = dimensions[0];

  const options = chart.options?.area ?? {};
  const colors = options.color_scheme ?? ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

  const width = options.width ?? "100%";
  const height = options.height ?? 350;

  const isCurved = (options as any).curved ?? true;
  const isStacked = (options as any).stacked ?? false;

  return (
    <ResponsiveContainer width={width} height={height}>
      {/* <AreaChart data={data}>
        {options.show_grid && (
          <CartesianGrid strokeDasharray="3 3" />
        )}

        <XAxis dataKey={dimension.field} />
        <YAxis />

        {options.show_tooltip && <Tooltip />}
        {options.show_legend && <Legend />}

        {metrics.map(m=>m.field).map((metric, i) => (
          <Area
            key={metric}
            type={isCurved ? "monotone" : "linear"}
            dataKey={metric}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.4}
            stackId={isStacked ? "stack" : undefined}
          />
        ))}
      </AreaChart> */}
      <></>
    </ResponsiveContainer>
  );
};