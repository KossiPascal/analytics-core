import { createIcon3D } from '../createIcon3D';

/**
 * Icône Importer 3D — Boîte avec flèche entrante
 */
export const ImportIcon3D = createIcon3D('ImportIcon3D', 'Importer', [
  { d: 'M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 3v10', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M8 10l4 4 4-4', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Exporter 3D — Boîte avec flèche sortante
 */
export const ExportIcon3D = createIcon3D('ExportIcon3D', 'Exporter', [
  { d: 'M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 14V3', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M8 7l4-4 4 4', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Télécharger 3D — Nuage avec flèche descendante
 */
export const DownloadIcon3D = createIcon3D('DownloadIcon3D', 'Télécharger', [
  { d: 'M6.5 17.5a4 4 0 0 1-.92-7.89A6.5 6.5 0 0 1 18.5 11a4.5 4.5 0 0 1-.43 8.5H6.5z', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 12v5', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M9.5 15l2.5 2.5L14.5 15', mode: 'stroke', strokeWidth: 2 },
]);

/**
 * Icône Uploader 3D — Nuage avec flèche montante
 */
export const UploadIcon3D = createIcon3D('UploadIcon3D', 'Uploader', [
  { d: 'M6.5 17.5a4 4 0 0 1-.92-7.89A6.5 6.5 0 0 1 18.5 11a4.5 4.5 0 0 1-.43 8.5H6.5z', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 17v-5', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M9.5 14l2.5-2.5L14.5 14', mode: 'stroke', strokeWidth: 2 },
]);

/**
 * Icône Filtrer 3D — Entonnoir en relief
 */
export const FilterIcon3D = createIcon3D('FilterIcon3D', 'Filtrer', [
  { d: 'M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6L15 12v5.5a1 1 0 0 1-.4.8l-3 2.25A1 1 0 0 1 10 19.75V12L3.2 4.6A1 1 0 0 1 3 4z' },
]);

/**
 * Icône Trier 3D — Barres horizontales graduées en relief
 */
export const SortIcon3D = createIcon3D('SortIcon3D', 'Trier', [
  { d: 'M4 5h16a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
  { d: 'M4 10h12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z' },
  { d: 'M4 15h8a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z' },
]);

/**
 * Icône Tableau 3D — Grille de données en perspective
 */
export const TableIcon3D = createIcon3D('TableIcon3D', 'Tableau', [
  { d: 'M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4z', mode: 'stroke', strokeWidth: 2 },
  { d: 'M3 9h18', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M3 14h18', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M9 2v20', mode: 'stroke', strokeWidth: 1.5 },
]);
