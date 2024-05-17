import { CountryCoustomQuery, RegionCoustomQuery, PrefectureCoustomQuery, CommuneCoustomQuery, HospitalCoustomQuery, DistrictQuartierCoustomQuery, VillageSecteurCoustomQuery, RecoCoustomQuery, ChwCoustomQuery } from "./org-units"
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
  isOnlyOnlineUser: boolean
  roleIds: string[]
  roles: Roles[]

  countries: CountryCoustomQuery[]
  regions: RegionCoustomQuery[]
  prefectures: PrefectureCoustomQuery[]
  communes: CommuneCoustomQuery[]
  hospitals: HospitalCoustomQuery[]
  districtQuartiers: DistrictQuartierCoustomQuery[]
  villageSecteurs: VillageSecteurCoustomQuery[]
  chws: ChwCoustomQuery[]
  recos: RecoCoustomQuery[]
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
  isOnlyOnlineUser: boolean
  token: string
  userLogo: string
  mustLogin: boolean
  isAdmin:boolean
  roleIds: string[]
  roles: Roles[]

  countries: CountryCoustomQuery[]
  regions: RegionCoustomQuery[]
  prefectures: PrefectureCoustomQuery[]
  communes: CommuneCoustomQuery[]
  hospitals: HospitalCoustomQuery[]
  districtQuartiers: DistrictQuartierCoustomQuery[]
  villageSecteurs: VillageSecteurCoustomQuery[]
  chws: ChwCoustomQuery[]
  recos: RecoCoustomQuery[]

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


