import { createIcon3D } from '../createIcon3D';

/**
 * Icône Utilisateur 3D — Silhouette avec profondeur
 */
export const UserIcon3D = createIcon3D('UserIcon3D', 'Utilisateur', [
  { d: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z' },
  { d: 'M20 21v-1a7 7 0 0 0-7-7h-2a7 7 0 0 0-7 7v1' },
]);

/**
 * Icône Groupe 3D — Silhouettes multiples empilées
 */
export const UsersIcon3D = createIcon3D('UsersIcon3D', 'Groupe', [
  { d: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { d: 'M17 21v-1a6 6 0 0 0-6-6H7a6 6 0 0 0-6 6v1' },
  { d: 'M16 3.13a4 4 0 0 1 0 7.75', mode: 'stroke', strokeWidth: 2 },
  { d: 'M23 21v-1a4 4 0 0 0-3-3.87', mode: 'stroke', strokeWidth: 2 },
]);

/**
 * Icône Rôle 3D — Bouclier avec coche en relief
 */
export const RoleIcon3D = createIcon3D('RoleIcon3D', 'Rôle', [
  { d: 'M12 2l8 4v5c0 5.25-3.5 10-8 11.5C7.5 21 4 16.25 4 11V6l8-4z' },
  { d: 'M9 12l2 2 4-4', mode: 'stroke', strokeWidth: 2.5 },
]);

/**
 * Icône Profil 3D — Carte d'identité en perspective
 */
export const ProfileIcon3D = createIcon3D('ProfileIcon3D', 'Profil', [
  { d: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z' },
  { d: 'M9 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
  { d: 'M5 18a4 4 0 0 1 8 0', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M15 8h4', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M15 12h4', mode: 'stroke', strokeWidth: 1.5 },
  { d: 'M16 16h3', mode: 'stroke', strokeWidth: 1.5 },
]);

/**
 * Icône Permissions 3D — Clé en relief
 */
export const PermissionIcon3D = createIcon3D('PermissionIcon3D', 'Permissions', [
  { d: 'M15.5 2a5.5 5.5 0 0 0-4.88 8.01L2 18.63V22h3.37v-2H8v-2.63h2l1.12-1.12A5.5 5.5 0 1 0 15.5 2z' },
  { d: 'M16.5 6a1 1 0 1 0 2 0 1 1 0 0 0-2 0z' },
]);

/**
 * Icône Authentification 3D — Cadenas en relief
 */
export const AuthIcon3D = createIcon3D('AuthIcon3D', 'Authentification', [
  { d: 'M5 11a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5z' },
  { d: 'M7 11V7a5 5 0 0 1 10 0v4', mode: 'stroke', strokeWidth: 2 },
  { d: 'M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
]);
