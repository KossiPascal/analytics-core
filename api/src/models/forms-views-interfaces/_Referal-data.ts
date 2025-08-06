
export interface ReferalDataView {
    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string
    sex?:'M'|'F'|null
    birth_date?: string
    age_in_years?:number
    age_in_months?:number
    age_in_days?:number

    is_referred?: boolean | null
    is_present?: boolean | null

    absence_reasons?: string | null
    went_to_health_center?: boolean | null

    coupon_available?: string | null

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
