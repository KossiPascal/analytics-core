
export interface PromotionReport {
    id: string
    month: string
    year: number

    domains?: { [key: string]: any }
    themes: { [key: string]: any }

    maternel_childhealth_domain: DomainsThemesUtils
    education_domain: DomainsThemesUtils
    gbv_domain: DomainsThemesUtils
    nutrition_domain: DomainsThemesUtils
    water_hygiene_domain: DomainsThemesUtils
    ist_vih_domain: DomainsThemesUtils
    disease_control_domain: DomainsThemesUtils
    others_domain: DomainsThemesUtils

    prenatal_consultation_theme: DomainsThemesUtils
    birth_attended_theme: DomainsThemesUtils
    delivery_theme: DomainsThemesUtils
    birth_registration_theme: DomainsThemesUtils
    post_natal_theme: DomainsThemesUtils
    post_abortion_theme: DomainsThemesUtils
    obstetric_fistula_theme: DomainsThemesUtils
    family_planning_theme: DomainsThemesUtils
    oral_contraceptive_theme: DomainsThemesUtils
    vaccination_theme: DomainsThemesUtils
    newborn_care_home_theme: DomainsThemesUtils
    care_home_illness_case_theme: DomainsThemesUtils
    child_development_care_theme: DomainsThemesUtils
    advice_for_child_development_theme: DomainsThemesUtils
    child_abuse_theme: DomainsThemesUtils
    female_genital_mutilation_theme: DomainsThemesUtils
    exclusive_breastfeeding_theme: DomainsThemesUtils
    vitamin_a_supp_theme: DomainsThemesUtils
    suppl_feeding_theme: DomainsThemesUtils
    malnutrition_theme: DomainsThemesUtils
    combating_iodine_theme: DomainsThemesUtils
    hand_washing_theme: DomainsThemesUtils
    community_led_theme: DomainsThemesUtils
    tuberculosis_theme: DomainsThemesUtils
    leprosy_theme: DomainsThemesUtils
    buruli_ulcer_theme: DomainsThemesUtils
    onchocerciasis_theme: DomainsThemesUtils
    bilharzia_theme: DomainsThemesUtils
    mass_deworming_theme: DomainsThemesUtils
    human_african_trypanosomiasis_theme: DomainsThemesUtils
    lymphatic_theme: DomainsThemesUtils
    trachoma_theme: DomainsThemesUtils
    sti_and_hepatitis_theme: DomainsThemesUtils
    hypertension_theme: DomainsThemesUtils
    diabetes_theme: DomainsThemesUtils
    cancers_theme: DomainsThemesUtils
    sickle_cell_disease_theme: DomainsThemesUtils
    malaria_theme: DomainsThemesUtils
    diarrhea_theme: DomainsThemesUtils
    bloody_diarrhea_theme: DomainsThemesUtils
    pneumonia_theme: DomainsThemesUtils
    yellow_fever_theme: DomainsThemesUtils
    cholera_theme: DomainsThemesUtils
    tetanus_theme: DomainsThemesUtils
    viral_diseases_theme: DomainsThemesUtils
    meningitis_theme: DomainsThemesUtils
    pfa_theme: DomainsThemesUtils
    urine_loss_theme: DomainsThemesUtils
    blood_pressure_theme: DomainsThemesUtils
    hiv_theme: DomainsThemesUtils
    ist_theme: DomainsThemesUtils

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
    id: string
    month: string
    year: number
    // orgunit: string

    methods?: { [key: string]: any }

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

export interface MorbidityReport {
    id: string
    month: string
    year: number
    // orgunit: string
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


export interface HouseholdRecapReport {
    id: string
    month: string
    year: number
    index: number
    // orgunit: string
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

export interface PcimneNewbornReport {
    id: string
    month: string
    year: number
    // orgunit: string
    pcimne_newborn?: PcimneNewbornReportUtils[]

    cases_received: PcimneNewbornReportUtils,
    given_rdt: PcimneNewbornReportUtils,
    positive_rdt: PcimneNewbornReportUtils,
    case_cta_treated: PcimneNewbornReportUtils,
    case_amoxicilline_treated: PcimneNewbornReportUtils,
    case_ors_zinc_treated: PcimneNewbornReportUtils,
    case_paracetamol_treated: PcimneNewbornReportUtils,
    case_24h_treated: PcimneNewbornReportUtils,
    followup_made: PcimneNewbornReportUtils,
    pre_referal_traitment: PcimneNewbornReportUtils,
    referal_case: PcimneNewbornReportUtils,
    case_malnutrition_detected: PcimneNewbornReportUtils,
    case_cough_detected: PcimneNewbornReportUtils,
    counter_referrals_received: PcimneNewbornReportUtils,
    deaths_registered: PcimneNewbornReportUtils,

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

export interface ChwsRecoReport {
    id: string
    month: string
    year: number
    // orgunit: string
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
    diseases_alerts: ChwsRecoReportElements
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

export interface RecoMegSituationReport {

    id: string
    year: number
    month: string
    // orgunit: string
    meg_data: RecoMegQuantityUtils[]
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    // chw: { id: string, name: string, phone: string }
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



export interface DomainsThemesUtils {
    label: string,
    vad: {
        F: number | null,
        M: number | null,
    },
    talk: {
        F: number | null,
        M: number | null,
    },
    personal: {
        F: number | null,
        M: number | null,
    },
    total: {
        F: number | null,
        M: number | null,
    },
    bigtotal: number | null
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