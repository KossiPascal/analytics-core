import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import {
  DatasetChart,
  ChartVisualOptions,
  BaseChartOptions,
  SqlChartType,
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
  suggestChartType
} from "@/models/dataset.models";
import { useState } from "react";

export const getOptionKey = (type: SqlChartType): keyof ChartVisualOptions => {
  switch (type) {
    case "bar": return "bar";
    case "stacked-bar": return "stacked_bar";
    case "line": return "line";
    case "area": return "area";
    case "stacked-area": return "stacked_area";
    case "pie": return "pie";
    case "donut": return "donut";
    case "kpi": return "kpi";
    case "table": return "table";
    case "gauge": return "gauge";
    case "heatmap": return "heatmap";
    case "radar": return "radar";
    default:
      return "bar";
  }
};

type FullChartOptions = BarChartOptions | LineChartOptions | PieChartOptions | TableChartOptions | KpiChartOptions | GaugeChartOptions | HeatmapChartOptions | RadarChartOptions


export const VisualOptionsStep = ({ chart, onChange }: ChartFormProps) => {

  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [chartType, setChartType] = useState<string>("table");

  const optionKey = getOptionKey(chart.type);

  function options<T = FullChartOptions>() {
    return (chart.options?.[optionKey] ?? {}) as T;
  }

  const updateOption = (key: keyof BaseChartOptions, value: any) => {
    const updatedOptions = { ...chart.options, [optionKey]: { ...options(), [key]: value } };
    onChange({ ...chart, options: updatedOptions });
  };

  const updateSpecific = (key: string, value: any) => {
    const updatedOptions = { ...chart.options, [optionKey]: { ...options(), [key]: value } };
    onChange({ ...chart, options: updatedOptions });
  };

  const updateChartValue = (key: keyof DatasetChart, val: any) => {
    let updated: DatasetChart = { ...chart, [key]: val };
    // si tu veux suggérer le type après chaque changement de structure
    if (key === "structure") {
      if (!("structure" in updated)) {
        updated = { ...updated as any, structure: { rows_dimensions: [], cols_dimensions: [], metrics: [], filters: [] } };
      }
      const dimensions = [...updated.structure.rows_dimensions, ...updated.structure.cols_dimensions].map(d => d.field);
      const metrics = updated.structure.metrics.map(m => m.field);
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
            checked={options<BarChartOptions>().stacked ?? false}
            onChange={e => updateSpecific("stacked", e.target.checked)}
          />

          <FormSwitch
            label="Horizontal"
            checked={options<BarChartOptions>().horizontal ?? false}
            onChange={e => updateSpecific("horizontal", e.target.checked)}
          />

          <FormInput
            label="Bar Width"
            value={options<BarChartOptions>().bar_width ?? 20}
            onChange={e => updateSpecific("bar_width", Number(e.target.value))}
          />
        </>
      )}

      {/* LINE / AREA */}

      {(chart.type === "line" || chart.type === "area" || chart.type === "stacked-area") && (
        <>
          <FormSwitch
            label="Curved Line"
            checked={options<LineChartOptions>().curved ?? false}
            onChange={e => updateSpecific("curved", e.target.checked)}
          />

          <FormSwitch
            label="Show Markers"
            checked={options<LineChartOptions>().show_markers ?? true}
            onChange={e => updateSpecific("show_markers", e.target.checked)}
          />

          <FormInput
            label="Line Width"
            value={options<LineChartOptions>().line_width ?? 2}
            onChange={e => updateSpecific("line_width", Number(e.target.value))}
          />
        </>
      )}

      {/* PIE / DONUT */}

      {(chart.type === "pie" || chart.type === "donut") && (
        <>
          <FormSwitch
            label="Show Percentage"
            checked={options<PieChartOptions>().show_percentage ?? true}
            onChange={e => updateSpecific("show_percentage", e.target.checked)}
          />

          {chart.type === "donut" && (
            <FormInput
              label="Inner Radius"
              value={options<PieChartOptions>().inner_radius ?? 50}
              onChange={e => updateSpecific("inner_radius", Number(e.target.value))}
            />
          )}
        </>
      )}

      {/* KPI */}

      {chart.type === "kpi" && (
        <>
          <FormInput
            label="Icon"
            value={options<KpiChartOptions>().icon ?? ""}
            onChange={e => updateSpecific("icon", e.target.value)}
          />

          <FormInput
            label="Decimal Precision"
            value={options<KpiChartOptions>().decimal_precision ?? 2}
            onChange={e => updateSpecific("decimal_precision", Number(e.target.value))}
          />

          <FormSwitch
            label="Show Trend Indicator"
            checked={options<KpiChartOptions>().trend_indicator ?? false}
            onChange={e => updateSpecific("trend_indicator", e.target.checked)}
          />
        </>
      )}

      {/* GAUGE */}

      {chart.type === "gauge" && (
        <>
          <FormInput
            label="Min Value"
            value={options<GaugeChartOptions>().min_value ?? 0}
            onChange={e => updateSpecific("min_value", Number(e.target.value))}
          />

          <FormInput
            label="Max Value"
            value={options<GaugeChartOptions>().max_value ?? 100}
            onChange={e => updateSpecific("max_value", Number(e.target.value))}
          />
        </>
      )}

      {/* HEATMAP */}

      {chart.type === "heatmap" && (
        <>
          <FormInput
            label="Cell Padding"
            value={options<HeatmapChartOptions>().cell_padding ?? 2}
            onChange={e => updateSpecific("cell_padding", Number(e.target.value))}
          />
        </>
      )}

      {/* RADAR */}

      {chart.type === "radar" && (
        <>
          <FormInput
            label="Max Value"
            value={options<RadarChartOptions>().max_value ?? 100}
            onChange={e => updateSpecific("max_value", Number(e.target.value))}
          />

          <FormSwitch
            label="Fill Area"
            checked={options<RadarChartOptions>().fill_area ?? true}
            onChange={e => updateSpecific("fill_area", e.target.checked)}
          />
        </>
      )}

      {/* TABLE SPECIFIC OPTIONS */}
      {chart.type === "table" && (
        <>
          <FormSwitch label="Pagination" checked={options<TableChartOptions>().pagination ?? true} onChange={e => updateSpecific("pagination", e.target.checked)} />
          <FormInput label="Page Size" value={options<TableChartOptions>().page_size ?? 10} onChange={e => updateSpecific("page_size", Number(e.target.value))} />
          <FormSwitch label="Sortable" checked={options<TableChartOptions>().sortable ?? true} onChange={e => updateSpecific("sortable", e.target.checked)} />
          <FormSwitch label="Filterable" checked={options<TableChartOptions>().filterable ?? false} onChange={e => updateSpecific("filterable", e.target.checked)} />
          <FormSwitch label="Searchable" checked={options<TableChartOptions>().searchable ?? true} onChange={e => updateSpecific("searchable", e.target.checked)} />
          <FormSwitch label="Exportable" checked={options<TableChartOptions>().exportable ?? false} onChange={e => updateSpecific("exportable", e.target.checked)} />
          <FormSwitch label="Row Highlight" checked={options<TableChartOptions>().row_highlight ?? true} onChange={e => updateSpecific("row_highlight", e.target.checked)} />
          <FormSwitch label="Conditional Formatting" checked={options<TableChartOptions>().conditional_formatting ?? false} onChange={e => updateSpecific("conditional_formatting", e.target.checked)} />
          {options<TableChartOptions>().columns?.length && (
            <FormInput label="Custom Columns JSON" value={JSON.stringify(options<TableChartOptions>().columns)} onChange={e => updateSpecific("columns", JSON.parse(e.target.value))} />
          )}
        </>
      )}
    </>
  );
};


// import { FormInput } from "@/components/forms/FormInput/FormInput";
// import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
// import { ChartStructure, ChartVisualOptions, DatasetChart } from "@/models/dataset.models";

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