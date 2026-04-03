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
  Brush,
  ReferenceLine
} from "recharts";
import { CHART_COLS_SEPARATOR, ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const LineRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys: string[] = header.rows ?? [];
  const allColumns: string[] = header._all_columns_order ?? [];

  if (!dimensionKeys.length && !allColumns.length) {
    return <div className="text-gray-400 p-4">Aucune dimension ou métrique configurée.</div>;
  }
  const colDimsLabel = header.column_label_maps ?? {};

  const options = useMemo(() => ({
    ...(chart.options?.line ?? {}),
    ...(chart.options ?? {})
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4","#8bc34a","#ffc107"
  ];

  const width = options.width ?? "100%";
  const height = options.height ?? 400;
  const isArea = options.is_area ?? false;
  const isCurved = options.curved ?? true;
  const lineWidth = options.line_width ?? 2;
  const showMarkers = options.show_markers ?? true;
  const pointSize = options.point_size ?? 4;
  const animationDuration = options.animation_duration ?? 500;
  const smoothType = isCurved ? "monotone" : "linear";

  const margin = {
    top: options.margin_top ?? 20,
    bottom: options.margin_bottom ?? 20,
    left: options.margin_left ?? 20,
    right: options.margin_right ?? 20
  };

  const showSubtotal =
    options.show_subtotal ?? chart.structure?.pivot?.cols_subtotal ?? chart.structure?.pivot?.rows_subtotal ?? false;
  const showTotal =
    options.show_total ?? chart.structure?.pivot?.cols_total ?? chart.structure?.pivot?.rows_total ?? false;

  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const metricColumns = useMemo(() =>
    allColumns.filter((c) => {
      if (!showSubtotal && c.startsWith("SUBTOTALS")) return false;
      if (!showTotal && c.startsWith("TOTALS")) return false;
      return true;
    }), [allColumns, showSubtotal, showTotal]
  );

  const cleanRows = useMemo(() =>
    data.rows.filter((row: any) => {
      const lastDim = row[xKey];
      if (!showSubtotal && lastDim === "SUBTOTALS") return false;
      if (!showTotal && lastDim === "TOTALS") return false;
      return true;
    }), [data.rows, showSubtotal, showTotal, xKey]
  );

  const chartData = useMemo(() => cleanRows.map((row: any) => {
    const r: Record<string, string | number> = {};
    r[xKey] = dimensionKeys
      .map(d => ((options.renames ?? {})[d] ?? {})[row[d]] ?? row[d])
      .filter(Boolean)
      .join(" / ");
    metricColumns.forEach(col => r[col] = Number.isFinite(Number(row[col])) ? Number(row[col]) : 0);
    return r;
  }), [cleanRows, metricColumns, dimensionKeys, options.renames, xKey]);

  const formatLabel = (mc: string) => {
    const sep = CHART_COLS_SEPARATOR;
    const cols = mc.split(sep);
    const labels = cols.map((c,j) => ((options.renames ?? {})[colDimsLabel[j]] ?? {})[c] ?? c);
    const col = labels.join(sep);
    if (col.startsWith("SUBTOTALS")) return col.replace("SUBTOTALS" + sep, "").replaceAll(sep," ") + " subtotal";
    if (col.startsWith("TOTALS")) return "Total";
    return col.replaceAll(sep," ");
  };

  const tooltipFormatter = (value:any,name:any) => {
    const label = formatLabel(name);
    if(options.y_axis_format==="number") return [Number(value).toLocaleString(), label];
    if(options.y_axis_format==="percent") return [(Number(value)*100).toFixed(2)+"%", label];
    return [value,label];
  };

  return (
    <div style={{width,height}}>
      {options.title && <div className="text-lg font-semibold mb-1 text-center">{options.title}</div>}
      {options.subtitle && <div className="text-gray-500 text-sm mb-3 text-center">{options.subtitle}</div>}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={margin}>

          {options.show_grid && (
            <CartesianGrid
              stroke={options.grid_stroke ?? "#e0e0e0"}
              strokeDasharray={options.grid_dasharray ?? "3 3"}
              vertical={options.grid_vertical ?? true}
              horizontal={options.grid_horizontal ?? true}
            />
          )}

          <XAxis
            type="category"
            dataKey={xKey}
            interval={0}
            angle={options.rotate_x_labels ?? 0}
            height={options.x_label_height ?? 60}
          />

          <YAxis
            yAxisId="left"
            tickFormatter={v => options.y_axis_format==="percent" ? `${(v*100).toFixed(2)}%` : v}
          />

          {options.show_right_y_axis && <YAxis yAxisId="right" orientation="right"/>}

          {options.show_tooltip !== false && <Tooltip formatter={tooltipFormatter} />}

          {options.show_legend !== false && <Legend formatter={formatLabel}/>}

          {options.show_brush && <Brush dataKey={xKey} height={30} stroke="#8884d8" />}

          {metricColumns.map((col,i)=> {
            const color = colors[i%colors.length];
            const dotConfig = showMarkers ? {r:pointSize, strokeWidth:1, stroke:'#fff'} : false;

            if(isArea){
              return <Area
                key={col}
                type={smoothType}
                dataKey={col}
                stroke={color}
                fill={options.gradient_fill ?
                  `url(#gradient-${i})` : color}
                fillOpacity={options.fill_opacity ?? 0.25}
                strokeWidth={lineWidth}
                animationDuration={animationDuration}
                dot={dotConfig}
              />
            }

            return <Line
              key={col}
              type={smoothType}
              dataKey={col}
              stroke={color}
              strokeWidth={lineWidth}
              animationDuration={animationDuration}
              dot={dotConfig}
              activeDot={{ r: pointSize + 2 }}
            >
              {options.show_labels && <LabelList dataKey={col} position={options.label_position ?? "top"} />}
            </Line>
          })}

          {options.reference_lines?.map((ref:any,idx:number)=>
            <ReferenceLine
              key={idx}
              x={ref.x}
              y={ref.y}
              label={ref.label}
              stroke={ref.stroke ?? "#ff0000"}
              strokeDasharray={ref.dash ?? "3 3"}
            />
          )}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};