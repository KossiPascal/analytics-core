import { useState } from "react";
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
import styles from "./VisualOptionsStep.module.css";
import { RenamesOptionsModal } from "../components/chart-utils/RenamesOptionsModal";

const TABS = [
  { key: "general",   label: "Général" },
  { key: "display",   label: "Affichage" },
  { key: "axes",      label: "Axes & Style" },
  { key: "animation", label: "Animation" },
  { key: "specific",  label: "Spécifique" },
] as const;

type TabKey = typeof TABS[number]["key"];

export const VisualOptionsStep = ({ chart, onChange }: ChartFormProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [isInModalOpen, setIsInModalOpen] = useState(false);

  const optionKey = getOptionKey(chart.type);

  const options = (): ChartOptions => chart.options ?? {};

  function visualOptions<T>() {
    return (chart.options?.[optionKey] ?? {}) as T;
  }

  const updateOption = (key: keyof ChartOptions, value: any) => {
    const updatedOptions = { ...chart.options, [key]: value };
    onChange({ ...chart, options: updatedOptions });
  };

  function updateSpecific<T>(key: keyof T, value: any) {
    const updatedOptions = { ...options(), [optionKey]: { ...visualOptions<T>(), [key]: value } };
    onChange({ ...chart, options: updatedOptions });
  }

  const updateChartValue = (key: keyof DatasetChart, val: any) => {
    let updated: DatasetChart = { ...chart, [key]: val };
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

  const currentTabIndex = TABS.findIndex(t => t.key === activeTab);
  const canPrev = currentTabIndex > 0;
  const canNext = currentTabIndex < TABS.length - 1;

  const hasSpecificOptions = ["bar", "stacked-bar", "line", "area", "stacked-area", "pie", "donut", "kpi", "gauge", "heatmap", "radar", "table"].includes(chart.type);

  return (
    <div className={styles.container}>
      {/* TAB HEADERS */}
      <div className={styles.tabList}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
            {tab.key === "specific" && !hasSpecificOptions && (
              <span className={styles.tabDisabledDot} title="Aucune option pour ce type" />
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className={styles.tabContent}>

        {/* ── GÉNÉRAL ── */}
        {activeTab === "general" && (
          <div className={styles.fields}>
            <FormSelect
              label="Type de graphique"
              value={chart.type}
              options={SqlChartTypeList.map(c => ({ value: c, label: c }))}
              onChange={v => updateChartValue("type", v)}
              required
            />
            <FormInput label="Titre" value={options().title ?? ""} onChange={e => updateOption("title", e.target.value)} />
            <FormInput label="Sous-titre" value={options().subtitle ?? ""} onChange={e => updateOption("subtitle", e.target.value)} />
            <div className={styles.row}>
              <FormInput label="Largeur" value={options().width ?? 600} onChange={e => updateOption("width", e.target.value)} />
              <FormInput label="Hauteur" value={options().height ?? 400} onChange={e => updateOption("height", e.target.value)} />
            </div>
            <div className={styles.action}>
              <Button size="sm" variant="outline" onClick={() => setIsInModalOpen(true)}>
                Éditer les renommages
              </Button>
            </div>
            <RenamesOptionsModal
              isOpen={isInModalOpen}
              onClose={() => setIsInModalOpen(false)}
              values={options()?.renames || {}}
              onChange={(newValues: Record<string, Record<string, string>>) => updateOption("renames", newValues)}
            />
          </div>
        )}

        {/* ── AFFICHAGE ── */}
        {activeTab === "display" && (
          <div className={styles.fields}>
            <FormSwitch label="Afficher la légende" checked={options().show_legend ?? true} onChange={e => updateOption("show_legend", e.target.checked)} />
            <FormSwitch label="Afficher l'infobulle" checked={options().show_tooltip ?? true} onChange={e => updateOption("show_tooltip", e.target.checked)} />
            <FormSwitch label="Afficher la grille" checked={options().show_grid ?? true} onChange={e => updateOption("show_grid", e.target.checked)} />
            <FormSwitch label="Afficher les labels" checked={options().show_labels ?? false} onChange={e => updateOption("show_labels", e.target.checked)} />
            <FormSwitch label="Responsive" checked={options().responsive ?? true} onChange={e => updateOption("responsive", e.target.checked)} />
          </div>
        )}

        {/* ── AXES & STYLE ── */}
        {activeTab === "axes" && (
          <div className={styles.fields}>
            <p className={styles.sectionTitle}>Axes</p>
            <div className={styles.row}>
              <FormInput label="Label axe X" value={options().x_axis_label ?? ""} onChange={e => updateOption("x_axis_label", e.target.value)} />
              <FormInput label="Label axe Y" value={options().y_axis_label ?? ""} onChange={e => updateOption("y_axis_label", e.target.value)} />
            </div>
            <div className={styles.row}>
              <FormInput label="Format axe X" value={options().x_axis_format ?? ""} onChange={e => updateOption("x_axis_format", e.target.value)} />
              <FormInput label="Format axe Y" value={options().y_axis_format ?? ""} onChange={e => updateOption("y_axis_format", e.target.value)} />
            </div>

            <p className={styles.sectionTitle}>Police</p>
            <div className={styles.row}>
              <FormInput label="Famille" value={options().font_family ?? "Arial"} onChange={e => updateOption("font_family", e.target.value)} />
              <FormInput label="Taille" value={options().font_size ?? 12} onChange={e => updateOption("font_size", Number(e.target.value))} />
              <FormInput label="Couleur" value={options().font_color ?? "#000000"} onChange={e => updateOption("font_color", e.target.value)} />
            </div>

            <p className={styles.sectionTitle}>Marges</p>
            <div className={styles.row}>
              <FormInput label="Haut" value={options().margin_top ?? 10} onChange={e => updateOption("margin_top", Number(e.target.value))} />
              <FormInput label="Bas" value={options().margin_bottom ?? 10} onChange={e => updateOption("margin_bottom", Number(e.target.value))} />
              <FormInput label="Gauche" value={options().margin_left ?? 10} onChange={e => updateOption("margin_left", Number(e.target.value))} />
              <FormInput label="Droite" value={options().margin_right ?? 10} onChange={e => updateOption("margin_right", Number(e.target.value))} />
            </div>
          </div>
        )}

        {/* ── ANIMATION ── */}
        {activeTab === "animation" && (
          <div className={styles.fields}>
            <FormInput label="Durée (ms)" value={options().animation_duration ?? 500} onChange={e => updateOption("animation_duration", Number(e.target.value))} />
            <FormSelect
              label="Easing"
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
          </div>
        )}

        {/* ── SPÉCIFIQUE ── */}
        {activeTab === "specific" && (
          <div className={styles.fields}>
            {!hasSpecificOptions && (
              <p className={styles.emptyMsg}>Aucune option spécifique pour ce type de graphique.</p>
            )}

            {(chart.type === "bar" || chart.type === "stacked-bar") && (
              <>
                <FormSwitch label="Empilé" checked={visualOptions<BarChartOptions>().stacked ?? false} onChange={e => updateSpecific<BarChartOptions>("stacked", e.target.checked)} />
                <FormSwitch label="Horizontal" checked={visualOptions<BarChartOptions>().horizontal ?? false} onChange={e => updateSpecific<BarChartOptions>("horizontal", e.target.checked)} />
                <FormInput label="Largeur des barres" value={visualOptions<BarChartOptions>().bar_width ?? 20} onChange={e => updateSpecific<BarChartOptions>("bar_width", Number(e.target.value))} />
              </>
            )}

            {(chart.type === "line" || chart.type === "area" || chart.type === "stacked-area") && (
              <>
                <FormSwitch label="Courbe" checked={visualOptions<LineChartOptions>().curved ?? false} onChange={e => updateSpecific<LineChartOptions>("curved", e.target.checked)} />
                <FormSwitch label="Zone (area)" checked={visualOptions<LineChartOptions>().is_area ?? false} onChange={e => updateSpecific<LineChartOptions>("is_area", e.target.checked)} />
                <FormSwitch label="Horizontal" checked={visualOptions<BarChartOptions>().horizontal ?? false} onChange={e => updateSpecific<BarChartOptions>("horizontal", e.target.checked)} />
                <FormSwitch label="Afficher les marqueurs" checked={visualOptions<LineChartOptions>().show_markers ?? true} onChange={e => updateSpecific<LineChartOptions>("show_markers", e.target.checked)} />
                <FormInput label="Épaisseur du trait" value={visualOptions<LineChartOptions>().line_width ?? 2} onChange={e => updateSpecific<LineChartOptions>("line_width", Number(e.target.value))} />
              </>
            )}

            {chart.type === "area" && (
              <>
                <FormInput label="Trait grille (stroke)" value={visualOptions<AreaChartOptions>().grid_stroke ?? 20} onChange={e => updateSpecific<AreaChartOptions>("grid_stroke", Number(e.target.value))} />
                <FormInput label="Pointillé grille (dasharray)" value={visualOptions<AreaChartOptions>().grid_dasharray ?? 20} onChange={e => updateSpecific<AreaChartOptions>("grid_dasharray", Number(e.target.value))} />
                <FormSwitch label="Grille verticale" checked={visualOptions<AreaChartOptions>().grid_vertical ?? false} onChange={e => updateSpecific<AreaChartOptions>("grid_vertical", e.target.checked)} />
                <FormSwitch label="Grille horizontale" checked={visualOptions<AreaChartOptions>().grid_horizontal ?? false} onChange={e => updateSpecific<AreaChartOptions>("grid_horizontal", e.target.checked)} />
                <FormSwitch label="Afficher le brush" checked={visualOptions<AreaChartOptions>().show_brush ?? false} onChange={e => updateSpecific<AreaChartOptions>("show_brush", e.target.checked)} />
                <FormInput label="Opacité du remplissage" type="number" value={visualOptions<AreaChartOptions>().fill_opacity} onChange={e => updateSpecific<AreaChartOptions>("fill_opacity", Number(e.target.value))} />
                <FormSelect
                  label="Position des labels"
                  value={visualOptions<AreaChartOptions>().label_position ?? "top"}
                  options={[
                    { value: "top", label: "Haut" },
                    { value: "bottom", label: "Bas" },
                    { value: "left", label: "Gauche" },
                    { value: "right", label: "Droite" },
                    { value: "inside", label: "Intérieur" },
                  ]}
                  onChange={v => updateSpecific<AreaChartOptions>("label_position", v)}
                />
              </>
            )}

            {(chart.type === "pie" || chart.type === "donut") && (
              <>
                <FormSwitch label="Afficher le pourcentage" checked={visualOptions<PieChartOptions>().show_percentage ?? true} onChange={e => updateSpecific<PieChartOptions>("show_percentage", e.target.checked)} />
                {chart.type === "donut" && (
                  <FormInput label="Rayon intérieur" value={visualOptions<PieChartOptions>().inner_radius ?? 50} onChange={e => updateSpecific<PieChartOptions>("inner_radius", Number(e.target.value))} />
                )}
              </>
            )}

            {chart.type === "kpi" && (
              <>
                <FormInput label="Icône" value={visualOptions<KpiChartOptions>().icon ?? ""} onChange={e => updateSpecific<KpiChartOptions>("icon", e.target.value)} />
                <FormInput label="Précision décimale" value={visualOptions<KpiChartOptions>().decimal_precision ?? 2} onChange={e => updateSpecific<KpiChartOptions>("decimal_precision", Number(e.target.value))} />
                <FormSwitch label="Indicateur de tendance" checked={visualOptions<KpiChartOptions>().trend_indicator ?? false} onChange={e => updateSpecific<KpiChartOptions>("trend_indicator", e.target.checked)} />
              </>
            )}

            {chart.type === "gauge" && (
              <>
                <FormInput label="Valeur min" value={visualOptions<GaugeChartOptions>().min_value ?? 0} onChange={e => updateSpecific<GaugeChartOptions>("min_value", Number(e.target.value))} />
                <FormInput label="Valeur max" value={visualOptions<GaugeChartOptions>().max_value ?? 100} onChange={e => updateSpecific<GaugeChartOptions>("max_value", Number(e.target.value))} />
              </>
            )}

            {chart.type === "heatmap" && (
              <FormInput label="Espacement des cellules" value={visualOptions<HeatmapChartOptions>().cell_padding ?? 2} onChange={e => updateSpecific<HeatmapChartOptions>("cell_padding", Number(e.target.value))} />
            )}

            {chart.type === "radar" && (
              <>
                <FormInput label="Valeur max" value={visualOptions<RadarChartOptions>().max_value ?? 100} onChange={e => updateSpecific<RadarChartOptions>("max_value", Number(e.target.value))} />
                <FormSwitch label="Remplir la zone" checked={visualOptions<RadarChartOptions>().fill_area ?? true} onChange={e => updateSpecific<RadarChartOptions>("fill_area", e.target.checked)} />
              </>
            )}

            {chart.type === "table" && (
              <>
                <FormSwitch label="Pagination" checked={visualOptions<TableChartOptions>().pagination ?? true} onChange={e => updateSpecific<TableChartOptions>("pagination", e.target.checked)} />
                <FormInput label="Taille de page" value={visualOptions<TableChartOptions>().page_size ?? 10} onChange={e => updateSpecific<TableChartOptions>("page_size", Number(e.target.value))} />
                <FormSwitch label="Triable" checked={visualOptions<TableChartOptions>().sortable ?? true} onChange={e => updateSpecific<TableChartOptions>("sortable", e.target.checked)} />
                <FormSwitch label="Filtrable" checked={visualOptions<TableChartOptions>().filterable ?? false} onChange={e => updateSpecific<TableChartOptions>("filterable", e.target.checked)} />
                <FormSwitch label="Recherche" checked={visualOptions<TableChartOptions>().searchable ?? true} onChange={e => updateSpecific<TableChartOptions>("searchable", e.target.checked)} />
                <FormSwitch label="Export" checked={visualOptions<TableChartOptions>().exportable ?? false} onChange={e => updateSpecific<TableChartOptions>("exportable", e.target.checked)} />
                <FormSwitch label="Surbrillance des lignes" checked={visualOptions<TableChartOptions>().row_highlight ?? true} onChange={e => updateSpecific<TableChartOptions>("row_highlight", e.target.checked)} />
                <FormSwitch label="Formatage conditionnel" checked={visualOptions<TableChartOptions>().conditional_formatting ?? false} onChange={e => updateSpecific<TableChartOptions>("conditional_formatting", e.target.checked)} />
              </>
            )}
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <div className={styles.nav}>
        <Button
          size="sm"
          variant="outline"
          disabled={!canPrev}
          onClick={() => setActiveTab(TABS[currentTabIndex - 1].key)}
        >
          ← Précédent
        </Button>
        <span className={styles.navStep}>{currentTabIndex + 1} / {TABS.length}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={!canNext}
          onClick={() => setActiveTab(TABS[currentTabIndex + 1].key)}
        >
          Suivant →
        </Button>
      </div>
    </div>
  );
};
