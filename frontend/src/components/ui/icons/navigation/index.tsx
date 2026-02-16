import { createIcon3D } from '../createIcon3D';

/**
 * Icône Accueil 3D — Maison avec toit en perspective
 */
export const HomeIcon3D = createIcon3D('HomeIcon3D', 'Accueil', [
  { d: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z' },
  { d: 'M9 21V14h6v7', mode: 'stroke', strokeWidth: 1.5 },
]);

/**
 * Icône Menu 3D — Hamburger avec barres empilées en relief
 */
export const MenuIcon3D = createIcon3D('MenuIcon3D', 'Menu', [
  { d: 'M3 6h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z' },
  { d: 'M3 11h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z' },
  { d: 'M3 16h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z' },
]);

/**
 * Icône Retour 3D — Flèche courbée vers la gauche
 */
export const BackIcon3D = createIcon3D('BackIcon3D', 'Retour', [
  { d: 'M9 14L4 9l5-5', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M4 9h11a5 5 0 0 1 5 5v2', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Développer 3D — Flèches diagonales vers l'extérieur
 */
export const ExpandIcon3D = createIcon3D('ExpandIcon3D', 'Développer', [
  { d: 'M15 3h6v6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M9 21H3v-6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M21 3l-7 7', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M3 21l7-7', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Réduire 3D — Flèches diagonales vers l'intérieur
 */
export const CollapseIcon3D = createIcon3D('CollapseIcon3D', 'Réduire', [
  { d: 'M4 14h6v6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M20 10h-6V4', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M14 10l7-7', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M3 21l7-7', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Plein écran 3D — Cadre en perspective
 */
export const FullscreenIcon3D = createIcon3D('FullscreenIcon3D', 'Plein écran', [
  { d: 'M3 3h5v2H5v3H3V3z' },
  { d: 'M16 3h5v5h-2V5h-3V3z' },
  { d: 'M21 16v5h-5v-2h3v-3h2z' },
  { d: 'M3 16v5h5v-2H5v-3H3z' },
]);

/**
 * Icône Sidebar 3D — Panneau latéral avec contenu
 */
export const SidebarIcon3D = createIcon3D('SidebarIcon3D', 'Sidebar', [
  { d: 'M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4z', mode: 'stroke', strokeWidth: 2 },
  { d: 'M9 2v20', mode: 'stroke', strokeWidth: 2 },
  { d: 'M5 7h2', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M5 11h2', mode: 'stroke', strokeWidth: 1.5 },
]);
