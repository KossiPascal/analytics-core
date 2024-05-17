

export interface FilterParams {
  start_date?: string
  end_date?: string
  forms?: string[]
  names?: string[]
  codes?: string[]
  external_ids?: string[]
  countries?: string[]
  regions?: string[]
  prefectures?: string[]
  communes?: string[]
  hospitals?: string[]
  district_quartiers?: string[]
  village_secteurs?: string[]
  families: string[]
  chws?: string[]
  recos?: string[]
  patients?: string[]
  type?: any
  dhisusername?: string
  dhispassword?: string
}

export interface SyncOrgUnit {
  year: number
  month: string
  country: boolean
  region: boolean
  prefecture: boolean
  commune: boolean
  hospital: boolean
  mentor: boolean
  district_quartier: boolean
  chw: boolean
  village_secteur: boolean
  reco: boolean
  family: boolean
  patient: boolean
}

export interface OrgUnitSyncResult {
  status: number
  Country?: SyncOutputUtils
  Region?: SyncOutputUtils
  Prefecture?: SyncOutputUtils
  Commune?: SyncOutputUtils
  Hospital?: SyncOutputUtils
  DistrictQuartier?: SyncOutputUtils
  VillageSecteur?: SyncOutputUtils
  Family?: SyncOutputUtils
  Mentor?: SyncOutputUtils
  Chw?: SyncOutputUtils
  Reco?: SyncOutputUtils
  Patient?: SyncOutputUtils
  Message?: SyncOutputUtils
  validationError?: string
  InnerCatch?: string
  AxioCatch?: string
  GlobalCatch?: string
}

export interface AllFormsSyncResult {
  adult?: SyncOutputUtils
  familyPlanning?: SyncOutputUtils
  pregnant?: SyncOutputUtils
  newborn?: SyncOutputUtils
  pcimne?: SyncOutputUtils
  delivery?: SyncOutputUtils
  recoMeg?: SyncOutputUtils
  referal?: SyncOutputUtils
  vaccination?: SyncOutputUtils
  event?: SyncOutputUtils
  fsMeg?: SyncOutputUtils
  promotionalActivity?: SyncOutputUtils
  death?: SyncOutputUtils
  catchErrors?: string
}

export interface SyncOutputUtils {
  SuccessCount: number,
  Errors: string,
  ErrorCount: number,
  ErrorElements: string,
  ErrorIds: string
}

export interface getOrgUnitFromDbFilter {
  id?: string,
  patients?: string[],
  countries?: string[],
  regions?: string[],
  prefectures?: string[],
  communes?: string[],
  hospitals?: string[],
  district_quartiers?: string[],
  village_secteurs?: string[],
  chws?: string[],
  recos?: string[]
}




// #############################################

// ###################### ORG UNITS ##########################

export interface CountryCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string
}

export interface RegionCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string
  country_id: string
  country: { id: string, name: string }
}

export interface PrefectureCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string

  country_id: string
  region_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
}

export interface CommuneCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
}

export interface HospitalCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
}

export interface DistrictQuartierCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string
  hospital_id: string
  chw_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  chw: { id: string, name: string, phone: string }
}

export interface VillageSecteurCoustomQuery {
  id: string
  name: string
  external_id: string
  code: string
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string
  hospital_id: string
  district_quartier_id: string
  reco_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  reco: { id: string, name: string, phone: string }
}

export interface FamilyCoustomQuery {
  id: string
  name: string
  given_name: string
  external_id: string
  code: string
  household_has_working_latrine: boolean
  household_has_good_water_access: boolean
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string
  hospital_id: string
  district_quartier_id: string
  village_secteur_id: string
  chw_id: string
  reco_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  village_secteur: { id: string, name: string }
  chw: { id: string, name: string, phone: string }
  reco: { id: string, name: string, phone: string }
}

export interface ChwCoustomQuery {
  id: string
  name: string
  phone: string
  code: string
  external_id: string
  role: string
  sex: string
  date_of_birth: string
  email: string
  profession: string
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string
  hospital_id: string
  district_quartier_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
}

export interface RecoCoustomQuery {
  id: string
  name: string
  phone: string
  code: string
  external_id: string
  role: string
  sex: string
  date_of_birth: string
  email: string
  profession: string
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string
  hospital_id: string
  district_quartier_id: string
  chw_id: string
  village_secteur_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  chw: { id: string, name: string, phone: string }
  village_secteur: { id: string, name: string }
}

export interface PatientCoustomQuery {
  id: string
  name: string
  phone: string
  code: string
  external_id: string
  role: string
  sex: string
  date_of_birth: string
  profession: string
  relationship_with_household_head: string
  has_birth_certificate: boolean
  geolocation: string

  country_id: string
  region_id: string
  prefecture_id: string
  commune_id: string
  hospital_id: string
  district_quartier_id: string
  village_secteur_id: string
  family_id: string
  chw_id: string
  reco_id: string

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  village_secteur: { id: string, name: string }
  family: { id: string, name: string, phone: string }
  chw: { id: string, name: string, phone: string }
  reco: { id: string, name: string, phone: string }
}
