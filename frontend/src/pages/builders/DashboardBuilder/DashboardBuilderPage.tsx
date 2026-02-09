import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Activity,
  TrendingUp,
  GitBranch,
  Grid3x3,
  Target,
  Filter,
  Calendar,
  Building2,
  Database,
  Plus,
  Trash2,
  Save,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  GripVertical,
  Settings,
  Layers,
  Table,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import { useNotification } from '@contexts/OLD/useNotification';
import {
  db,
  initializeTestData,
  type VisualizationDimensionItem,
} from '@/utils/TestData';
import { CHART_COLORS } from '@components/charts/theme';
import type { ChartType, ChartDataItem } from '@components/charts/types';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { RenderChartPreview } from './components/RenderChartPreview';
import { DimensionSelector } from './components/DimensionSelector';
import { LayoutDropZone } from './components/LayoutDropZone';

import type { ChartTypeOption, ChartVariant, DimensionItem, StoredVisualization, VisualizationConfig, VisualizationOptions, VisualizationType } from './components/types';

import styles from '@pages/builders/DashboardBuilder/DashboardBuilder.module.css';
import { vizStyles } from './components/vizStyles';
import './Viz.css';
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


// ============================================================================
// MAIN COMPONENT
// ============================================================================
const DashboardBuilderPage: React.FC = () =>{
  const { showSuccess, showError } = useNotification();

  // State
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('dashboard');
  const [chartType, setChartType] = useState<ChartVariant>('bar');
  const [name, setName] = useState('Nouvelle visualisation');
  const [description, setDescription] = useState('');

  // Selected dimensions
  const [selectedDataElements, setSelectedDataElements] = useState<string[]>(['de1', 'de2', 'de3']);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['LAST_6_MONTHS']);
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>(['ou1', 'ou2', 'ou3']);

  // Layout
  const [columnItems, setColumnItems] = useState<string[]>(['LAST_6_MONTHS']);
  const [rowItems, setRowItems] = useState<string[]>(['de1', 'de2', 'de3']);
  const [filterItems, setFilterItems] = useState<string[]>(['ou1']);

  // Dimension data
  const [dataElements, setDataElements] = useState<DimensionItem[]>([]);
  const [indicators, setIndicators] = useState<DimensionItem[]>([]);
  const [periods, setPeriods] = useState<DimensionItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<DimensionItem[]>([]);
  const [savedVisualizations, setSavedVisualizations] = useState<StoredVisualization[]>([]);

  // Options
  const [options, setOptions] = useState<VisualizationOptions>({
    title: 'Évolution des consultations',
    subtitle: 'Par type de service',
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    stacked: false,
    animation: true,
  });

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
      showError("Impossible de charger les données locales pour les visualisations.");
    }
  }, [loadSavedVisualizations, showError]);

  // Get all items for lookup
  const allItems = useMemo(() => [
    ...dataElements,
    ...indicators,
    ...periods,
    ...orgUnits,
  ], [dataElements, indicators, periods, orgUnits]);

  const filteredSavedVisualizations = useMemo(
    () => savedVisualizations.filter((viz) => viz.type === visualizationType),
    [savedVisualizations, visualizationType]
  );

  // Generate preview data based on selections
  const previewData = useMemo((): ChartDataItem[] => {
    // Generate mock data based on selected items
    const dataItems = [...selectedDataElements, ...selectedIndicators];
    const periods = selectedPeriods.length > 0 ? selectedPeriods : ['THIS_MONTH'];

    if (chartType === 'pie' || chartType === 'donut' || chartType === 'treemap' || chartType === 'funnel' || chartType === 'radialBar') {
      // For pie-like charts, use data items as categories
      return dataItems.slice(0, 6).map((itemId, index) => {
        const item = dataElements.find(d => d.id === itemId) ||
                     indicators.find(i => i.id === itemId);
        return {
          name: item?.name || itemId,
          value: Math.floor(Math.random() * 500) + 100,
          color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        };
      });
    }

    if (chartType === 'radar') {
      // For radar, use org units as subjects
      return selectedOrgUnits.slice(0, 5).map((ouId) => {
        const ou = orgUnits.find(o => o.id === ouId);
        const entry: ChartDataItem = { subject: ou?.name || ouId };
        dataItems.slice(0, 3).forEach((dataId) => {
          const dataItem = dataElements.find(d => d.id === dataId);
          entry[dataItem?.name || dataId] = Math.floor(Math.random() * 100) + 20;
        });
        return entry;
      });
    }

    if (chartType === 'scatter') {
      // For scatter, generate x, y pairs
      return Array.from({ length: 20 }, (_, i) => ({
        name: `Point ${i + 1}`,
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        z: Math.floor(Math.random() * 50) + 10,
      }));
    }

    // For line, area, bar, composed charts - time series data
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return monthNames.slice(0, 6).map((month) => {
      const entry: ChartDataItem = { name: month };
      dataItems.slice(0, 4).forEach((dataId) => {
        const dataItem = dataElements.find(d => d.id === dataId) ||
                        indicators.find(i => i.id === dataId);
        entry[dataItem?.name || dataId] = Math.floor(Math.random() * 300) + 50;
      });
      return entry;
    });
  }, [selectedDataElements, selectedIndicators, selectedPeriods, selectedOrgUnits, chartType]);

  // Generate series config
  const previewSeries = useMemo(() => {
    const dataItems = [...selectedDataElements, ...selectedIndicators];
    return dataItems.slice(0, 4).map((dataId, index) => {
      const item = dataElements.find(d => d.id === dataId) ||
                   indicators.find(i => i.id === dataId);
      return {
        dataKey: item?.name || dataId,
        name: item?.name || dataId,
        color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        type: chartType === 'composed' ? (index === 0 ? 'bar' : 'line') as 'bar' | 'line' : undefined,
      };
    });
  }, [selectedDataElements, selectedIndicators, chartType]);

  // Handlers
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

    console.log('Saving visualization:', config);
    const now = new Date().toISOString();
    const storedVisualization: StoredVisualization = {
      id: `viz-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...config,
    };

    try {
      db.create<StoredVisualization>('visualizations', storedVisualization);
      setSavedVisualizations((prev) => [storedVisualization, ...prev]);
    } catch (error) {
      console.error('[VisualizationsTab] Failed to save visualization', error);
      showError('Impossible de sauvegarder la visualisation.');
      return;
    }
    showSuccess(`Visualisation sauvegardée : "${name}"`);
  }, [name, description, visualizationType, chartType, columnItems, rowItems, filterItems, options, showSuccess, showError]);

  const handleReset = useCallback(() => {
    setName('Nouvelle visualisation');
    setDescription('');
    setChartType('bar');
    setSelectedDataElements([]);
    setSelectedIndicators([]);
    setSelectedPeriods(['THIS_MONTH']);
    setSelectedOrgUnits([]);
    setColumnItems([]);
    setRowItems([]);
    setFilterItems([]);
    setOptions({
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      stacked: false,
      animation: true,
    });
  }, []);



  return (
    <>

      <div className={vizStyles.container}>
        {/* Header */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Layers size={24} />
              Créateur de visualisation
            </h2>
          </div>

          <div className={styles.form}>
            <div className={`${styles.grid} ${styles.grid2}`}>
              <FormInput
                label="Nom de la visualisation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez un nom..."
              />
              <FormInput
                label="Description (optionnel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre visualisation..."
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="viz-content">
          {/* Sidebar */}
          <div className="viz-sidebar">
            {/* Visualization Type */}
            <div className="viz-section">
              <div className="viz-section-title">
                <FileText size={18} />
                Type de visualisation
              </div>
              <div className="viz-type-selector">
                <button
                  type="button"
                  className={`viz-type-option ${visualizationType === 'dashboard' ? 'viz-type-option-active' : ''}`}
                  onClick={() => setVisualizationType('dashboard')}
                >
                  <LayoutDashboard size={24} />
                  <span>Tableau de bord</span>
                </button>
                <button
                  type="button"
                  className={`viz-type-option ${visualizationType === 'report' ? 'viz-type-option-active' : ''}`}
                  onClick={() => setVisualizationType('report')}
                >
                  <FileText size={24} />
                  <span>Rapport</span>
                </button>
              </div>
            </div>

            <div className="viz-section">
              <div className="viz-section-title">
                <Layers size={18} />
                Visualisations sauvegardées
              </div>
              <div className="viz-saved-list">
                {filteredSavedVisualizations.length === 0 ? (
                  <div className="viz-saved-empty">
                    Aucune visualisation pour ce type.
                  </div>
                ) : (
                  filteredSavedVisualizations.map((viz) => (
                    <div key={viz.id} className="viz-saved-item">
                      <div className="viz-saved-item-title">{viz.name}</div>
                      {viz.description && (
                        <div className="viz-saved-item-description">{viz.description}</div>
                      )}
                      <div className="viz-saved-item-meta">
                        <span>{viz.chartType}</span>
                        <span>•</span>
                        <span>{new Date(viz.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chart Type */}
            <div className="viz-section">
              <div className="viz-section-title">
                <BarChart3 size={18} />
                Type de graphique
              </div>
              <div className="viz-chart-type-grid">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`viz-chart-type-card ${chartType === type.id ? 'viz-chart-type-card-active' : ''}`}
                    onClick={() => setChartType(type.id)}
                    title={type.description}
                  >
                    {type.icon}
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Dimensions */}
            <div className="viz-section">
              <div className="viz-section-title">
                <Database size={18} />
                Dimensions de données
              </div>

              <DimensionSelector
                title="Éléments de données"
                icon={<Database size={16} />}
                items={dataElements}
                selectedItems={selectedDataElements}
                onSelectionChange={setSelectedDataElements}
                searchPlaceholder="Rechercher un élément..."
              />

              <DimensionSelector
                title="Indicateurs"
                icon={<TrendingUp size={16} />}
                items={indicators}
                selectedItems={selectedIndicators}
                onSelectionChange={setSelectedIndicators}
                searchPlaceholder="Rechercher un indicateur..."
              />

              <DimensionSelector
                title="Périodes"
                icon={<Calendar size={16} />}
                items={periods}
                selectedItems={selectedPeriods}
                onSelectionChange={setSelectedPeriods}
                searchPlaceholder="Rechercher une période..."
              />

              <DimensionSelector
                title="Unités d'organisation"
                icon={<Building2 size={16} />}
                items={orgUnits}
                selectedItems={selectedOrgUnits}
                onSelectionChange={setSelectedOrgUnits}
                searchPlaceholder="Rechercher une unité..."
              />
            </div>
          </div>

          {/* Main Area */}
          <div className="viz-main-area">
            {/* Layout Configuration */}
            <div className="viz-section">
              <div className="viz-section-title">
                <Grid3x3 size={18} />
                Configuration de la mise en page
              </div>
              <div className="viz-layout-section">
                <LayoutDropZone
                  title="Colonnes"
                  items={columnItems}
                  allItems={allItems}
                  onRemove={(id) => setColumnItems(columnItems.filter((i) => i !== id))}
                  placeholder="Colonnes"
                />
                <LayoutDropZone
                  title="Lignes"
                  items={rowItems}
                  allItems={allItems}
                  onRemove={(id) => setRowItems(rowItems.filter((i) => i !== id))}
                  placeholder="Lignes"
                />
                <LayoutDropZone
                  title="Filtres"
                  items={filterItems}
                  allItems={allItems}
                  onRemove={(id) => setFilterItems(filterItems.filter((i) => i !== id))}
                  placeholder="Filtres"
                />
              </div>

              <div className={styles.alert + ' ' + styles.alertInfo} style={{ margin: '0 1rem 1rem' }}>
                <Filter size={18} />
                <div>
                  <strong>Astuce :</strong> Sélectionnez des éléments dans les dimensions ci-dessus,
                  puis réorganisez-les dans les zones Colonnes, Lignes et Filtres pour personnaliser
                  l'affichage de vos données.
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="viz-section">
              <div className="viz-section-title">
                <Settings size={18} />
                Options d'affichage
              </div>
              <div className="viz-options-panel">
                <div className="viz-option-row">
                  <FormInput
                    label="Titre"
                    value={options.title || ''}
                    onChange={(e) => setOptions({ ...options, title: e.target.value })}
                    placeholder="Titre du graphique"
                  />
                </div>
                <div className="viz-option-row">
                  <FormInput
                    label="Sous-titre"
                    value={options.subtitle || ''}
                    onChange={(e) => setOptions({ ...options, subtitle: e.target.value })}
                    placeholder="Sous-titre du graphique"
                  />
                </div>
                <div className="viz-option-row">
                  <FormCheckbox
                    label="Afficher la légende"
                    checked={options.showLegend}
                    onChange={(e) => setOptions({ ...options, showLegend: e.target.checked })}
                  />
                  <FormCheckbox
                    label="Afficher l'infobulle"
                    checked={options.showTooltip}
                    onChange={(e) => setOptions({ ...options, showTooltip: e.target.checked })}
                  />
                  <FormCheckbox
                    label="Afficher la grille"
                    checked={options.showGrid}
                    onChange={(e) => setOptions({ ...options, showGrid: e.target.checked })}
                  />
                  <FormCheckbox
                    label="Empilé"
                    checked={options.stacked}
                    onChange={(e) => setOptions({ ...options, stacked: e.target.checked })}
                  />
                  <FormCheckbox
                    label="Animation"
                    checked={options.animation}
                    onChange={(e) => setOptions({ ...options, animation: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="viz-preview-section">
              <div className="viz-preview-header">
                <h3>
                  <Eye size={18} />
                  Aperçu
                </h3>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`}
                  onClick={() => {
                    // Force re-render with new random data
                    setSelectedDataElements([...selectedDataElements]);
                  }}
                >
                  <RefreshCw size={16} />
                  Actualiser
                </button>
              </div>
              <div className="viz-preview-content">
                <RenderChartPreview chartType={chartType} previewData={previewData} previewSeries={previewSeries} options={options} />
              </div>

              {/* Actions */}
              <div className="viz-actions">
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleSave}
                >
                  <Save size={18} />
                  Sauvegarder
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={handleReset}
                >
                  <Trash2 size={18} />
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardBuilderPage;
