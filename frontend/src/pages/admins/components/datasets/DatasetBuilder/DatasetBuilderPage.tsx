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

import { useNotification } from '@contexts/OLD/useNotification';
import { CHART_COLORS } from '@components/charts/theme';
import type { ChartDataItem } from '@components/charts/types';
import { db, initializeTestData, type VisualizationDimensionItem } from '@/utils/TestData';

import type {
  ChartTypeOption,
  ChartVariant,
  DataSourceMode,
  DimensionItem,
  LayoutZone,
  StoredVisualization,
  VisualizationConfig,
  VisualizationOptions,
  VisualizationType,
} from './components/types';
import type { DatasetChart } from '@/models/dataset.models';
import styles from './DatasetBuilder.module.css';
import { BuilderHeader } from './components/BuilderHeader/BuilderHeader';
import { BuilderMainArea } from './components/BuilderMainArea/BuilderMainArea';
import { BuilderSidebar } from './components/BuilderSidebar/BuilderSidebar';
import { OptionsModal } from './components/OptionsModal/OptionsModal';
import { SaveModal } from './components/SaveModal/SaveModal';
import { SavedVisualizationsModal } from './components/SavedVisualizationsModal/SavedVisualizationsModal';
import { VisualizationTypeModal } from './components/VisualizationTypeModal/VisualizationTypeModal';
import { ThemeModal } from './components/ThemeModal/ThemeModal';
import { IndicatorBuilder } from './components/IndicatorBuilder/IndicatorBuilder';
import type { IndicatorQueryConfig, SidebarEntity } from './components/IndicatorBuilder/IndicatorBuilder';
import type { IndicatorFilter } from './components/IndicatorBuilder/IndicatorFilterBuilder';
import type { DefinitionEntry } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';

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

interface PreviewSnapshot {
  chartType: ChartVariant;
  selectedDataElements: string[];
  selectedIndicators: string[];
  selectedPeriods: string[];
  selectedOrgUnits: string[];
  options: VisualizationOptions;
}

const DatasetBuilderPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  // Modal states
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedListOpen, setIsSavedListOpen] = useState(false);
  const [isIndicatorBuilderOpen, setIsIndicatorBuilderOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [indicatorConfigs, setIndicatorConfigs] = useState<Record<string, IndicatorQueryConfig>>({});

  // Visualization metadata
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('dashboard');
  const [chartType, setChartType] = useState<ChartVariant>('bar');
  const [name, setName] = useState('Nouvelle visualisation');
  const [description, setDescription] = useState('');

  // Data source mode (for table chart toggle)
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('indicators');

  // Edit mode
  const [editingVisualizationId, setEditingVisualizationId] = useState<string | null>(null);
  const isEditing = editingVisualizationId !== null;

  // Dimension selections
  const [selectedDataElements, setSelectedDataElements] = useState<string[]>(['de1', 'de2', 'de3']);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['ind1', 'ind2']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['LAST_6_MONTHS']);
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>(['ou1', 'ou2', 'ou3']);

  // Layout
  const [columnItems, setColumnItems] = useState<string[]>(['LAST_6_MONTHS']);
  const [rowItems, setRowItems] = useState<string[]>(['ind1', 'ind2']);
  const [filterItems, setFilterItems] = useState<string[]>(['ou1']);
  const [metricItems, setMetricItems] = useState<string[]>([]);

  // Layout filters (from IndicatorFilterBuilder modal)
  const [layoutFilters, setLayoutFilters] = useState<IndicatorFilter[]>([]);

  // Layout data (from DefinitionItemForm modal)
  const [layoutData, setLayoutData] = useState<DefinitionEntry[]>([]);

  // Data sources
  const [dataElements, setDataElements] = useState<DimensionItem[]>([]);
  const [indicators, setIndicators] = useState<DimensionItem[]>([]);
  const [periods, setPeriods] = useState<DimensionItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<DimensionItem[]>([]);
  const [savedVisualizations, setSavedVisualizations] = useState<StoredVisualization[]>([]);

  // Indicator builder data
  const [indicatorEntities] = useState<SidebarEntity[]>([
    {
      id: 'mv1', label: 'Matview 1', type: 'materialized_view',
      columns: [
        { name: 'age', type: 'number', nullable: false },
        { name: 'membre', type: 'number', nullable: false },
        { name: 'sexe', type: 'string', nullable: false },
        { name: 'fluorescence', type: 'string', nullable: true },
        { name: 'date_visite', type: 'date', nullable: false },
        { name: 'poids', type: 'number', nullable: true },
      ],
    },
    { id: 'mv2', label: 'Matview 2', type: 'materialized_view', columns: [{ name: 'score', type: 'number', nullable: false }, { name: 'categorie', type: 'string', nullable: false }] },
    { id: 'mv3', label: 'Matview 3', type: 'materialized_view', columns: [{ name: 'total', type: 'number', nullable: false }] },
    { id: 't1', label: 'Table 1', type: 'table', columns: [{ name: 'valeur', type: 'number', nullable: false }] },
    { id: 't2', label: 'Table 2', type: 'table', columns: [{ name: 'montant', type: 'number', nullable: false }] },
    { id: 'v1', label: 'Vue 1', type: 'view', columns: [{ name: 'indicateur', type: 'number', nullable: false }] },
  ]);
  const [indicatorSites] = useState([
    { value: 'site1', label: 'Site Lomé' },
    { value: 'site2', label: 'Site Kara' },
    { value: 'site3', label: 'Site Sokodé' },
  ]);

  const [options, setOptions] = useState<VisualizationOptions>(DEFAULT_OPTIONS);

  const [chart, setChart] = useState<DatasetChart>({
    id: null,
    name: '',
    tenant_id: null,
    dataset_id: null,
    query_id: null,
    type: 'bar',
    structure: { rows_dimensions: [], cols_dimensions: [], metrics: [], filters: [], order_by: [], limit: null, offset: null, pivot: { acitve: false, fill_value: 0, rows_total: false, cols_total: false, rows_subtotal: false, cols_subtotal: false, sort_desc: false } },
    options: {},
    is_active: true,
  });

  const [previewSnapshot, setPreviewSnapshot] = useState<PreviewSnapshot>({
    chartType: 'bar',
    selectedDataElements: ['de1', 'de2', 'de3'],
    selectedIndicators: ['ind1', 'ind2'],
    selectedPeriods: ['LAST_6_MONTHS'],
    selectedOrgUnits: ['ou1', 'ou2', 'ou3'],
    options: DEFAULT_OPTIONS,
  });
  const [isPreviewStale, setIsPreviewStale] = useState(false);

  const hasInitializedRef = useRef(false);
  const previousChartTypeRef = useRef<ChartVariant>(chartType);

  const loadSavedVisualizations = useCallback(() => {
    const { items } = db.list<StoredVisualization>('visualizations', {
      sortBy: 'updatedAt',
      sortDir: 'desc',
    });
    setSavedVisualizations(items);
  }, []);

  useEffect(() => {
    try {
      initializeTestData();
      const { items: dataElementItems } = db.list<VisualizationDimensionItem>('visualization_data_elements');
      const { items: indicatorItems } = db.list<VisualizationDimensionItem>('visualization_indicators');
      const { items: periodItems } = db.list<VisualizationDimensionItem>('visualization_periods');
      const { items: orgUnitItems } = db.list<VisualizationDimensionItem>('visualization_org_units');

      setDataElements(dataElementItems);
      setIndicators(indicatorItems);
      setPeriods(periodItems);
      setOrgUnits(orgUnitItems);
      loadSavedVisualizations();
    } catch (error) {
      console.error('[VisualizationsTab] Failed to load local data', error);
      showError('Impossible de charger les données locales pour les visualisations.');
    }
  }, [loadSavedVisualizations, showError]);

  // Mark preview as stale on any config change (except chartType which auto-refreshes)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }
    setIsPreviewStale(true);
  }, [
    selectedDataElements,
    selectedIndicators,
    selectedPeriods,
    selectedOrgUnits,
    columnItems,
    rowItems,
    filterItems,
    options,
  ]);

  // Auto-refresh preview when chart type changes (from modal)
  useEffect(() => {
    if (previousChartTypeRef.current === chartType) {
      return;
    }
    previousChartTypeRef.current = chartType;

    setPreviewSnapshot((prev) => ({
      ...prev,
      chartType,
    }));
    setIsPreviewStale(false);
  }, [chartType]);

  // Clean up data elements when switching away from table type
  useEffect(() => {
    if (chartType === 'table') {
      return;
    }

    if (selectedDataElements.length > 0) {
      setSelectedDataElements([]);
    }

    const dataElementIds = new Set(dataElements.map((item) => item.id));
    setColumnItems((items) => items.filter((item) => !dataElementIds.has(item)));
    setRowItems((items) => items.filter((item) => !dataElementIds.has(item)));
    setFilterItems((items) => items.filter((item) => !dataElementIds.has(item)));
  }, [chartType, dataElements, selectedDataElements.length]);

  const handleSaveIndicator = useCallback(
    (indicator: DimensionItem, config: IndicatorQueryConfig) => {
      setIndicatorConfigs((prev) => ({ ...prev, [indicator.id]: config }));

      setIndicators((prev) => {
        const existingIndex = prev.findIndex((ind) => ind.id === indicator.id);
        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev];
          updated[existingIndex] = indicator;
          return updated;
        }
        // Add new
        return [...prev, indicator];
      });

      // Auto-sélectionner l'indicateur créé pour le graphique
      setSelectedIndicators((prev) =>
        prev.includes(indicator.id) ? prev : [...prev, indicator.id]
      );

      setEditingIndicatorId(null);
      showSuccess(
        editingIndicatorId
          ? `Indicateur modifié : "${indicator.name}"`
          : `Indicateur créé : "${indicator.name}"`
      );
    },
    [showSuccess, editingIndicatorId]
  );

  const editableIndicatorIds = useMemo(
    () => new Set(Object.keys(indicatorConfigs)),
    [indicatorConfigs]
  );

  const handleEditIndicator = useCallback(
    (indicatorId: string) => {
      setEditingIndicatorId(indicatorId);
      setIsIndicatorBuilderOpen(true);
    },
    []
  );

  const handleDataSourceModeChange = useCallback(
    (mode: DataSourceMode) => {
      if (mode === dataSourceMode) return;
      setDataSourceMode(mode);
      if (mode === 'matview') {
        setSelectedIndicators([]);
      } else {
        setSelectedDataElements([]);
      }
    },
    [dataSourceMode]
  );

  const handleMoveItem = useCallback((itemId: string, fromZone: LayoutZone, toZone: LayoutZone) => {
    const setters: Record<LayoutZone, React.Dispatch<React.SetStateAction<string[]>>> = {
      column: setColumnItems,
      row: setRowItems,
      filter: setFilterItems,
    };
    setters[fromZone]((prev) => prev.filter((id) => id !== itemId));
    setters[toZone]((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  }, []);

  const handleRefreshPreview = useCallback(() => {
    setPreviewSnapshot({
      chartType,
      selectedDataElements: [...selectedDataElements],
      selectedIndicators: [...selectedIndicators],
      selectedPeriods: [...selectedPeriods],
      selectedOrgUnits: [...selectedOrgUnits],
      options: { ...options },
    });
    setIsPreviewStale(false);
  }, [chartType, selectedDataElements, selectedIndicators, selectedPeriods, selectedOrgUnits, options]);

  const availableLayoutItems = useMemo(
    () =>
      chartType === 'table'
        ? [...dataElements, ...indicators, ...periods, ...orgUnits]
        : [...indicators, ...periods, ...orgUnits],
    [chartType, dataElements, indicators, periods, orgUnits]
  );

  const activePreviewDataIds = useMemo(() => {
    const fromSelection =
      previewSnapshot.chartType === 'table'
        ? [...previewSnapshot.selectedDataElements, ...previewSnapshot.selectedIndicators]
        : [...previewSnapshot.selectedIndicators];

    // Si rien n'est sélectionné pour le tableau, fallback sur quelques éléments
    if (fromSelection.length === 0 && previewSnapshot.chartType === 'table') {
      return [...dataElements.slice(0, 2).map((item) => item.id), ...indicators.slice(0, 2).map((item) => item.id)];
    }

    // Aucune sélection → pas de données (évite d'afficher tout par défaut)
    return fromSelection;
  }, [previewSnapshot, dataElements, indicators]);

  const previewData = useMemo((): ChartDataItem[] => {
    const periodsForPreview =
      previewSnapshot.selectedPeriods.length > 0 ? previewSnapshot.selectedPeriods : ['THIS_MONTH'];
    const palette = previewSnapshot.options.colors ?? CHART_COLORS.primary;

    if (
      previewSnapshot.chartType === 'pie' ||
      previewSnapshot.chartType === 'donut' ||
      previewSnapshot.chartType === 'treemap' ||
      previewSnapshot.chartType === 'funnel' ||
      previewSnapshot.chartType === 'radialBar'
    ) {
      return activePreviewDataIds.map((itemId, index) => {
        const item = dataElements.find((candidate) => candidate.id === itemId) ||
          indicators.find((candidate) => candidate.id === itemId);

        return {
          name: item?.name || itemId,
          value: Math.floor(Math.random() * 500) + 100,
          color: palette[index % palette.length],
        };
      });
    }

    if (previewSnapshot.chartType === 'radar') {
      return previewSnapshot.selectedOrgUnits.slice(0, 5).map((orgUnitId) => {
        const orgUnit = orgUnits.find((item) => item.id === orgUnitId);
        const entry: ChartDataItem = { subject: orgUnit?.name || orgUnitId };

        activePreviewDataIds.forEach((dataId) => {
          const dataItem = dataElements.find((item) => item.id === dataId) || indicators.find((item) => item.id === dataId);
          entry[dataItem?.name || dataId] = Math.floor(Math.random() * 100) + 20;
        });

        return entry;
      });
    }

    if (previewSnapshot.chartType === 'scatter') {
      return Array.from({ length: Math.max(periodsForPreview.length, 12) }, (_, index) => ({
        name: `Point ${index + 1}`,
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        z: Math.floor(Math.random() * 50) + 10,
      }));
    }

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return monthNames.slice(0, Math.max(periodsForPreview.length, 6)).map((month) => {
      const entry: ChartDataItem = { name: month };

      activePreviewDataIds.forEach((dataId) => {
        const dataItem = dataElements.find((item) => item.id === dataId) || indicators.find((item) => item.id === dataId);
        entry[dataItem?.name || dataId] = Math.floor(Math.random() * 300) + 50;
      });

      return entry;
    });
  }, [activePreviewDataIds, dataElements, indicators, orgUnits, previewSnapshot]);

  const previewSeries = useMemo(() => {
    const palette = previewSnapshot.options.colors ?? CHART_COLORS.primary;
    return activePreviewDataIds.map((dataId, index) => {
      const item = dataElements.find((candidate) => candidate.id === dataId) ||
        indicators.find((candidate) => candidate.id === dataId);

      return {
        dataKey: item?.name || dataId,
        name: item?.name || dataId,
        color: palette[index % palette.length],
        type: previewSnapshot.chartType === 'composed' ? ((index === 0 ? 'bar' : 'line') as 'bar' | 'line') : undefined,
      };
    });
  }, [activePreviewDataIds, dataElements, indicators, previewSnapshot]);

  const handleSaveConfirm = useCallback(
    (saveName: string, saveDescription: string, saveVizType: VisualizationType) => {
      const config: VisualizationConfig = {
        name: saveName,
        description: saveDescription,
        type: saveVizType,
        chartType,
        columns: [{ dimension: 'pe', items: columnItems }],
        rows: [{ dimension: 'dx', items: rowItems }],
        filters: [{ dimension: 'ou', items: filterItems }],
        options,
        selectedDataElements,
        selectedIndicators,
        selectedPeriods,
        selectedOrgUnits,
      };

      const now = new Date().toISOString();

      if (isEditing && editingVisualizationId) {
        const updatedVisualization: StoredVisualization = {
          id: editingVisualizationId,
          createdAt: savedVisualizations.find((v) => v.id === editingVisualizationId)?.createdAt || now,
          updatedAt: now,
          ...config,
        };

        try {
          db.create<StoredVisualization>('visualizations', updatedVisualization);
          setSavedVisualizations((previous) =>
            previous.map((v) => (v.id === editingVisualizationId ? updatedVisualization : v))
          );
          setName(saveName);
          setDescription(saveDescription);
          setVisualizationType(saveVizType);
          showSuccess(`Visualisation modifiée : "${saveName}"`);
        } catch (error) {
          console.error('[VisualizationsTab] Failed to update visualization', error);
          showError('Impossible de modifier la visualisation.');
        }
      } else {
        const storedVisualization: StoredVisualization = {
          id: `viz-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
          ...config,
        };

        try {
          db.create<StoredVisualization>('visualizations', storedVisualization);
          setSavedVisualizations((previous) => [storedVisualization, ...previous]);
          setName(saveName);
          setDescription(saveDescription);
          setVisualizationType(saveVizType);
          showSuccess(`Visualisation sauvegardée : "${saveName}"`);
        } catch (error) {
          console.error('[VisualizationsTab] Failed to save visualization', error);
          showError('Impossible de sauvegarder la visualisation.');
        }
      }

      setIsSaveModalOpen(false);
    },
    [chartType, columnItems, rowItems, filterItems, options, selectedDataElements, selectedIndicators, selectedPeriods, selectedOrgUnits, isEditing, editingVisualizationId, savedVisualizations, showSuccess, showError]
  );

  const handleLoadVisualization = useCallback((viz: StoredVisualization) => {
    setName(viz.name);
    setDescription(viz.description || '');
    setVisualizationType(viz.type);
    setChartType(viz.chartType);
    setOptions(viz.options);
    setEditingVisualizationId(viz.id);

    if (viz.columns.length > 0) {
      setColumnItems(viz.columns[0].items);
    }
    if (viz.rows.length > 0) {
      setRowItems(viz.rows[0].items);
    }
    if (viz.filters.length > 0) {
      setFilterItems(viz.filters[0].items);
    }

    // Restaurer les sélections de dimensions
    setSelectedDataElements(viz.selectedDataElements ?? []);
    setSelectedIndicators(viz.selectedIndicators ?? []);
    setSelectedPeriods(viz.selectedPeriods ?? []);
    setSelectedOrgUnits(viz.selectedOrgUnits ?? []);

    // Synchroniser immédiatement le snapshot avec les données chargées
    setPreviewSnapshot({
      chartType: viz.chartType,
      selectedDataElements: viz.selectedDataElements ?? [],
      selectedIndicators: viz.selectedIndicators ?? [],
      selectedPeriods: viz.selectedPeriods ?? [],
      selectedOrgUnits: viz.selectedOrgUnits ?? [],
      options: viz.options,
    });
    setIsPreviewStale(false);
  }, []);

  return (
    <>
      <div className={styles.container}>
        <BuilderHeader
          chartType={chartType}
          chartTypes={CHART_TYPES}
          dataSourceMode={dataSourceMode}
          onDataSourceModeChange={handleDataSourceModeChange}
          onOpenTypeModal={() => setIsTypeModalOpen(true)}
          onOpenIndicatorBuilder={() => {
            setEditingIndicatorId(null);
            setIsIndicatorBuilderOpen(true);
          }}
          onOpenFilters={() => setIsFiltersModalOpen(true)}
        />

        <div className={styles.content}>
          <BuilderSidebar
            chartType={chartType}
            dataSourceMode={dataSourceMode}
            dataElements={dataElements}
            indicators={indicators}
            periods={periods}
            selectedDataElements={selectedDataElements}
            selectedIndicators={selectedIndicators}
            selectedPeriods={selectedPeriods}
            onDataElementsChange={setSelectedDataElements}
            onIndicatorsChange={setSelectedIndicators}
            onPeriodsChange={setSelectedPeriods}
            editableIndicatorIds={editableIndicatorIds}
            onEditIndicator={handleEditIndicator}
          />

          <BuilderMainArea
            allItems={availableLayoutItems}
            columnItems={columnItems}
            rowItems={rowItems}
            filterItems={filterItems}
            metricItems={metricItems}
            onRemoveColumnItem={(id) => setColumnItems(columnItems.filter((item) => item !== id))}
            onRemoveRowItem={(id) => setRowItems(rowItems.filter((item) => item !== id))}
            onRemoveFilterItem={(id) => setFilterItems(filterItems.filter((item) => item !== id))}
            onRemoveMetricItem={(id) => setMetricItems(metricItems.filter((item) => item !== id))}
            onMoveItem={handleMoveItem}
            entities={indicatorEntities}
            layoutFilters={layoutFilters}
            onLayoutFiltersChange={setLayoutFilters}
            isFiltersOpen={isFiltersModalOpen}
            onFiltersClose={() => setIsFiltersModalOpen(false)}
            layoutData={layoutData}
            onLayoutDataChange={setLayoutData}
            previewOptions={previewSnapshot.options}
            previewChartType={previewSnapshot.chartType}
            previewData={previewData}
            previewSeries={previewSeries}
            isPreviewStale={isPreviewStale}
            isEditing={isEditing}
            onRefreshPreview={handleRefreshPreview}
            onOpenTheme={() => setIsThemeModalOpen(true)}
            onOpenOptions={() => setIsOptionsModalOpen(true)}
            onOpenSaved={() => setIsSavedListOpen(true)}
            onSave={() => setIsSaveModalOpen(true)}
          />
        </div>
      </div>

      <VisualizationTypeModal
        isOpen={isTypeModalOpen}
        chartTypes={CHART_TYPES}
        selectedChartType={chartType}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectChartType={setChartType}
      />

      <OptionsModal
        isOpen={isOptionsModalOpen}
        chart={chart}
        onChange={setChart}
        onClose={() => setIsOptionsModalOpen(false)}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        currentColors={options.colors}
        indicatorNames={activePreviewDataIds.map((id) => {
          const item = dataElements.find((d) => d.id === id) || indicators.find((d) => d.id === id);
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
      />

      <SaveModal
        isOpen={isSaveModalOpen}
        isEditing={isEditing}
        initialName={name}
        initialDescription={description}
        initialVisualizationType={visualizationType}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleSaveConfirm}
      />

      <SavedVisualizationsModal
        isOpen={isSavedListOpen}
        savedVisualizations={savedVisualizations}
        onClose={() => setIsSavedListOpen(false)}
        onSelect={handleLoadVisualization}
      />

      <IndicatorBuilder
        isOpen={isIndicatorBuilderOpen}
        onClose={() => {
          setIsIndicatorBuilderOpen(false);
          setEditingIndicatorId(null);
        }}
        entities={indicatorEntities}
        sites={indicatorSites}
        onSaveIndicator={handleSaveIndicator}
        editingIndicatorId={editingIndicatorId}
        initialConfig={editingIndicatorId ? indicatorConfigs[editingIndicatorId] ?? null : null}
      />
    </>
  );
};

export default DatasetBuilderPage;
