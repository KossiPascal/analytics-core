import React from 'react';
import { Layers } from 'lucide-react';

import styles from './BuilderHeader.module.css';
import type { ChartTypeOption, ChartVariant } from '../types';

interface BuilderHeaderProps {
  chartType: ChartVariant;
  chartTypes: ChartTypeOption[];
  onOpenTypeModal: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  chartType,
  chartTypes,
  onOpenTypeModal,
}) => {
  const currentType = chartTypes.find((t) => t.id === chartType);

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <h2 className={styles.cardTitle}>
          <Layers size={24} />
          Créateur de visualisation
        </h2>

        <div className={styles.typeSummary}>
          <div className={styles.typeLabel}>
            <span className={styles.typeLabelText}>Type</span>
            <span className={styles.typeBadge}>
              {currentType?.icon}
              {currentType?.name ?? chartType}
            </span>
          </div>
          <button type="button" className={styles.typeChangeBtn} onClick={onOpenTypeModal}>
            Changer le type
          </button>
        </div>
      </div>
    </div>
  );
};
