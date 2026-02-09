import React from 'react';
import { BarChart3, Building2, Calendar, Database, Layers, TrendingUp } from 'lucide-react';

import { DimensionSelector } from './DimensionSelector';
import type { ChartTypeOption, ChartVariant, DimensionItem, StoredVisualization } from './types';
import styles from './BuilderSidebar.module.css';

interface BuilderSidebarProps {
  chartTypes: ChartTypeOption[];
  chartType: ChartVariant;
  onChartTypeChange: (type: ChartVariant) => void;
  filteredSavedVisualizations: StoredVisualization[];
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
  chartTypes,
  chartType,
  onChartTypeChange,
  filteredSavedVisualizations,
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

  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Layers size={18} />
          Visualisations sauvegardées
        </div>
        <div className={styles.savedList}>
          {filteredSavedVisualizations.length === 0 ? (
            <div className={styles.savedEmpty}>Aucune visualisation pour ce type.</div>
          ) : (
            filteredSavedVisualizations.map((viz) => (
              <div key={viz.id} className={styles.savedItem}>
                <div className={styles.savedItemTitle}>{viz.name}</div>
                {viz.description && <div className={styles.savedItemDescription}>{viz.description}</div>}
                <div className={styles.savedItemMeta}>
                  <span>{viz.chartType}</span>
                  <span>•</span>
                  <span>{new Date(viz.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <BarChart3 size={18} />
          Type de graphique
        </div>
        <div className={styles.chartTypeGrid}>
          {chartTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`${styles.chartTypeCard} ${chartType === type.id ? styles.chartTypeCardActive : ''}`}
              onClick={() => onChartTypeChange(type.id)}
              title={type.description}
            >
              {type.icon}
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Database size={18} />
          Dimensions de données
        </div>

        {isTableChart && (
          <DimensionSelector
            title="Mat views"
            icon={<Database size={16} />}
            items={dataElements}
            selectedItems={selectedDataElements}
            onSelectionChange={onDataElementsChange}
            searchPlaceholder="Rechercher une mat view..."
          />
        )}

        <DimensionSelector
          title="Indicateurs"
          icon={<TrendingUp size={16} />}
          items={indicators}
          selectedItems={selectedIndicators}
          onSelectionChange={onIndicatorsChange}
          searchPlaceholder="Rechercher un indicateur..."
        />

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
