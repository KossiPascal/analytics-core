
export interface DeathDataView {
    id?: string
    rev?: string
    form?: string

    year?: number
    month?: string
    sex?: 'M' | 'F' | null
    date_of_birth?: string
    age_in_years?: number
    age_in_months?: number
    age_in_days?: number

    date_of_death?: string | null
    death_place?: string | null
    death_reason?: string[]
    death_place_label?: string | null
    death_reason_label?: string | null
    is_maternal_death?: boolean | null
    is_home_death?: boolean | null
    has_malaria?: boolean | null
    has_diarrhea?: boolean | null
    has_malnutrition?: boolean | null
    has_cough_cold?: boolean | null
    has_pneumonia?: boolean | null
    has_maternal_death?: boolean | null
    has_fever?: boolean | null
    has_yellow_fever?: boolean | null
    has_tetanus?: boolean | null
    has_viral_diseases?: boolean | null
    has_meningitis?: boolean | null
    has_miscarriage?: boolean | null
    has_traffic_accident?: boolean | null
    has_burns?: boolean | null
    has_tuberculosis?: boolean | null
    has_bloody_diarrhea?: boolean | null
    has_accidental_ingestion_caustic_products?: boolean | null
    has_food_poisoning?: boolean | null
    has_dog_bites?: boolean | null
    has_snake_bite?: boolean | null
    has_trauma?: boolean | null
    has_domestic_violence?: boolean | null
    has_cholera?: boolean | null

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
