import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const HeatmapRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const dimensionKeys = header.rows ?? [];
  const metrics = header._all_columns_order ?? [];

  const options = useMemo(() => ({
    ...(chart.options?.heatmap ?? {}),
    ...(chart.options ?? {}),
    cell_width: chart.options?.heatmap?.cell_width ?? 40,
    cell_height: chart.options?.heatmap?.cell_height ?? 40,
    color_min: chart.options?.heatmap?.color_min ?? "#e0f7fa",
    color_max: chart.options?.heatmap?.color_max ?? "#0288d1",
    show_values: chart.options?.heatmap?.show_values ?? false,
    min_value: chart.options?.heatmap?.min_value ?? undefined,
    max_value: chart.options?.heatmap?.max_value ?? undefined
  }), [chart.options]);

  const min = options.min_value ?? Math.min(...data.rows.flatMap(r => metrics.map(m => Number(r[m]) || 0)));
  const max = options.max_value ?? Math.max(...data.rows.flatMap(r => metrics.map(m => Number(r[m]) || 0)));

  const interpolateColor = (val: number) => {
    const ratio = max === min ? 0 : (val - min) / (max - min);
    const hex = (color: string) => color.replace("#","").match(/.{2}/g)?.map(h => parseInt(h,16)) ?? [0,0,0];
    const [r1,g1,b1] = hex(options.color_min);
    const [r2,g2,b2] = hex(options.color_max);
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div style={{ display: "grid", gap: 4 }}>
      {data.rows.map((row: any, i: number) => (
        <div key={i} style={{ display: "flex", gap: 4 }}>
          {metrics.map((m: any) => {
            const val = Number(row[m]) || 0;
            const color = interpolateColor(val);

            return (
              <div
                key={m}
                title={`${m}: ${val}`}
                style={{
                  width: options.cell_width,
                  height: options.cell_height,
                  background: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontSize: options.show_values ? 12 : 0,
                  transition: "background 0.3s"
                }}
              >
                {options.show_values ? val : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};