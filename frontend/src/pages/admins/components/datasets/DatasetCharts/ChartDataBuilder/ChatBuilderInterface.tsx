
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { DefinitionEntry } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';
import { DatasetChart, Dataset, DatasetQuery, ExecuteChartResponse, ChartFilter, SqlDataType, ChartStructure, ChartDimension, ChartMetric, ChartOrderby, DatasetField } from '@/models/dataset.models';
import { Tenant } from '@/models/identity.model';
import { PreviewSection } from './components/PreviewSection/PreviewSection';
import { LayoutDataZone, LayoutState, LayoutZone } from './components/LayoutDropZone/LayoutDropZone';
import { LayoutConfiguration } from './components/LayoutConfiguration/LayoutConfiguration';

const CHART_TYPES: ChartTypeOption[] = [
  { id: 'line', name: 'Ligne', icon: <LineChart size={20} />, description: 'Évolution dans le temps', category: 'trend' },
  { id: 'area', name: 'Zone', icon: <AreaChart size={20} />, description: 'Évolution avec remplissage', category: 'trend' },
  { id: 'bar', name: 'Barres', icon: <BarChart3 size={20} />, description: 'Comparaison de valeurs', category: 'comparison' },
  { id: 'pie', name: 'Camembert', icon: <PieChart size={20} />, description: 'Distribution en parts', category: 'composition' },
  { id: 'donut', name: 'Anneau', icon: <Target size={20} />, description: 'Distribution avec centre vide', category: 'composition' },
  { id: 'radar', name: 'Radar', icon: <Activity size={20} />, description: 'Comparaison multidimensionnelle', category: 'comparison' },
  { id: 'radialBar', name: 'Barres radiales', icon: <TrendingUp size={20} />, description: 'Progression circulaire', category: 'comparison' },
  { id: 'scatter', name: 'Nuage de points', icon: <Grid3x3 size={20} />, description: 'Corrélation entre variables', category: 'distribution' },
  { id: 'composed', name: 'Composé', icon: <Layers size={20} />, description: 'Combinaison de types', category: 'other' },
  { id: 'treemap', name: 'Treemap', icon: <Grid3x3 size={20} />, description: 'Hiérarchie en rectangles', category: 'composition' },
  { id: 'funnel', name: 'Entonnoir', icon: <GitBranch size={20} />, description: 'Processus séquentiel', category: 'other' },
  { id: 'table', name: 'Tableau', icon: <Table size={20} />, description: 'Données tabulaires', category: 'other' },
];

const DEFAULT_OPTIONS: VisualizationOptions = {
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  stacked: false,
  animation: true,
};

interface DimMetricFieldMap {
  field_name: string;
  data_type: SqlDataType;
  field_id: number;
  alias?: string;
}

interface PreviewSnapshot {
  chartType: ChartVariant;
  selectedDataElements: string[];
  selectedPeriods: string[];
  selectedOrgUnits: string[];
  options: VisualizationOptions;
}

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




export const ChatBuilderInterface: React.FC<ChatBuilderInterfaceProps> = ({ chart, tenants, datasets, queries, onChange, onExecute }) => {
  const [_chart, setChart] = useState<DatasetChart>(chart);

  // Modal states
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedListOpen, setIsSavedListOpen] = useState(false);

  // Visualization metadata
  const [chartType, setChartType] = useState<ChartVariant>('bar');

  // Edit mode
  const [editingVisualizationId, setEditingVisualizationId] = useState<string | null>(null);
  const isEditing = editingVisualizationId !== null;

  const [isPreviewStale, setIsPreviewStale] = useState(false);

  const [layout, setLayout] = useState<LayoutState>({
    columns: [],
    rows: [],
    metrics: [],
    filters: [],
  });

  useEffect(() => {
    if (!chart.structure) return;

    setLayout({
      columns: chart.structure.cols_dimensions ?? [],
      rows: chart.structure.rows_dimensions ?? [],
      metrics: chart.structure.metrics ?? [],
      filters: chart.structure.filters ?? [],
    });
  }, [chart.structure]);

  useEffect(() => {
    setChart(prev => {
      const prevStructure = prev.structure ?? {} as any;

      // 🔥 éviter update inutile
      if (
        prevStructure.cols_dimensions === layout.columns &&
        prevStructure.rows_dimensions === layout.rows &&
        prevStructure.metrics === layout.metrics &&
        prevStructure.filters === layout.filters
      ) {
        return prev;
      }

      return {
        ...prev,
        structure: {
          ...prevStructure,
          cols_dimensions: layout.columns as ChartDimension[],
          rows_dimensions: layout.rows as ChartDimension[],
          metrics: layout.metrics as ChartMetric[],
          filters: layout.filters as ChartFilter[],
        }
      };
    });
  }, [layout]);



  const findItemIndex = <T extends { field_id: number }>(arr: T[], id: number) => arr.findIndex(i => i.field_id === id);

  const handleMoveItem = useCallback((itemId: number, fromZone: LayoutDataZone, toZone: LayoutDataZone, toIndex: number) => {
    setLayout(prev => {
      const next = { ...prev };

      const source = [...next[fromZone]];
      const target = fromZone === toZone ? source : [...next[toZone]];

      const fromIndex = findItemIndex(source, itemId);
      if (fromIndex === -1) return prev;

      const [item] = source.splice(fromIndex, 1);

      const existingIndex = findItemIndex(target, itemId);

      const safeIndex = Math.max(0, Math.min(toIndex, target.length));

      // 🔥 CAS 1 : SAME ZONE (REORDER)
      if (fromZone === toZone) {
        target.splice(safeIndex, 0, item);
      }

      // 🔁 CAS 2 : SWAP (autre zone + déjà présent)
      else if (existingIndex !== -1) {
        const existingItem = target[existingIndex];

        target[existingIndex] = item;
        source.splice(fromIndex, 0, existingItem);
      }

      // ✅ CAS 3 : MOVE NORMAL
      else {
        target.splice(safeIndex, 0, item);
      }

      next[fromZone] = source as any;
      next[toZone] = target as any;

      return next;
    });

    setIsPreviewStale(true);
  }, []);

  const handleRefreshPreview = useCallback(() => {

    setIsPreviewStale(false);
  }, [chartType]);


  const filterOne: ChartFilter[] = [
    {
      field_id: 0,
      field_type: 'dimension',
      operator: '=',
      value: undefined,
      value2: undefined,
      useSqlInClause: false
    },
    {
      field_id: 1,
      field_type: 'dimension',
      operator: '=',
      value: undefined,
      value2: undefined,
      useSqlInClause: false
    },
    {
      field_id: 2,
      field_type: 'dimension',
      operator: '=',
      value: undefined,
      value2: undefined,
      useSqlInClause: false
    },
  ];



  // REMOVE
  const handleRemove = useCallback((id: number, zone: keyof LayoutState) => {
    setLayout(prev => ({
      ...prev,
      [zone]: prev[zone].filter((item: any) => item.field_id !== id)
    }));
    setIsPreviewStale(true);
  }, []);


  // UPDATE FILTER
  const handleUpdateLayout = useCallback((zone: keyof LayoutState, fields: (ChartDimension | ChartMetric | ChartFilter)[]) => {
    setLayout(prev => {
      return { ...prev, [zone]: fields };
    });
    setIsPreviewStale(true);
  }, []);


  // ADD FILTER
const handleAddLayout = useCallback(
  (zone: LayoutDataZone, items: (ChartDimension | ChartMetric | ChartFilter)[]) => {
    setLayout((prev) => {
      // 🔥 Set pour lookup O(1)
      const ids = new Set(items.map((i) => i.field_id));

      // 🔥 clone propre
      let columns = [...prev.columns];
      let rows = [...prev.rows];
      let metrics = [...prev.metrics];
      let filters = [...prev.filters];

      switch (zone) {
        case 'columns':
          rows = rows.filter((d) => !ids.has(d.field_id));
          columns = [ ...columns.filter((d) => !ids.has(d.field_id)), ...(items as ChartDimension[]) ];
          break;
        case 'rows':
          columns = columns.filter((d) => !ids.has(d.field_id));
          rows = [...rows.filter((d) => !ids.has(d.field_id)), ...(items as ChartDimension[]) ];
          break;
        case 'metrics':
          metrics = [...metrics.filter((m) => !ids.has(m.field_id)),...(items as ChartMetric[])];
          break;
        case 'filters':
          filters = [...filters.filter((f) => !ids.has(f.field_id)),...(items as ChartFilter[])];
          break;
      }

      return { ...prev, columns, rows, metrics, filters };
    });
  },
  []
);

  const query = useMemo(() => {
    return queries?.find((q) => q.id === (_chart.query_id ?? chart.query_id));
  }, [queries, _chart.query_id, chart.query_id]);

  const fields = useMemo(() => {
    return query?.fields ?? [];
  }, [query]);


  // const queryDimensions: DimMetricFieldMap[] = useMemo(() => {
  //   const dims = query?.query_json?.select?.dimensions ?? [];
  //   const fm = new Map(fields.map(f => [f.id, f]));
  //   return dims
  //     .filter(d => fm.has(d.field_id))
  //     .map(q => {
  //       const fd = fm.get(q.field_id);
  //       const field_name = q?.alias ?? fd?.name ?? "";
  //       const fl = fields.find(f => f.id === q.field_id);
  //       const data_type = fl?.data_type ?? "string";
  //       return { ...q, field_name, data_type };
  //     });
  // }, [query, fields]);

  // const queryMetrics: DimMetricFieldMap[] = useMemo(() => {
  //   const metrs = query?.query_json?.select?.metrics ?? [];
  //   const fm = new Map(fields.map(f => [f.id, f]));
  //   return metrs
  //     .filter(d => fm.has(d.field_id))
  //     .map(q => {
  //       const fd = fm.get(q.field_id);
  //       const field_name = q?.alias ?? fd?.name ?? "";
  //       const fl = fields.find(f => f.id === q.field_id);
  //       const data_type = fl?.data_type ?? "string";
  //       const aggregation = fl?.aggregation ?? "count";
  //       return { ...q, field_name, data_type, aggregation };
  //     });
  // }, [query, fields]);

  // const { dimMap, metricMap, fieldMap } = useMemo(() => {
  //   const dimMap: Map<number, DimMetricFieldMap> = new Map();
  //   const metricMap: Map<number, DimMetricFieldMap> = new Map();
  //   const fieldMap: Map<number, DimMetricFieldMap> = new Map();

  //   queryDimensions.forEach(d => {
  //     dimMap.set(d.field_id, d);
  //     fieldMap.set(d.field_id, d);
  //   });

  //   queryMetrics.forEach(m => {
  //     metricMap.set(m.field_id, m);
  //     fieldMap.set(m.field_id, m);
  //   });

  //   return { dimMap, metricMap, fieldMap };
  // }, [queryDimensions, queryMetrics]);


  // const structure: ChartStructure = useMemo(() => {
  //   const str = { ..._chart.structure ?? {} };

  //   const rowsDimsMap = new Map<string, ChartDimension>();
  //   // ---- Rows / Cols (strings → Set OK)
  //   [...(str.rows_dimensions ?? [])].forEach((rd, i) => {
  //     const dim = dimMap.get(rd.field_id);
  //     const alias = rd.alias ?? dim?.field_name ?? "";
  //     const name = dim?.field_name ?? rd.alias ?? "";
  //     const key = `${i}`; // `${dim?.field_name}_${alias}`.replace(/\s+/g, "_");
  //     rowsDimsMap.set(key, { ...rd, alias, name });
  //   });
  //   const rows_dimensions = Array.from(rowsDimsMap.values());

  //   const colsDimsMap = new Map<string, ChartDimension>();
  //   [...(str.cols_dimensions ?? [])].forEach((cd, i) => {
  //     const dim = dimMap.get(cd.field_id);
  //     const alias = cd.alias ?? dim?.field_name ?? "";
  //     const name = dim?.field_name ?? cd.alias ?? "";
  //     const key = `${i}`; // `${dim.field_name}_${alias}`.replace(/\s+/g, "_");
  //     colsDimsMap.set(key, { ...cd, alias, name });
  //   });
  //   const cols_dimensions = Array.from(colsDimsMap.values());

  //   // ---- Metrics (clé = field + aggregation)
  //   const metricsMap = new Map<string, ChartMetric>();
  //   [...(str.metrics ?? [])].forEach((m, i) => {
  //     const metr = metricMap.get(m.field_id);
  //     const alias = m.alias ?? metr?.field_name ?? "";
  //     const name = metr?.field_name ?? m.alias ?? "";
  //     const key = `${i}`; // `${alias}_${m.aggregation}`;
  //     metricsMap.set(key, { ...m, alias, name });
  //   });
  //   const metrics = Array.from(metricsMap.values());

  //   // ---- Filters (clé plus robuste)
  //   const filtersMap = new Map<string, ChartFilter>();
  //   [...(str.filters ?? [])].forEach((ft, i) => {
  //     // const filt = fieldMap.get(ft.field_id);
  //     const key = `${i}`; // `${filt?.field_name ?? ""}_${ft.operator ?? ""}_${ft.value ?? ""}_${ft.value2 ?? ""}`;
  //     filtersMap.set(key, { ...ft });
  //   });
  //   const filters = Array.from(filtersMap.values());

  //   // ---- Order by
  //   const orderMap = new Map<string, ChartOrderby>();
  //   [...(str.order_by ?? [])].forEach((o, i) => {
  //     // const odb = fieldMap.get(o.field_id);
  //     const key = `${i}`; // `${odb?.field_id}_${o.direction}`;
  //     orderMap.set(key, { ...o });
  //   });
  //   const order_by = Array.from(orderMap.values());

  //   // ---- Pivot
  //   const limit = str.limit;
  //   const offset = str.offset;
  //   const pivot = { ...(str.pivot ?? {}) };

  //   return { rows_dimensions, cols_dimensions, metrics, filters, limit, offset, order_by, pivot };

  // }, [_chart.structure, queryDimensions, queryMetrics]);



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
        />

        <PreviewSection
          previewOptions={{} as any}
          previewChartType={"bar"}
          isPreviewStale={isPreviewStale}
          isEditing={isEditing}
          chartType={chartType}
          chartTypes={CHART_TYPES}
          onRefreshPreview={handleRefreshPreview}
          onOpenTheme={() => setIsThemeModalOpen(true)}
          onOpenOptions={() => setIsOptionsModalOpen(true)}
          onOpenSaved={() => setIsSavedListOpen(true)}
          onSave={() => setIsSaveModalOpen(true)}
          toogleChartTypeModal={() => setIsTypeModalOpen(true)}
        />
      </div>
</div>

      {/* <VisualizationTypeModal
        isOpen={isTypeModalOpen}
        chartTypes={CHART_TYPES}
        selectedChartType={chartType}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectChartType={setChartType}
      /> */}

      {/* <OptionsModal
        isOpen={isOptionsModalOpen}
        options={options}
        onOptionsChange={setOptions}
        onClose={() => setIsOptionsModalOpen(false)}
      /> */}

      {/* <ThemeModal
        isOpen={isThemeModalOpen}
        currentColors={options.colors}
        indicatorNames={[].map((id) => {
          const item = dataElements.find((d) => d.id === id);
          return item?.name || id;
        })}
        onClose={() => setIsThemeModalOpen(false)}
        onApply={(colors) => {
          setOptions((prev) => ({ ...prev, colors }));
          setPreviewSnapshot((prev) => ({
            ...prev,
            options: { ...prev.options, colors },
          }));
        }}
      /> */}

      {/* <SaveModal
        isOpen={isSaveModalOpen}
        isEditing={isEditing}
        initialName={name}
        initialDescription={description}
        initialVisualizationType={visualizationType}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleSaveConfirm}
      /> */}

      {/* <SavedVisualizationsModal
        isOpen={isSavedListOpen}
        savedVisualizations={savedVisualizations}
        onClose={() => setIsSavedListOpen(false)}
        onSelect={handleLoadVisualization}
      /> */}

    </>
  );
};
