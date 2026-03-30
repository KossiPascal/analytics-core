import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AreaChart,
  BarChart3,
  GitBranch,
  Grid3x3,
  Layers,
  LineChart,
  PieChart,
  Table,
  Target,
  TrendingUp,
} from 'lucide-react';

import type { ChartTypeOption, ChartVariant, VisualizationOptions } from './components/types';
import styles from './ChatBuilderInterface.module.css';
import { DatasetChart, Dataset, DatasetQuery, ExecuteChartResponse, ChartFilter, ChartDimension, ChartMetric } from '@/models/dataset.models';
import { Tenant } from '@/models/identity.model';
import { PreviewSection } from './components/PreviewSection/PreviewSection';
import { LayoutDataZone, LayoutState } from './components/LayoutDropZone/LayoutDropZone';
import { LayoutConfiguration } from './components/LayoutConfiguration/LayoutConfiguration';
import { OptionsModal } from '@pages/builders/DashboardBuilder/components/OptionsModal/OptionsModal';
import { ThemeModal } from './components/ThemeModal/ThemeModal';
import { CHART_COLORS } from '@components/charts/theme';

const CHART_TYPES: ChartTypeOption[] = [
  { id: 'line',      name: 'Ligne',            icon: <LineChart size={20} />,  description: 'Évolution dans le temps',          category: 'trend' },
  { id: 'area',      name: 'Zone',             icon: <AreaChart size={20} />,  description: 'Évolution avec remplissage',       category: 'trend' },
  { id: 'bar',       name: 'Barres',           icon: <BarChart3 size={20} />,  description: 'Comparaison de valeurs',           category: 'comparison' },
  { id: 'pie',       name: 'Camembert',        icon: <PieChart size={20} />,   description: 'Distribution en parts',            category: 'composition' },
  { id: 'donut',     name: 'Anneau',           icon: <Target size={20} />,     description: 'Distribution avec centre vide',   category: 'composition' },
  { id: 'radar',     name: 'Radar',            icon: <Activity size={20} />,   description: 'Comparaison multidimensionnelle', category: 'comparison' },
  { id: 'radialBar', name: 'Barres radiales',  icon: <TrendingUp size={20} />, description: 'Progression circulaire',          category: 'comparison' },
  { id: 'scatter',   name: 'Nuage de points',  icon: <Grid3x3 size={20} />,    description: 'Corrélation entre variables',     category: 'distribution' },
  { id: 'composed',  name: 'Composé',          icon: <Layers size={20} />,     description: 'Combinaison de types',            category: 'other' },
  { id: 'treemap',   name: 'Treemap',          icon: <Grid3x3 size={20} />,    description: 'Hiérarchie en rectangles',        category: 'composition' },
  { id: 'funnel',    name: 'Entonnoir',        icon: <GitBranch size={20} />,  description: 'Processus séquentiel',            category: 'other' },
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

  // Visualization state
  const [chartType, setChartType] = useState<ChartVariant>('bar');
  const [options, setOptions] = useState<VisualizationOptions>(DEFAULT_OPTIONS);

  // Preview snapshot (frozen at Actualiser click)
  const [previewChartType, setPreviewChartType] = useState<ChartVariant>('bar');
  const [previewOptions, setPreviewOptions] = useState<VisualizationOptions>(DEFAULT_OPTIONS);
  const [isPreviewStale, setIsPreviewStale] = useState(false);

  // Auto-refresh when chart type changes
  const prevChartTypeRef = useRef<ChartVariant>(chartType);
  useEffect(() => {
    if (prevChartTypeRef.current === chartType) return;
    prevChartTypeRef.current = chartType;
    setPreviewChartType(chartType);
    setIsPreviewStale(false);
  }, [chartType]);

  // Edit mode
  const isEditing = !!_chart.id;

  const [layout, setLayout] = useState<LayoutState>({
    columns: [],
    rows: [],
    metrics: [],
    filters: [],
  });

  // Sync layout from chart.structure on mount
  useEffect(() => {
    if (!chart.structure) return;
    setLayout({
      columns: chart.structure.cols_dimensions ?? [],
      rows: chart.structure.rows_dimensions ?? [],
      metrics: chart.structure.metrics ?? [],
      filters: chart.structure.filters ?? [],
    });
  }, [chart.structure]);

  // Propagate layout changes to _chart
  useEffect(() => {
    setChart(prev => {
      const prevStructure = prev.structure ?? {} as any;
      if (
        prevStructure.cols_dimensions === layout.columns &&
        prevStructure.rows_dimensions === layout.rows &&
        prevStructure.metrics === layout.metrics &&
        prevStructure.filters === layout.filters
      ) return prev;

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
  }, [layout]);

  // ── Layout handlers ─────────────────────────────────────────────────────────
  const findItemIndex = <T extends { field_id: number }>(arr: T[], id: number) =>
    arr.findIndex(i => i.field_id === id);

  const handleMoveItem = useCallback((
    itemId: number, fromZone: LayoutDataZone, toZone: LayoutDataZone, toIndex: number,
  ) => {
    setLayout(prev => {
      const next = { ...prev };
      const source = [...next[fromZone]];
      const target = fromZone === toZone ? source : [...next[toZone]];
      const fromIndex = findItemIndex(source, itemId);
      if (fromIndex === -1) return prev;
      const [item] = source.splice(fromIndex, 1);
      const existingIndex = findItemIndex(target, itemId);
      const safeIndex = Math.max(0, Math.min(toIndex, target.length));

      if (fromZone === toZone) {
        target.splice(safeIndex, 0, item);
      } else if (existingIndex !== -1) {
        const existingItem = target[existingIndex];
        target[existingIndex] = item;
        source.splice(fromIndex, 0, existingItem);
      } else {
        target.splice(safeIndex, 0, item);
      }

      next[fromZone] = source as any;
      next[toZone] = target as any;
      return next;
    });
    setIsPreviewStale(true);
  }, []);

  const handleRemove = useCallback((id: number, zone: keyof LayoutState) => {
    setLayout(prev => ({
      ...prev,
      [zone]: prev[zone].filter((item: any) => item.field_id !== id),
    }));
    setIsPreviewStale(true);
  }, []);

  const handleUpdateLayout = useCallback((
    zone: keyof LayoutState, fields: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => {
    setLayout(prev => ({ ...prev, [zone]: fields }));
    setIsPreviewStale(true);
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
    setIsPreviewStale(true);
  }, []);

  // ── Query & fields ───────────────────────────────────────────────────────────
  const query = useMemo(
    () => queries?.find(q => q.id === (_chart.query_id ?? chart.query_id)),
    [queries, _chart.query_id, chart.query_id],
  );
  const fields = useMemo(() => query?.fields ?? [], [query]);

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

    const flat = ['pie', 'donut', 'treemap', 'funnel', 'radialBar'];
    if (flat.includes(previewChartType)) {
      return metricNames.map((name, i) => ({
        name,
        value: Math.floor(Math.random() * 500) + 100,
        color: palette[i % palette.length],
      }));
    }

    if (previewChartType === 'scatter') {
      return Array.from({ length: 12 }, (_, i) => ({
        name: `Point ${i + 1}`,
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        z: Math.floor(Math.random() * 50) + 10,
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
      type: previewChartType === 'composed'
        ? ((i === 0 ? 'bar' : 'line') as 'bar' | 'line')
        : undefined,
    })),
    [metricNames, palette, previewChartType],
  );

  // ── Refresh ──────────────────────────────────────────────────────────────────
  const handleRefreshPreview = useCallback(() => {
    setPreviewChartType(chartType);
    setPreviewOptions({ ...options });
    setIsPreviewStale(false);
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
            onSelectChartType={setChartType}
          />

          <PreviewSection
            previewChartType={previewChartType}
            previewOptions={previewOptions}
            previewData={previewData}
            previewSeries={previewSeries}
            isPreviewStale={isPreviewStale}
            isEditing={isEditing}
            onRefreshPreview={handleRefreshPreview}
            onOpenTheme={() => setIsThemeModalOpen(true)}
            onOpenOptions={() => setIsOptionsModalOpen(true)}
            onOpenSaved={() => {}}
            onSave={() => {}}
          />
        </div>
      </div>

      <OptionsModal
        isOpen={isOptionsModalOpen}
        options={options}
        onOptionsChange={setOptions}
        onClose={() => setIsOptionsModalOpen(false)}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        currentColors={options.colors}
        indicatorNames={metricNames}
        onClose={() => setIsThemeModalOpen(false)}
        onApply={handleApplyTheme}
      />
    </>
  );
};
