import React from 'react';

import { LayoutConfiguration } from '../LayoutConfiguration/LayoutConfiguration';
import { PreviewSection } from '../PreviewSection/PreviewSection';
import type { DefinitionEntry } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';
import type { ChartVariant, DimensionItem, LayoutZone, VisualizationOptions } from '../types';
import styles from './BuilderMainArea.module.css';

interface BuilderMainAreaProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
  onMoveItem: (itemId: string, fromZone: LayoutZone, toZone: LayoutZone) => void;
  entities: any[];
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
  onRemoveColumnItem,
  onRemoveRowItem,
  onRemoveFilterItem,
  onMoveItem,
  entities,
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
        onRemoveColumnItem={onRemoveColumnItem}
        onRemoveRowItem={onRemoveRowItem}
        onRemoveFilterItem={onRemoveFilterItem}
        onMoveItem={onMoveItem}
        entities={entities}
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
