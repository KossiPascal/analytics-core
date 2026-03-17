// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
//   ResponsiveContainer
// } from "recharts";

// import { ChartRenderProp } from "@/models/dataset.models";
// import { useMemo } from "react";

// export const StackedBarRenderer = ({ chart, data }: ChartRenderProp) => {

//   if (!data?.rows?.length || !data?.header) {
//     return <div className="text-gray-400 p-4">No data</div>;
//   }

//   const header = data.header;

//   const dimensionKeys: string[] = header.rows ?? [];
//   const metrics: string[] = header._all_columns_order ?? [];

//   const xKey = dimensionKeys[dimensionKeys.length - 1];

//   const options = useMemo(() => ({
//     ...(chart.options?.stacked_bar ?? {}),
//     ...(chart.options ?? {})
//   }), [chart.options]);

//   const colors = options.color_scheme ?? [
//     "#4caf50",
//     "#2196f3",
//     "#ff9800",
//     "#9c27b0",
//     "#f44336",
//     "#00bcd4"
//   ];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 350;

//   return (

//     <ResponsiveContainer width={width} height={height}>

//       <BarChart
//         data={data.rows}
//         margin={{
//           top: options.margin_top ?? 20,
//           bottom: options.margin_bottom ?? 20,
//           left: options.margin_left ?? 20,
//           right: options.margin_right ?? 20
//         }}
//       >

//         {options.show_grid && (
//           <CartesianGrid strokeDasharray="3 3" />
//         )}

//         <XAxis dataKey={xKey} />
//         <YAxis />

//         {options.show_tooltip !== false && <Tooltip />}
//         {options.show_legend !== false && <Legend />}

//         {metrics.map((m, i) => (

//           <Bar
//             key={m}
//             dataKey={m}
//             stackId="stack"
//             fill={colors[i % colors.length]}
//             barSize={options.bar_width ?? 30}
//             radius={[4, 4, 0, 0]}
//             animationDuration={500}
//           />

//         ))}

//       </BarChart>

//     </ResponsiveContainer>

//   );

// };