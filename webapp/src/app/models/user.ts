import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from "./org-unit-interface"
import { Roles } from "./roles"

export interface User {
  id: string
  username: string
  fullname: string
  email: string
  routes: Routes[]
  default_route: Routes
  autorizations: string[]
  exp: number
  iat: number
  isAdmin:boolean
  can_use_offline_mode: boolean
  can_view_reports: boolean
  can_view_dashboards: boolean
  can_manage_data: boolean
  can_create_user: boolean
  can_update_user: boolean
  can_delete_user: boolean
  can_create_role: boolean
  can_update_role: boolean
  can_delete_role: boolean
  can_logout: boolean
  roleIds: string[]
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
}

export interface AdminUser {
  id: string
  username: string
  fullname: string
  email?: string
  routes: Routes[]
  default_route: Routes
  autorizations: string[]
  isActive: boolean
  can_use_offline_mode: boolean
  can_view_reports: boolean
  can_view_dashboards: boolean
  can_manage_data: boolean
  can_create_user: boolean
  can_update_user: boolean
  can_delete_user: boolean
  can_create_role: boolean
  can_update_role: boolean
  can_delete_role: boolean
  can_logout: boolean
  token: string
  userLogo: string
  mustLogin: boolean
  isAdmin:boolean
  roleIds: string[]
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

  isDeleted: boolean
  deletedAt: Date
}

export interface Routes {
  path: string
  group: string
  label: string
  autorizations: string[]
}

// ###################### ORG UNITS ##########################


