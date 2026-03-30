import React from 'react';

import { LayoutConfiguration } from '../LayoutConfiguration/LayoutConfiguration';
import { PreviewSection } from '../PreviewSection/PreviewSection';
import type { IndicatorFilter } from '../IndicatorBuilder/IndicatorFilterBuilder';
import type { DefinitionEntry } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';
import type { SidebarEntity } from '../IndicatorBuilder/IndicatorBuilder';
import type { ChartVariant, DimensionItem, LayoutZone, VisualizationOptions } from '../types';
import styles from './BuilderMainArea.module.css';

interface BuilderMainAreaProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  metricItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
  onRemoveMetricItem: (id: string) => void;
  onMoveItem: (itemId: string, fromZone: LayoutZone, toZone: LayoutZone) => void;
  entities: SidebarEntity[];
  layoutFilters: IndicatorFilter[];
  onLayoutFiltersChange: (filters: IndicatorFilter[]) => void;
  isFiltersOpen: boolean;
  onFiltersClose: () => void;
  layoutData: DefinitionEntry[];
  onLayoutDataChange: (data: DefinitionEntry[]) => void;
  previewChartType: ChartVariant;
  previewData: any[];
  previewSeries: any[];
  previewOptions: VisualizationOptions;
  isPreviewStale: boolean;
  isEditing: boolean;
  onRefreshPreview: () => void;
  onOpenTheme: () => void;
  onOpenOptions: () => void;
  onOpenSaved: () => void;
  onSave: () => void;
}

export const BuilderMainArea: React.FC<BuilderMainAreaProps> = ({
  allItems,
  columnItems,
  rowItems,
  filterItems,
  metricItems,
  onRemoveColumnItem,
  onRemoveRowItem,
  onRemoveFilterItem,
  onRemoveMetricItem,
  onMoveItem,
  entities,
  layoutFilters,
  onLayoutFiltersChange,
  isFiltersOpen,
  onFiltersClose,
  layoutData,
  onLayoutDataChange,
  previewChartType,
  previewData,
  previewSeries,
  previewOptions,
  isPreviewStale,
  isEditing,
  onRefreshPreview,
  onOpenTheme,
  onOpenOptions,
  onOpenSaved,
  onSave,
}) => {
  return (
    <div className={styles.mainArea}>
      <LayoutConfiguration
        allItems={allItems}
        columnItems={columnItems}
        rowItems={rowItems}
        filterItems={filterItems}
        metricItems={metricItems}
        onRemoveColumnItem={onRemoveColumnItem}
        onRemoveRowItem={onRemoveRowItem}
        onRemoveFilterItem={onRemoveFilterItem}
        onRemoveMetricItem={onRemoveMetricItem}
        onMoveItem={onMoveItem}
        entities={entities}
        layoutFilters={layoutFilters}
        onLayoutFiltersChange={onLayoutFiltersChange}
        isFiltersOpen={isFiltersOpen}
        onFiltersClose={onFiltersClose}
        layoutData={layoutData}
        onLayoutDataChange={onLayoutDataChange}
      />

      <PreviewSection
        previewChartType={previewChartType}
        previewData={previewData}
        previewSeries={previewSeries}
        previewOptions={previewOptions}
        isPreviewStale={isPreviewStale}
        isEditing={isEditing}
        onRefreshPreview={onRefreshPreview}
        onOpenTheme={onOpenTheme}
        onOpenOptions={onOpenOptions}
        onOpenSaved={onOpenSaved}
        onSave={onSave}
      />
    </div>
  );
};
