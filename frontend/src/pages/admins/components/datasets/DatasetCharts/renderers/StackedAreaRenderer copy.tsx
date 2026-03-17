// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
//   ResponsiveContainer
// } from "recharts";

// import { ChartRenderProp } from "@/models/dataset.models";
// import { useMemo } from "react";

// export const StackedAreaRenderer = ({ chart, data }: ChartRenderProp) => {

//   if (!data?.rows?.length || !data?.header) {
//     return <div className="text-gray-400 p-4">No data</div>;
//   }

//   const header = data.header;

//   const dimensionKeys: string[] = header.rows ?? [];
//   const metrics: string[] = header._all_columns_order ?? [];

//   const xKey = dimensionKeys[dimensionKeys.length - 1];

//   const options = useMemo(() => ({
//     ...(chart.options?.stacked_area ?? {}),
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

//   const isCurved = options.curved ?? true;

//   return (

//     <ResponsiveContainer width={width} height={height}>

//       <AreaChart data={data.rows}>

//         {options.show_grid && (
//           <CartesianGrid strokeDasharray="3 3" />
//         )}

//         <XAxis dataKey={xKey} />
//         <YAxis />

//         {options.show_tooltip !== false && <Tooltip />}
//         {options.show_legend !== false && <Legend />}

//         {metrics.map((m, i) => (

//           <Area
//             key={m}
//             type={isCurved ? "monotone" : "linear"}
//             dataKey={m}
//             stackId="stack"
//             stroke={colors[i % colors.length]}
//             fill={colors[i % colors.length]}
//             fillOpacity={0.5}
//             animationDuration={500}
//           />

//         ))}

//       </AreaChart>

//     </ResponsiveContainer>

//   );

// };