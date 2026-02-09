import { FormCheckbox } from "@/components/forms/FormCheckbox/FormCheckbox";
import { ChevronDown, ChevronRight, FormInput, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { vizStyles } from "./vizStyles";
import { DimensionSelectorProps } from "./types";

export const DimensionSelector:React.FC<DimensionSelectorProps> = ({title,icon,items,selectedItems,onSelectionChange,searchPlaceholder = 'Rechercher...'}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(term) || item.code?.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const handleToggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredItems.map((item) => item.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={vizStyles.dimensionSelector}>
      <button
        type="button"
        className={vizStyles.dimensionHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={vizStyles.dimensionIcon}>{icon}</span>
        <span className={vizStyles.dimensionTitle}>{title}</span>
        <span className={vizStyles.dimensionCount}>
          {selectedItems.length > 0 && (
            <span className={vizStyles.countBadge}>{selectedItems.length}</span>
          )}
        </span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isExpanded && (
        <div className={vizStyles.dimensionContent}>
          <div className={vizStyles.dimensionSearch}>
            <FormInput
              value={searchTerm}
              onChange={(e:any) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              leftIcon={<Search size={16} />}
              rightIcon={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={vizStyles.dimensionSearchClear}
                    aria-label="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                ) : undefined
              }
              wrapperClassName={vizStyles.dimensionSearchInput}
            />
          </div>

          <div className={vizStyles.dimensionActions}>
            <button type="button" onClick={handleSelectAll}>
              Tout sélectionner
            </button>
            <button type="button" onClick={handleDeselectAll}>
              Tout désélectionner
            </button>
          </div>

          <div className={vizStyles.dimensionItems}>
            {filteredItems.map((item) => (
              <FormCheckbox
                key={item.id}
                label={item.code ? `${item.name} (${item.code})` : item.name}
                checked={selectedItems.includes(item.id)}
                onChange={() => handleToggleItem(item.id)}
                wrapperClassName={vizStyles.dimensionItem}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className={vizStyles.noResults}>Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}