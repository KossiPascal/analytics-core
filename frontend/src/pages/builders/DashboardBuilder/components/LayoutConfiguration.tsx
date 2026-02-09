import React from 'react';
import { Filter, Grid3x3 } from 'lucide-react';

import { LayoutDropZone } from './LayoutDropZone';
import type { DimensionItem } from './types';
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

      <div className={styles.alertInfo}>
        <Filter size={18} />
        <div>
          <strong>Astuce :</strong> Sélectionnez des éléments dans les dimensions ci-dessus, puis réorganisez-les
          dans les zones Colonnes, Lignes et Filtres pour personnaliser l'affichage de vos données.
        </div>
      </div>
    </div>
  );
};
