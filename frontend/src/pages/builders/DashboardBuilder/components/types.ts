
// ============================================================================
// TYPES
// ============================================================================

export type VisualizationType = 'dashboard' | 'report';

export type DataSourceMode = 'matview' | 'indicators';

export type ChartVariant =
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

 export interface DataDimension {
  id: string;
  name: string;
  type: 'data' | 'period' | 'orgUnit';
  items: DimensionItem[];
}

 export interface DimensionItem {
  id: string;
  name: string;
  code?: string;
  selected?: boolean;
}

 export interface LayoutDimension {
  dimension: string;
  items: string[];
}

 export interface VisualizationConfig {
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

 export interface VisualizationOptions {
  title?: string;
  subtitle?: string;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  stacked: boolean;
  animation: boolean;
  colors?: string[];
}

 export interface StoredVisualization extends VisualizationConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CHART TYPE OPTIONS
// ============================================================================

 export interface ChartTypeOption {
  id: ChartVariant;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'trend' | 'comparison' | 'composition' | 'distribution' | 'other';
}



 export interface DimensionSelectorProps {
  title: string;
  icon: React.ReactNode;
  items: DimensionItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  searchPlaceholder?: string;
  singleSelect?: boolean;
  editableItemIds?: Set<string>;
  onEditItem?: (itemId: string) => void;
}

export type LayoutZone = 'column' | 'row' | 'filter';

 export interface LayoutDropZoneProps {
  zone: LayoutZone;
  title: string;
  items: string[];
  allItems: DimensionItem[];
  onRemove: (itemId: string) => void;
  onMoveItem: (itemId: string, fromZone: LayoutZone, toZone: LayoutZone) => void;
  placeholder?: string;
}