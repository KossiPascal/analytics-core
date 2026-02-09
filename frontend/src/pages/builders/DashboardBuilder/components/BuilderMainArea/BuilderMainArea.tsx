import React from 'react';

import { LayoutConfiguration } from '../LayoutConfiguration/LayoutConfiguration';
import { PreviewSection } from '../PreviewSection/PreviewSection';
import type { ChartVariant, DimensionItem, VisualizationOptions } from '../types';
import styles from './BuilderMainArea.module.css';

interface BuilderMainAreaProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
  previewChartType: ChartVariant;
  previewData: any[];
  previewSeries: any[];
  previewOptions: VisualizationOptions;
  isPreviewStale: boolean;
  isEditing: boolean;
  onRefreshPreview: () => void;
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
  previewChartType,
  previewData,
  previewSeries,
  previewOptions,
  isPreviewStale,
  isEditing,
  onRefreshPreview,
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
      />

      <PreviewSection
        previewChartType={previewChartType}
        previewData={previewData}
        previewSeries={previewSeries}
        previewOptions={previewOptions}
        isPreviewStale={isPreviewStale}
        isEditing={isEditing}
        onRefreshPreview={onRefreshPreview}
        onOpenOptions={onOpenOptions}
        onOpenSaved={onOpenSaved}
        onSave={onSave}
      />
    </div>
  );
};
