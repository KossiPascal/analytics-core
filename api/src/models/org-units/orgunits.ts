export interface CountryView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface RegionView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  country_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface PrefectureView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface CommuneView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface HospitalView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface CountryManagerView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface RegionManagerView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface PrefectureManagerView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface CommuneManagerView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface HospitalManagerView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface DistrictQuartierView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface VillageSecteurView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  external_id: string
  code: string
  geolocation: object | null
  reco_id: string
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null
  district_quartier_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface ChwView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null
  district_quartier_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface RecoView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  phone: string
  email: string
  profession: string
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null
  district_quartier_id: string | null
  village_secteur_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface FamilyView {
  id: string
  rev: string
  year: number
  month: string
  given_name: string
  name: string
  external_id: string
  code: string
  household_has_working_latrine: boolean | null
  household_has_good_water_access: boolean | null
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null
  district_quartier_id: string | null
  village_secteur_id: string | null
  reco_id: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}

export interface PatientView {
  id: string
  rev: string
  year: number
  month: string
  name: string
  code: string
  external_id: string
  role: string
  sex: 'M' | 'F' | null
  birth_date: string
  age_in_year_on_creation: number
  age_in_month_on_creation: number
  age_in_day_on_creation: number
  phone: string | null
  profession: string | null
  relationship_with_household_head: string
  has_birth_certificate: boolean | null
  place_of_death: string | null
  is_home_death: boolean | null
  is_stillbirth: boolean | null
  geolocation: object | null
  country_id: string | null
  region_id: string | null
  prefecture_id: string | null
  commune_id: string | null
  hospital_id: string | null
  district_quartier_id: string | null
  village_secteur_id: string | null
  family_id: string | null
  reco_id: string | null
  death_date: string | null
  year_of_death: number | null
  month_of_death: string | null
  reported_date_timestamp: number
  reported_date: string
  reported_full_date: string | null
}
