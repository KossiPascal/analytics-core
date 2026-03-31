import React, { useState, useEffect } from 'react';
import styles from './FormMultiSelectDualPanel.module.css';

export interface MultiSelectItem {
  id: string;
  name: string;
  // table mode
  type?: string;
  aggregation?: string;
  // filter mode
  operator?: string;
  value?: string;
  value2?: string;
}

export interface FilterConfig {
  getOperators: (item: MultiSelectItem) => readonly string[];
  getInputType?: (item: MultiSelectItem) => string;
  noValueOperators?: readonly string[];
  rangeOperators?: readonly string[];
}

const DEFAULT_AGG_OPTIONS = ['sum', 'count', 'avg', 'min', 'max'];

interface FormMultiSelectDualPanelProps {
  items: MultiSelectItem[];
  selectedItems?: MultiSelectItem[];
  onChange?: (selected: MultiSelectItem[]) => void;
  leftTitle?: string;
  rightTitle?: string;
  searchable?: boolean;
  rightPanelMode?: 'list' | 'table' | 'filter';
  aggregationOptions?: string[];
  filterConfig?: FilterConfig;
}

export const FormMultiSelectDualPanel: React.FC<FormMultiSelectDualPanelProps> = ({
  items,
  selectedItems = [],
  onChange,
  leftTitle = 'Disponibles',
  rightTitle = 'Sélectionnés',
  searchable = true,
  rightPanelMode = 'list',
  aggregationOptions,
  filterConfig,
}) => {
  const [available, setAvailable] = useState<MultiSelectItem[]>([]);
  const [selected, setSelected] = useState<MultiSelectItem[]>([]);
  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');

  const aggOptions = aggregationOptions ?? DEFAULT_AGG_OPTIONS;

  useEffect(() => {
    setSelected(selectedItems);
    setAvailable(items.filter((i) => !selectedItems.some((s) => s.id === i.id)));
  }, [items, selectedItems]);

  const addItem = (item: MultiSelectItem) => {
    let newItem: MultiSelectItem = { ...item };
    if (rightPanelMode === 'table') {
      newItem = { ...newItem, aggregation: item.aggregation ?? aggOptions[0] };
    } else if (rightPanelMode === 'filter') {
      newItem = { ...newItem, operator: '=', value: '', value2: '' };
    }
    const newSelected = [...selected, newItem];
    setSelected(newSelected);
    setAvailable((prev) => prev.filter((i) => i.id !== item.id));
    onChange?.(newSelected);
  };

  const removeItem = (item: MultiSelectItem) => {
    const originalItem = items.find((i) => i.id === item.id) ?? { id: item.id, name: item.name, type: item.type };
    const newSelected = selected.filter((i) => i.id !== item.id);
    setAvailable((prev) => [...prev, originalItem]);
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  const updateAggregation = (itemId: string, newAgg: string) => {
    const newSelected = selected.map((item) =>
      item.id === itemId ? { ...item, aggregation: newAgg } : item
    );
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  const updateFilter = (itemId: string, updates: Partial<{ operator: string; value: string; value2: string }>) => {
    const newSelected = selected.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  const filteredAvailable = searchable
    ? available.filter((i) => i.name.toLowerCase().includes(searchLeft.toLowerCase()))
    : available;

  const filteredSelected = searchable && rightPanelMode === 'list'
    ? selected.filter((i) => i.name.toLowerCase().includes(searchRight.toLowerCase()))
    : selected;

  const isTableMode = rightPanelMode === 'table';
  const isFilterMode = rightPanelMode === 'filter';

  return (
    <div className={styles.dualPanelContainer}>
      {/* ── Left Panel ── */}
      <div className={styles.panel}>
        <h4>{leftTitle}</h4>
        {searchable && (
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchLeft}
            onChange={(e) => setSearchLeft(e.target.value)}
            className={styles.searchInput}
          />
        )}
        <ul className={styles.itemList}>
          {filteredAvailable.map((item) => (
            <li key={item.id} onClick={() => addItem(item)} className={styles.item}>
              {item.name} <span className={styles.addButton}>+</span>
            </li>
          ))}
          {filteredAvailable.length === 0 && <li className={styles.empty}>Aucun élément</li>}
        </ul>
      </div>

      {/* ── Right Panel ── */}
      <div className={`${styles.panel} ${(isTableMode || isFilterMode) ? styles.panelWide : ''}`}>
        <h4>{rightTitle}</h4>
        {searchable && rightPanelMode === 'list' && (
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchRight}
            onChange={(e) => setSearchRight(e.target.value)}
            className={styles.searchInput}
          />
        )}

        {/* LIST MODE */}
        {rightPanelMode === 'list' && (
          <ul className={styles.itemList}>
            {filteredSelected.map((item) => (
              <li key={item.id} onClick={() => removeItem(item)} className={styles.item}>
                {item.name} <span className={styles.removeButton}>−</span>
              </li>
            ))}
            {filteredSelected.length === 0 && <li className={styles.empty}>Aucun élément</li>}
          </ul>
        )}

        {/* TABLE MODE (aggregation) */}
        {isTableMode && (
          <div className={styles.tableMode}>
            {selected.length > 0 && (
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <span className={styles.tableHeaderCell}>NOM</span>
                <span className={styles.tableHeaderCell}>TYPE</span>
                <span className={styles.tableHeaderCell}>AGRÉGATION</span>
                <span />
              </div>
            )}
            {selected.map((item) => (
              <div key={item.id} className={styles.tableRow}>
                <span className={styles.tableCellName}>{item.name}</span>
                <span className={styles.tableCellType}>
                  {item.type && <span className={styles.typeBadge}>{item.type}</span>}
                </span>
                <span className={styles.tableCellAgg}>
                  <div className={styles.aggregationWrapper}>
                    <select
                      className={styles.aggregationSelect}
                      value={item.aggregation ?? aggOptions[0]}
                      onChange={(e) => updateAggregation(item.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {aggOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.aggregationClear}
                      onClick={(e) => { e.stopPropagation(); updateAggregation(item.id, aggOptions[0]); }}
                    >×</button>
                  </div>
                </span>
                <button type="button" className={styles.removeTableBtn} onClick={() => removeItem(item)}>×</button>
              </div>
            ))}
            {selected.length === 0 && <div className={styles.empty}>Aucun élément sélectionné</div>}
          </div>
        )}

        {/* FILTER MODE */}
        {isFilterMode && (
          <div className={styles.tableMode}>
            {selected.length > 0 && (
              <div className={`${styles.filterRow} ${styles.filterHeader}`}>
                <span className={styles.tableHeaderCell}>NOM</span>
                <span className={styles.tableHeaderCell}>TYPE</span>
                <span className={styles.tableHeaderCell}>OPÉRATEUR</span>
                <span className={styles.tableHeaderCell}>VALEUR</span>
                <span />
              </div>
            )}
            {selected.map((item) => {
              const operators = filterConfig?.getOperators(item) ?? ['='];
              const currentOp = item.operator ?? operators[0] ?? '=';
              const isNoValue = filterConfig?.noValueOperators?.includes(currentOp) ?? false;
              const isRange = !isNoValue && (filterConfig?.rangeOperators?.includes(currentOp) ?? false);
              const rawInputType = filterConfig?.getInputType?.(item) ?? 'text';
              const inputType = (rawInputType === 'select' || rawInputType === 'textarea') ? 'text' : rawInputType;

              return (
                <div key={item.id} className={styles.filterRow}>
                  <span className={styles.tableCellName}>{item.name}</span>
                  <span className={styles.tableCellType}>
                    {item.type && <span className={styles.typeBadge}>{item.type}</span>}
                  </span>
                  <span className={styles.tableCellOp}>
                    <select
                      className={styles.operatorSelect}
                      value={currentOp}
                      onChange={(e) => updateFilter(item.id, { operator: e.target.value, value: '', value2: '' })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </span>
                  <span className={styles.tableCellValue}>
                    {isNoValue ? (
                      <span className={styles.noValueIndicator}>—</span>
                    ) : isRange ? (
                      <div className={styles.rangeInputs}>
                        <input
                          type={inputType}
                          className={styles.filterInput}
                          placeholder="De"
                          value={item.value ?? ''}
                          onChange={(e) => updateFilter(item.id, { value: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={styles.rangeSep}>~</span>
                        <input
                          type={inputType}
                          className={styles.filterInput}
                          placeholder="À"
                          value={item.value2 ?? ''}
                          onChange={(e) => updateFilter(item.id, { value2: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <input
                        type={inputType}
                        className={styles.filterInput}
                        placeholder="Valeur..."
                        value={item.value ?? ''}
                        onChange={(e) => updateFilter(item.id, { value: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </span>
                  <button type="button" className={styles.removeTableBtn} onClick={() => removeItem(item)}>×</button>
                </div>
              );
            })}
            {selected.length === 0 && <div className={styles.empty}>Aucun filtre sélectionné</div>}
          </div>
        )}
      </div>
    </div>
  );
};
