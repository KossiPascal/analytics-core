import type { LocationInfo } from './org-unit.types';

// Base report interface with common fields
export interface BaseReport extends LocationInfo {
  id: string;
  month: string;
  year: number;
  orgunit?: string;
  is_validate?: boolean;
  validate_user_id?: string;
  validated_at?: string;
  cancel_validate_user_id?: string;
  cancel_validated_at?: string;
  already_on_dhis2?: boolean;
  already_on_dhis2_user_id?: string;
  already_on_dhis2_at?: string;
}

// Family Planning Report
export interface FP_Utils {
  label: string;
  nbr_new_user: number;
  nbr_regular_user: number;
  nbr_total_user: number;
  nbr_delivered: number;
  nbr_in_stock: number;
  nbr_referred: number;
  nbr_side_effect: number;
}

export interface FamilyPlanningReport extends BaseReport {
  methods: {
    pill_coc: FP_Utils;
    pill_cop: FP_Utils;
    condoms: FP_Utils;
    condoms_masculin: FP_Utils;
    depo_provera_im: FP_Utils;
    dmpa_sc: FP_Utils;
    cycle_necklace: FP_Utils;
    diu: FP_Utils;
    implant: FP_Utils;
    tubal_ligation: FP_Utils;
  };
}

// Morbidity Report
export interface MorbidityUtils {
  indicator: string;
  nbr_5_14_years: number;
  nbr_14_25_years: number;
  nbr_25_60_years: number;
  nbr_60_more_years: number;
  nbr_pregnant_woman?: number;
  nbr_total: number;
  nbr_referred?: number;
}

export interface MorbidityReport extends BaseReport {
  hp_circulation_accident: MorbidityUtils;
  hp_burn: MorbidityUtils;
  hp_suspected_tb_cases: MorbidityUtils;
  hp_dermatosis: MorbidityUtils;
  hp_diarrhea: MorbidityUtils;
  hp_urethral_discharge: MorbidityUtils;
  hp_vaginal_discharge: MorbidityUtils;
  hp_urinary_loss: MorbidityUtils;
  hp_accidental_caustic_products_ingestion: MorbidityUtils;
  hp_food_poisoning: MorbidityUtils;
  hp_oral_diseases: MorbidityUtils;
  hp_dog_bite: MorbidityUtils;
  hp_snake_bite: MorbidityUtils;
  hp_parasitosis: MorbidityUtils;
  hp_measles: MorbidityUtils;
  hp_trauma: MorbidityUtils;
  hp_gender_based_violence: MorbidityUtils;
  malaria_total_cases: MorbidityUtils;
  malaria_rdt_performed: MorbidityUtils;
  malaria_positive_rdts: MorbidityUtils;
  malaria_cases_treated_with_cta: MorbidityUtils;
}

// Promotion Report
export interface DomainsThemesUtils {
  label: string;
  vad: { F: number | null; M: number | null };
  talk: { F: number | null; M: number | null };
  personal: { F: number | null; M: number | null };
  total: { F: number | null; M: number | null };
  bigtotal: number;
}

export interface PromotionReport extends BaseReport {
  domains: {
    maternel_childhealth: DomainsThemesUtils;
    education: DomainsThemesUtils;
    gbv: DomainsThemesUtils;
    nutrition: DomainsThemesUtils;
    water_hygiene: DomainsThemesUtils;
    ist_vih: DomainsThemesUtils;
    disease_control: DomainsThemesUtils;
    others: DomainsThemesUtils;
  };
  themes: {
    prenatal_consultation: DomainsThemesUtils;
    birth_attended: DomainsThemesUtils;
    delivery: DomainsThemesUtils;
    birth_registration: DomainsThemesUtils;
    post_natal: DomainsThemesUtils;
    post_abortion: DomainsThemesUtils;
    obstetric_fistula: DomainsThemesUtils;
    family_planning: DomainsThemesUtils;
    oral_contraceptive: DomainsThemesUtils;
    vaccination: DomainsThemesUtils;
    newborn_care_home: DomainsThemesUtils;
    care_home_illness_case: DomainsThemesUtils;
    child_development_care: DomainsThemesUtils;
    advice_for_child_development: DomainsThemesUtils;
    child_abuse: DomainsThemesUtils;
    female_genital_mutilation: DomainsThemesUtils;
    exclusive_breastfeeding: DomainsThemesUtils;
    vitamin_a_supp: DomainsThemesUtils;
    suppl_feeding: DomainsThemesUtils;
    malnutrition: DomainsThemesUtils;
    combating_iodine: DomainsThemesUtils;
    hand_washing: DomainsThemesUtils;
    community_led: DomainsThemesUtils;
    tuberculosis: DomainsThemesUtils;
    leprosy: DomainsThemesUtils;
    buruli_ulcer: DomainsThemesUtils;
    onchocerciasis: DomainsThemesUtils;
    bilharzia: DomainsThemesUtils;
    mass_deworming: DomainsThemesUtils;
    human_african_trypanosomiasis: DomainsThemesUtils;
    lymphatic: DomainsThemesUtils;
    trachoma: DomainsThemesUtils;
    sti_and_hepatitis: DomainsThemesUtils;
    hypertension: DomainsThemesUtils;
    diabetes: DomainsThemesUtils;
    cancers: DomainsThemesUtils;
    sickle_cell_disease: DomainsThemesUtils;
    malaria: DomainsThemesUtils;
    diarrhea: DomainsThemesUtils;
    bloody_diarrhea: DomainsThemesUtils;
    pneumonia: DomainsThemesUtils;
    yellow_fever: DomainsThemesUtils;
    cholera: DomainsThemesUtils;
    tetanus: DomainsThemesUtils;
    viral_diseases: DomainsThemesUtils;
    meningitis: DomainsThemesUtils;
    pfa: DomainsThemesUtils;
    urine_loss: DomainsThemesUtils;
    blood_pressure: DomainsThemesUtils;
    hiv: DomainsThemesUtils;
    ist: DomainsThemesUtils;
  };
}

// Household Recap Report
export interface HouseholdRecapReport extends BaseReport {
  index: number;
  family_code: string;
  family_name: string;
  family_fullname: string;
  total_household_members: number;
  total_adult_women_15_50_years: number;
  total_children_0_12_months: number;
  total_children_12_60_months: number;
  total_children_under_5_years: number;
  has_functional_latrine: boolean;
  has_drinking_water_access: boolean;
}

// PCIMNE Newborn Report
export interface PcimneNewbornReportUtils {
  index: number;
  indicator: string;
  malaria_0_2: { F: number | null; M: number | null };
  malaria_2_12: { F: number | null; M: number | null };
  malaria_12_60: { F: number | null; M: number | null };
  cough_pneumonia_0_2: { F: number | null; M: number | null };
  cough_pneumonia_2_12: { F: number | null; M: number | null };
  cough_pneumonia_12_60: { F: number | null; M: number | null };
  diarrhea_0_2: { F: number | null; M: number | null };
  diarrhea_2_12: { F: number | null; M: number | null };
  diarrhea_12_60: { F: number | null; M: number | null };
  malnutrition_0_2: { F: number | null; M: number | null };
  malnutrition_2_12: { F: number | null; M: number | null };
  malnutrition_12_60: { F: number | null; M: number | null };
  total: { F: number; M: number };
  bigtotal: number;
}

export interface PcimneNewbornReport extends BaseReport {
  pcimne_newborn: PcimneNewbornReportUtils[];
}

// CHW RECO Report
export interface ChwsRecoReportElementsUtils {
  index: number;
  indicator: string;
  de_number: number;
  observation: string | null;
}

export interface ChwsRecoReportElements {
  index: number;
  group: string;
  position: string;
  bigGroup?: string | null;
  data: ChwsRecoReportElementsUtils[];
}

export interface ChwsRecoReport extends BaseReport {
  reco_monitoring: ChwsRecoReportElements;
  demography: ChwsRecoReportElements;
  child_health_0_59_months: ChwsRecoReportElements;
  mother_health: ChwsRecoReportElements;
  pcimne_activity: ChwsRecoReportElements;
  morbidity_activities: ChwsRecoReportElements;
  malaria_more_5_years: ChwsRecoReportElements;
  home_visit: ChwsRecoReportElements;
  educational_talk: ChwsRecoReportElements;
  developed_areas: ChwsRecoReportElements;
  diseases_alerts: ChwsRecoReportElements;
}

// MEG Situation Report
export interface RecoMegQuantityUtils {
  index: number;
  label: string;
  month_beginning: number;
  month_received: number;
  month_total_start: number;
  month_consumption: number;
  month_theoreticaly: number;
  month_inventory: number;
  month_loss: number;
  month_damaged: number;
  month_broken: number;
  month_expired: number;
}

export interface RecoMegSituationReport extends BaseReport {
  meg_data: RecoMegQuantityUtils[];
}

// Report filter params
export interface ReportFilterParams {
  year: number;
  month: string;
  countryId?: string;
  regionId?: string;
  prefectureId?: string;
  communeId?: string;
  hospitalId?: string;
  districtQuartierId?: string;
  villageSecteurId?: string;
  recoId?: string;
}

// Report types enum
export type ReportType =
  | 'MONTHLY_ACTIVITY'
  | 'FAMILY_PLANNING'
  | 'MORBIDITY'
  | 'PCIMNE_NEWBORN'
  | 'PROMOTION'
  | 'HOUSE_HOLD_RECAP'
  | 'RECO_MEG_QUANTITIES';

// Alias for backwards compatibility
export type ChwRecoActivityReport = ChwsRecoReport;

// Report metadata
export interface ReportMetadata {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// Available reports configuration
export const REPORTS_CONFIG: Record<ReportType, ReportMetadata> = {
  'MONTHLY_ACTIVITY': {
    type: 'MONTHLY_ACTIVITY',
    title: 'Rapport Mensuel RECO',
    description: 'Activites mensuelles des RECO',
    icon: 'clipboard-list',
    color: '#3B82F6',
  },
  'FAMILY_PLANNING': {
    type: 'FAMILY_PLANNING',
    title: 'Planification Familiale',
    description: 'Rapport de planification familiale',
    icon: 'users',
    color: '#EC4899',
  },
  'MORBIDITY': {
    type: 'MORBIDITY',
    title: 'Morbidite',
    description: 'Rapport de morbidite',
    icon: 'activity',
    color: '#EF4444',
  },
  'PCIMNE_NEWBORN': {
    type: 'PCIMNE_NEWBORN',
    title: 'PCIMNE',
    description: 'Prise en charge integree des maladies du nouveau-ne et de l\'enfant',
    icon: 'baby',
    color: '#8B5CF6',
  },
  'PROMOTION': {
    type: 'PROMOTION',
    title: 'Promotion de la Sante',
    description: 'Activites de promotion de la sante',
    icon: 'megaphone',
    color: '#10B981',
  },
  'HOUSE_HOLD_RECAP': {
    type: 'HOUSE_HOLD_RECAP',
    title: 'Recapitulatif Menages',
    description: 'Recapitulatif des menages',
    icon: 'home',
    color: '#F59E0B',
  },
  'RECO_MEG_QUANTITIES': {
    type: 'RECO_MEG_QUANTITIES',
    title: 'Situation MEG',
    description: 'Situation des medicaments essentiels generiques',
    icon: 'pill',
    color: '#06B6D4',
  },
};
