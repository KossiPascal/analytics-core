import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Search, X } from 'lucide-react';

import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput/FormInput';

import styles from './DimensionSelector.module.css';
import type { DimensionSelectorProps } from '../types';

export const DimensionSelector: React.FC<DimensionSelectorProps> = ({
  title,
  icon,
  items,
  selectedItems,
  onSelectionChange,
  searchPlaceholder = 'Rechercher...',
  singleSelect = false,
  editableItemIds,
  onEditItem,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();

    return items.filter(
      (item) => item.name.toLowerCase().includes(term) || item.code?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const handleToggleItem = (itemId: string) => {
    if (singleSelect) {
      // In single-select mode, toggle off if already selected, otherwise select only this one
      onSelectionChange(selectedItems.includes(itemId) ? [] : [itemId]);
      return;
    }

    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
      return;
    }

    onSelectionChange([...selectedItems, itemId]);
  };

  const handleSelectAll = () => {
    if (singleSelect) return;
    onSelectionChange(filteredItems.map((item) => item.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={styles.dimensionSelector}>
      <button type="button" className={styles.dimensionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.dimensionIcon}>{icon}</span>
        <span className={styles.dimensionTitle}>{title}</span>
        {selectedItems.length > 0 && <span className={styles.countBadge}>{selectedItems.length}</span>}
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isExpanded && (
        <div className={styles.dimensionContent}>
          <div className={styles.dimensionSearch}>
            <FormInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              leftIcon={<Search size={16} />}
              rightIcon={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={styles.dimensionSearchClear}
                    aria-label="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                ) : undefined
              }
              wrapperClassName={styles.dimensionSearchInput}
            />
          </div>

          <div className={styles.dimensionActions}>
            {!singleSelect && (
              <button type="button" onClick={handleSelectAll}>
                Tout sélectionner
              </button>
            )}
            <button type="button" onClick={handleDeselectAll}>
              Tout désélectionner
            </button>
          </div>

          <div className={styles.dimensionItems}>
            {filteredItems.map((item) => (
              <div key={item.id} className={styles.dimensionItemRow}>
                <FormCheckbox
                  label={item.code ? `${item.name} (${item.code})` : item.name}
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleToggleItem(item.id)}
                  wrapperClassName={styles.dimensionItem}
                />
                {editableItemIds?.has(item.id) && onEditItem && (
                  <button
                    type="button"
                    className={styles.editItemBtn}
                    onClick={() => onEditItem(item.id)}
                    aria-label={`Modifier ${item.name}`}
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            ))}
            {filteredItems.length === 0 && <div className={styles.noResults}>Aucun résultat</div>}
          </div>
        </div>
      )}
    </div>
  );
};
