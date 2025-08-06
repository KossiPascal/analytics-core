import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from "./org-unit-interface"

export interface User {
  id: string
  username: string
  fullname: string
  email: string
  phone: string
  routes: Routes[]
  authorizations: string[]
  exp: number
  iat: number
  rolesIds: number[]
  rolesNames: string[]
  roles: Roles[]
  countries: CountryMap[]
  regions: RegionsMap[]
  prefectures: PrefecturesMap[]
  communes: CommunesMap[]
  hospitals: HospitalsMap[]
  districtQuartiers: DistrictQuartiersMap[]
  villageSecteurs: VillageSecteursMap[]
  chws: ChwsMap[]
  recos: RecosMap[]
  role: UserRole
  isActive: boolean
  token: string
  userLogo: string
  mustLogin: boolean
  mustChangeDefaultPassword: boolean
  hasChangedDefaultPassword: boolean
  isDeleted: boolean
  deletedAt: Date
}

export interface AuthResponse {
  status: number;
  data: string;
  token: string;
  orgunits: { [key: string]: any[] };
  persons: { [key: string]: any[] };
  message: any;
  mustChangeDefaultPassword: boolean
}


export interface Routes {
  path: string
  label: string
  authorizations: string[]
}


export interface Roles {
  id: number
  name: string
  authorizations: string[] | null
  routes: string[] | Routes[] | null
  isDeleted: boolean
  deletedAt: Date
}

export interface UserRole {
  isSuperUser: boolean,
  canUseOfflineMode: boolean,
  canViewMaps: boolean,
  canViewReports: boolean,
  canViewDashboards: boolean,
  canManageData: boolean,
  canCreateUser: boolean,
  canUpdateUser: boolean,
  canDeleteUser: boolean,
  canCreateRole: boolean,
  canUpdateRole: boolean,
  canDeleteRole: boolean,
  canValidateData: boolean,
  canSendDataToDhis2: boolean,
  canViewUsers: boolean,
  canViewRoles: boolean,
  canDownloadData: boolean,
  canSendSms: boolean,
  canLogout: boolean,
  canUpdateProfile: boolean,
  canUpdatePassword: boolean,
  canUpdateLanguage: boolean,
  canViewNotifications: boolean,
  mustChangeDefaultPassword: boolean,
}




