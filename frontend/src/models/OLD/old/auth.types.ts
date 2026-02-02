import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  ChwsMap,
  RecosMap,
} from './org-unit.types';

// Route permission
export interface Routes {
  path: string;
  label: string;
  authorizations: string[];
}

// Role interface
export interface Roles {
  id: number;
  name: string;
  authorizations: string[] | null;
  routes: string[] | Routes[] | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}

// User permissions/role capabilities
export interface UserRole {
  isSuperUser: boolean;
  canUseOfflineMode: boolean;
  canViewMaps: boolean;
  canViewReports: boolean;
  canViewDashboards: boolean;
  canManageData: boolean;
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canDeleteRole: boolean;
  canValidateData: boolean;
  canSendDataToDhis2: boolean;
  canViewUsers: boolean;
  canViewRoles: boolean;
  canDownloadData: boolean;
  canSendSms: boolean;
  canLogout: boolean;
  canUpdateProfile: boolean;
  canUpdatePassword: boolean;
  canUpdateLanguage: boolean;
  canViewNotifications: boolean;
  mustChangeDefaultPassword: boolean;
}

// Complete User interface
export interface User {
  id: string;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  routes: Routes[];
  authorizations: string[];
  exp: number;
  iat: number;
  rolesIds: number[];
  rolesNames: string[];
  roles: Roles[];
  countries: CountryMap[];
  regions: RegionsMap[];
  prefectures: PrefecturesMap[];
  communes: CommunesMap[];
  hospitals: HospitalsMap[];
  districtQuartiers: DistrictQuartiersMap[];
  villageSecteurs: VillageSecteursMap[];
  chws: ChwsMap[];
  recos: RecosMap[];
  role: UserRole;
  isActive: boolean;
  token: string;
  userLogo: string;
  mustLogin: boolean;
  mustChangeDefaultPassword: boolean;
  hasChangedDefaultPassword: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
}

// Auth response from API
export interface AuthResponse {
  status: number;
  data: string;
  token: string;
  orgunits: { [key: string]: unknown[] };
  persons: { [key: string]: unknown[] };
  message: string | null;
  mustChangeDefaultPassword: boolean;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Login response
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
  mustChangeDefaultPassword: boolean;
  orgunits: { [key: string]: unknown[] };
  persons: { [key: string]: unknown[] };
}

// Auth state for store
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mustChangeDefaultPassword: boolean;
}

// Change password payload
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Token payload (JWT decoded)
export interface TokenPayload {
  sub: string;
  username: string;
  roles: string[];
  authorizations: string[];
  iat: number;
  exp: number;
}

// Role for simplified use
export interface Role {
  id: string | number;
  name: string;
  description?: string;
  routes: Routes[];
  authorizations: string[];
}

// Route permission (simplified)
export interface RoutePermission {
  path: string;
  canAccess: boolean;
}
