import { createIcon3D } from '../createIcon3D';

/**
 * Icône Ajouter 3D — Cercle avec symbole plus en relief
 */
export const AddIcon3D = createIcon3D('AddIcon3D', 'Ajouter', [
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M12 8v8', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M8 12h8', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Éditer 3D — Crayon avec ombre portée
 */
export const EditIcon3D = createIcon3D('EditIcon3D', 'Éditer', [
  { d: 'M16.474 5.408l2.118 2.118m-.756-3.982L12.109 9.27a2.118 2.118 0 0 0-.58 1.082l-.634 3.178 3.178-.634a2.118 2.118 0 0 0 1.082-.58l5.727-5.727a1.853 1.853 0 1 0-2.621-2.621z' },
  { d: 'M19 15v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3', mode: 'stroke', strokeWidth: 2 },
]);

/**
 * Icône Supprimer 3D — Poubelle en relief
 */
export const DeleteIcon3D = createIcon3D('DeleteIcon3D', 'Supprimer', [
  { d: 'M3 6h18', mode: 'stroke', strokeWidth: 2 },
  { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', mode: 'stroke', strokeWidth: 2 },
  { d: 'M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14' },
  { d: 'M10 11v6', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M14 11v6', mode: 'stroke', strokeWidth: 1.5 },
]);

/**
 * Icône Sauvegarder 3D — Disquette en perspective
 */
export const SaveIcon3D = createIcon3D('SaveIcon3D', 'Sauvegarder', [
  { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' },
  { d: 'M17 21v-7H7v7', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M7 3v4h7', mode: 'stroke', strokeWidth: 1.5 },
]);

/**
 * Icône Annuler 3D — Flèche circulaire retour
 */
export const UndoIcon3D = createIcon3D('UndoIcon3D', 'Annuler', [
  { d: 'M3 7v6h6', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Valider 3D — Coche dans un cercle en relief
 */
export const CheckIcon3D = createIcon3D('CheckIcon3D', 'Valider', [
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M8 12l3 3 5-6', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Copier 3D — Documents empilés avec profondeur
 */
export const CopyIcon3D = createIcon3D('CopyIcon3D', 'Copier', [
  { d: 'M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43l-2.21-2.242A2 2 0 0 0 15.79 3H10a2 2 0 0 0-2 1z' },
  { d: 'M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2', mode: 'stroke', strokeWidth: 2 },
]);

/**
 * Icône Rechercher 3D — Loupe avec reflet
 */
export const SearchIcon3D = createIcon3D('SearchIcon3D', 'Rechercher', [
  { d: 'M11 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  { d: 'M21 21l-4.35-4.35', mode: 'stroke', strokeWidth: 2.5 },
  { d: 'M8 8a3 3 0 0 1 3-3', mode: 'stroke', strokeWidth: 1.5 },
]);
