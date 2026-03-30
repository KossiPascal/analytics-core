import React from 'react';
import { Database, Filter, Layers, Plus, TrendingUp } from 'lucide-react';

import styles from './BuilderHeader.module.css';
import type { ChartTypeOption, ChartVariant, DataSourceMode } from '../types';
import { Tip } from '@/components/layout/Tip/Tip';

interface BuilderHeaderProps {
  chartType: ChartVariant;
  chartTypes: ChartTypeOption[];
  dataSourceMode: DataSourceMode;
  onDataSourceModeChange: (mode: DataSourceMode) => void;
  onOpenTypeModal: () => void;
  onOpenIndicatorBuilder: () => void;
  onOpenFilters: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  chartType,
  chartTypes,
  dataSourceMode,
  onDataSourceModeChange,
  onOpenTypeModal,
  onOpenIndicatorBuilder,
  onOpenFilters,
}) => {
  const currentType = chartTypes.find((t) => t.id === chartType);
  const isTableChart = chartType === 'table';

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <h2 className={styles.cardTitle}>
          <Layers size={24} />
          Créateur de visualisation
        </h2>

        <div className={styles.headerControls}>
          <button
            type="button"
            className={styles.createIndicatorBtn}
            onClick={onOpenIndicatorBuilder}
          >
            <Plus size={14} />
            Créer indicateur
          </button>

          <button
            type="button"
            className={styles.filterBtn}
            onClick={onOpenFilters}
          >
            <Filter size={14} />
            Filtres
          </button>

          {isTableChart && (
            <div className={styles.toggleContainer}>
              <button
                type="button"
                className={`${styles.toggleButton} ${dataSourceMode === 'matview' ? styles.toggleButtonActive : ''}`}
                onClick={() => onDataSourceModeChange('matview')}
              >
                <Database size={14} />
                Mat views
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${dataSourceMode === 'indicators' ? styles.toggleButtonActive : ''}`}
                onClick={() => onDataSourceModeChange('indicators')}
              >
                <TrendingUp size={14} />
                Indicateurs
              </button>
            </div>
          )}

          <div className={styles.typeSummary}>
            <Tip
              title="Astuce"
              importance="low"
              size="lg"
              modalTitle="Astuce de configuration"
              message="Sélectionnez des éléments dans les dimensions ci-dessus, puis réorganisez-les dans les zones Colonnes, Lignes et Filtres pour personnaliser l'affichage de vos données."
            />
          </div>

          <button type="button" className={styles.typeChangeBtn} onClick={onOpenTypeModal}>
            {currentType?.icon}
            {currentType?.name ?? chartType}
          </button>
        </div>
      </div>
    </div>
  );
};
