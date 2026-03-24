import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const GaugeRenderer = ({ chart, data }: ChartRenderProp) => {
  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;
  const metric = header._all_columns_order?.[0];

  const options = useMemo(() => ({
    ...(chart.options?.gauge ?? {}),
    ...(chart.options ?? {}),
    width: chart.options?.gauge?.width ?? 200,
    height: chart.options?.gauge?.height ?? 200,
    min: chart.options?.gauge?.min ?? 0,
    max: chart.options?.gauge?.max ?? 100,
    thresholds: chart.options?.gauge?.thresholds ?? [
      { value: 50, color: "#f44336" },
      { value: 75, color: "#ff9800" },
      { value: 100, color: "#4caf50" }
    ],
    show_value: chart.options?.gauge?.show_value ?? true,
    show_label: chart.options?.gauge?.show_label ?? true,
    label_formatter: chart.options?.gauge?.label_formatter ?? ((val:number) => metric),
    thickness: chart.options?.gauge?.thickness ?? 20,
    animation_duration: chart.options?.gauge?.animation_duration ?? 600
  }), [chart.options, metric]);

  const value = useMemo(() => {
    return data.rows.reduce((acc: number, row: any) => acc + (Number(row[metric]) || 0), 0);
  }, [data.rows, metric]);

  const clampedValue = Math.max(options.min, Math.min(options.max, value));
  const percentage = ((clampedValue - options.min) / (options.max - options.min)) * 100;

  const getColor = (perc: number) => {
    for (const t of options.thresholds) {
      if (perc <= t.value) return t.color;
    }
    return options.thresholds[options.thresholds.length - 1].color;
  };

  const color = getColor(percentage);

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      {options.show_label && (
        <div className="text-lg font-semibold mb-2">
          {options.label_formatter(clampedValue)}
        </div>
      )}

      <div
        style={{
          width: options.width,
          height: options.height,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${percentage}%, #eee ${percentage}%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "auto",
          fontSize: 28,
          fontWeight: 700,
          transition: `background ${options.animation_duration}ms ease`
        }}
      >
        {options.show_value && `${clampedValue.toFixed(0)}%`}
      </div>
    </div>
  );
};