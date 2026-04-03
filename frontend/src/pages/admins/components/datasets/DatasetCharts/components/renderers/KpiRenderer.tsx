import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const KpiRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const allColumns = header._all_columns_order ?? [];

  const options = useMemo(() => ({
    ...(chart.options?.kpi ?? {}),
    ...(chart.options ?? {}),
    value_format: chart.options?.kpi?.value_format ?? "number", // number | percent | currency
    show_trend: chart.options?.kpi?.show_trend ?? false,
    background_opacity: chart.options?.kpi?.background_opacity ?? 0.1,
    columns_per_row: chart.options?.kpi?.columns_per_row ?? 3
  }), [chart.options]);

  const colors = options.color_scheme ?? ["#4caf50","#2196f3","#ff9800","#9c27b0"];

  const totals = useMemo(() => {
    const res: Record<string, number> = {};
    allColumns.forEach(col => {
      res[col] = data.rows.reduce((a: number, r: any) => a + (Number(r[col]) || 0), 0);
    });
    return res;
  }, [data.rows, allColumns]);

  const formatValue = (val: number) => {
    if (options.value_format === "percent") return (val * 100).toFixed(2) + "%";
    if (options.value_format === "currency") return "$" + val.toLocaleString();
    return val.toLocaleString();
  };

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(${options.columns_per_row}, 1fr)`, gap: '1rem', padding: '1rem' }}
    >
      {allColumns.map((col, i) => {
        const baseColor = colors[i % colors.length];
        const opacityHex = Math.floor(options.background_opacity * 255).toString(16).padStart(2, '0');
        return (
        <div
          key={col}
          style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center', backgroundColor: `${baseColor}${opacityHex}` }}
        >
          <div className="text-gray-600 text-sm">{col}</div>
          <div className="text-3xl font-bold mt-2">{formatValue(totals[col])}</div>
          {options.show_trend && (
            <div className="text-green-500 mt-1 text-sm">
              ▲ {/* Ici on peut calculer la tendance réelle si besoin */}
            </div>
          )}
          {options.subtitle && (
            <div className="text-gray-400 text-xs mt-1">{options.subtitle}</div>
          )}
        </div>
        );
      })}
    </div>
  );
};