import React, { useCallback } from 'react';
import { Calendar, Database, Layers, TrendingUp } from 'lucide-react';

import { DimensionSelector } from '../DimensionSelector/DimensionSelector';
import type { ChartVariant, DataSourceMode, DimensionItem } from '../types';
import styles from './BuilderSidebar.module.css';

interface BuilderSidebarProps {
  chartType: ChartVariant;
  dataSourceMode: DataSourceMode;
  dataElements: DimensionItem[];
  indicators: DimensionItem[];
  periods: DimensionItem[];
  selectedDataElements: string[];
  selectedIndicators: string[];
  selectedPeriods: string[];
  onDataElementsChange: (items: string[]) => void;
  onIndicatorsChange: (items: string[]) => void;
  onPeriodsChange: (items: string[]) => void;
  editableIndicatorIds?: Set<string>;
  onEditIndicator?: (indicatorId: string) => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  chartType,
  dataSourceMode,
  dataElements,
  indicators,
  periods,
  selectedDataElements,
  selectedIndicators,
  selectedPeriods,
  onDataElementsChange,
  onIndicatorsChange,
  onPeriodsChange,
  editableIndicatorIds,
  onEditIndicator,
}) => {
  const isTableChart = chartType === 'table';

  const handleMatViewSelectionChange = useCallback(
    (items: string[]) => {
      onDataElementsChange(items.length <= 1 ? items : [items[items.length - 1]]);
    },
    [onDataElementsChange]
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Database size={18} />
          Dimensions de données
        </div>

        {/* Dimensions (indicateurs / mat views) */}
        {isTableChart && dataSourceMode === 'matview' ? (
          <DimensionSelector
            title="Dimensions"
            icon={<Layers size={16} />}
            items={dataElements}
            selectedItems={selectedDataElements}
            onSelectionChange={handleMatViewSelectionChange}
            searchPlaceholder="Rechercher une dimension..."
            singleSelect
          />
        ) : (
          <DimensionSelector
            title="Dimensions"
            icon={<Layers size={16} />}
            items={indicators}
            selectedItems={selectedIndicators}
            onSelectionChange={onIndicatorsChange}
            searchPlaceholder="Rechercher une dimension..."
            editableItemIds={editableIndicatorIds}
            onEditItem={onEditIndicator}
          />
        )}

        {/* Métriques */}
        <DimensionSelector
          title="Métriques"
          icon={<TrendingUp size={16} />}
          items={dataElements}
          selectedItems={selectedDataElements}
          onSelectionChange={onDataElementsChange}
          searchPlaceholder="Rechercher une métrique..."
        />

        {/* Périodes */}
        <DimensionSelector
          title="Périodes"
          icon={<Calendar size={16} />}
          items={periods}
          selectedItems={selectedPeriods}
          onSelectionChange={onPeriodsChange}
          searchPlaceholder="Rechercher une période..."
        />
      </div>
    </div>
  );
};
