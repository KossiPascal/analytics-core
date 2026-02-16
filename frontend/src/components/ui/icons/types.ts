/**
 * Types partagés pour les icônes 3D de la plateforme analytics
 */

export type IconColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'navbar';
export type IconVariant = 'solid' | 'gradient' | 'glass';

export interface Icon3DProps {
  /** Taille de l'icône en pixels */
  size?: number;
  /** Couleur basée sur le thème de la plateforme */
  color?: IconColor;
  /** Style de rendu 3D */
  variant?: IconVariant;
  /** Classes CSS additionnelles */
  className?: string;
  /** Title pour l'accessibilité */
  title?: string;
  /** Gestionnaire de clic */
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

export interface ColorSet {
  base: string;
  light: string;
  dark: string;
  glow: string;
}

export const colorMap: Record<IconColor, ColorSet> = {
  primary:   { base: '#003366', light: '#3b82f6', dark: '#1e2a4a', glow: 'rgba(59,130,246,0.35)' },
  success:   { base: '#22c55e', light: '#4ade80', dark: '#16a34a', glow: 'rgba(34,197,94,0.35)' },
  danger:    { base: '#ef4444', light: '#f87171', dark: '#dc2626', glow: 'rgba(239,68,68,0.35)' },
  warning:   { base: '#f59e0b', light: '#fbbf24', dark: '#d97706', glow: 'rgba(245,158,11,0.35)' },
  info:      { base: '#06b6d4', light: '#22d3ee', dark: '#0891b2', glow: 'rgba(6,182,212,0.35)' },
  secondary: { base: '#64748b', light: '#94a3b8', dark: '#475569', glow: 'rgba(100,116,139,0.35)' },
  navbar:    { base: '#004422', light: '#16a34a', dark: '#002211', glow: 'rgba(0,68,34,0.35)' },
};
