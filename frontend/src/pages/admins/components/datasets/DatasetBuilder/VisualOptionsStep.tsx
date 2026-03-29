import { useMemo, useState } from "react";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import {
  DatasetChart,
  ChartOptions,
  ChartFormProps,
  BarChartOptions,
  GaugeChartOptions,
  HeatmapChartOptions,
  KpiChartOptions,
  LineChartOptions,
  PieChartOptions,
  RadarChartOptions,
  TableChartOptions,
  SqlChartTypeList,
  suggestChartType,
  getOptionKey,
  AreaChartOptions,
} from "@/models/dataset.models";
import { Button } from "@/components/ui/Button/Button";
import { RenamesOptionsModal } from "../DatasetCharts/components/chart-utils/RenamesOptionsModal";

// ChartOptions


export const VisualOptionsStep = ({ chart, queries, onChange }: ChartFormProps) => {
  const [isInModalOpen, setIsInModalOpen] = useState(false);
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [chartType, setChartType] = useState<string>("table");

  const optionKey = getOptionKey(chart.type);

  const options = (): ChartOptions => chart.options ?? {};

  function visualOptions<T>() {
    return (chart.options?.[optionKey] ?? {}) as T;
  }

  const query = useMemo(() => {
    return queries?.find((q) => q.id === chart.query_id);
  }, [queries, chart.query_id]);

  const fields = useMemo(() => {
    return query?.fields ?? [];
  }, [query]);

  const updateOption = (key: keyof ChartOptions, value: any) => {
    const updatedOptions = { ...chart.options, [key]: value };
    onChange({ ...chart, options: updatedOptions });
  };

  function updateSpecific<T>(key: keyof T, value: any) {
    const updatedOptions = { ...options(), [optionKey]: { ...visualOptions<T>(), [key]: value } };
    onChange({ ...chart, options: updatedOptions });
  };

  const updateChartValue = (key: keyof DatasetChart, val: any) => {
    let updated: DatasetChart = { ...chart, [key]: val };
    // si tu veux suggérer le type après chaque changement de structure
    if (key === "structure") {
      if (!("structure" in updated)) {
        updated = { ...updated as any, structure: { rows_dimensions: [], cols_dimensions: [], metrics: [], filters: [] } };
      }
      const dimensions = [...updated.structure.rows_dimensions, ...updated.structure.cols_dimensions].map(d => d.field_id);
      const metrics = updated.structure.metrics.map(m => m.field_id);
      updated.type = suggestChartType(dimensions, metrics);
    }
    onChange(updated);
  };

  // useEffect(() => {
  //     const suggestion = suggestChartType(chart?.structure?.dimensions ?? [], chart?.structure?.metrics ?? []);
  //     if (!expertMode) setChartType(suggestion);
  // }, [chart?.structure?.dimensions, chart?.structure?.metrics]);

  return (
    <>
      <>
        <Button size="sm" variant="outline" onClick={() => setIsInModalOpen(true)} >
          Edit values
        </Button>

        <RenamesOptionsModal
          isOpen={isInModalOpen}
          onClose={() => setIsInModalOpen(false)}
          values={options()?.renames || {}}
          onChange={(newValues: Record<string, Record<string, string>>) => updateOption("renames", newValues)}
        />
      </>

      {/* BASE OPTIONS */}
      <FormSelect
        label="Chart Type"
        value={chart.type}
        options={SqlChartTypeList.map(c => ({ value: c, label: c }))}
        onChange={v => updateChartValue("type", v)}
        required
      />

      <FormInput label="Title" value={options().title ?? ""} onChange={e => updateOption("title", e.target.value)} />
      <FormInput label="Subtitle" value={options().subtitle ?? ""} onChange={e => updateOption("subtitle", e.target.value)} />
      <FormInput label="Width" value={options().width ?? 600} onChange={e => updateOption("width", e.target.value)} />
      <FormInput label="Height" value={options().height ?? 400} onChange={e => updateOption("height", e.target.value)} />

      <FormSwitch label="Show Legend" checked={options().show_legend ?? true} onChange={e => updateOption("show_legend", e.target.checked)} />
      <FormSwitch label="Show Tooltip" checked={options().show_tooltip ?? true} onChange={e => updateOption("show_tooltip", e.target.checked)} />
      <FormSwitch label="Show Grid" checked={options().show_grid ?? true} onChange={e => updateOption("show_grid", e.target.checked)} />
      <FormSwitch label="Show Labels" checked={options().show_labels ?? false} onChange={e => updateOption("show_labels", e.target.checked)} />

      {/* AXES */}
      <FormInput label="X Axis Label" value={options().x_axis_label ?? ""} onChange={e => updateOption("x_axis_label", e.target.value)} />
      <FormInput label="Y Axis Label" value={options().y_axis_label ?? ""} onChange={e => updateOption("y_axis_label", e.target.value)} />
      <FormInput label="X Axis Format" value={options().x_axis_format ?? ""} onChange={e => updateOption("x_axis_format", e.target.value)} />
      <FormInput label="Y Axis Format" value={options().y_axis_format ?? ""} onChange={e => updateOption("y_axis_format", e.target.value)} />

      {/* FONT / STYLE */}
      <FormInput label="Font Family" value={options().font_family ?? "Arial"} onChange={e => updateOption("font_family", e.target.value)} />
      <FormInput label="Font Size" value={options().font_size ?? 12} onChange={e => updateOption("font_size", Number(e.target.value))} />
      <FormInput label="Font Color" value={options().font_color ?? "#000000"} onChange={e => updateOption("font_color", e.target.value)} />

      {/* MARGINS */}
      <FormInput label="Margin Top" value={options().margin_top ?? 10} onChange={e => updateOption("margin_top", Number(e.target.value))} />
      <FormInput label="Margin Bottom" value={options().margin_bottom ?? 10} onChange={e => updateOption("margin_bottom", Number(e.target.value))} />
      <FormInput label="Margin Left" value={options().margin_left ?? 10} onChange={e => updateOption("margin_left", Number(e.target.value))} />
      <FormInput label="Margin Right" value={options().margin_right ?? 10} onChange={e => updateOption("margin_right", Number(e.target.value))} />

      {/* ANIMATION */}
      <FormInput label="Animation Duration (ms)" value={options().animation_duration ?? 500} onChange={e => updateOption("animation_duration", Number(e.target.value))} />
      <FormSelect
        label="Animation Easing"
        value={options().animation_easing ?? "ease"}
        options={[
          { value: "linear", label: "Linear" },
          { value: "ease", label: "Ease" },
          { value: "ease-in", label: "Ease In" },
          { value: "ease-out", label: "Ease Out" },
          { value: "ease-in-out", label: "Ease In Out" },
        ]}
        onChange={v => updateOption("animation_easing", v)}
      />
      <FormSwitch label="Responsive" checked={options().responsive ?? true} onChange={e => updateOption("responsive", e.target.checked)} />


      {/* BAR CHART */}
      {(chart.type === "bar" || chart.type === "stacked-bar") && (
        <>
          <FormSwitch
            label="Stacked"
            checked={visualOptions<BarChartOptions>().stacked ?? false}
            onChange={e => updateSpecific<BarChartOptions>("stacked", e.target.checked)}
          />

          <FormSwitch
            label="Horizontal"
            checked={visualOptions<BarChartOptions>().horizontal ?? false}
            onChange={e => updateSpecific<BarChartOptions>("horizontal", e.target.checked)}
          />

          <FormInput
            label="Bar Width"
            value={visualOptions<BarChartOptions>().bar_width ?? 20}
            onChange={e => updateSpecific<BarChartOptions>("bar_width", Number(e.target.value))}
          />
        </>
      )}

      {/* LINE / AREA */}
      {(chart.type === "line" || chart.type === "area" || chart.type === "stacked-area") && (
        <>
          <FormSwitch
            label="Curved Line"
            checked={visualOptions<LineChartOptions>().curved ?? false}
            onChange={e => updateSpecific<LineChartOptions>("curved", e.target.checked)}
          />
          <FormSwitch
            label="Is Area"
            checked={visualOptions<LineChartOptions>().is_area ?? false}
            onChange={e => updateSpecific<LineChartOptions>("is_area", e.target.checked)}
          />
          <FormSwitch
            label="Horizontal"
            checked={visualOptions<BarChartOptions>().horizontal ?? false}
            onChange={e => updateSpecific<BarChartOptions>("horizontal", e.target.checked)}
          />

          <FormSwitch
            label="Show Markers"
            checked={visualOptions<LineChartOptions>().show_markers ?? true}
            onChange={e => updateSpecific<LineChartOptions>("show_markers", e.target.checked)}
          />

          <FormInput
            label="Line Width"
            value={visualOptions<LineChartOptions>().line_width ?? 2}
            onChange={e => updateSpecific<LineChartOptions>("line_width", Number(e.target.value))}
          />
        </>
      )}

      {/* LINE / AREA */}
      {(chart.type === "area") && (
        <>
          <FormInput
            label="grid_stroke"
            value={visualOptions<AreaChartOptions>().grid_stroke ?? 20}
            onChange={e => updateSpecific<AreaChartOptions>("grid_stroke", Number(e.target.value))}
          />
          <FormInput
            label="grid_dasharray"
            value={visualOptions<AreaChartOptions>().grid_dasharray ?? 20}
            onChange={e => updateSpecific<AreaChartOptions>("grid_dasharray", Number(e.target.value))}
          />

          <FormSwitch
            label="grid_vertical"
            checked={visualOptions<AreaChartOptions>().grid_vertical ?? false}
            onChange={e => updateSpecific<AreaChartOptions>("grid_vertical", e.target.checked)}
          />
          <FormSwitch
            label="grid_horizontal"
            checked={visualOptions<AreaChartOptions>().grid_horizontal ?? false}
            onChange={e => updateSpecific<AreaChartOptions>("grid_horizontal", e.target.checked)}
          />
          <FormSwitch
            label="show_brush"
            checked={visualOptions<AreaChartOptions>().show_brush ?? false}
            onChange={e => updateSpecific<AreaChartOptions>("show_brush", e.target.checked)}
          />

          {/* <FormSelect
            label="reference_lines"
            value={visualOptions<AreaChartOptions>().reference_lines ?? []}
            options={[{ value: "", label: "" }]}
            onChange={v => updateSpecific<AreaChartOptions>("reference_lines", v)}
          /> */}

          <FormInput
            label="Bar Width"
            value={visualOptions<AreaChartOptions>().gradient_fill}
            onChange={e => updateSpecific<AreaChartOptions>("gradient_fill", Number(e.target.value))}
          />
          <FormInput
            label="Bar Width"
            type="number"
            value={visualOptions<AreaChartOptions>().fill_opacity}
            onChange={e => updateSpecific<AreaChartOptions>("fill_opacity", Number(e.target.value))}
          />

          <FormSelect
            label="label_position"
            value={visualOptions<AreaChartOptions>().label_position ?? []}
            options={[
              { value: "top", label: "Top" }, 
              { value: "bottom", label: "Bottom" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
              { value: "inside", label: "Inside" },
            ]}
            onChange={v => updateSpecific<AreaChartOptions>("label_position", v)}
          />

        </>
      )}

      {/* PIE / DONUT */}
      {(chart.type === "pie" || chart.type === "donut") && (
        <>
          <FormSwitch
            label="Show Percentage"
            checked={visualOptions<PieChartOptions>().show_percentage ?? true}
            onChange={e => updateSpecific<PieChartOptions>("show_percentage", e.target.checked)}
          />

          {chart.type === "donut" && (
            <FormInput
              label="Inner Radius"
              value={visualOptions<PieChartOptions>().inner_radius ?? 50}
              onChange={e => updateSpecific<PieChartOptions>("inner_radius", Number(e.target.value))}
            />
          )}
        </>
      )}

      {/* KPI */}
      {chart.type === "kpi" && (
        <>
          <FormInput
            label="Icon"
            value={visualOptions<KpiChartOptions>().icon ?? ""}
            onChange={e => updateSpecific<KpiChartOptions>("icon", e.target.value)}
          />

          <FormInput
            label="Decimal Precision"
            value={visualOptions<KpiChartOptions>().decimal_precision ?? 2}
            onChange={e => updateSpecific<KpiChartOptions>("decimal_precision", Number(e.target.value))}
          />

          <FormSwitch
            label="Show Trend Indicator"
            checked={visualOptions<KpiChartOptions>().trend_indicator ?? false}
            onChange={e => updateSpecific<KpiChartOptions>("trend_indicator", e.target.checked)}
          />
        </>
      )}

      {/* GAUGE */}
      {chart.type === "gauge" && (
        <>
          <FormInput
            label="Min Value"
            value={visualOptions<GaugeChartOptions>().min_value ?? 0}
            onChange={e => updateSpecific<GaugeChartOptions>("min_value", Number(e.target.value))}
          />

          <FormInput
            label="Max Value"
            value={visualOptions<GaugeChartOptions>().max_value ?? 100}
            onChange={e => updateSpecific<GaugeChartOptions>("max_value", Number(e.target.value))}
          />
        </>
      )}

      {/* HEATMAP */}
      {chart.type === "heatmap" && (
        <>
          <FormInput
            label="Cell Padding"
            value={visualOptions<HeatmapChartOptions>().cell_padding ?? 2}
            onChange={e => updateSpecific<HeatmapChartOptions>("cell_padding", Number(e.target.value))}
          />
        </>
      )}

      {/* RADAR */}
      {chart.type === "radar" && (
        <>
          <FormInput
            label="Max Value"
            value={visualOptions<RadarChartOptions>().max_value ?? 100}
            onChange={e => updateSpecific<RadarChartOptions>("max_value", Number(e.target.value))}
          />

          <FormSwitch
            label="Fill Area"
            checked={visualOptions<RadarChartOptions>().fill_area ?? true}
            onChange={e => updateSpecific<RadarChartOptions>("fill_area", e.target.checked)}
          />
        </>
      )}

      {/* TABLE SPECIFIC OPTIONS */}
      {chart.type === "table" && (
        <>
          <FormSwitch label="Pagination" checked={visualOptions<TableChartOptions>().pagination ?? true} onChange={e => updateSpecific<TableChartOptions>("pagination", e.target.checked)} />
          <FormInput label="Page Size" value={visualOptions<TableChartOptions>().page_size ?? 10} onChange={e => updateSpecific<TableChartOptions>("page_size", Number(e.target.value))} />
          <FormSwitch label="Sortable" checked={visualOptions<TableChartOptions>().sortable ?? true} onChange={e => updateSpecific<TableChartOptions>("sortable", e.target.checked)} />
          <FormSwitch label="Filterable" checked={visualOptions<TableChartOptions>().filterable ?? false} onChange={e => updateSpecific<TableChartOptions>("filterable", e.target.checked)} />
          <FormSwitch label="Searchable" checked={visualOptions<TableChartOptions>().searchable ?? true} onChange={e => updateSpecific<TableChartOptions>("searchable", e.target.checked)} />
          <FormSwitch label="Exportable" checked={visualOptions<TableChartOptions>().exportable ?? false} onChange={e => updateSpecific<TableChartOptions>("exportable", e.target.checked)} />
          <FormSwitch label="Row Highlight" checked={visualOptions<TableChartOptions>().row_highlight ?? true} onChange={e => updateSpecific<TableChartOptions>("row_highlight", e.target.checked)} />
          <FormSwitch label="Conditional Formatting" checked={visualOptions<TableChartOptions>().conditional_formatting ?? false} onChange={e => updateSpecific<TableChartOptions>("conditional_formatting", e.target.checked)} />
          {visualOptions<TableChartOptions>().columns?.length && (
            <FormInput label="Custom Columns JSON" value={JSON.stringify(visualOptions<TableChartOptions>().columns)} onChange={e => updateSpecific<TableChartOptions>("columns", JSON.parse(e.target.value))} />
          )}
        </>
      )}
    </>
  );
};


// import { FormInput } from "@/components/forms/FormInput/FormInput";
// import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
// import { ChartStructure, ChartOptions, DatasetChart } from "@/models/dataset.models";

// export interface ChartFormProps {
//   chart: DatasetChart;
//   onChange: (val: DatasetChart) => void;
//   onExecute?: (val: ExecuteChartResponse | undefined) => void;
//   tenants?: Tenant[];
//   datasets?: Dataset[];
//   queries?: DatasetQuery[];
// }

// export const VisualOptionsStep = ({ chart, onChange }: ChartFormProps) => {

//   const updateStructure = (key: keyof , val: any) => {
//     onChange({ ...chart, structure: { ...chart.structure, [key]: val } });
//   };

//   const updateOption = (key: keyof ChartOptions, val: any) => {
//     onChange({ ...chart, options: { ...chart.options, [key]: val } });
//   };

//   return (
//     <>
//       <FormInput
//         label="Title"
//         value={chart.options.title ?? ""}
//         onChange={e => updateOption("title", e.target.value)}
//       />
//       <FormInput
//         label="Subtitle"
//         value={chart.options.subtitle ?? ""}
//         onChange={e => updateOption("subtitle", e.target.value)}
//       />
//       <FormInput
//         label="Chart Width"
//         value={chart.options.width ?? 600}
//         onChange={e => updateOption("width", parseInt(e.target.value))}
//       />
//       <FormInput
//         label="Chart Height"
//         value={chart.options.height ?? 400}
//         onChange={e => updateOption("height", parseInt(e.target.value))}
//       />

//       <FormSwitch
//         label="Show Legend"
//         checked={chart.options.show_legend ?? true}
//         onChange={(e) => updateOption("show_legend", e.target.checked)}
//       />
//       <FormSwitch
//         label="Show Grid"
//         checked={chart.options.show_grid ?? true}
//         onChange={e => updateOption("show_grid", e.target.checked)}
//       />
//     </>
//   );
// };