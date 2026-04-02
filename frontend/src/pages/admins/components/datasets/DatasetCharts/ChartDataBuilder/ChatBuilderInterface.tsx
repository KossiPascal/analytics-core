import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AreaChart,
  BarChart3,
  Grid3x3,
  Layers,
  LineChart,
  PieChart,
  Table,
  Target,
} from 'lucide-react';

import type { ChartTypeOption, ChartVariant, VisualizationOptions } from './components/types';
import styles from './ChatBuilderInterface.module.css';
import { DatasetChart, Dataset, DatasetQuery, ExecuteChartResponse, ChartFilter, ChartDimension, ChartMetric, ChartRenderDataProp } from '@/models/dataset.models';
import { Tenant } from '@/models/identity.model';
import { PreviewSection } from './components/PreviewSection/PreviewSection';
import { LayoutDataZone, LayoutState } from './components/LayoutDropZone/LayoutDropZone';
import { LayoutConfiguration } from './components/LayoutConfiguration/LayoutConfiguration';
import { OptionsModal } from './components/OptionsModal/OptionsModal';
import { ThemeModal } from './components/ThemeModal/ThemeModal';
import { RenamesOptionsModal } from '../components/chart-utils/RenamesOptionsModal';
import { StructureStep } from '../components/chart-utils/StructureStep';
import { Modal } from '@/components/ui/Modal/Modal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { Button } from '@/components/ui/Button/Button';
import { getOptionKey, type ChartOptions } from '@/models/dataset.models';
import { chartService } from '@/services/dataset.service';

const CHART_TYPES: ChartTypeOption[] = [
  { id: 'bar',       name: 'Barres',           icon: <BarChart3 size={20} />,  description: 'Comparaison de valeurs',           category: 'comparison' },
  { id: 'stacked-bar', name: 'Barres empilées', icon: <Layers size={20} />, description: 'Comparaison cumulée', category: 'comparison' },
  { id: 'line',      name: 'Ligne',            icon: <LineChart size={20} />,  description: 'Évolution dans le temps',          category: 'trend' },
  { id: 'area',      name: 'Zone',             icon: <AreaChart size={20} />,  description: 'Évolution avec remplissage',       category: 'trend' },
  { id: 'stacked-area', name: 'Zone empilée', icon: <Layers size={20} />, description: 'Évolution empilée', category: 'trend' },
  { id: 'pie',       name: 'Camembert',        icon: <PieChart size={20} />,   description: 'Distribution en parts',            category: 'composition' },
  { id: 'donut',     name: 'Anneau',           icon: <Target size={20} />,     description: 'Distribution avec centre vide',   category: 'composition' },
  { id: 'kpi',       name: 'KPI',              icon: <Target size={20} />,     description: 'Valeur clé unique',                category: 'other' },
  { id: 'heatmap',   name: 'Heatmap',          icon: <Grid3x3 size={20} />,    description: 'Intensité par cellule',           category: 'distribution' },
  { id: 'radar',     name: 'Radar',            icon: <Activity size={20} />,   description: 'Comparaison multidimensionnelle', category: 'comparison' },
  { id: 'table',     name: 'Tableau',          icon: <Table size={20} />,      description: 'Données tabulaires',              category: 'other' },
];

const DEFAULT_OPTIONS: VisualizationOptions = {
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  stacked: false,
  animation: true,
};

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];

const toLayoutArray = <T extends ChartDimension | ChartMetric | ChartFilter>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const normalizeLayoutState = (structure?: Partial<DatasetChart['structure']> | null): LayoutState => ({
  columns: toLayoutArray<ChartDimension>(structure?.cols_dimensions),
  rows: toLayoutArray<ChartDimension>(structure?.rows_dimensions),
  metrics: toLayoutArray<ChartMetric>(structure?.metrics),
  filters: toLayoutArray<ChartFilter>(structure?.filters),
});

const toVisualizationOptions = (chartOptions?: ChartOptions): VisualizationOptions => ({
  title: chartOptions?.title,
  subtitle: chartOptions?.subtitle,
  showLegend: chartOptions?.show_legend ?? true,
  showTooltip: chartOptions?.show_tooltip ?? true,
  showGrid: chartOptions?.show_grid ?? true,
  stacked: Boolean(chartOptions?.stacked),
  animation: (chartOptions?.animation_duration ?? 500) > 0,
  colors: chartOptions?.color_scheme,
});

const toChartOptions = (
  previous: ChartOptions | undefined,
  nextOptions: VisualizationOptions,
  nextChartType: ChartVariant,
): ChartOptions => {
  const optionKey = getOptionKey(nextChartType);
  const previousSpecific = previous?.[optionKey] ?? {};
  const nextSpecific = {
    ...previousSpecific,
    stacked: nextChartType === 'stacked-bar' || nextChartType === 'stacked-area' || nextOptions.stacked,
  };

  return {
    ...previous,
    title: nextOptions.title,
    subtitle: nextOptions.subtitle,
    show_legend: nextOptions.showLegend,
    show_tooltip: nextOptions.showTooltip,
    show_grid: nextOptions.showGrid,
    color_scheme: nextOptions.colors,
    stacked: nextSpecific.stacked ? 1 : 0,
    animation_duration: nextOptions.animation ? (previous?.animation_duration ?? 500) : 0,
    [optionKey]: nextSpecific,
  };
};

/* ── Modal Titre / Sous-titre / Description ──────────────────── */
const MetaModal = ({
  isOpen, onClose, chart, onChange,
}: { isOpen: boolean; onClose: () => void; chart: DatasetChart; onChange: (c: DatasetChart) => void }) => {
  const [localChart, setLocalChart] = useState<DatasetChart>(chart);

  useEffect(() => {
    if (isOpen) setLocalChart(chart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Informations du graphique"
      size="md"
      showCloseButton={false}
      closeOnEscape
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormInput
          label="Titre *"
          value={localChart.options?.title ?? ''}
          onChange={(e) => setLocalChart(prev => ({
            ...prev,
            name: e.target.value,
            options: { ...prev.options, title: e.target.value },
          }))}
          placeholder="Titre du graphique"
          required
        />
        <FormInput
          label="Sous-titre"
          value={localChart.options?.subtitle ?? ''}
          onChange={(e) => setLocalChart(prev => ({ ...prev, options: { ...prev.options, subtitle: e.target.value } }))}
          placeholder="Sous-titre (optionnel)"
        />
        <FormInput
          label="Description"
          value={localChart.description ?? ''}
          onChange={(e) => setLocalChart(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description (optionnel)"
        />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem', borderTop: '1px solid #e2e8f0' }}>
          <Button size="sm" variant="outline" onClick={onClose}>Annuler</Button>
          <Button size="sm" disabled={!localChart.name?.trim()} onClick={() => { onChange(localChart); onClose(); }}>Appliquer</Button>
        </div>
      </div>
    </Modal>
  );
};

interface ChatBuilderInterfaceProps {
  chart: DatasetChart;
  tenants: Tenant[];
  tenant_id: number;
  datasets: Dataset[];
  dataset_id: number;
  queries: DatasetQuery[];
  query_id: number;
  onChange?: (val: DatasetChart) => void;
  onExecute?: (val: ExecuteChartResponse | undefined) => void;
}

export const ChatBuilderInterface: React.FC<ChatBuilderInterfaceProps> = ({
  chart, queries, onChange,
}) => {
  const [_chart, setChart] = useState<DatasetChart>(chart);

  // Modals
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isRenamesModalOpen, setIsRenamesModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);

  // Visualization state
  const [chartType, setChartType] = useState<ChartVariant>((chart.type as ChartVariant) || 'bar');
  const [options, setOptions] = useState<VisualizationOptions>({
    ...DEFAULT_OPTIONS,
    ...toVisualizationOptions(chart.options),
  });

  // Preview snapshot (frozen at Exécuter click)
  const [previewChartType, setPreviewChartType] = useState<ChartVariant>('bar');
  const [previewOptions, setPreviewOptions] = useState<VisualizationOptions>(DEFAULT_OPTIONS);
  const [renderData, setRenderData] = useState<ChartRenderDataProp | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);

  // Auto-refresh when chart type changes
  const prevChartTypeRef = useRef<ChartVariant>(chartType);
  useEffect(() => {
    if (prevChartTypeRef.current === chartType) return;
    prevChartTypeRef.current = chartType;
    setPreviewChartType(chartType);
  }, [chartType]);

  // Edit mode
  const isEditing = !!_chart.id;

  const [layout, setLayout] = useState<LayoutState>(() => normalizeLayoutState(chart.structure));

  // Sync layout from chart.structure on mount only (guarded against re-running on onChange bounce)
  const structureInitialized = useRef(false);
  useEffect(() => {
    if (structureInitialized.current) return;
    if (!chart.structure) return;
    structureInitialized.current = true;
    setLayout(normalizeLayoutState(chart.structure));
  }, [chart.structure]);

  // Propagate layout changes to _chart (no external resync — avoids circular loop)
  useEffect(() => {
    setChart(prev => {
      const prevStructure = prev.structure ?? {} as any;
      const next = {
        ...prev,
        structure: {
          ...prevStructure,
          cols_dimensions: layout.columns as ChartDimension[],
          rows_dimensions: layout.rows as ChartDimension[],
          metrics: layout.metrics as ChartMetric[],
          filters: layout.filters as ChartFilter[],
        },
      };
      onChange?.(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useEffect(() => {
    setChart(prev => {
      if (prev.type === chartType) return prev;
      const next = { ...prev, type: chartType };
      onChange?.(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  useEffect(() => {
    setChart(prev => {
      const nextOptions = toChartOptions(prev.options, options, chartType);
      if (JSON.stringify(prev.options) === JSON.stringify(nextOptions)) return prev;
      const next = { ...prev, options: nextOptions };
      onChange?.(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // ── Query & fields ───────────────────────────────────────────────────────────
  const query = useMemo(
    () => queries?.find(q => q.id === (_chart.query_id ?? chart.query_id)),
    [queries, _chart.query_id, chart.query_id],
  );
  const fields = useMemo(() => query?.fields ?? [], [query]);

  // ── Layout handlers ─────────────────────────────────────────────────────────
  const findItemIndex = <T extends { field_id: number }>(arr: T[], id: number) =>
    arr.findIndex(i => i.field_id === id);

  const handleMoveItem = useCallback((
    itemId: number, fromZone: LayoutDataZone, toZone: LayoutDataZone, toIndex: number,
  ) => {
    // Convert an item to the target zone's expected type.
    // columns/rows use ChartDimension; filters use ChartFilter.
    const convertForZone = (
      raw: ChartDimension | ChartMetric | ChartFilter,
      from: LayoutDataZone,
      to: LayoutDataZone,
    ): ChartDimension | ChartFilter => {
      if (from === to) return raw as (ChartDimension | ChartFilter);
      const field = fields.find(f => f.id === raw.field_id);
      if ((from === 'columns' || from === 'rows') && to === 'filters') {
        const dim = raw as ChartDimension;
        return {
          field_id: dim.field_id,
          field_type: field?.field_type ?? 'dimension',
          operator: dim.operator ?? '=',
          value: dim.value ?? null,
          value2: dim.value2 ?? null,
          useSqlInClause: dim.useSqlInClause ?? false,
        } as ChartFilter;
      }
      if (from === 'filters' && (to === 'columns' || to === 'rows')) {
        const filt = raw as ChartFilter;
        return {
          field_id: filt.field_id,
          alias: field?.name ?? String(filt.field_id),
          name: field?.name,
          data_type: field?.data_type,
          operator: filt.operator,
          value: filt.value,
          value2: filt.value2,
          useSqlInClause: filt.useSqlInClause,
        } as ChartDimension;
      }
      return raw as ChartDimension;
    };

    setLayout(prev => {
      const next = { ...prev };
      const source = [...next[fromZone]];
      const target = fromZone === toZone ? source : [...next[toZone]];
      const fromIndex = findItemIndex(source, itemId);
      if (fromIndex === -1) return prev;
      const [rawItem] = source.splice(fromIndex, 1);
      const item = convertForZone(rawItem, fromZone, toZone);
      const existingIndex = findItemIndex(target, itemId);
      const safeIndex = Math.max(0, Math.min(toIndex, target.length));

      if (fromZone === toZone) {
        target.splice(safeIndex, 0, item);
      } else if (existingIndex !== -1) {
        const existingItem = target[existingIndex];
        target[existingIndex] = item;
        source.splice(fromIndex, 0, convertForZone(existingItem, toZone, fromZone));
      } else {
        target.splice(safeIndex, 0, item);
      }

      next[fromZone] = source as any;
      next[toZone] = target as any;
      return next;
    });
  }, [fields]);

  const handleRemove = useCallback((id: number, zone: keyof LayoutState) => {
    setLayout(prev => ({
      ...prev,
      [zone]: prev[zone].filter((item: any) => item.field_id !== id),
    }));
  }, []);

  const handleUpdateLayout = useCallback((
    zone: keyof LayoutState, fields: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => {
    setLayout(prev => ({ ...prev, [zone]: fields }));
  }, []);

  const handleAddLayout = useCallback((
    zone: LayoutDataZone, items: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => {
    setLayout(prev => {
      const ids = new Set(items.map(i => i.field_id));
      let columns = [...prev.columns];
      let rows = [...prev.rows];
      let metrics = [...prev.metrics];
      let filters = [...prev.filters];

      switch (zone) {
        case 'columns':
          rows = rows.filter(d => !ids.has(d.field_id));
          columns = [...columns.filter(d => !ids.has(d.field_id)), ...(items as ChartDimension[])];
          break;
        case 'rows':
          columns = columns.filter(d => !ids.has(d.field_id));
          rows = [...rows.filter(d => !ids.has(d.field_id)), ...(items as ChartDimension[])];
          break;
        case 'metrics':
          metrics = [...metrics.filter(m => !ids.has(m.field_id)), ...(items as ChartMetric[])];
          break;
        case 'filters':
          filters = [...filters.filter(f => !ids.has(f.field_id)), ...(items as ChartFilter[])];
          break;
      }
      return { ...prev, columns, rows, metrics, filters };
    });
  }, []);

  // ── Execute & fetch real data ────────────────────────────────────────────────
  const metricNames = useMemo(
    () => renderData?.header.metrics ?? layout.metrics.map(m => m.alias || `metric_${m.field_id}`),
    [renderData, layout.metrics],
  );

  const handleRefreshPreview = useCallback(async () => {
    const queryId = _chart.query_id;
    if (!queryId) {
      setExecuteError("Aucune requête sélectionnée.");
      return;
    }
    setIsExecuting(true);
    setExecuteError(null);
    try {
      // CRUDService.post throws on error and returns T | undefined on success
      const response = await chartService.execute(queryId, _chart);
      if (!response) throw new Error("Pas de réponse du serveur.");

      console.log('[ChartBuilder] response complète:', response);
      console.log('[ChartBuilder] response.data (rows):', response.data);
      console.log('[ChartBuilder] response.meta:', response.meta);

      // Snapshot chart type & options
      setPreviewChartType(chartType);
      setPreviewOptions({ ...options });

      // Build ChartRenderDataProp from backend response
      const metricDict: Record<string, string> = response.meta?.metrics ?? {};
      const metricKeys = Object.keys(metricDict);
      const dimKeys: string[] = response.meta?.dimensions ?? [];

      console.log('[ChartBuilder] metricKeys:', metricKeys);
      console.log('[ChartBuilder] dimKeys:', dimKeys);

      const rd: ChartRenderDataProp = {
        header: {
          header_rows: [metricKeys],
          rows: dimKeys,
          columns: [],
          column_maps: {},
          column_label_maps: {},
          metrics: metricKeys,
          _all_columns_order: metricKeys,
        },
        rows: response.data ?? [],
      };
      console.log('[ChartBuilder] renderData construit:', rd);
      setRenderData(rd);
    } catch (err: any) {
      setExecuteError(err?.response?.data?.message ?? err?.message ?? "Erreur d'exécution.");
    } finally {
      setIsExecuting(false);
    }
  }, [_chart, chartType, options]);

  // ── Theme apply ──────────────────────────────────────────────────────────────
  const handleApplyTheme = useCallback((colors: string[]) => {
    setOptions(prev => ({ ...prev, colors }));
    setPreviewOptions(prev => ({ ...prev, colors }));
  }, []);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.mainArea}>
          <LayoutConfiguration
            layout={layout}
            fields={fields}
            onRemoveLayout={handleRemove}
            onMoveLayout={handleMoveItem}
            onUpdateLayout={handleUpdateLayout}
            onAddLayout={handleAddLayout}
            chartType={chartType}
            chartTypes={CHART_TYPES}
            options={previewOptions}
            onSelectChartType={setChartType}
            onExecute={handleRefreshPreview}
          />

          <PreviewSection
            previewChartType={previewChartType}
            previewOptions={previewOptions}
            renderData={renderData}
            chart={_chart}
            query={query}
            isEditing={isEditing}
            isExecuting={isExecuting}
            executeError={executeError}
            onOpenTheme={() => setIsThemeModalOpen(true)}
            onOpenOptions={() => setIsOptionsModalOpen(true)}
            onOpenRenames={() => setIsRenamesModalOpen(true)}
            onOpenStructure={() => setIsStructureModalOpen(true)}
            onOpenSaved={() => setIsMetaModalOpen(true)}
            onSave={() => {}}
          />
        </div>
      </div>

      <OptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        chart={_chart}
        onChange={(updated: DatasetChart) => {
          setChart(updated);
          setOptions(toVisualizationOptions(updated.options));
          onChange?.(updated);
        }}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        currentColors={options.colors}
        indicatorNames={metricNames}
        onClose={() => setIsThemeModalOpen(false)}
        onApply={handleApplyTheme}
      />

      <RenamesOptionsModal
        isOpen={isRenamesModalOpen}
        onClose={() => setIsRenamesModalOpen(false)}
        values={_chart.options?.renames ?? {}}
        onChange={(newValues) => {
          const updated: DatasetChart = { ..._chart, options: { ..._chart.options, renames: newValues } };
          setChart(updated);
          onChange?.(updated);
        }}
      />

      <Modal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        title="Structure du graphique"
        size="full"
        noPadding
        closeOnBackdrop
        closeOnEscape
      >
        <StructureStep
          chart={_chart}
          queries={queries}
          onChange={(updated) => {
            setChart(updated);
            onChange?.(updated);
          }}
        />
      </Modal>

      <MetaModal
        isOpen={isMetaModalOpen}
        onClose={() => setIsMetaModalOpen(false)}
        chart={_chart}
        onChange={(updated) => {
          setChart(updated);
          onChange?.(updated);
        }}
      />
    </>
  );
};
