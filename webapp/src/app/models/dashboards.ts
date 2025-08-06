import { ChartDataSet } from "./interfaces"

export interface RecoPerformanceUtils {
  consultation: number
  followup: number
  total: number
}

export interface RecoPerformanceFullYearUtils {
  label: string
  color: string
  data: Record<string, number>
}

export interface RecoPerformanceDashboardTotal {
  family_count: number
  patient_count: number

  adult_data_count: RecoPerformanceUtils
  family_planning_data_count: RecoPerformanceUtils
  newborn_data_count: RecoPerformanceUtils
  pcimne_data_count: RecoPerformanceUtils
  pregnant_data_count: RecoPerformanceUtils
  all_consultation_followup_count: RecoPerformanceUtils

  referal_data_count: number
  delivery_data_count: number
  events_data_count: number
  promotional_data_count: number
  death_data_count: number
  all_actions_count: number

  // linechart: RecoPerformanceDashboardUtils
  // barchart: RecoPerformanceDashboardUtils
}

export interface RecoPerformanceDashboardDbOutput {
  id: string
  year: number
  month: string

  family_count: number
  patient_count: number

  referal_data_count: number
  delivery_data_count: number
  events_data_count: number
  promotional_data_count: number
  death_data_count: number
  all_actions_count: number

  adult_data_count: RecoPerformanceUtils
  family_planning_data_count: RecoPerformanceUtils
  newborn_data_count: RecoPerformanceUtils
  pcimne_data_count: RecoPerformanceUtils
  pregnant_data_count: RecoPerformanceUtils
  all_consultation_followup_count: RecoPerformanceUtils

  country: { id: string; name: string }
  region: { id: string; name: string }
  prefecture: { id: string; name: string }
  commune: { id: string; name: string }
  hospital: { id: string; name: string }
  district_quartier: { id: string; name: string }
  // chw: { id: string, name: string, phone: string }
  village_secteur: { id: string; name: string }
  reco: { id: string; name: string; phone: string }
  is_validate?: boolean
  validate_user_id?: string
  already_on_dhis2?: boolean
  already_on_dhis2_user_id?: string

  // lineChart: RecoPerformanceDashboardUtils
  // barChart: RecoPerformanceDashboardUtils
  // yearLineChart: RecoPerformanceDashboardUtils
  // yearBarChart: RecoPerformanceDashboardUtils

}

export interface RecoPerformanceDashboardFullYearUtils {
  adult_data_count: RecoPerformanceFullYearUtils
  family_planning_data_count: RecoPerformanceFullYearUtils
  newborn_data_count: RecoPerformanceFullYearUtils
  pcimne_data_count: RecoPerformanceFullYearUtils
  pregnant_data_count: RecoPerformanceFullYearUtils

  referal_data_count: RecoPerformanceFullYearUtils
  delivery_data_count: RecoPerformanceFullYearUtils
  events_data_count: RecoPerformanceFullYearUtils
  promotional_data_count: RecoPerformanceFullYearUtils
  death_data_count: RecoPerformanceFullYearUtils
}

export interface RecoPerformanceDashboardFullYearDbOutput {
  id: string
  year: number

  adult_data_count: RecoPerformanceFullYearUtils
  family_planning_data_count: RecoPerformanceFullYearUtils
  newborn_data_count: RecoPerformanceFullYearUtils
  pcimne_data_count: RecoPerformanceFullYearUtils
  pregnant_data_count: RecoPerformanceFullYearUtils

  referal_data_count: RecoPerformanceFullYearUtils
  delivery_data_count: RecoPerformanceFullYearUtils
  events_data_count: RecoPerformanceFullYearUtils
  promotional_data_count: RecoPerformanceFullYearUtils
  death_data_count: RecoPerformanceFullYearUtils

  country: { id: string; name: string }
  region: { id: string; name: string }
  prefecture: { id: string; name: string }
  commune: { id: string; name: string }
  hospital: { id: string; name: string }
  district_quartier: { id: string; name: string }
  village_secteur: { id: string; name: string }
  reco: { id: string; name: string; phone: string }
}

export interface RecoPerformanceDashboard {
  performances: RecoPerformanceDashboardDbOutput[],
  yearDatas: Record<string, RecoPerformanceDashboardUtils>
  total: RecoPerformanceDashboardTotal
}

// export interface RecoChartPerformanceDashboard {
//   id: string
//   year: number
//   lineChart: RecoPerformanceDashboardUtils
//   barChart: RecoPerformanceDashboardUtils
//   country: { id: string, name: string }
//   region: { id: string, name: string }
//   prefecture: { id: string, name: string }
//   commune: { id: string, name: string }
//   hospital: { id: string, name: string }
//   district_quartier: { id: string, name: string }
//   // chw: { id: string, name: string, phone: string }
//   village_secteur: { id: string, name: string }
//   reco: { id: string, name: string, phone: string } | null
//   is_validate?: boolean
//   validate_user_id?: string
//   already_on_dhis2?: boolean
//   already_on_dhis2_user_id?: string
// }



export interface RecoPerformanceDashboardUtils {
  title: string
  type: 'line' | 'bar',
  absisseLabels: number[] | string[],
  datasets: ChartDataSet[]
}


export interface RecoVaccinationDashboardDbOutput {
  id: string
  month: string
  year: number
  children_vaccines: {
    family_id: string,
    family_name: string,
    family_fullname: string,
    family_code: string,
    data: RecoVaccinationDashboard[]
  }[]
  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  // chw: { id: string, name: string, phone: string }
  village_secteur: { id: string, name: string }
  reco: { id: string, name: string, phone: string } | null
  is_validate?: boolean
  validate_user_id?: string
  already_on_dhis2?: boolean
  already_on_dhis2_user_id?: string
}




export interface RecoVaccinationDashboard {
  family_id: string,
  family_name: string,
  family_fullname: string,
  family_code: string,
  child_id: string
  child_name: string
  child_code: string
  child_sex: string
  reco_phone: string
  parent_phone: string
  neighbor_phone: string
  child_age_in_days: number
  child_age_in_months: number
  child_age_in_years: number
  child_age_str: string
  vaccine_BCG: boolean
  vaccine_VPO_0: boolean
  vaccine_PENTA_1: boolean
  vaccine_VPO_1: boolean
  vaccine_PENTA_2: boolean
  vaccine_VPO_2: boolean
  vaccine_PENTA_3: boolean
  vaccine_VPO_3: boolean
  vaccine_VPI_1: boolean
  vaccine_VAR_1: boolean
  vaccine_VAA: boolean
  vaccine_VPI_2: boolean
  vaccine_MEN_A: boolean
  vaccine_VAR_2: boolean

  no_BCG_reason: string | null | ''
  no_VPO_0_reason: string | null | ''
  no_PENTA_1_reason: string | null | ''
  no_VPO_1_reason: string | null | ''
  no_PENTA_2_reason: string | null | ''
  no_VPO_2_reason: string | null | ''
  no_PENTA_3_reason: string | null | ''
  no_VPO_3_reason: string | null | ''
  no_VPI_1_reason: string | null | ''
  no_VAR_1_reason: string | null | ''
  no_VAA_reason: string | null | ''
  no_VPI_2_reason: string | null | ''
  no_MEN_A_reason: string | null | ''
  no_VAR_2_reason: string | null | ''
}


type MonthKey = 'jan' | 'fev' | 'mar' | 'avr' | 'mai' | 'jui' | 'jul' | 'aou' | 'sep' | 'oct' | 'nov' | 'dec';


export interface ActiveRecoUtils {
  cover: boolean
  supervised: boolean
  fonctionnal: boolean
}

export interface ActiveRecoTotalUtils {
  cover: number;
  supervised: number;
  fonctionnal: number
}


export interface ActiveRecoDashboardDbOutput {
  id: string
  year: number

  jan: ActiveRecoUtils
  fev: ActiveRecoUtils
  mar: ActiveRecoUtils
  avr: ActiveRecoUtils
  mai: ActiveRecoUtils
  jui: ActiveRecoUtils
  jul: ActiveRecoUtils
  aou: ActiveRecoUtils
  sep: ActiveRecoUtils
  oct: ActiveRecoUtils
  nov: ActiveRecoUtils
  dec: ActiveRecoUtils

  country: { id: string; name: string }
  region: { id: string; name: string }
  prefecture: { id: string; name: string }
  commune: { id: string; name: string }
  hospital: { id: string; name: string }
  district_quartier: { id: string; name: string }
  village_secteur: { id: string; name: string }
  reco: { id: string; name: string; phone: string }
  chw: { id: string; name: string; phone: string }
}


export interface ActiveRecoRecord {
  id: string
  name: string
  phone: string

  country: { id: string; name: string }
  region: { id: string; name: string }
  prefecture: { id: string; name: string }
  commune: { id: string; name: string }
  hospital: { id: string; name: string }
  district_quartier: { id: string; name: string }

  recos: {
    id: string
    name: string
    phone: string;

    jan: ActiveRecoUtils
    fev: ActiveRecoUtils
    mar: ActiveRecoUtils
    avr: ActiveRecoUtils
    mai: ActiveRecoUtils
    jui: ActiveRecoUtils
    jul: ActiveRecoUtils
    aou: ActiveRecoUtils
    sep: ActiveRecoUtils
    oct: ActiveRecoUtils
    nov: ActiveRecoUtils
    dec: ActiveRecoUtils
    village_secteur: { id: string; name: string }
  }[];
}

export interface ActiveRecoTotal {
  jan: ActiveRecoTotalUtils;
  fev: ActiveRecoTotalUtils;
  mar: ActiveRecoTotalUtils;
  avr: ActiveRecoTotalUtils;
  mai: ActiveRecoTotalUtils;
  jui: ActiveRecoTotalUtils;
  jul: ActiveRecoTotalUtils;
  aou: ActiveRecoTotalUtils;
  sep: ActiveRecoTotalUtils;
  oct: ActiveRecoTotalUtils;
  nov: ActiveRecoTotalUtils;
  dec: ActiveRecoTotalUtils;
}

export interface ActiveRecoDashboard {
  record: ActiveRecoRecord[]
  total: ActiveRecoTotal
}

export interface ActiveRecoReco {
  jan: ActiveRecoUtils;
  fev: ActiveRecoUtils;
  mar: ActiveRecoUtils;
  avr: ActiveRecoUtils;
  mai: ActiveRecoUtils;
  jui: ActiveRecoUtils;
  jul: ActiveRecoUtils;
  aou: ActiveRecoUtils;
  sep: ActiveRecoUtils;
  oct: ActiveRecoUtils;
  nov: ActiveRecoUtils;
  dec: ActiveRecoUtils;
}





export interface RecoTasksStateDashboardUtils {
  form: string
  label: string
  title: string
  source: string
  due_date: string
  end_date: string
  source_id: string
  start_date: string

  patient_id: string
  patient_code: string
  patient_name: string
  patient_external_id: string

  family_id: string
  family_name: string
  family_given_name: string
  family_external_id: string
  family_code: string
}


export interface RecoTasksStateDashboardDbOutput {
  id: string
  reco_id: string
  due_date: string

  state_data: Record<string, RecoTasksStateDashboardUtils[]>,

  country: { id: string; name: string }
  region: { id: string; name: string }
  prefecture: { id: string; name: string }
  commune: { id: string; name: string }
  hospital: { id: string; name: string }
  district_quartier: { id: string; name: string }
  village_secteur: { id: string; name: string }
  reco: { id: string; name: string; phone: string }
  chw: { id: string; name: string; phone: string }
}

export interface RecoTasksStateFamilies {
  id: string,
  name: string,
  given_name: string,
  external_id: string,
  code: string,
  patients: RecoTasksStatePatients[]
}

export interface RecoTasksStatePatients {
  id: string,
  name: string,
  external_id: string,
  code: any,
  data: RecoTasksStateDashboardUtils[]
}

export interface RecoTasksStateDashboard {
  id: string,
  name: string,
  phone: string,
  code: string,
  external_id: string,
  village_secteur: any,
  families: RecoTasksStateFamilies[]
}