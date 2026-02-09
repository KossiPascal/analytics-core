import { GripVertical, X } from "lucide-react";
import { vizStyles } from "./vizStyles";
import { LayoutDropZoneProps } from "./types";

export const LayoutDropZone: React.FC<LayoutDropZoneProps> = ({title,items,allItems,onRemove,placeholder = 'Glissez des éléments ici'}) => {
  const getItemName = (id: string) => {
    const item = allItems.find((i) => i.id === id);
    return item?.name || id;
  };

  return (
    <div className={vizStyles.layoutZone}>
      <div className={vizStyles.layoutZoneHeader}>{title}</div>
      <div className={vizStyles.layoutZoneContent}>
        {items.length === 0 ? (
          <div className={vizStyles.layoutPlaceholder}>{placeholder}</div>
        ) : (
          items.map((itemId) => (
            <div key={itemId} className={vizStyles.layoutItem}>
              <GripVertical size={14} />
              <span>{getItemName(itemId)}</span>
              <button type="button" onClick={() => onRemove(itemId)} className={vizStyles.removeItemBtn}>
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}