import React from 'react';
import { Grid3x3 } from 'lucide-react';

import { Tip } from '@components/layout/Tip/Tip';
import { LayoutDropZone } from '../LayoutDropZone/LayoutDropZone';
import type { DimensionItem, LayoutZone } from '../types';
import styles from './LayoutConfiguration.module.css';

interface LayoutConfigurationProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
  onMoveItem: (itemId: string, fromZone: LayoutZone, toZone: LayoutZone) => void;
}

export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({
  allItems,
  columnItems,
  rowItems,
  filterItems,
  onRemoveColumnItem,
  onRemoveRowItem,
  onRemoveFilterItem,
  onMoveItem,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        <Grid3x3 size={18} />
        Configuration de la mise en page
      </div>

      <div className={styles.layoutSection}>
        <LayoutDropZone
          zone="column"
          title="Colonnes"
          items={columnItems}
          allItems={allItems}
          onRemove={onRemoveColumnItem}
          onMoveItem={onMoveItem}
          placeholder="Colonnes"
        />
        <LayoutDropZone
          zone="row"
          title="Lignes"
          items={rowItems}
          allItems={allItems}
          onRemove={onRemoveRowItem}
          onMoveItem={onMoveItem}
          placeholder="Lignes"
        />
        <LayoutDropZone
          zone="filter"
          title="Filtres"
          items={filterItems}
          allItems={allItems}
          onRemove={onRemoveFilterItem}
          onMoveItem={onMoveItem}
          placeholder="Filtres"
        />
      </div>

    </div>
  );
};
