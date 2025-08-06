
export interface FamilyPlanningDataView {
    id: string
    rev?: string
    form: string
    year?: number
    month?: string
    sex?: 'M' | 'F' | null
    birth_date?: string
    age_in_years?: number
    age_in_months?: number
    age_in_days?: number
    consultation_followup?: 'consultation' | 'renewal' | 'danger_sign_check'
    has_counseling?: boolean | null
    no_counseling_reasons?: string | null
    no_counseling_reasons_name?: string | null
    already_use_method?: boolean | null
    method_already_used?: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null
    is_currently_using_method?: boolean | null
    has_changed_method?: boolean | null
    want_renew_method?: boolean | null
    want_renew_method_date?: string | null
    refuse_renew_method_reasons?: string | null
    refuse_renew_method_reasons_name?: string | null
    new_method_wanted?: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null
    who_will_give_method?: 'reco' | 'health_center' | null
    method_was_given?: boolean | null
    method_start_date?: string | null
    method_not_given_reason?: string | null
    method_not_given_reason_name?: string | null
    is_method_avaible_reco?: boolean | null
    fp_method?: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null
    fp_method_name?: string | null
    next_fp_renew_date?: string | null
    has_health_problem?: boolean | null
    has_fever?: boolean | null
    has_vomit?: boolean | null
    has_headaches?: boolean | null
    has_abdominal_pain?: boolean | null
    has_bleeding?: boolean | null
    has_feel_pain_injection?: boolean | null
    other_health_problem_written?: string | null
    has_secondary_effect?: boolean | null
    is_fp_referal?: boolean | null
    is_health_problem_referal?: boolean | null

    country_id?: string | null
    region_id?: string | null
    prefecture_id?: string | null
    commune_id?: string | null
    hospital_id?: string | null
    district_quartier_id?: string | null
    village_secteur_id?: string | null
    family_id?: string | null
    reco_id?: string | null
    patient_id?: string | null

    reported_date_timestamp?: number
    reported_date?: string
    reported_full_date?: string | null
    
    geolocation?: object | null;

}