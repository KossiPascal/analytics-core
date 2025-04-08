
export interface PregnantDataView {

    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string
    sex?:'M'|'F'|null
    date_of_birth?: string
    age_in_years?:number
    age_in_months?:number
    age_in_days?:number

    consultation_followup?: 'consultation' | 'followup'
    
    is_pregnant?: boolean | null

    next_cpn_visit_date?: string
    is_cpn_late?: boolean | null
    is_pregnant_referred?: boolean | null
    has_danger_sign?: boolean | null
    
    is_referred?: boolean | null
    cpn_done?: boolean | null
    td1_done?: boolean | null
    td2_done?: boolean | null
    has_milda?: boolean | null
    cpn_number?: number | null

    date_cpn1?: string | null
    date_cpn2?: string | null
    date_cpn3?: string | null
    date_cpn4?: string | null

    next_cpn_date?: string | null
    cpn_next_number?: number | null

    delivery_place_wanted?: string | null
    is_home_delivery_wanted?: boolean | null
    
    cpn_already_count?: number | null
    is_closed?: boolean | null

    close_reason?: string | null
    close_reason_name?: string | null
    
    is_miscarriage_referred?: boolean | null
    
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