import { createIcon3D } from '../createIcon3D';

/**
 * Icône Dashboard 3D — Grille de widgets en perspective
 */
export const DashboardIcon3D = createIcon3D('DashboardIcon3D', 'Dashboard', [
  { d: 'M3 3h7v7H3V3z' },
  { d: 'M14 3h7v4h-7V3z' },
  { d: 'M14 10h7v11h-7V10z' },
  { d: 'M3 13h7v8H3v-8z' },
]);

/**
 * Icône Graphique Barres 3D — Barres verticales avec profondeur isométrique
 */
export const BarChartIcon3D = createIcon3D('BarChartIcon3D', 'Graphique barres', [
  { d: 'M4 20h16', mode: 'stroke', strokeWidth: 2 },
  { d: 'M6 16h2a1 1 0 0 1 1 1v3H5v-3a1 1 0 0 1 1-1z' },
  { d: 'M11 10h2a1 1 0 0 1 1 1v9h-4v-9a1 1 0 0 1 1-1z' },
  { d: 'M16 6h2a1 1 0 0 1 1 1v13h-4V7a1 1 0 0 1 1-1z' },
]);

/**
 * Icône Graphique Ligne 3D — Courbe avec ombre portée sur axes
 */
export const LineChartIcon3D = createIcon3D('LineChartIcon3D', 'Graphique ligne', [
  { d: 'M3 20L3 4', mode: 'stroke', strokeWidth: 2 },
  { d: 'M3 20h18', mode: 'stroke', strokeWidth: 2 },
  { d: 'M5 16l4-5 3 3 4-6 4 2', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Graphique Camembert 3D — Camembert en perspective isométrique
 */
export const PieChartIcon3D = createIcon3D('PieChartIcon3D', 'Graphique camembert', [
  { d: 'M12 2a10 10 0 1 0 10 10h-10V2z' },
  { d: 'M14 2.05A10 10 0 0 1 21.95 10H14V2.05z' },
]);

/**
 * Icône KPI 3D — Indicateur de performance avec jauge
 */
export const KpiIcon3D = createIcon3D('KpiIcon3D', 'KPI', [
  { d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 12l4-6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { d: 'M5 17h2', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M17 17h2', mode: 'stroke', strokeWidth: 1.5 },
]);

/**
 * Icône Tendance Hausse 3D — Flèche ascendante en relief
 */
export const TrendUpIcon3D = createIcon3D('TrendUpIcon3D', 'Tendance hausse', [
  { d: 'M2 18l7-7 4 4L22 6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M16 6h6v6', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Tendance Baisse 3D — Flèche descendante en relief
 */
export const TrendDownIcon3D = createIcon3D('TrendDownIcon3D', 'Tendance baisse', [
  { d: 'M2 6l7 7 4-4 9 9', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M16 18h6v-6', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Rapport 3D — Document avec mini-graphique intégré
 */
export const ReportIcon3D = createIcon3D('ReportIcon3D', 'Rapport', [
  { d: 'M4 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H4z' },
  { d: 'M12 2v6h6', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M6 14l2-2 2 2 3-4 2 2', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M6 18h8', mode: 'stroke', strokeWidth: 1.2 },
]);

/**
 * Icône Entonnoir 3D — Entonnoir en perspective
 */
export const FunnelIcon3D = createIcon3D('FunnelIcon3D', 'Entonnoir', [
  { d: 'M2 4a1 1 0 0 1 1-1h18a1 1 0 0 1 .8 1.6L15 13v6a1 1 0 0 1-.55.9l-4 2A1 1 0 0 1 9 21v-8L2.2 4.6A1 1 0 0 1 2 4z' },
]);

/**
 * Icône Base de Données 3D — Cylindre 3D empilé
 */
export const DatabaseIcon3D = createIcon3D('DatabaseIcon3D', 'Base de données', [
  { d: 'M12 2C7.58 2 4 3.34 4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5c0-1.66-3.58-3-8-3z', mode: 'stroke', strokeWidth: 2 },
  { d: 'M4 5c0 1.66 3.58 3 8 3s8-1.34 8-3', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M4 10c0 1.66 3.58 3 8 3s8-1.34 8-3', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M4 15c0 1.66 3.58 3 8 3s8-1.34 8-3', mode: 'stroke', strokeWidth: 1.5 },
]);
