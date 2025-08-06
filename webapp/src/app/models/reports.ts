
export interface FP_Utils {
  label: string
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



export interface PromotionReport_OLD {
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

export interface DomainsThemesUtils {
  label: string,
  vad: { F: number|null, M: number|null },
  talk: { F: number|null, M: number|null },
  personal: { F: number|null, M: number|null },
  total: { F: number|null, M: number|null },
  bigtotal: number
}

export interface PromotionReport {
  id: string
  month: string
  year: number
  orgunit: string
  domains: {
    maternel_childhealth: DomainsThemesUtils
    education: DomainsThemesUtils
    gbv: DomainsThemesUtils
    nutrition: DomainsThemesUtils
    water_hygiene: DomainsThemesUtils
    ist_vih: DomainsThemesUtils
    disease_control: DomainsThemesUtils
    others: DomainsThemesUtils
  },
  themes: {
    prenatal_consultation: DomainsThemesUtils
    birth_attended: DomainsThemesUtils
    delivery: DomainsThemesUtils
    birth_registration: DomainsThemesUtils
    post_natal: DomainsThemesUtils
    post_abortion: DomainsThemesUtils
    obstetric_fistula: DomainsThemesUtils
    family_planning: DomainsThemesUtils
    oral_contraceptive: DomainsThemesUtils
    vaccination: DomainsThemesUtils
    newborn_care_home: DomainsThemesUtils
    care_home_illness_case: DomainsThemesUtils
    child_development_care: DomainsThemesUtils
    advice_for_child_development: DomainsThemesUtils
    child_abuse: DomainsThemesUtils
    female_genital_mutilation: DomainsThemesUtils
    exclusive_breastfeeding: DomainsThemesUtils
    vitamin_a_supp: DomainsThemesUtils
    suppl_feeding: DomainsThemesUtils
    malnutrition: DomainsThemesUtils
    combating_iodine: DomainsThemesUtils
    hand_washing: DomainsThemesUtils
    community_led: DomainsThemesUtils
    tuberculosis: DomainsThemesUtils
    leprosy: DomainsThemesUtils
    buruli_ulcer: DomainsThemesUtils
    onchocerciasis: DomainsThemesUtils
    bilharzia: DomainsThemesUtils
    mass_deworming: DomainsThemesUtils
    human_african_trypanosomiasis: DomainsThemesUtils
    lymphatic: DomainsThemesUtils
    trachoma: DomainsThemesUtils
    sti_and_hepatitis: DomainsThemesUtils
    hypertension: DomainsThemesUtils
    diabetes: DomainsThemesUtils
    cancers: DomainsThemesUtils
    sickle_cell_disease: DomainsThemesUtils
    malaria: DomainsThemesUtils
    diarrhea: DomainsThemesUtils
    bloody_diarrhea: DomainsThemesUtils
    pneumonia: DomainsThemesUtils
    yellow_fever: DomainsThemesUtils
    cholera: DomainsThemesUtils
    tetanus: DomainsThemesUtils
    viral_diseases: DomainsThemesUtils
    meningitis: DomainsThemesUtils
    pfa: DomainsThemesUtils
    urine_loss: DomainsThemesUtils
    blood_pressure: DomainsThemesUtils
    hiv: DomainsThemesUtils
    ist: DomainsThemesUtils
  }
  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  // chw: { id: string, name: string, phone:string }
  village_secteur: { id: string, name: string }
  reco: { id: string, name: string, phone: string }
  is_validate: boolean
  validate_user_id: string
  validated_at: string
  cancel_validate_user_id: string
  cancel_validated_at: string
  already_on_dhis2: boolean
  already_on_dhis2_user_id: string
  already_on_dhis2_at: string
}

export interface FamilyPlanningReport {
  orgunit: string
  id: string
  month: string
  year: number
  methods: {
    pill_coc: FP_Utils
    pill_cop: FP_Utils
    condoms: FP_Utils
    depo_provera_im: FP_Utils
    dmpa_sc: FP_Utils
    cycle_necklace: FP_Utils
    diu: FP_Utils
    implant: FP_Utils
    tubal_ligation: FP_Utils
  }
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
  family_code: string
  family_name: string
  family_fullname: string
  total_household_members: number
  total_adult_women_15_50_years: number
  total_children_0_12_months: number
  total_children_12_60_months: number
  total_children_under_5_years: number
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

  malaria_0_2: { F: number|null, M: number|null }
  malaria_2_12: { F: number|null, M: number|null }
  malaria_12_60: { F: number|null, M: number|null }

  cough_pneumonia_0_2: { F: number|null, M: number|null }
  cough_pneumonia_2_12: { F: number|null, M: number|null }
  cough_pneumonia_12_60: { F: number|null, M: number|null }

  diarrhea_0_2: { F: number|null, M: number|null }
  diarrhea_2_12: { F: number|null, M: number|null }
  diarrhea_12_60: { F: number|null, M: number|null }

  malnutrition_0_2: { F: number|null, M: number|null }
  malnutrition_2_12: { F: number|null, M: number|null }
  malnutrition_12_60: { F: number|null, M: number|null }

  total: { F: number, M: number }
  bigtotal: number
}

export interface ChwsRecoReport {
  // orgunit: string
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
  educational_talk: ChwsRecoReportElements
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
