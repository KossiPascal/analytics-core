import { ChartRenderProp } from "@/models/dataset.models";
import { PieRenderer } from "./PieRenderer";
import { useMemo } from "react";

export const DonutRenderer = (props: ChartRenderProp) => {
  const chart:any = useMemo(() => {
    const baseOptions = props.chart.options ?? {};
    const pieOpts = baseOptions.pie ?? {};

    return {
      ...props.chart,
      options: {
        ...baseOptions,
        pie: {
          inner_radius: pieOpts.inner_radius ?? 70,
          outer_radius: pieOpts.outer_radius ?? 100,
          start_angle: pieOpts.start_angle ?? 0,
          end_angle: pieOpts.end_angle ?? 360,
          animation_duration: pieOpts.animation_duration ?? 800,
          show_labels: pieOpts.show_labels ?? true,
          label_position: pieOpts.label_position ?? "outside",
          label_formatter: pieOpts.label_formatter ?? ((value:any, name:any, percent:any) => `${name}: ${percent.toFixed(1)}%`),
          colors: pieOpts.colors ?? [
            "#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4", "#8bc34a", "#ffc107"
          ],
          show_tooltip: pieOpts.show_tooltip ?? true,
          show_legend: pieOpts.show_legend ?? true,
          hover_offset: pieOpts.hover_offset ?? 8,
        },
      },
    };
  }, [props.chart]);

  return <PieRenderer {...props} chart={chart} />;
};