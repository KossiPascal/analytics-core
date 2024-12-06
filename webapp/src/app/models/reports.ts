
export interface FP_Utils {
  nbr_new_user: number
  nbr_regular_user: number
  nbr_total_user: number
  nbr_delivered: number
  nbr_in_stock: number
  nbr_referred: number
  nbr_side_effect: number
}

export interface MorbidityUtils {
  indicator: string
  nbr_5_14_years: number
  nbr_14_25_years: number
  nbr_25_60_years: number
  nbr_60_more_years: number
  nbr_pregnant_woman: number | undefined
  nbr_total: number
  nbr_referred: number | undefined
}

export interface IndicatorsDataOutput<T> {
  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  // chw: { id: string, name: string, phone: string }
  village_secteur: { id: string, name: string }
  reco: { id: string, name: string, phone: string } | null
  reco_asc_type: string
  is_validate?: boolean
  validate_user_id?: string
  already_on_dhis2?: boolean
  already_on_dhis2_user_id?: string
  data: T
}


export interface RecoMegSituationReport {
  orgunit: string
  id: string
  month: string
  year: number

  meg_data: RecoMegQuantityUtils[]

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

export interface RecoMegQuantityUtils {
  index: number,
  label: string
  month_beginning: number
  month_received: number
  month_total_start: number
  month_consumption: number
  month_theoreticaly: number
  month_inventory: number
  month_loss: number
  month_damaged: number
  month_broken: number
  month_expired: number
}



export interface PromotionReport {
  id: string
  month: string
  year: number
  orgunit: string

  malaria_nbr_touched_by_VAD_F: number
  malaria_nbr_touched_by_VAD_M: number
  malaria_nbr_touched_by_CE_F: number
  malaria_nbr_touched_by_CE_M: number
  malaria_nbr_total_F: number
  malaria_nbr_total_M: number

  vaccination_nbr_touched_by_VAD_F: number
  vaccination_nbr_touched_by_VAD_M: number
  vaccination_nbr_touched_by_CE_F: number
  vaccination_nbr_touched_by_CE_M: number
  vaccination_nbr_total_F: number
  vaccination_nbr_total_M: number

  child_health_nbr_touched_by_VAD_F: number
  child_health_nbr_touched_by_VAD_M: number
  child_health_nbr_touched_by_CE_F: number
  child_health_nbr_touched_by_CE_M: number
  child_health_nbr_total_F: number
  child_health_nbr_total_M: number

  cpn_cpon_nbr_touched_by_VAD_F: number
  cpn_cpon_nbr_touched_by_VAD_M: number
  cpn_cpon_nbr_touched_by_CE_F: number
  cpn_cpon_nbr_touched_by_CE_M: number
  cpn_cpon_nbr_total_F: number
  cpn_cpon_nbr_total_M: number

  family_planning_nbr_touched_by_VAD_F: number
  family_planning_nbr_touched_by_VAD_M: number
  family_planning_nbr_touched_by_CE_F: number
  family_planning_nbr_touched_by_CE_M: number
  family_planning_nbr_total_F: number
  family_planning_nbr_total_M: number

  hygienic_water_sanitation_nbr_touched_by_VAD_F: number
  hygienic_water_sanitation_nbr_touched_by_VAD_M: number
  hygienic_water_sanitation_nbr_touched_by_CE_F: number
  hygienic_water_sanitation_nbr_touched_by_CE_M: number
  hygienic_water_sanitation_nbr_total_F: number
  hygienic_water_sanitation_nbr_total_M: number

  other_diseases_nbr_touched_by_VAD_F: number
  other_diseases_nbr_touched_by_VAD_M: number
  other_diseases_nbr_touched_by_CE_F: number
  other_diseases_nbr_touched_by_CE_M: number
  other_diseases_nbr_total_F: number
  other_diseases_nbr_total_M: number

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

export interface FamilyPlanningReport {
  orgunit: string
  id: string
  month: string
  year: number
  pill_coc: FP_Utils
  pill_cop: FP_Utils
  condoms: FP_Utils
  depo_provera_im: FP_Utils
  dmpa_sc: FP_Utils
  cycle_necklace: FP_Utils
  diu: FP_Utils
  implant: FP_Utils
  tubal_ligation: FP_Utils
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

export interface MorbidityReport {
  orgunit: string
  id: string
  month: string
  year: number
  hp_circulation_accident: MorbidityUtils
  hp_burn: MorbidityUtils
  hp_suspected_tb_cases: MorbidityUtils
  hp_dermatosis: MorbidityUtils
  hp_diarrhea: MorbidityUtils
  hp_urethral_discharge: MorbidityUtils
  hp_vaginal_discharge: MorbidityUtils
  hp_urinary_loss: MorbidityUtils
  hp_accidental_caustic_products_ingestion: MorbidityUtils
  hp_food_poisoning: MorbidityUtils
  hp_oral_diseases: MorbidityUtils
  hp_dog_bite: MorbidityUtils
  hp_snake_bite: MorbidityUtils
  hp_parasitosis: MorbidityUtils
  hp_measles: MorbidityUtils
  hp_trauma: MorbidityUtils
  hp_gender_based_violence: MorbidityUtils

  malaria_total_cases: MorbidityUtils
  malaria_rdt_performed: MorbidityUtils
  malaria_positive_rdts: MorbidityUtils
  malaria_cases_treated_with_cta: MorbidityUtils
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

export interface HouseholdRecapReport {
  orgunit: string
  id: string
  month: string
  year: number
  index: number
  household_code: string
  household_name: string
  total_household_members: number
  total_women_15_50_years: number
  total_children_under_5_years: number
  total_children_0_12_months: number
  total_children_12_60_months: number
  has_functional_latrine: boolean
  has_drinking_water_access: boolean
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

export interface PcimneNewbornReport {
  orgunit: string
  id: string
  month: string
  year: number
  pcimne_newborn: PcimneNewbornReportUtils[]
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



export interface PcimneNewbornReportUtils {
  index: number
  indicator: string
  nbr_malaria_0_2_months_F: number | undefined
  nbr_malaria_0_2_months_M: number | undefined
  nbr_malaria_2_12_months_F: number | undefined
  nbr_malaria_2_12_months_M: number | undefined
  nbr_malaria_12_60_months_F: number | undefined
  nbr_malaria_12_60_months_M: number | undefined

  nbr_cough_pneumonia_0_2_months_F: number | undefined
  nbr_cough_pneumonia_0_2_months_M: number | undefined
  nbr_cough_pneumonia_2_12_months_F: number | undefined
  nbr_cough_pneumonia_2_12_months_M: number | undefined
  nbr_cough_pneumonia_12_60_months_F: number | undefined
  nbr_cough_pneumonia_12_60_months_M: number | undefined

  nbr_diarrhea_0_2_months_F: number | undefined
  nbr_diarrhea_0_2_months_M: number | undefined
  nbr_diarrhea_2_12_months_F: number | undefined
  nbr_diarrhea_2_12_months_M: number | undefined
  nbr_diarrhea_12_60_months_F: number | undefined
  nbr_diarrhea_12_60_months_M: number | undefined

  nbr_malnutrition_0_2_months_F: number | undefined
  nbr_malnutrition_0_2_months_M: number | undefined
  nbr_malnutrition_2_12_months_F: number | undefined
  nbr_malnutrition_2_12_months_M: number | undefined
  nbr_malnutrition_12_60_months_F: number | undefined
  nbr_malnutrition_12_60_months_M: number | undefined

  nbr_total: number | undefined
}

export interface ChwsRecoReport {
  orgunit: string
  id: string
  month: string
  year: number
  reco_monitoring: ChwsRecoReportElements
  demography: ChwsRecoReportElements
  child_health_0_59_months: ChwsRecoReportElements
  mother_health: ChwsRecoReportElements
  pcimne_activity: ChwsRecoReportElements
  morbidity_activities: ChwsRecoReportElements
  malaria_more_5_years: ChwsRecoReportElements
  home_visit: ChwsRecoReportElements
  educational_chat: ChwsRecoReportElements
  developed_areas: ChwsRecoReportElements
  diseases_alerts: ChwsRecoReportElements,

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

export interface ChwsRecoReportElements {
  index: number
  group: string
  position: string
  bigGroup?: string | null
  data: ChwsRecoReportElementsUtils[]
}

export interface ChwsRecoReportElementsUtils {
  index: number
  indicator: string
  de_number: number
  observation: string | null
}
