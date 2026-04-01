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
import { DatasetChart, Dataset, DatasetQuery, ExecuteChartResponse, ChartFilter, ChartDimension, ChartMetric } from '@/models/dataset.models';
import { Tenant } from '@/models/identity.model';
import { PreviewSection } from './components/PreviewSection/PreviewSection';
import { LayoutDataZone, LayoutState } from './components/LayoutDropZone/LayoutDropZone';
import { LayoutConfiguration } from './components/LayoutConfiguration/LayoutConfiguration';
import { OptionsModal } from './components/OptionsModal/OptionsModal';
import { ThemeModal } from './components/ThemeModal/ThemeModal';
import { RenamesOptionsModal } from '../components/chart-utils/RenamesOptionsModal';
import { StructureStep } from '../components/chart-utils/StructureStep';
import { Modal } from '@/components/ui/Modal/Modal';
import { CHART_COLORS } from '@components/charts/theme';
import { getOptionKey, type ChartOptions } from '@/models/dataset.models';

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

  // Visualization state
  const [chartType, setChartType] = useState<ChartVariant>((chart.type as ChartVariant) || 'bar');
  const [options, setOptions] = useState<VisualizationOptions>({
    ...DEFAULT_OPTIONS,
    ...toVisualizationOptions(chart.options),
  });

  // Preview snapshot (frozen at Exécuter click)
  const [previewChartType, setPreviewChartType] = useState<ChartVariant>('bar');
  const [previewOptions, setPreviewOptions] = useState<VisualizationOptions>(DEFAULT_OPTIONS);

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

  // ── Preview data generation (same approach as DashboardBuilder) ──────────────
  const palette = useMemo(
    () => previewOptions.colors ?? CHART_COLORS.primary,
    [previewOptions.colors],
  );

  const metricNames = useMemo(
    () => layout.metrics.map(m => m.alias || m.name || `metric_${m.field_id}`),
    [layout.metrics],
  );

  const previewData = useMemo(() => {
    if (metricNames.length === 0) return [];

    const flat = ['pie', 'donut', 'kpi', 'gauge'];
    if (flat.includes(previewChartType)) {
      return metricNames.map((name, i) => ({
        name,
        value: Math.floor(Math.random() * 500) + 100,
        color: palette[i % palette.length],
      }));
    }

    if (previewChartType === 'radar') {
      const radarMetrics = metricNames.slice(0, 2);
      return ['Qualité', 'Accès', 'Délai', 'Suivi', 'Impact'].map((subject, index) => {
        const entry: Record<string, unknown> = { subject };
        (radarMetrics.length > 0 ? radarMetrics : ['Valeur']).forEach((name, metricIndex) => {
          entry[name] = 40 + ((index + 1) * 13) + (metricIndex * 11);
        });
        return entry;
      });
    }

    if (previewChartType === 'heatmap') {
      return ['Lomé', 'Kara', 'Sokodé'].map((row) => ({
        row,
        jan: Math.floor(Math.random() * 20) + 5,
        fev: Math.floor(Math.random() * 20) + 5,
        mar: Math.floor(Math.random() * 20) + 5,
      }));
    }

    return MONTHS.map(month => {
      const entry: Record<string, unknown> = { name: month };
      metricNames.forEach(name => {
        entry[name] = Math.floor(Math.random() * 300) + 50;
      });
      return entry;
    });
  }, [previewChartType, metricNames, palette]);

  const previewSeries = useMemo(
    () => metricNames.map((name, i) => ({
      dataKey: name,
      name,
      color: palette[i % palette.length],
      type: undefined,
    })),
    [metricNames, palette],
  );

  // ── Refresh ──────────────────────────────────────────────────────────────────
  const handleRefreshPreview = useCallback(() => {
    setPreviewChartType(chartType);
    setPreviewOptions({ ...options });
  }, [chartType, options]);

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
            previewData={previewData}
            previewSeries={previewSeries}
            isEditing={isEditing}
            onOpenTheme={() => setIsThemeModalOpen(true)}
            onOpenOptions={() => setIsOptionsModalOpen(true)}
            onOpenRenames={() => setIsRenamesModalOpen(true)}
            onOpenStructure={() => setIsStructureModalOpen(true)}
            onOpenSaved={() => {}}
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
    </>
  );
};
