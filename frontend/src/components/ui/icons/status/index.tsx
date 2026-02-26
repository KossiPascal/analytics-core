import { createIcon3D } from '../createIcon3D';

/**
 * Icône Notification 3D — Cloche avec badge en relief
 */
export const NotificationIcon3D = createIcon3D('NotificationIcon3D', 'Notification', [
  { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z' },
  { d: 'M13.73 21a2 2 0 0 1-3.46 0', mode: 'stroke', strokeWidth: 2 },
  { d: 'M18 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' },
]);

/**
 * Icône Succès 3D — Cercle avec coche en relief (vert)
 */
export const SuccessIcon3D = createIcon3D('SuccessIcon3D', 'Succès', [
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M8 12l3 3 5-6', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Erreur 3D — Cercle avec X en relief (rouge)
 */
export const ErrorIcon3D = createIcon3D('ErrorIcon3D', 'Erreur', [
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M15 9l-6 6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M9 9l6 6', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Avertissement 3D — Triangle avec point d'exclamation (ambre)
 */
export const WarningIcon3D = createIcon3D('WarningIcon3D', 'Avertissement', [
  { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
  { d: 'M12 9v4', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M12 17h.01', mode: 'stroke', strokeWidth: 3 },
]);

/**
 * Icône Info 3D — Cercle avec i en relief (cyan)
 */
export const InfoIcon3D = createIcon3D('InfoIcon3D', 'Information', [
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M12 16v-4', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M12 8h.01', mode: 'stroke', strokeWidth: 3 },
]);

/**
 * Icône Chargement 3D — Anneau rotatif avec dégradé
 * Note : Utiliser l'animation CSS `spin` pour la rotation
 */
export const LoadingIcon3D = createIcon3D('LoadingIcon3D', 'Chargement', [
  { d: 'M12 2a10 10 0 0 1 10 10', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M12 2a10 10 0 0 0-10 10', mode: 'stroke', strokeWidth: 1 },
  { d: 'M22 12a10 10 0 0 1-10 10', mode: 'stroke', strokeWidth: 1.5 },
]);
