import React, { useState } from 'react';
import { Check, Palette, X } from 'lucide-react';
import styles from './ThemeModal.module.css';

// ============================================================================
// PALETTES PRÉDÉFINIES
// ============================================================================

export interface ThemePalette {
  id: string;
  name: string;
  colors: string[];
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'vivid',
    name: 'Vif',
    colors: ['#7c3aed', '#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#e879f9', '#06b6d4', '#fb923c', '#84cc16', '#3b82f6'],
  },
  {
    id: 'ocean',
    name: 'Océan',
    colors: ['#0ea5e9', '#06b6d4', '#0284c7', '#38bdf8', '#7dd3fc', '#0369a1', '#7c3aed', '#a78bfa', '#60a5fa', '#22d3ee'],
  },
  {
    id: 'forest',
    name: 'Forêt',
    colors: ['#10b981', '#16a34a', '#4ade80', '#84cc16', '#65a30d', '#22c55e', '#14b8a6', '#059669', '#a3e635', '#15803d'],
  },
  {
    id: 'sunset',
    name: 'Coucher de soleil',
    colors: ['#f59e0b', '#f97316', '#f43f5e', '#ec4899', '#fb923c', '#fbbf24', '#ef4444', '#e11d48', '#dc2626', '#b45309'],
  },
  {
    id: 'night',
    name: 'Nuit',
    colors: ['#818cf8', '#38bdf8', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#67e8f9', '#86efac', '#fb923c', '#c084fc'],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#f9a8d4', '#67e8f9', '#bef264', '#fdba74', '#a5b4fc'],
  },
  {
    id: 'berry',
    name: 'Baies',
    colors: ['#9333ea', '#c026d3', '#e11d48', '#db2777', '#7c3aed', '#a21caf', '#be185d', '#6d28d9', '#831843', '#4c1d95'],
  },
  {
    id: 'classic',
    name: 'Classique',
    colors: ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5'],
  },
];

// ============================================================================
// COMPOSANT
// ============================================================================

interface ThemeModalProps {
  isOpen: boolean;
  currentColors?: string[];
  onClose: () => void;
  onApply: (colors: string[]) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  currentColors,
  onClose,
  onApply,
}) => {
  const [selected, setSelected] = useState<string | null>(() => {
    if (!currentColors) return 'vivid';
    const match = THEME_PALETTES.find(
      (p) => JSON.stringify(p.colors) === JSON.stringify(currentColors)
    );
    return match?.id ?? null;
  });

  if (!isOpen) return null;

  const handleSelect = (palette: ThemePalette) => {
    setSelected(palette.id);
    onApply(palette.colors);
  };

  const activePalette = THEME_PALETTES.find((p) => p.id === selected);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Palette size={18} />
            <span>Thème du graphique</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {/* Preview bande */}
        {activePalette && (
          <div className={styles.previewBar}>
            {activePalette.colors.map((color, i) => (
              <div
                key={i}
                className={styles.previewBarSwatch}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Grille de palettes */}
        <div className={styles.body}>
          <p className={styles.subtitle}>Choisissez une palette de couleurs pour ce graphique</p>
          <div className={styles.grid}>
            {THEME_PALETTES.map((palette) => {
              const isActive = selected === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  className={`${styles.paletteCard} ${isActive ? styles.paletteCardActive : ''}`}
                  onClick={() => handleSelect(palette)}
                >
                  <div className={styles.swatches}>
                    {palette.colors.slice(0, 5).map((color, i) => (
                      <span
                        key={i}
                        className={styles.swatch}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className={styles.paletteName}>{palette.name}</span>
                  {isActive && (
                    <span className={styles.checkIcon}>
                      <Check size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
