

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
  district_quartier: boolean
  country_manager: boolean
  region_manager: boolean
  prefecture_manager: boolean
  commune_manager: boolean
  hospital_manager: boolean
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
  CountryManager?: SyncOutputUtils
  RegionManager?: SyncOutputUtils
  PrefectureManager?: SyncOutputUtils
  CommuneManager?: SyncOutputUtils
  HospitalManager?: SyncOutputUtils
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
  Message?: SyncOutputUtils
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


// ###################### ORG UNITS ##########################

// export interface CountryCustomQuery {
//   id: string
//   name: string
//   external_id: string
// }

// export interface RegionCustomQuery {
//   id: string
//   name: string
//   external_id: string

//   country: { id: string, name: string }
// }

// export interface PrefectureCustomQuery {
//   id: string
//   name: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
// }

// export interface CommuneCustomQuery {
//   id: string
//   name: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
// }

// export interface HospitalCustomQuery {
//   id: string
//   name: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
//   commune: { id: string, name: string }
// }

// export interface DistrictQuartierCustomQuery {
//   id: string
//   name: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
//   commune: { id: string, name: string }
//   hospital: { id: string, name: string }
//   chw: { id: string, name: string, phone: string }
// }

// export interface VillageSecteurCustomQuery {
//   id: string
//   name: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
//   commune: { id: string, name: string }
//   hospital: { id: string, name: string }
//   district_quartier: { id: string, name: string }
//   reco: { id: string, name: string, phone: string }
// }

// export interface ChwCustomQuery {
//   id: string
//   name: string
//   phone: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
//   commune: { id: string, name: string }
//   hospital: { id: string, name: string }
//   district_quartier: { id: string, name: string }
// }

// export interface RecoCustomQuery {
//   id: string
//   name: string
//   phone: string
//   external_id: string

//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
//   commune: { id: string, name: string }
//   hospital: { id: string, name: string }
//   district_quartier: { id: string, name: string }
//   chw: { id: string, name: string, phone: string }
//   village_secteur: { id: string, name: string }
// }

export interface FamilyCustomQuery {
  id: string
  name: string
  external_id: string
  household_has_working_latrine: boolean
  household_has_good_water_access: boolean

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  village_secteur: { id: string, name: string }
  // chw: { id: string, name: string, phone: string }
  reco: { id: string, name: string, phone: string }
}

export interface PatientCustomQuery {
  id: string
  name: string
  phone: string
  external_id: string
  sex: string
  birth_date: string
  has_birth_certificate: boolean

  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  village_secteur: { id: string, name: string }
  family: { id: string, name: string, phone: string }
  // chw: { id: string, name: string, phone: string }
  reco: { id: string, name: string, phone: string }
}
