import React, { useCallback } from 'react';
import { Building2, Calendar, Database, TrendingUp } from 'lucide-react';

import { DimensionSelector } from '../DimensionSelector/DimensionSelector';
import type { ChartVariant, DataSourceMode, DimensionItem } from '../types';
import styles from './BuilderSidebar.module.css';

interface BuilderSidebarProps {
  chartType: ChartVariant;
  dataSourceMode: DataSourceMode;
  dataElements: DimensionItem[];
  indicators: DimensionItem[];
  periods: DimensionItem[];
  orgUnits: DimensionItem[];
  selectedDataElements: string[];
  selectedIndicators: string[];
  selectedPeriods: string[];
  selectedOrgUnits: string[];
  onDataElementsChange: (items: string[]) => void;
  onIndicatorsChange: (items: string[]) => void;
  onPeriodsChange: (items: string[]) => void;
  onOrgUnitsChange: (items: string[]) => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  chartType,
  dataSourceMode,
  dataElements,
  indicators,
  periods,
  orgUnits,
  selectedDataElements,
  selectedIndicators,
  selectedPeriods,
  selectedOrgUnits,
  onDataElementsChange,
  onIndicatorsChange,
  onPeriodsChange,
  onOrgUnitsChange,
}) => {
  const isTableChart = chartType === 'table';

  const handleMatViewSelectionChange = useCallback(
    (items: string[]) => {
      if (items.length <= 1) {
        onDataElementsChange(items);
        return;
      }
      onDataElementsChange([items[items.length - 1]]);
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

        {isTableChart && dataSourceMode === 'matview' && (
          <DimensionSelector
            title="Mat views"
            icon={<Database size={16} />}
            items={dataElements}
            selectedItems={selectedDataElements}
            onSelectionChange={handleMatViewSelectionChange}
            searchPlaceholder="Rechercher une mat view..."
            singleSelect
          />
        )}

        {(!isTableChart || dataSourceMode === 'indicators') && (
          <DimensionSelector
            title="Indicateurs"
            icon={<TrendingUp size={16} />}
            items={indicators}
            selectedItems={selectedIndicators}
            onSelectionChange={onIndicatorsChange}
            searchPlaceholder="Rechercher un indicateur..."
          />
        )}

        <DimensionSelector
          title="Périodes"
          icon={<Calendar size={16} />}
          items={periods}
          selectedItems={selectedPeriods}
          onSelectionChange={onPeriodsChange}
          searchPlaceholder="Rechercher une période..."
        />

        <DimensionSelector
          title="Unités d'organisation"
          icon={<Building2 size={16} />}
          items={orgUnits}
          selectedItems={selectedOrgUnits}
          onSelectionChange={onOrgUnitsChange}
          searchPlaceholder="Rechercher une unité..."
        />
      </div>
    </div>
  );
};
