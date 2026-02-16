/**
 * Barrel export — Icônes 3D de la plateforme analytics
 *
 * Usage :
 *   import { DashboardIcon3D, UserIcon3D } from '@/components/ui/icons';
 *
 *   <DashboardIcon3D size={32} color="primary" variant="gradient" />
 *   <UserIcon3D size={24} color="success" variant="glass" />
 */

// Types partagés
export type { Icon3DProps, IconColor, IconVariant, ColorSet } from './types';
export { colorMap } from './types';
export { createIcon3D } from './createIcon3D';
export type { IconPathDef } from './createIcon3D';

// Styles CSS communs (pour usage via className)
export { default as icon3dStyles } from './Icon3D.module.css';

// Icône existante
export { RemoveIcon } from './RemoveIcon';
export type { RemoveIconProps } from './RemoveIcon';

// Navigation & Layout
export {
  HomeIcon3D,
  MenuIcon3D,
  BackIcon3D,
  ExpandIcon3D,
  CollapseIcon3D,
  FullscreenIcon3D,
  SidebarIcon3D,
} from './navigation';

// Analytics & Données
export {
  DashboardIcon3D,
  BarChartIcon3D,
  LineChartIcon3D,
  PieChartIcon3D,
  KpiIcon3D,
  TrendUpIcon3D,
  TrendDownIcon3D,
  ReportIcon3D,
  FunnelIcon3D,
  DatabaseIcon3D,
} from './analytics';

// Actions CRUD
export {
  AddIcon3D,
  EditIcon3D,
  DeleteIcon3D,
  SaveIcon3D,
  UndoIcon3D,
  CheckIcon3D,
  CopyIcon3D,
  SearchIcon3D,
} from './actions';

// Données & Fichiers
export {
  ImportIcon3D,
  ExportIcon3D,
  DownloadIcon3D,
  UploadIcon3D,
  FilterIcon3D,
  SortIcon3D,
  TableIcon3D,
} from './data';

// Utilisateurs & Rôles
export {
  UserIcon3D,
  UsersIcon3D,
  RoleIcon3D,
  ProfileIcon3D,
  PermissionIcon3D,
  AuthIcon3D,
} from './users';

// Notifications & Status
export {
  NotificationIcon3D,
  SuccessIcon3D,
  ErrorIcon3D,
  WarningIcon3D,
  InfoIcon3D,
  LoadingIcon3D,
} from './status';

// Configuration & Système
export {
  SettingsIcon3D,
  SyncIcon3D,
  ApiIcon3D,
  LogsIcon3D,
} from './system';
