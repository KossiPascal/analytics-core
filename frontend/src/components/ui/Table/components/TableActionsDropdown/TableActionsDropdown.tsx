import { useState, useRef, useEffect, type ReactNode } from 'react';
import { SettingsIcon3D } from '@/components/ui/icons';
import styles from './TableActionsDropdown.module.css';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Affiche l'élément en rouge */
  danger?: boolean;
  /** Tooltip sur l'élément */
  title?: string;
  /** Style custom (ex: couleur warning) */
  style?: React.CSSProperties;
  /** Séparateur au-dessus de cet élément */
  separator?: boolean;
}

interface Props {
  items: ActionMenuItem[];
}

export function TableActionsDropdown({ items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer en cliquant en dehors
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={`${styles.trigger}${open ? ` ${styles.open}` : ''}`}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Actions"
      >
        <MoreHorizontal size={18} color="#475569" strokeWidth={2} />
      </button>
      

      {open && (
        <div className={styles.dropdown} role="menu">
          {visibleItems.map((item, i) => (
            <div key={i}>
              {item.separator && <div className={styles.separator} />}
              <button
                role="menuitem"
                className={`${styles.item}${item.danger ? ` ${styles.danger}` : ''}`}
                disabled={item.disabled}
                title={item.title ?? item.label}
                style={item.style}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.disabled) {
                    item.onClick();
                    setOpen(false);
                  }
                }}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
