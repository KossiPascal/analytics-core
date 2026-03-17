// import {
//   PieChart,
//   Pie,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Cell
// } from "recharts";

// import { ChartRenderProp, CHART_COLS_SEPARATOR } from "@/models/dataset.models";
// import { useMemo } from "react";

// export const PieRenderer = ({ chart, data }: ChartRenderProp) => {

//   if (!data?.rows?.length || !data?.header) {
//     return <div className="text-gray-400 p-4">No data</div>;
//   }

//   const header = data.header;

//   const dimensionKeys: string[] = header.rows ?? [];
//   const allColumns: string[] = header._all_columns_order ?? [];

//   const options = useMemo(() => ({
//     ...(chart.options?.pie ?? {}),
//     ...(chart.options ?? {})
//   }), [chart.options]);

//   const colors = options.color_scheme ?? [
//     "#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"
//   ];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 400;

//   const xKey = dimensionKeys[dimensionKeys.length - 1];
//   const metric = allColumns[0];

//   const chartData = useMemo(() => {

//     return data.rows.map((row:any)=>({

//       name: dimensionKeys
//         .map(d => row[d])
//         .filter(Boolean)
//         .join(" / "),

//       value: Number(row[metric]) || 0

//     }));

//   },[data.rows,dimensionKeys,metric]);

//   return (

//     <ResponsiveContainer width={width} height={height}>

//       <PieChart>

//         <Pie
//           data={chartData}
//           dataKey="value"
//           nameKey="name"
//           innerRadius={options.inner_radius ?? 0}
//           outerRadius={options.outer_radius ?? 120}
//           label={options.show_labels ?? false}
//         >
//           {chartData.map((_,i)=>(
//             <Cell key={i} fill={colors[i % colors.length]} />
//           ))}
//         </Pie>

//         {options.show_tooltip !== false && <Tooltip/>}
//         {options.show_legend !== false && <Legend/>}

//       </PieChart>

//     </ResponsiveContainer>

//   );
// };