import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Cell
} from "recharts";

import { ChartRenderProp } from "@/models/dataset.models";

export const BarRenderer = ({ chart, data }: ChartRenderProp) => {

  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;

  const dimensionKeys: string[] = header.rows ?? [];
  const allColumns: string[] = header._all_columns_order ?? [];

  const options = chart.options?.bar ?? {};

  const colors =
    options.color_scheme ??
    [
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

  const showSubtotal = options.show_subtotal ?? (chart.structure?.pivot?.cols_subtotal || chart.structure?.pivot?.rows_subtotal) ?? false;
  const showTotal = options.show_total ?? (chart.structure?.pivot?.cols_total || chart.structure?.pivot?.rows_total) ?? false;

  const xKey = dimensionKeys[dimensionKeys.length - 1];

  /* ----------------------------
  CLEAN METRIC COLUMNS
  ----------------------------- */

  const metricColumns = allColumns.filter((c) => {

    if (!showSubtotal && c.startsWith("SUBTOTAL")) return false;
    if (!showTotal && c.startsWith("TOTAL")) return false;

    return true;
  });

  /* ----------------------------
  CLEAN ROWS
  ----------------------------- */

  const cleanRows = data.rows.filter((row: any) => {

    const lastDim = row[xKey];

    if (!showSubtotal && lastDim === "SUBTOTAL") return false;
    if (!showTotal && lastDim === "TOTAL") return false;

    return true;
  });

  /* ----------------------------
  BUILD CHART DATA
  ----------------------------- */

  const chartData = cleanRows.map((row: any) => {

    const r: any = {};

    /* dimension label */

    r[xKey] = dimensionKeys
      .map((d) => row[d])
      .filter(Boolean)
      .join(" / ");

    /* metrics */

    metricColumns.forEach((col) => {

      const v = row[col];

      r[col] =
        v === null || v === undefined
          ? 0
          : typeof v === "number"
          ? v
          : Number(v);
    });

    return r;
  });

  /* ----------------------------
  FORMAT LABEL
  ----------------------------- */

  const formatLabel = (col: string) => {

    if (col.startsWith("SUBTOTAL")) {

      return col
        .replace("SUBTOTAL_", "")
        .replaceAll("_", " ")
        .trim() + " subtotal";
    }

    if (col.startsWith("TOTAL")) {

      return "Total";
    }

    return col.replaceAll("_", " ");
  };

  /* ----------------------------
  TOOLTIP FORMAT
  ----------------------------- */

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

  /* ----------------------------
  LEGEND FORMAT
  ----------------------------- */

  const legendFormatter = (value: string) => {

    return formatLabel(value);
  };

  /* ----------------------------
  RENDER
  ----------------------------- */

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

              <YAxis
                type="category"
                dataKey={xKey}
                width={150}
              />
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
            <Legend
              formatter={legendFormatter}
            />
          )}

          {metricColumns.map((col: string, i: number) => {

            const color = colors[i % colors.length];

            return (
              <Bar
                key={col}
                dataKey={col}
                fill={color}
                stackId={isStacked ? "stack" : undefined}
                barSize={barSize}
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={500}
              >

                {options.show_labels && (
                  <LabelList
                    dataKey={col}
                    position={isHorizontal ? "right" : "top"}
                  />
                )}

                {chartData.map((entry: any, index: number) => (

                  <Cell
                    key={`cell-${index}`}
                    fillOpacity={0.9}
                  />
                ))}

              </Bar>
            );
          })}

        </BarChart>

      </ResponsiveContainer>
    </div>
  );
};





// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
//   ResponsiveContainer,
//   LabelList
// } from "recharts";

// import { getDimensionKeys, getMetricKeys } from "./render-utils";
// import { ChartRenderProp } from "@/models/dataset.models";

// export const BarRenderer = ({ chart, data }: ChartRenderProp) => {

//   const dimensions = getDimensionKeys(chart);
//   const metrics = getMetricKeys(chart);

//   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
//     return <div className="text-gray-400 p-4">No configuration or data</div>;
//   }

//   const dim = dimensions[0];

//   /* MERGE OPTIONS */

//   const baseOptions = chart.options ?? {};
//   const options = {
//     ...baseOptions,
//     ...(baseOptions.bar ?? {})
//   };

//   const colors =
//     options.color_scheme ??
//     ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 350;

//   const isHorizontal = options.horizontal ?? false;
//   const isStacked = options.stacked ?? false;

//   const margin = {
//     top: options.margin_top ?? 20,
//     bottom: options.margin_bottom ?? 20,
//     left: options.margin_left ?? 20,
//     right: options.margin_right ?? 20
//   };

//   const barSize = options.bar_width ?? 30;
//   const radius = options.border_radius ?? 2;
//   const animationDuration = options.animation_duration ?? 500;

//   /* IMPORTANT: ensure numeric metrics */

//   const chartData = data.rows.map((row: any) => {
//     const newRow: any = { ...row };
    
//     console.log(row)

//     metrics.forEach((m) => {
//       const field = m.alias ?? m.field;

//       if (newRow[field] !== undefined) {
//         newRow[field] = Number(newRow[field]);
//       }
//     });

//     return newRow;
//   });

//   return (
//     <div style={{ width, height }}>

//       {options.title && (
//         <div className="text-lg font-semibold mb-1 text-center">
//           {options.title}
//         </div>
//       )}

//       {options.subtitle && (
//         <div className="text-gray-500 text-sm mb-2 text-center">
//           {options.subtitle}
//         </div>
//       )}

//       <ResponsiveContainer width="100%" height="100%">

//         <BarChart
//           data={chartData}
//           layout={isHorizontal ? "vertical" : "horizontal"}
//           margin={margin}
//         >

//           {options.show_grid && (
//             <CartesianGrid strokeDasharray="3 3" />
//           )}

//           {isHorizontal ? (
//             <>
//               <XAxis type="number" />

//               <YAxis
//                 type="category"
//                 dataKey={dim.alias ?? dim.field}
//               />
//             </>
//           ) : (
//             <>
//               <XAxis
//                 type="category"
//                 dataKey={dim.alias ?? dim.field}
//               />

//               <YAxis type="number" />
//             </>
//           )}

//           {options.show_tooltip && (
//             <Tooltip
//               formatter={(value: any) => {
//                 if (options.y_axis_format === "number")
//                   return Number(value).toLocaleString();
//                 return value;
//               }}
//             />
//           )}

//           {options.show_legend && <Legend />}

//           {metrics.map((m, i) => {

//             const metric = m.alias ?? m.field;
//             const color = colors[i % colors.length];

//             return (
//               <Bar
//                 key={metric}
//                 dataKey={metric}
//                 fill={color}
//                 stackId={isStacked ? "stack" : undefined}
//                 barSize={barSize}
//                 radius={[radius, radius, 0, 0]}
//                 isAnimationActive
//                 animationDuration={animationDuration}
//               >

//                 {options.show_labels && (
//                   <LabelList
//                     dataKey={metric}
//                     position={isHorizontal ? "right" : "top"}
//                   />
//                 )}

//               </Bar>
//             );
//           })}

//         </BarChart>

//       </ResponsiveContainer>
//     </div>
//   );
// };




// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
//   ResponsiveContainer,
//   LabelList
// } from "recharts";

// import { getDimensionKeys, getMetricKeys } from "./render-utils";
// import { ChartRenderProp } from "@/models/dataset.models";

// export const BarRenderer = ({ chart, data }: ChartRenderProp) => {

//   const dimensions = getDimensionKeys(chart);
//   const metrics = getMetricKeys(chart);

//   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
//     return <div className="text-gray-400 p-4">No configuration or data</div>;
//   }

//   const dimension = dimensions[0];

//   /* MERGE BASE + BAR OPTIONS */

//   const baseOptions = chart.options ?? {};
//   const options = {
//     ...baseOptions,
//     ...(baseOptions.bar ?? {})
//   };

//   const colors =
//     options.color_scheme ??
//     ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 350;

//   const isHorizontal = options.horizontal ?? false;
//   const isStacked = options.stacked ?? false;

//   const margin = {
//     top: options.margin_top ?? 20,
//     bottom: options.margin_bottom ?? 20,
//     left: options.margin_left ?? 20,
//     right: options.margin_right ?? 20
//   };

//   const barSize = options.bar_width ?? 30;

//   const radius = options.border_radius ?? 2;

//   const animationDuration = options.animation_duration ?? 500;

//   return (
//     <div style={{ width, height }}>


//       {options.title && (
//         <div className="text-lg font-semibold mb-1 text-center">
//           {options.title}
//         </div>
//       )}

//       {options.subtitle && (
//         <div className="text-gray-500 text-sm mb-2 text-center">
//           {options.subtitle}
//         </div>
//       )}

//       <ResponsiveContainer width="100%" height="100%">

//         <BarChart
//           data={data.rows}
//           layout={isHorizontal ? "vertical" : "horizontal"}
//           margin={margin}
//         >


//           {options.show_grid && (
//             <CartesianGrid strokeDasharray="3 3" />
//           )}

//           {isHorizontal ? (
//             <>
//               <XAxis
//                 type="number"
//                 label={
//                   options.x_axis_label
//                     ? { value: options.x_axis_label, position: "insideBottom" }
//                     : undefined
//                 }
//               />
//               <YAxis
//                 type="category"
//                 dataKey={dim.alias ?? dim.field}
//                 label={
//                   options.y_axis_label
//                     ? { value: options.y_axis_label, angle: -90 }
//                     : undefined
//                 }
//               />
//             </>
//           ) : (
//             <>
//               <XAxis
//                 dataKey={dim.alias ?? dim.field}
//                 label={
//                   options.x_axis_label
//                     ? { value: options.x_axis_label, position: "insideBottom" }
//                     : undefined
//                 }
//               />
//               <YAxis
//                 label={
//                   options.y_axis_label
//                     ? { value: options.y_axis_label, angle: -90 }
//                     : undefined
//                 }
//               />
//             </>
//           )}

//           {options.show_tooltip && (
//             <Tooltip
//               formatter={(value: any) => {
//                 if (options.y_axis_format === "number")
//                   return Number(value).toLocaleString();
//                 return value;
//               }}
//             />
//           )}

//           {options.show_legend && <Legend />}

//           {metrics.map((m, i) => {

//             const metric = m.field;

//             return (
//               <Bar
//                 key={metric}
//                 dataKey={metric}
//                 fill={colors[i % colors.length]}
//                 stackId={isStacked ? "stack" : undefined}
//                 barSize={barSize}
//                 radius={[radius, radius, 0, 0]}
//                 isAnimationActive={true}
//                 animationDuration={animationDuration}
//               >

//                 {options.show_labels && (
//                   <LabelList
//                     dataKey={metric}
//                     position={isHorizontal ? "right" : "top"}
//                   />
//                 )}

//               </Bar>
//             );
//           })}

//         </BarChart>

//       </ResponsiveContainer>
//     </div>
//   );
// };




// // import {
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   Legend,
// //   CartesianGrid,
// //   ResponsiveContainer,
// // } from "recharts";

// // import { getDimensionKeys, getMetricKeys } from "./render-utils";
// // import { ChartRenderProp } from "@/models/dataset.models";

// // export const BarRenderer = ({ chart, data }: ChartRenderProp) => {
// //   const dimensions = getDimensionKeys(chart);
// //   const metrics = getMetricKeys(chart);

// //   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
// //     return (
// //       <div className="text-gray-400 p-4">
// //         No configuration or data
// //       </div>
// //     );
// //   }

// //   // 🔥 Bar chart = 1 dimension obligatoire
// //   const dimension = dimensions[0];
// //   const options = chart.options?.bar ?? {};
// //   const colors = options.color_scheme ?? ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

// //   const width = options.width ?? "100%";
// //   const height = options.height ?? 300;

// //   const isHorizontal = (options as any).horizontal ?? false;
// //   const isStacked = (options as any).stacked ?? false;

// //   return (
// //     <ResponsiveContainer width={width} height={height}>
// //       <BarChart
// //         data={data}
// //         layout={isHorizontal ? "vertical" : "horizontal"}
// //       >
// //         {options.show_grid && <CartesianGrid strokeDasharray="3 3" />}

// //         {isHorizontal ? (
// //           <>
// //             <XAxis type="number" />
// //             <YAxis type="category" dataKey={dim.alias ?? dim.field} />
// //           </>
// //         ) : (
// //           <>
// //             <XAxis dataKey={dim.alias ?? dim.field} />
// //             <YAxis />
// //           </>
// //         )}

// //         {options.show_tooltip && <Tooltip />}
// //         {options.show_legend && <Legend />}

// //         {metrics.map(m=>m.field).map((metric, i) => (
// //           <Bar
// //             key={metric}
// //             dataKey={metric}
// //             fill={colors[i % colors.length]}
// //             stackId={isStacked ? "stack" : undefined}
// //           />
// //         ))}
// //       </BarChart>
// //       <></>
// //     </ResponsiveContainer>
// //   );
// // };