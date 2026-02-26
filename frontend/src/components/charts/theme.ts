// ============================================================================
// CHART THEME - Couleurs et configurations par défaut
// ============================================================================

// Palette de couleurs vives et modernes
export const CHART_COLORS = {
  primary: [
    '#7c3aed', // Violet profond
    '#0ea5e9', // Bleu ciel vif
    '#f43f5e', // Rose corail
    '#10b981', // Emeraude
    '#f59e0b', // Ambre doré
    '#e879f9', // Fuchsia
    '#06b6d4', // Cyan turquoise
    '#fb923c', // Orange brûlé
    '#84cc16', // Lime vert
    '#3b82f6', // Bleu électrique
  ],

  // Palettes thématiques
  blue: ['#bae6fd', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985'],
  green: ['#bbf7d0', '#4ade80', '#10b981', '#059669', '#047857', '#065f46'],
  red: ['#fecdd3', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239'],
  amber: ['#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],
  purple: ['#e9d5ff', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6d28d9'],

  // Couleurs sémantiques
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  info: '#0ea5e9',

  // Neutres
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
  },

  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    muted: '#f1f5f9',
  },

  border: '#e2e8f0',
  grid: '#e8edf4',
};

// Configuration par défaut des animations
export const DEFAULT_ANIMATION = {
  duration: 800,
  easing: 'ease-out' as const,
};

// Configuration par défaut des marges
export const DEFAULT_MARGIN = {
  top: 20,
  right: 30,
  bottom: 20,
  left: 20,
};

// Configuration par défaut de la grille
export const DEFAULT_GRID = {
  horizontal: true,
  vertical: false,
  strokeDasharray: '3 3',
};

// Configuration par défaut du tooltip
export const DEFAULT_TOOLTIP_STYLE = {
  backgroundColor: CHART_COLORS.background.primary,
  border: `1px solid ${CHART_COLORS.border}`,
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  padding: '12px 16px',
};

// Configuration par défaut de la légende
export const DEFAULT_LEGEND_STYLE = {
  fontSize: '12px',
  fontWeight: 500,
  color: CHART_COLORS.text.secondary,
};

// Configuration par défaut des axes
export const DEFAULT_AXIS_STYLE = {
  fontSize: 12,
  fontFamily: 'inherit',
  fill: CHART_COLORS.text.secondary,
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.border },
};

// Fonction pour obtenir une couleur de la palette
export function getChartColor(index: number, palette: string[] = CHART_COLORS.primary): string {
  return palette[index % palette.length];
}

// Fonction pour générer un dégradé
export function generateGradientId(color: string, index: number): string {
  return `gradient-${color.replace('#', '')}-${index}`;
}

// Créer un dégradé SVG
export function createGradientDef(id: string, color: string, opacity: number = 0.8) {
  return {
    id,
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
    stops: [
      { offset: '5%', stopColor: color, stopOpacity: opacity },
      { offset: '95%', stopColor: color, stopOpacity: 0.1 },
    ],
  };
}

// Formater les nombres pour l'affichage
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

// Formater les pourcentages
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Abréger les grands nombres
export function abbreviateNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}
