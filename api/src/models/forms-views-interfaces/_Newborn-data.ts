
export interface NewbornDataView {

    id?: string
    rev?: string
    form?: 'newborn_register' | 'newborn_followup'
    year?: number
    month?: string
    sex?:'M'|'F'|null
    birth_date?: string
    age_in_years?:number
    age_in_months?:number
    age_in_days?:number

    consultation_followup?: 'consultation' | 'followup'


    // newborm register from --------------------------------------
    promptitude?: number | null
    is_referred?: boolean | null
    has_danger_sign?: boolean | null
    has_unable_to_suckle?: boolean | null
    has_vomits_everything_consumes?: boolean | null
    has_convulsion?: boolean | null
    has_sleepy_unconscious?: boolean | null
    has_stiff_neck?: boolean | null
    has_domed_fontanelle?: boolean | null
    has_breathe_hard?: boolean | null
    has_subcostal_indrawing?: boolean | null
    has_wheezing?: boolean | null
    has_diarrhea?: boolean | null
    has_malnutrition?: boolean | null
    has_malaria?: boolean | null
    has_pneumonia?: boolean | null
    has_cough_cold?: boolean | null
    coupon_available?: boolean | null

    coupon_number?: string | null
    
    has_others_heath_problem?: boolean | null
    has_pre_reference_treatments?: boolean | null

    

    reference_pattern_other?: string | null
    // -------------------------------------------------------------

    //newborn followup form ---------------------------------
    referal_health_center?: boolean | null
    is_health_referred?: boolean | null
    has_new_complaint?: boolean | null

    other_diseases?: string | null

    country_id?: string | null
    region_id?: string | null
    prefecture_id?: string | null
    commune_id?: string | null
    hospital_id?: string | null
    district_quartier_id?: string | null
    village_secteur?: string | null
    family_id?: string | null
    reco_id?: string | null
    patient_id?: string | null

    reported_date_timestamp?: number
    reported_date?: string
    reported_full_date?: string | null
    
    geolocation?: object | null;

}