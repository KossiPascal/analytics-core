import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Dot
} from "recharts";

import { ChartRenderProp } from "@/models/dataset.models";

export const LineRenderer = ({ chart, data }: ChartRenderProp) => {

  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;

  const dimensionKeys: string[] = header.rows ?? [];
  const allColumns: string[] = header._all_columns_order ?? [];

  const options = chart.options?.line ?? {};

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

  const isArea = options.area ?? false;
  const isCurved = options.curved ?? true;

  const lineWidth = options.line_width ?? 2;
  const showMarkers = options.show_markers ?? true;
  const pointSize = options.point_size ?? 4;

  const margin = {
    top: options.margin_top ?? 20,
    bottom: options.margin_bottom ?? 20,
    left: options.margin_left ?? 20,
    right: options.margin_right ?? 20
  };

  const animationDuration = options.animation_duration ?? 500;
  const smoothType = isCurved ? "monotone" : "linear";

   const showSubtotal = options.show_subtotal ?? (chart.structure?.pivot?.cols_subtotal || chart.structure?.pivot?.rows_subtotal) ?? false;
  const showTotal = options.show_total ?? (chart.structure?.pivot?.cols_total || chart.structure?.pivot?.rows_total) ?? false;

  const xKey = dimensionKeys[dimensionKeys.length - 1];

  /* -------------------------
  CLEAN METRIC COLUMNS
  ------------------------- */

  const metricColumns = allColumns.filter((c) => {

    if (!showSubtotal && c.startsWith("SUBTOTAL")) return false;
    if (!showTotal && c.startsWith("TOTAL")) return false;

    return true;
  });

  /* -------------------------
  CLEAN ROWS
  ------------------------- */

  const cleanRows = data.rows.filter((row: any) => {

    const val = row[xKey];

    if (!showSubtotal && val === "SUBTOTAL") return false;
    if (!showTotal && val === "TOTAL") return false;

    return true;
  });

  /* -------------------------
  BUILD CHART DATA
  ------------------------- */

  const chartData = cleanRows.map((row: any) => {

    const r: any = {};

    r[xKey] = dimensionKeys
      .map((d) => row[d])
      .filter(Boolean)
      .join(" / ");

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

  /* -------------------------
  FORMAT LABEL
  ------------------------- */

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

  /* -------------------------
  TOOLTIP FORMAT
  ------------------------- */

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

  /* -------------------------
  LEGEND FORMAT
  ------------------------- */

  const legendFormatter = (value: string) => {
    return formatLabel(value);
  };

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

        <LineChart data={chartData} margin={margin}>

          {options.show_grid && (
            <CartesianGrid strokeDasharray="3 3" />
          )}

          <XAxis
            dataKey={xKey}
            type="category"
            interval={0}
            angle={options.rotate_x_labels ?? 0}
            height={options.x_label_height ?? 60}
          />

          <YAxis />

          {options.show_tooltip !== false && (
            <Tooltip
              formatter={tooltipFormatter}
              cursor={{ strokeDasharray: "3 3" }}
            />
          )}

          {options.show_legend !== false && (
            <Legend formatter={legendFormatter} />
          )}

          {metricColumns.map((col: string, i: number) => {

            const color = colors[i % colors.length];

            if (isArea) {

              return (
                <Area
                  key={col}
                  type={smoothType}
                  dataKey={col}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.25}
                  strokeWidth={lineWidth}
                  isAnimationActive
                  animationDuration={animationDuration}
                  dot={showMarkers ? { r: pointSize } : false}
                />
              );
            }

            return (
              <Line
                key={col}
                type={smoothType}
                dataKey={col}
                stroke={color}
                strokeWidth={lineWidth}
                isAnimationActive
                animationDuration={animationDuration}
                dot={showMarkers ? { r: pointSize } : false}
                activeDot={{ r: pointSize + 2 }}
              >
                {options.show_labels && (
                  <LabelList
                    dataKey={col}
                    position="top"
                  />
                )}
              </Line>
            );
          })}

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
};





// import {
//   LineChart,
//   Line,
//   Area,
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

// export const LineRenderer = ({ chart, data }: ChartRenderProp) => {

//   const dimensions = getDimensionKeys(chart);
//   const metrics = getMetricKeys(chart);

//   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
//     return <div className="text-gray-400 p-4">No configuration or data</div>;
//   }

//   const dimension = dimensions[0];

//   /* MERGE BASE + LINE OPTIONS */

//   const baseOptions = chart.options ?? {};

//   const options = {
//     ...baseOptions,
//     ...(baseOptions.line ?? {})
//   };

//   const colors =
//     options.color_scheme ??
//     ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 350;

//   const isCurved = options.curved ?? true;
//   const isArea = options.area ?? false;

//   const lineWidth = options.line_width ?? 2;
//   const showMarkers = options.show_markers ?? false;

//   const pointSize = options.point_size ?? 4;

//   const margin = {
//     top: options.margin_top ?? 20,
//     bottom: options.margin_bottom ?? 20,
//     left: options.margin_left ?? 20,
//     right: options.margin_right ?? 20
//   };

//   const animationDuration = options.animation_duration ?? 500;

//   const smoothType = isCurved ? "monotone" : "linear";

//   return (
//     <div style={{ width, height }}>

//       {/* TITLE */}

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

//         <LineChart
//           data={data.rows}
//           margin={margin}
//         >

//           {/* GRID */}

//           {options.show_grid && (
//             <CartesianGrid strokeDasharray="3 3" />
//           )}

//           {/* AXES */}

//           <XAxis
//             dataKey={dimension.field}
//             label={
//               options.x_axis_label
//                 ? { value: options.x_axis_label, position: "insideBottom" }
//                 : undefined
//             }
//           />

//           <YAxis
//             label={
//               options.y_axis_label
//                 ? { value: options.y_axis_label, angle: -90 }
//                 : undefined
//             }
//           />

//           {/* TOOLTIP */}

//           {options.show_tooltip && (
//             <Tooltip
//               formatter={(value:any)=>{
//                 if(options.y_axis_format==="number")
//                   return Number(value).toLocaleString()
//                 return value
//               }}
//             />
//           )}

//           {/* LEGEND */}

//           {options.show_legend && <Legend />}

//           {/* LINES */}

//           {metrics.map((m,i)=>{

//             const metric = m.field;

//             if(isArea){

//               return (
//                 <Area
//                   key={metric}
//                   type={smoothType}
//                   dataKey={metric}
//                   stroke={colors[i % colors.length]}
//                   fill={colors[i % colors.length]}
//                   strokeWidth={lineWidth}
//                   isAnimationActive
//                   animationDuration={animationDuration}
//                   dot={showMarkers ? { r: pointSize } : false}
//                 />
//               )
//             }

//             return (
//               <Line
//                 key={metric}
//                 type={smoothType}
//                 dataKey={metric}
//                 stroke={colors[i % colors.length]}
//                 strokeWidth={lineWidth}
//                 isAnimationActive
//                 animationDuration={animationDuration}
//                 dot={showMarkers ? { r: pointSize } : false}
//               >

//                 {options.show_labels && (
//                   <LabelList
//                     dataKey={metric}
//                     position="top"
//                   />
//                 )}

//               </Line>
//             )

//           })}

//         </LineChart>

//       </ResponsiveContainer>

//     </div>
//   );
// };



// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
//   ResponsiveContainer,
// } from "recharts";

// import { getDimensionKeys, getMetricKeys } from "./render-utils";
// import { ChartRenderProp } from "@/models/dataset.models";

// export const LineRenderer = ({ chart, data }: ChartRenderProp) => {
//   const dimensions = getDimensionKeys(chart);
//   const metrics = getMetricKeys(chart);

//   if (!dimensions?.length || !metrics?.length || !data?.rows?.length) {
//     return (
//       <div className="text-gray-400 p-4">
//         No configuration or data
//       </div>
//     );
//   }

//   // 🔥 Line chart = 1 dimension principale
//   const dimension = dimensions[0];

//   const options = chart.options?.line ?? {};

//   const colors = options.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4"];

//   const width = options.width ?? "100%";
//   const height = options.height ?? 300;

//   const isCurved = (options as any).curved ?? true;

//   return (
//     <ResponsiveContainer width={width} height={height}>
//       <LineChart data={data.rows}>
//         {options.show_grid && (
//           <CartesianGrid strokeDasharray="3 3" />
//         )}

//         <XAxis dataKey={dimension.field} />
//         <YAxis />

//         {options.show_tooltip && <Tooltip />}
//         {options.show_legend && <Legend />}

//         {metrics.map(m=>m.field).map((metric, i) => (
//           <Line
//             key={metric}
//             type={isCurved ? "monotone" : "linear"}
//             dataKey={metric}
//             stroke={colors[i % colors.length]}
//             strokeWidth={2}
//             dot={false}
//           />
//         ))}
//       </LineChart>
//     </ResponsiveContainer>
//   );
// };