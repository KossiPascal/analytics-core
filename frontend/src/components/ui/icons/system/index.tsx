import { createIcon3D } from '../createIcon3D';

/**
 * Icône Paramètres 3D — Engrenage en relief avec profondeur
 */
export const SettingsIcon3D = createIcon3D('SettingsIcon3D', 'Paramètres', [
  {
    d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
  {
    d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    mode: 'stroke',
    strokeWidth: 2,
  },
]);

/**
 * Icône Synchronisation 3D — Flèches circulaires rotatives
 */
export const SyncIcon3D = createIcon3D('SyncIcon3D', 'Synchronisation', [
  { d: 'M21 2v6h-6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M3 12a9 9 0 0 1 15-6.7L21 8', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M3 22v-6h6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M21 12a9 9 0 0 1-15 6.7L3 16', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône API 3D — Connecteurs / prises en relief
 */
export const ApiIcon3D = createIcon3D('ApiIcon3D', 'API', [
  { d: 'M4 6h4v4H4V6z' },
  { d: 'M16 6h4v4h-4V6z' },
  { d: 'M4 14h4v4H4v-4z' },
  { d: 'M16 14h4v4h-4v-4z' },
  { d: 'M8 8h8', mode: 'stroke', strokeWidth: 2 },
  { d: 'M8 16h8', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 10v4', mode: 'stroke', strokeWidth: 2 },
]);

/**
 * Icône Logs 3D — Terminal / console en perspective
 */
export const LogsIcon3D = createIcon3D('LogsIcon3D', 'Logs', [
  { d: 'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z' },
  { d: 'M6 9l3 3-3 3', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M12 17h6', mode: 'stroke', strokeWidth: 2 },
]);
