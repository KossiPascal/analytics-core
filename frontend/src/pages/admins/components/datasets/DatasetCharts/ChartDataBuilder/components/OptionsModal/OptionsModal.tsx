import { useEffect, useMemo, useState } from "react";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";
import {
  DatasetChart,
  ChartOptions,
  ChartFormProps,
  ChartPivot,
  BarChartOptions,
  GaugeChartOptions,
  HeatmapChartOptions,
  KpiChartOptions,
  LineChartOptions,
  PieChartOptions,
  RadarChartOptions,
  TableChartOptions,
  getOptionKey,
  AreaChartOptions,
} from "@/models/dataset.models";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { ChevronDown } from "lucide-react";
import styles from "./OptionsModal.module.css";

const TABS = [
  { key: "general",   label: "Général" },
  { key: "display",   label: "Affichage" },
  { key: "axes",      label: "Axes & Style" },
  { key: "animation", label: "Animation" },
  { key: "specific",  label: "Spécifique" },
] as const;

type TabKey = typeof TABS[number]["key"];

interface OptionsModalProps extends ChartFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsModal = ({ isOpen, onClose, chart, onChange, queries }: OptionsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [pivotOpen, setPivotOpen] = useState(true);
  // Local snapshot — discarded on Annuler, applied on Appliquer
  const [localChart, setLocalChart] = useState<DatasetChart>(chart);

  useEffect(() => {
    if (isOpen) setLocalChart(chart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const optionKey = getOptionKey(localChart.type);

  const query = useMemo(
    () => queries?.find((q) => q.id === (localChart.query_id ?? chart.query_id)),
    [queries, localChart.query_id, chart.query_id]
  );
  const fields = useMemo(() => query?.fields ?? [], [query]);
  const structure = useMemo(() => localChart.structure ?? {}, [localChart.structure]);

  const options = (): ChartOptions => localChart.options ?? {};

  function visualOptions<T>() {
    return (localChart.options?.[optionKey] ?? {}) as T;
  }

  const updateOption = (key: keyof ChartOptions, value: any) => {
    setLocalChart(prev => ({ ...prev, options: { ...prev.options, [key]: value } }));
  };

  const updateChartPivot = (key: keyof ChartPivot, val: any) => {
    setLocalChart((prev) => {
      const pivot = { ...(prev.structure?.pivot ?? {}), [key]: val };
      return { ...prev, structure: { ...(prev.structure ?? {}), pivot } };
    });
  };

  function updateSpecific<T>(key: keyof T, value: any) {
    setLocalChart(prev => {
      const prevOptions = prev.options ?? {};
      const prevSpecific = (prevOptions[getOptionKey(prev.type)] ?? {}) as T;
      return {
        ...prev,
        options: { ...prevOptions, [getOptionKey(prev.type)]: { ...prevSpecific, [key]: value } },
      };
    });
  }

  const hasSpecificOptions = ["bar", "stacked-bar", "line", "area", "stacked-area", "pie", "donut", "kpi", "gauge", "heatmap", "radar", "table"].includes(localChart.type);

  const handleApply = () => {
    onChange(localChart);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Options d'affichage"
      size="lg"
      showCloseButton={false}
      closeOnEscape
    >
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
            <>
              {/* ── Pivot section (collapsible) ── */}
              <div className={styles.pivotSection}>
                <div
                  className={styles.pivotHeader}
                  onClick={() => setPivotOpen((o) => !o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setPivotOpen((o) => !o)}
                >
                  <span className={styles.pivotTitle}>Options de pivot</span>
                  <ChevronDown
                    size={16}
                    className={`${styles.pivotChevron} ${pivotOpen ? styles.pivotChevronOpen : ""}`}
                  />
                </div>
                <div className={`${styles.pivotContent} ${pivotOpen ? styles.pivotContentOpen : ""}`}>
                  <div className={styles.pivotInner}>
                    <div className={styles.pivotRow}>
                      <FormSwitch label="Rows totals" checked={localChart?.structure?.pivot?.rows_total} onChange={(e) => updateChartPivot("rows_total", e.target.checked)} />
                      <FormSwitch label="Columns totals" checked={localChart?.structure?.pivot?.cols_total} onChange={(e) => updateChartPivot("cols_total", e.target.checked)} />
                      <FormSwitch label="Rows subtotals" checked={localChart?.structure?.pivot?.rows_subtotal} onChange={(e) => updateChartPivot("rows_subtotal", e.target.checked)} />
                      <FormSwitch label="Columns subtotals" checked={localChart?.structure?.pivot?.cols_subtotal} onChange={(e) => updateChartPivot("cols_subtotal", e.target.checked)} />
                    </div>
                    <div className={styles.pivotRow}>
                      <FormSwitch label="Active" checked={localChart?.structure?.pivot?.active} onChange={(e) => updateChartPivot("active", e.target.checked)} />
                      <FormSwitch label="Sort desc" checked={localChart?.structure?.pivot?.sort_desc} onChange={(e) => updateChartPivot("sort_desc", e.target.checked)} />
                      <FormInput value={localChart?.structure?.pivot?.fill_value ?? 0} type="number" onChange={(e) => updateChartPivot("fill_value", e.target.value)} />
                    </div>
                    <div className={styles.pivotRowWide}>
                      <div className={styles.pivotSelectWrap}>
                        <FormMultiSelect
                          label="percent_metrics"
                          value={localChart?.structure?.pivot?.percent_metrics ?? []}
                          options={structure.metrics?.map((m) => ({ value: m.field_id, label: m.alias ?? fields.find((f) => f.id === m.field_id)?.name ?? "" })) ?? []}
                          onChange={(values) => {
                            const vals = values?.filter(Boolean) || [];
                            updateChartPivot("percent_metrics", (structure.metrics ?? []).filter((d) => vals.includes(d.field_id)).map((m) => m.field_id));
                          }}
                          placeholder="percent_metrics"
                        />
                      </div>
                      <div className={styles.pivotSelectWrap}>
                        <FormSelect
                          label="sort_metric"
                          value={localChart?.structure?.pivot?.sort_metric}
                          options={structure.metrics?.map((m) => ({ value: m.field_id, label: m.alias ?? fields.find((f) => f.id === m.field_id)?.name ?? "" })) ?? []}
                          onChange={(val) => updateChartPivot("sort_metric", val)}
                          placeholder="sort_metric"
                        />
                      </div>
                      <div className={styles.pivotSelectWrap}>
                        <FormSelect
                          label="top_n"
                          value={localChart?.structure?.pivot?.top_n}
                          options={[1,2,3,4,5,6,7,8,9].map((d) => ({ value: d, label: `${d}` }))}
                          onChange={(val) => updateChartPivot("top_n", val)}
                          placeholder="top_n"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── AFFICHAGE ── */}
          {activeTab === "display" && (
            <div className={styles.fields}>
              <div className={styles.row}>
                <FormInput label="Largeur" value={options().width ?? 600} onChange={e => updateOption("width", e.target.value)} />
                <FormInput label="Hauteur" value={options().height ?? 400} onChange={e => updateOption("height", e.target.value)} />
              </div>
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

              {(localChart.type === "bar" || localChart.type === "stacked-bar") && (
                <>
                  <FormSwitch label="Empilé" checked={visualOptions<BarChartOptions>().stacked ?? false} onChange={e => updateSpecific<BarChartOptions>("stacked", e.target.checked)} />
                  <FormSwitch label="Horizontal" checked={visualOptions<BarChartOptions>().horizontal ?? false} onChange={e => updateSpecific<BarChartOptions>("horizontal", e.target.checked)} />
                  <FormInput label="Largeur des barres" value={visualOptions<BarChartOptions>().bar_width ?? 20} onChange={e => updateSpecific<BarChartOptions>("bar_width", Number(e.target.value))} />
                </>
              )}

              {(localChart.type === "line" || localChart.type === "area" || localChart.type === "stacked-area") && (
                <>
                  <FormSwitch label="Courbe" checked={visualOptions<LineChartOptions>().curved ?? false} onChange={e => updateSpecific<LineChartOptions>("curved", e.target.checked)} />
                  <FormSwitch label="Zone (area)" checked={visualOptions<LineChartOptions>().is_area ?? false} onChange={e => updateSpecific<LineChartOptions>("is_area", e.target.checked)} />
                  <FormSwitch label="Horizontal" checked={visualOptions<BarChartOptions>().horizontal ?? false} onChange={e => updateSpecific<BarChartOptions>("horizontal", e.target.checked)} />
                  <FormSwitch label="Afficher les marqueurs" checked={visualOptions<LineChartOptions>().show_markers ?? true} onChange={e => updateSpecific<LineChartOptions>("show_markers", e.target.checked)} />
                  <FormInput label="Épaisseur du trait" value={visualOptions<LineChartOptions>().line_width ?? 2} onChange={e => updateSpecific<LineChartOptions>("line_width", Number(e.target.value))} />
                </>
              )}

              {localChart.type === "area" && (
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

              {(localChart.type === "pie" || localChart.type === "donut") && (
                <>
                  <FormSwitch label="Afficher le pourcentage" checked={visualOptions<PieChartOptions>().show_percentage ?? true} onChange={e => updateSpecific<PieChartOptions>("show_percentage", e.target.checked)} />
                  {localChart.type === "donut" && (
                    <FormInput label="Rayon intérieur" value={visualOptions<PieChartOptions>().inner_radius ?? 50} onChange={e => updateSpecific<PieChartOptions>("inner_radius", Number(e.target.value))} />
                  )}
                </>
              )}

              {localChart.type === "kpi" && (
                <>
                  <FormInput label="Icône" value={visualOptions<KpiChartOptions>().icon ?? ""} onChange={e => updateSpecific<KpiChartOptions>("icon", e.target.value)} />
                  <FormInput label="Précision décimale" value={visualOptions<KpiChartOptions>().decimal_precision ?? 2} onChange={e => updateSpecific<KpiChartOptions>("decimal_precision", Number(e.target.value))} />
                  <FormSwitch label="Indicateur de tendance" checked={visualOptions<KpiChartOptions>().trend_indicator ?? false} onChange={e => updateSpecific<KpiChartOptions>("trend_indicator", e.target.checked)} />
                </>
              )}

              {localChart.type === "gauge" && (
                <>
                  <FormInput label="Valeur min" value={visualOptions<GaugeChartOptions>().min_value ?? 0} onChange={e => updateSpecific<GaugeChartOptions>("min_value", Number(e.target.value))} />
                  <FormInput label="Valeur max" value={visualOptions<GaugeChartOptions>().max_value ?? 100} onChange={e => updateSpecific<GaugeChartOptions>("max_value", Number(e.target.value))} />
                </>
              )}

              {localChart.type === "heatmap" && (
                <FormInput label="Espacement des cellules" value={visualOptions<HeatmapChartOptions>().cell_padding ?? 2} onChange={e => updateSpecific<HeatmapChartOptions>("cell_padding", Number(e.target.value))} />
              )}

              {localChart.type === "radar" && (
                <>
                  <FormInput label="Valeur max" value={visualOptions<RadarChartOptions>().max_value ?? 100} onChange={e => updateSpecific<RadarChartOptions>("max_value", Number(e.target.value))} />
                  <FormSwitch label="Remplir la zone" checked={visualOptions<RadarChartOptions>().fill_area ?? true} onChange={e => updateSpecific<RadarChartOptions>("fill_area", e.target.checked)} />
                </>
              )}

              {localChart.type === "table" && (
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

        {/* ACTIONS */}
        <div className={styles.nav}>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleApply}>
            Appliquer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
