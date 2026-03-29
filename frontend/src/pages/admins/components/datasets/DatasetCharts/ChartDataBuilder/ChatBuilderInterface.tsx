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
import type {
  ChartTypeOption,
  ChartVariant,
  DimensionItem,
  LayoutZone,
  StoredVisualization,
  VisualizationConfig,
  VisualizationOptions,
  VisualizationType,
} from './components/types';
import styles from './ChatBuilderInterface.module.css';
import { BuilderMainArea } from './components/BuilderMainArea/BuilderMainArea';
import { BuilderSidebar } from './components/BuilderSidebar/BuilderSidebar';
import { SavedVisualizationsModal } from './components/SavedVisualizationsModal/SavedVisualizationsModal';
import type { DefinitionEntry } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';
import { DatasetChart, Dataset, DatasetQuery, ExecuteChartResponse, ChartStructureFilter } from '@/models/dataset.models';
import { Tenant } from '@/models/identity.model';
import { db } from '@/utils/TestData';

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
  const { showSuccess, showError } = useNotification();

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

  // Dimension selections
  const [selectedDataElements, setSelectedDataElements] = useState<string[]>(['de1', 'de2', 'de3']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['LAST_6_MONTHS']);

  // Layout
  const [columnItems, setColumnItems] = useState<string[]>(['LAST_6_MONTHS']);
  const [rowItems, setRowItems] = useState<string[]>(['ind1', 'ind2']);
  const [filterItems, setFilterItems] = useState<string[]>(['ou1']);

  // Layout data (from DefinitionItemForm modal)
  const [layoutData, setLayoutData] = useState<DefinitionEntry[]>([]);
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>(['ou1', 'ou2', 'ou3']);





  const [isPreviewStale, setIsPreviewStale] = useState(false);


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

    setIsPreviewStale(false);
  }, [chartType, selectedDataElements, selectedPeriods, selectedOrgUnits]);


const filterOne: ChartStructureFilter[] = [
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


const handleFiltersStore = ()=>{

}

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <BuilderSidebar
            chartType={chartType}
            chartTypes={CHART_TYPES}
            filters={filterOne}
            onFilterChange={handleFiltersStore}
            toogleChartTypeModal={() => setIsTypeModalOpen(true)}
          />

          <BuilderMainArea
            allItems={availableLayoutItems}
            columnItems={columnItems}
            rowItems={rowItems}
            filterItems={filterItems}
            onRemoveColumnItem={(id) => setColumnItems(columnItems.filter((item) => item !== id))}
            onRemoveRowItem={(id) => setRowItems(rowItems.filter((item) => item !== id))}
            onRemoveFilterItem={(id) => setFilterItems(filterItems.filter((item) => item !== id))}
            onMoveItem={handleMoveItem}
            entities={[]}
            layoutData={layoutData}
            onLayoutDataChange={setLayoutData}
            previewOptions={{} as any}
            previewChartType={"bar"}
            previewData={[]}
            previewSeries={[]}
            isPreviewStale={true}
            isEditing={isEditing}
            onRefreshPreview={handleRefreshPreview}
            onOpenTheme={() => setIsThemeModalOpen(true)}
            onOpenOptions={() => setIsOptionsModalOpen(true)}
            onOpenSaved={() => setIsSavedListOpen(true)}
            onSave={() => setIsSaveModalOpen(true)}
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
