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
  DimensionItem,
  StoredVisualization,
  VisualizationConfig,
  VisualizationOptions,
  VisualizationType,
} from './components/types';
import styles from '@pages/builders/DashboardBuilder/DashboardBuilderPage.module.css';
import { BuilderHeader } from './components/BuilderHeader';
import { BuilderMainArea } from './components/BuilderMainArea';
import { BuilderSidebar } from './components/BuilderSidebar';
import { VisualizationTypeModal } from './components/VisualizationTypeModal';

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
  title: 'Évolution des consultations',
  subtitle: 'Par type de service',
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

const DashboardBuilderPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('dashboard');
  const [chartType, setChartType] = useState<ChartVariant>('bar');
  const [name, setName] = useState('Nouvelle visualisation');
  const [description, setDescription] = useState('');

  const [selectedDataElements, setSelectedDataElements] = useState<string[]>(['de1', 'de2', 'de3']);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['ind1', 'ind2']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['LAST_6_MONTHS']);
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>(['ou1', 'ou2', 'ou3']);

  const [columnItems, setColumnItems] = useState<string[]>(['LAST_6_MONTHS']);
  const [rowItems, setRowItems] = useState<string[]>(['ind1', 'ind2']);
  const [filterItems, setFilterItems] = useState<string[]>(['ou1']);

  const [dataElements, setDataElements] = useState<DimensionItem[]>([]);
  const [indicators, setIndicators] = useState<DimensionItem[]>([]);
  const [periods, setPeriods] = useState<DimensionItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<DimensionItem[]>([]);
  const [savedVisualizations, setSavedVisualizations] = useState<StoredVisualization[]>([]);

  const [options, setOptions] = useState<VisualizationOptions>(DEFAULT_OPTIONS);

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

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    setIsPreviewStale(true);
  }, [
    visualizationType,
    chartType,
    name,
    description,
    selectedDataElements,
    selectedIndicators,
    selectedPeriods,
    selectedOrgUnits,
    columnItems,
    rowItems,
    filterItems,
    options,
  ]);

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

  const filteredSavedVisualizations = useMemo(
    () => savedVisualizations.filter((viz) => viz.type === visualizationType),
    [savedVisualizations, visualizationType]
  );

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

    if (fromSelection.length > 0) {
      return fromSelection;
    }

    if (previewSnapshot.chartType === 'table') {
      return [...dataElements.slice(0, 2).map((item) => item.id), ...indicators.slice(0, 2).map((item) => item.id)];
    }

    return indicators.slice(0, 4).map((item) => item.id);
  }, [previewSnapshot, dataElements, indicators]);

  const previewData = useMemo((): ChartDataItem[] => {
    const periodsForPreview =
      previewSnapshot.selectedPeriods.length > 0 ? previewSnapshot.selectedPeriods : ['THIS_MONTH'];

    if (
      previewSnapshot.chartType === 'pie' ||
      previewSnapshot.chartType === 'donut' ||
      previewSnapshot.chartType === 'treemap' ||
      previewSnapshot.chartType === 'funnel' ||
      previewSnapshot.chartType === 'radialBar'
    ) {
      return activePreviewDataIds.slice(0, 6).map((itemId, index) => {
        const item = dataElements.find((candidate) => candidate.id === itemId) ||
          indicators.find((candidate) => candidate.id === itemId);

        return {
          name: item?.name || itemId,
          value: Math.floor(Math.random() * 500) + 100,
          color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        };
      });
    }

    if (previewSnapshot.chartType === 'radar') {
      return previewSnapshot.selectedOrgUnits.slice(0, 5).map((orgUnitId) => {
        const orgUnit = orgUnits.find((item) => item.id === orgUnitId);
        const entry: ChartDataItem = { subject: orgUnit?.name || orgUnitId };

        activePreviewDataIds.slice(0, 3).forEach((dataId) => {
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

      activePreviewDataIds.slice(0, 4).forEach((dataId) => {
        const dataItem = dataElements.find((item) => item.id === dataId) || indicators.find((item) => item.id === dataId);
        entry[dataItem?.name || dataId] = Math.floor(Math.random() * 300) + 50;
      });

      return entry;
    });
  }, [activePreviewDataIds, dataElements, indicators, orgUnits, previewSnapshot]);

  const previewSeries = useMemo(() => {
    return activePreviewDataIds.slice(0, 4).map((dataId, index) => {
      const item = dataElements.find((candidate) => candidate.id === dataId) ||
        indicators.find((candidate) => candidate.id === dataId);

      return {
        dataKey: item?.name || dataId,
        name: item?.name || dataId,
        color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        type: previewSnapshot.chartType === 'composed' ? ((index === 0 ? 'bar' : 'line') as 'bar' | 'line') : undefined,
      };
    });
  }, [activePreviewDataIds, dataElements, indicators, previewSnapshot.chartType]);

  const handleSave = useCallback(() => {
    const config: VisualizationConfig = {
      name,
      description,
      type: visualizationType,
      chartType,
      columns: [{ dimension: 'pe', items: columnItems }],
      rows: [{ dimension: 'dx', items: rowItems }],
      filters: [{ dimension: 'ou', items: filterItems }],
      options,
    };

    const now = new Date().toISOString();
    const storedVisualization: StoredVisualization = {
      id: `viz-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...config,
    };

    try {
      db.create<StoredVisualization>('visualizations', storedVisualization);
      setSavedVisualizations((previous) => [storedVisualization, ...previous]);
      showSuccess(`Visualisation sauvegardée : "${name}"`);
    } catch (error) {
      console.error('[VisualizationsTab] Failed to save visualization', error);
      showError('Impossible de sauvegarder la visualisation.');
    }
  }, [name, description, visualizationType, chartType, columnItems, rowItems, filterItems, options, showSuccess, showError]);

  const handleReset = useCallback(() => {
    setName('Nouvelle visualisation');
    setDescription('');
    setChartType('bar');
    setSelectedDataElements(['de1', 'de2', 'de3']);
    setSelectedIndicators(['ind1', 'ind2']);
    setSelectedPeriods(['LAST_6_MONTHS']);
    setSelectedOrgUnits(['ou1', 'ou2', 'ou3']);
    setColumnItems(['LAST_6_MONTHS']);
    setRowItems(['ind1', 'ind2']);
    setFilterItems(['ou1']);
    setOptions(DEFAULT_OPTIONS);
  }, []);

  return (
    <>
      <div className={styles.container}>
        <BuilderHeader
          name={name}
          description={description}
          visualizationType={visualizationType}
          onNameChange={(event) => setName(event.target.value)}
          onDescriptionChange={(event) => setDescription(event.target.value)}
          onOpenTypeModal={() => setIsTypeModalOpen(true)}
        />

        <div className={styles.content}>
          <BuilderSidebar
            chartTypes={CHART_TYPES}
            chartType={chartType}
            onChartTypeChange={setChartType}
            filteredSavedVisualizations={filteredSavedVisualizations}
            dataElements={dataElements}
            indicators={indicators}
            periods={periods}
            orgUnits={orgUnits}
            selectedDataElements={selectedDataElements}
            selectedIndicators={selectedIndicators}
            selectedPeriods={selectedPeriods}
            selectedOrgUnits={selectedOrgUnits}
            onDataElementsChange={setSelectedDataElements}
            onIndicatorsChange={setSelectedIndicators}
            onPeriodsChange={setSelectedPeriods}
            onOrgUnitsChange={setSelectedOrgUnits}
          />

          <BuilderMainArea
            allItems={availableLayoutItems}
            columnItems={columnItems}
            rowItems={rowItems}
            filterItems={filterItems}
            onRemoveColumnItem={(id) => setColumnItems(columnItems.filter((item) => item !== id))}
            onRemoveRowItem={(id) => setRowItems(rowItems.filter((item) => item !== id))}
            onRemoveFilterItem={(id) => setFilterItems(filterItems.filter((item) => item !== id))}
            options={options}
            previewOptions={previewSnapshot.options}
            onOptionsChange={setOptions}
            previewChartType={previewSnapshot.chartType}
            previewData={previewData}
            previewSeries={previewSeries}
            isPreviewStale={isPreviewStale}
            onRefreshPreview={handleRefreshPreview}
            onSave={handleSave}
            onReset={handleReset}
          />
        </div>
      </div>

      <VisualizationTypeModal
        isOpen={isTypeModalOpen}
        selectedType={visualizationType}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectType={setVisualizationType}
      />
    </>
  );
};

export default DashboardBuilderPage;
