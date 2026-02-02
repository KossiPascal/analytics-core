import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { useNotification } from '@/contexts/OLD/useNotification';
import {
  db,
  initializeTestData,
  type VisualizationDimensionItem,
} from '@/utils/TestData';
import {
  Chart,
  CHART_COLORS,
  type ChartType,
  type ChartDataItem,
} from '@components/charts';
import styles from '@pages/admins/AdminPage.module.css';

// ============================================================================
// TYPES
// ============================================================================

type VisualizationType = 'dashboard' | 'report';

type ChartVariant =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'radialBar'
  | 'scatter'
  | 'composed'
  | 'treemap'
  | 'funnel'
  | 'table';

interface DataDimension {
  id: string;
  name: string;
  type: 'data' | 'period' | 'orgUnit';
  items: DimensionItem[];
}

interface DimensionItem {
  id: string;
  name: string;
  code?: string;
  selected?: boolean;
}

interface LayoutDimension {
  dimension: string;
  items: string[];
}

interface VisualizationConfig {
  id?: string;
  name: string;
  description?: string;
  type: VisualizationType;
  chartType: ChartVariant;
  columns: LayoutDimension[];
  rows: LayoutDimension[];
  filters: LayoutDimension[];
  options: VisualizationOptions;
}

interface VisualizationOptions {
  title?: string;
  subtitle?: string;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  stacked: boolean;
  animation: boolean;
  colors?: string[];
}

interface StoredVisualization extends VisualizationConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CHART TYPE OPTIONS
// ============================================================================

interface ChartTypeOption {
  id: ChartVariant;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'trend' | 'comparison' | 'composition' | 'distribution' | 'other';
}

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
// HELPER COMPONENTS
// ============================================================================

interface DimensionSelectorProps {
  title: string;
  icon: React.ReactNode;
  items: DimensionItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  searchPlaceholder?: string;
}

function DimensionSelector({
  title,
  icon,
  items,
  selectedItems,
  onSelectionChange,
  searchPlaceholder = 'Rechercher...',
}: DimensionSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.code?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const handleToggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredItems.map((item) => item.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={vizStyles.dimensionSelector}>
      <button
        type="button"
        className={vizStyles.dimensionHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={vizStyles.dimensionIcon}>{icon}</span>
        <span className={vizStyles.dimensionTitle}>{title}</span>
        <span className={vizStyles.dimensionCount}>
          {selectedItems.length > 0 && (
            <span className={vizStyles.countBadge}>{selectedItems.length}</span>
          )}
        </span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isExpanded && (
        <div className={vizStyles.dimensionContent}>
          <div className={vizStyles.dimensionSearch}>
            <Search size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className={vizStyles.dimensionActions}>
            <button type="button" onClick={handleSelectAll}>
              Tout sélectionner
            </button>
            <button type="button" onClick={handleDeselectAll}>
              Tout désélectionner
            </button>
          </div>

          <div className={vizStyles.dimensionItems}>
            {filteredItems.map((item) => (
              <label key={item.id} className={vizStyles.dimensionItem}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleToggleItem(item.id)}
                />
                <span className={vizStyles.itemName}>{item.name}</span>
                {item.code && (
                  <span className={vizStyles.itemCode}>{item.code}</span>
                )}
              </label>
            ))}
            {filteredItems.length === 0 && (
              <div className={vizStyles.noResults}>Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LayoutDropZoneProps {
  title: string;
  items: string[];
  allItems: DimensionItem[];
  onRemove: (itemId: string) => void;
  placeholder?: string;
}

function LayoutDropZone({
  title,
  items,
  allItems,
  onRemove,
  placeholder = 'Glissez des éléments ici',
}: LayoutDropZoneProps) {
  const getItemName = (id: string) => {
    const item = allItems.find((i) => i.id === id);
    return item?.name || id;
  };

  return (
    <div className={vizStyles.layoutZone}>
      <div className={vizStyles.layoutZoneHeader}>{title}</div>
      <div className={vizStyles.layoutZoneContent}>
        {items.length === 0 ? (
          <div className={vizStyles.layoutPlaceholder}>{placeholder}</div>
        ) : (
          items.map((itemId) => (
            <div key={itemId} className={vizStyles.layoutItem}>
              <GripVertical size={14} />
              <span>{getItemName(itemId)}</span>
              <button
                type="button"
                onClick={() => onRemove(itemId)}
                className={vizStyles.removeItemBtn}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CUSTOM STYLES (inline for this component)
// ============================================================================

const vizStyles: Record<string, string> = {
  container: 'viz-container',
  header: 'viz-header',
  content: 'viz-content',
  sidebar: 'viz-sidebar',
  mainArea: 'viz-main-area',
  section: 'viz-section',
  sectionTitle: 'viz-section-title',
  typeSelector: 'viz-type-selector',
  typeOption: 'viz-type-option',
  typeOptionActive: 'viz-type-option-active',
  chartTypeGrid: 'viz-chart-type-grid',
  chartTypeCard: 'viz-chart-type-card',
  chartTypeCardActive: 'viz-chart-type-card-active',
  dimensionSelector: 'viz-dimension-selector',
  dimensionHeader: 'viz-dimension-header',
  dimensionIcon: 'viz-dimension-icon',
  dimensionTitle: 'viz-dimension-title',
  dimensionCount: 'viz-dimension-count',
  countBadge: 'viz-count-badge',
  dimensionContent: 'viz-dimension-content',
  dimensionSearch: 'viz-dimension-search',
  dimensionActions: 'viz-dimension-actions',
  dimensionItems: 'viz-dimension-items',
  dimensionItem: 'viz-dimension-item',
  itemName: 'viz-item-name',
  itemCode: 'viz-item-code',
  noResults: 'viz-no-results',
  layoutSection: 'viz-layout-section',
  layoutZone: 'viz-layout-zone',
  layoutZoneHeader: 'viz-layout-zone-header',
  layoutZoneContent: 'viz-layout-zone-content',
  layoutPlaceholder: 'viz-layout-placeholder',
  layoutItem: 'viz-layout-item',
  removeItemBtn: 'viz-remove-item-btn',
  previewSection: 'viz-preview-section',
  previewHeader: 'viz-preview-header',
  previewContent: 'viz-preview-content',
  optionsPanel: 'viz-options-panel',
  optionRow: 'viz-option-row',
  actions: 'viz-actions',
  tablePreview: 'viz-table-preview',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VisualizationsTab() {
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

  // Render chart preview
  const renderChartPreview = () => {
    if (chartType === 'table') {
      return (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Indicateur</th>
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'].map((month) => (
                  <th key={month}>{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewSeries.slice(0, 5).map((s) => (
                <tr key={s.dataKey}>
                  <td>{s.name}</td>
                  {Array.from({ length: 6 }, (_, i) => (
                    <td key={i}>{Math.floor(Math.random() * 300) + 50}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const chartProps = {
      data: previewData,
      height: 350,
      title: options.title,
      subtitle: options.subtitle,
      legend: { enabled: options.showLegend },
      tooltip: { enabled: options.showTooltip },
      grid: { horizontal: options.showGrid, vertical: false },
      animation: { enabled: options.animation },
      colors: CHART_COLORS.primary,
    };

    const needsDataKey = ['pie', 'donut', 'radialBar', 'treemap', 'funnel'].includes(chartType);
    const needsSeries = ['line', 'area', 'bar', 'radar', 'scatter', 'composed'].includes(chartType);

    return (
      <Chart
        type={chartType as ChartType}
        {...chartProps}
        series={needsSeries ? previewSeries : undefined}
        dataKey={needsDataKey ? 'value' : undefined}
        nameKey={needsDataKey ? 'name' : undefined}
        xAxis={{ dataKey: chartType === 'radar' ? undefined : 'name' }}
        options={{
          stacked: options.stacked,
          polarAngleAxisKey: chartType === 'radar' ? 'subject' : undefined,
          xAxisKey: chartType === 'scatter' ? 'x' : undefined,
          yAxisKey: chartType === 'scatter' ? 'y' : undefined,
        }}
      />
    );
  };

  return (
    <>
      <style>{`
        .viz-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .viz-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .viz-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .viz-content {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .viz-content {
            grid-template-columns: 350px 1fr;
          }
        }

        .viz-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .viz-main-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .viz-section {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .viz-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .viz-section-title svg {
          color: #3b82f6;
        }

        .viz-type-selector {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
        }

        .viz-type-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .viz-type-option:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .viz-type-option-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .viz-type-option svg {
          color: #64748b;
        }

        .viz-type-option-active svg {
          color: #3b82f6;
        }

        .viz-type-option span {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
        }

        .viz-type-option-active span {
          color: #3b82f6;
        }

        .viz-saved-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }

        .viz-saved-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: #ffffff;
        }

        .viz-saved-item-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .viz-saved-item-description {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .viz-saved-item-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .viz-saved-empty {
          padding: 0.75rem;
          font-size: 0.8125rem;
          color: #94a3b8;
          border: 1px dashed #e2e8f0;
          border-radius: 0.5rem;
          text-align: center;
        }

        .viz-chart-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
          padding: 1rem;
        }

        .viz-chart-type-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          padding: 0.75rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .viz-chart-type-card:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .viz-chart-type-card-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .viz-chart-type-card svg {
          color: #64748b;
        }

        .viz-chart-type-card-active svg {
          color: #3b82f6;
        }

        .viz-chart-type-card span {
          font-size: 0.6875rem;
          font-weight: 500;
          color: #64748b;
          text-align: center;
        }

        .viz-chart-type-card-active span {
          color: #3b82f6;
        }

        .viz-dimension-selector {
          border-bottom: 1px solid #e2e8f0;
        }

        .viz-dimension-selector:last-child {
          border-bottom: none;
        }

        .viz-dimension-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          text-align: left;
          transition: background 0.2s;
        }

        .viz-dimension-header:hover {
          background: #f8fafc;
        }

        .viz-dimension-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 0.375rem;
          background: #eff6ff;
          color: #3b82f6;
        }

        .viz-dimension-title {
          flex: 1;
        }

        .viz-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 0.375rem;
          border-radius: 9999px;
          background: #3b82f6;
          color: white;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .viz-dimension-content {
          padding: 0 1rem 1rem;
        }

        .viz-dimension-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          background: white;
          margin-bottom: 0.75rem;
        }

        .viz-dimension-search svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .viz-dimension-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.875rem;
          background: transparent;
        }

        .viz-dimension-search button {
          padding: 0.125rem;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
        }

        .viz-dimension-search button:hover {
          color: #64748b;
        }

        .viz-dimension-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .viz-dimension-actions button {
          padding: 0;
          border: none;
          background: transparent;
          font-size: 0.75rem;
          color: #3b82f6;
          cursor: pointer;
        }

        .viz-dimension-actions button:hover {
          text-decoration: underline;
        }

        .viz-dimension-items {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .viz-dimension-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .viz-dimension-item:hover {
          background: #f8fafc;
        }

        .viz-dimension-item input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .viz-item-name {
          flex: 1;
          font-size: 0.8125rem;
          color: #1e293b;
        }

        .viz-item-code {
          font-size: 0.6875rem;
          color: #94a3b8;
          font-family: monospace;
        }

        .viz-no-results {
          padding: 1rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .viz-layout-section {
          display: grid;
          gap: 1rem;
          padding: 1rem;
        }

        @media (min-width: 640px) {
          .viz-layout-section {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .viz-layout-zone {
          border: 1px dashed #e2e8f0;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .viz-layout-zone-header {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .viz-layout-zone-content {
          min-height: 80px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .viz-layout-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 60px;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .viz-layout-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.5rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #1e40af;
        }

        .viz-layout-item svg {
          color: #93c5fd;
          cursor: grab;
        }

        .viz-layout-item span {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .viz-remove-item-btn {
          padding: 0.125rem;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #93c5fd;
          display: flex;
          align-items: center;
        }

        .viz-remove-item-btn:hover {
          color: #ef4444;
        }

        .viz-preview-section {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .viz-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .viz-preview-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .viz-preview-header h3 svg {
          color: #3b82f6;
        }

        .viz-preview-content {
          padding: 1.5rem;
          min-height: 400px;
        }

        .viz-options-panel {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .viz-option-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .viz-option-row label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: #64748b;
          cursor: pointer;
        }

        .viz-option-row input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .viz-option-row input[type="text"] {
          flex: 1;
          min-width: 200px;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .viz-option-row input[type="text"]:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .viz-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>

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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nom de la visualisation</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Entrez un nom..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description (optionnel)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre visualisation..."
                />
              </div>
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
                  <label>
                    Titre:
                    <input
                      type="text"
                      value={options.title || ''}
                      onChange={(e) => setOptions({ ...options, title: e.target.value })}
                      placeholder="Titre du graphique"
                    />
                  </label>
                </div>
                <div className="viz-option-row">
                  <label>
                    Sous-titre:
                    <input
                      type="text"
                      value={options.subtitle || ''}
                      onChange={(e) => setOptions({ ...options, subtitle: e.target.value })}
                      placeholder="Sous-titre du graphique"
                    />
                  </label>
                </div>
                <div className="viz-option-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={options.showLegend}
                      onChange={(e) => setOptions({ ...options, showLegend: e.target.checked })}
                    />
                    Afficher la légende
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={options.showTooltip}
                      onChange={(e) => setOptions({ ...options, showTooltip: e.target.checked })}
                    />
                    Afficher l'infobulle
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={options.showGrid}
                      onChange={(e) => setOptions({ ...options, showGrid: e.target.checked })}
                    />
                    Afficher la grille
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={options.stacked}
                      onChange={(e) => setOptions({ ...options, stacked: e.target.checked })}
                    />
                    Empilé
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={options.animation}
                      onChange={(e) => setOptions({ ...options, animation: e.target.checked })}
                    />
                    Animation
                  </label>
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
                {renderChartPreview()}
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
