import React, { useState, useEffect } from 'react';
import styles from './FormMultiSelectDualPanel.module.css';

export interface MultiSelectItem {
    id: string;
    name: string;
}

interface FormMultiSelectDualPanelProps {
    items: MultiSelectItem[];
    selectedItems?: MultiSelectItem[];
    onChange?: (selected: MultiSelectItem[]) => void;
    leftTitle?: string;
    rightTitle?: string;
    searchable?: boolean;
}



export const FormMultiSelectDualPanel: React.FC<FormMultiSelectDualPanelProps> = ({ items, selectedItems = [], onChange, leftTitle = 'Disponibles', rightTitle = 'Sélectionnés', searchable = true }) => {
    const [available, setAvailable] = useState<MultiSelectItem[]>([]);
    const [selected, setSelected] = useState<MultiSelectItem[]>([]);
    const [searchLeft, setSearchLeft] = useState('');
    const [searchRight, setSearchRight] = useState('');

    // Initialisation
    useEffect(() => {
        setSelected(selectedItems);
        setAvailable(items.filter((i) => !selectedItems.some((s) => s.id === i.id)));
    }, [items, selectedItems]);

    // Ajouter un élément
    const addItem = (item: MultiSelectItem) => {
        setSelected((prev) => {
            const newSelected = [...prev, item];
            onChange?.(newSelected);
            return newSelected;
        });
        setAvailable((prev) => prev.filter((i) => i.id !== item.id));
    };

    // Retirer un élément
    const removeItem = (item: MultiSelectItem) => {
        setAvailable((prev) => [...prev, item]);
        setSelected((prev) => {
            const newSelected = prev.filter((i) => i.id !== item.id);
            onChange?.(newSelected);
            return newSelected;
        });
    };

    // Filtrage
    const filteredAvailable = searchable
        ? available.filter((i) => i.name.toLowerCase().includes(searchLeft.toLowerCase()))
        : available;

    const filteredSelected = searchable
        ? selected.filter((i) => i.name.toLowerCase().includes(searchRight.toLowerCase()))
        : selected;

    return (
        <div className={styles.dualPanelContainer}>
            {/* Left Panel */}
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

            {/* Right Panel */}
            <div className={styles.panel}>
                <h4>{rightTitle}</h4>
                {searchable && (
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchRight}
                        onChange={(e) => setSearchRight(e.target.value)}
                        className={styles.searchInput}
                    />
                )}
                <ul className={styles.itemList}>
                    {filteredSelected.map((item) => (
                        <li key={item.id} onClick={() => removeItem(item)} className={styles.item}>
                            {item.name} <span className={styles.removeButton}>−</span>
                        </li>
                    ))}
                    {filteredSelected.length === 0 && <li className={styles.empty}>Aucun élément</li>}
                </ul>
            </div>
        </div>
    );
};
