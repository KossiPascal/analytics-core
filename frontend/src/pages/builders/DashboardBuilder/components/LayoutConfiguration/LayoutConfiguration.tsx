import React from 'react';
import { Grid3x3 } from 'lucide-react';

import { Tip } from '@components/layout/Tip/Tip';
import { LayoutDropZone } from '../LayoutDropZone/LayoutDropZone';
import type { DimensionItem } from '../types';
import styles from './LayoutConfiguration.module.css';

interface LayoutConfigurationProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
}

export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({
  allItems,
  columnItems,
  rowItems,
  filterItems,
  onRemoveColumnItem,
  onRemoveRowItem,
  onRemoveFilterItem,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        <Grid3x3 size={18} />
        Configuration de la mise en page
      </div>

      <div className={styles.layoutSection}>
        <LayoutDropZone
          title="Colonnes"
          items={columnItems}
          allItems={allItems}
          onRemove={onRemoveColumnItem}
          placeholder="Colonnes"
        />
        <LayoutDropZone
          title="Lignes"
          items={rowItems}
          allItems={allItems}
          onRemove={onRemoveRowItem}
          placeholder="Lignes"
        />
        <LayoutDropZone
          title="Filtres"
          items={filterItems}
          allItems={allItems}
          onRemove={onRemoveFilterItem}
          placeholder="Filtres"
        />
      </div>

    </div>
  );
};
