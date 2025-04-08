
export interface PcimneDataView {

    id?: string
    rev?: string
    form?: 'pcimne_register' | 'pcimne_followup'
    year?: number
    month?: string
    sex?:'M'|'F'|null
    date_of_birth?: string
    age_in_years?:number
    age_in_months?:number
    age_in_days?:number

    consultation_followup?: 'consultation' | 'followup'
    
    promptitude?: number | null
    has_initial_danger_signs?: boolean | null
    has_fever?: boolean | null
    has_malaria?: boolean | null
    has_cough_cold?: boolean | null
    has_pneumonia?: boolean | null
    has_normal_respiratory_rate?: boolean | null
    has_diarrhea?: boolean | null
    
    has_malnutrition?: boolean | null
    has_modere_malnutrition?: boolean | null
    has_severe_malnutrition?: boolean | null

    has_afp?: boolean | null
    is_danger_signs_referral?: boolean | null
    is_fever_referal?: boolean | null
    is_cough_cold_referal?: boolean | null
    is_diarrhea_referal?: boolean | null
    is_malnutrition_referal?: boolean | null
    is_referred?: boolean | null
    
    temperature?: number | null
    rdt_given?: boolean | null
    
    rdt_result?: 'positive' | 'negative' | null
    unable_drink_breastfeed?: boolean | null
    vomits_everything?: boolean | null
    convulsions?: boolean | null
    sleepy_unconscious?: boolean | null
    has_stiff_neck?: boolean | null
    has_bulging_fontanelle?: boolean | null
    breathing_difficulty?: boolean | null
    cough_more_than_14days?: boolean | null
    subcostal_indrawing?: boolean | null
    wheezing?: boolean | null
    bloody_diarrhea?: boolean | null
    diarrhea_more_than_14_days?: boolean | null
    blood_in_stool?: boolean | null
    restless?: boolean | null
    drinks_hungrily?: boolean | null
    sunken_eyes?: boolean | null
    has_edema?: boolean | null
    is_principal_referal?: boolean | null
    has_health_problem?: boolean | null
    has_serious_malaria?: boolean | null
    has_pre_reference_treatments?: boolean | null
    
    cta_nn?: number
    cta_pe?: number
    cta_ge?: number
    cta_ad?: number

    amoxicillin_250mg?: number | null
    amoxicillin_500mg?: number | null
    paracetamol_100mg?: number | null
    paracetamol_250mg?: number | null
    paracetamol_500mg?: number | null
    ors?: number | null
    zinc?: number | null
    vitamin_a?: number | null
    mebendazol_250mg?: number | null
    mebendazol_500mg?: number | null
    tetracycline_ointment?: number | null

    is_present?: boolean | null

    absence_reasons?: string | null
    went_to_health_center?: boolean | null
    coupon_available?: boolean | null

    coupon_number?: string | null
    has_no_improvement?: boolean | null
    has_getting_worse?: boolean | null
    
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
