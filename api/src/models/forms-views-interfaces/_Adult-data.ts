
export interface AdultDataView {

    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string
    sex?:'M'|'F'|null
    date_of_birth?: string | null
    age_in_years?:number | null
    age_in_months?:number | null
    age_in_days?:number | null
    consultation_followup?: 'consultation' | 'followup'
    is_pregnant?: boolean | null
    promptitude?: number | null
    has_malaria?: boolean | null
    has_fever?: boolean | null
    has_diarrhea?: boolean | null
    has_cough_cold?: boolean | null
    rdt_given?: boolean | null
    rdt_result?: 'positive' | 'nagative' | null
    is_referred?: boolean | null
    malaria?: boolean | null
    fever?: boolean | null
    diarrhea?: boolean | null
    yellow_fever?: boolean | null
    tetanus?: boolean | null
    cough_or_cold?: boolean | null
    viral_diseases?: boolean | null
    acute_flaccid_paralysis?: boolean | null
    meningitis?: boolean | null
    miscarriage?: boolean | null
    traffic_accident?: boolean | null
    burns?: boolean | null
    suspected_tb?: boolean | null
    dermatosis?: boolean | null
    bloody_diarrhea?: boolean | null
    urethral_discharge?: boolean | null
    vaginal_discharge?: boolean | null
    loss_of_urine?: boolean | null
    accidental_ingestion_caustic_products?: boolean | null
    food_poisoning?: boolean | null
    oral_and_dental_diseases?: boolean | null
    dog_bites?: boolean | null
    snake_bite?: boolean | null
    parasitosis?: boolean | null
    measles?: boolean | null
    trauma?: boolean | null
    gender_based_violence?: boolean | null
    vomit?: boolean | null
    headaches?: boolean | null
    abdominal_pain?: boolean | null
    bleeding?: boolean | null
    feel_pain_injection?: boolean | null
    health_center_FP?: boolean | null
    cpn_done?: boolean | null
    td1_done?: boolean | null
    td2_done?: boolean | null
    danger_sign?: boolean | null
    fp_side_effect?: boolean | null
    domestic_violence?: boolean | null
    afp?: boolean | null
    cholera?: boolean | null
    other_problems?: string | null
    cta_nn?: number | null
    cta_pe?: number | null
    cta_ge?: number | null
    cta_ad?: number | null
    amoxicillin_250mg?: number | null
    amoxicillin_500mg?: number | null
    paracetamol_100mg?: number | null
    paracetamol_250mg?: number | null
    paracetamol_500mg?: number | null
    mebendazole_250mg?: number | null
    mebendazole_500mg?: number | null
    ors?: number | null
    zinc?: number | null

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

    geolocation?: object;

}
