
export interface VaccinationDataView {

    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string
    sex?: 'M' | 'F' | null
    birth_date?: string
    age_in_years?: number
    age_in_months?: number
    age_in_days?: number

    vaccine_BCG?: boolean | null
    vaccine_VPO_0?: boolean | null
    vaccine_PENTA_1?: boolean | null
    vaccine_VPO_1?: boolean | null
    vaccine_PENTA_2?: boolean | null
    vaccine_VPO_2?: boolean | null
    vaccine_PENTA_3?: boolean | null
    vaccine_VPO_3?: boolean | null
    vaccine_VPI_1?: boolean | null
    vaccine_VAR_1?: boolean | null
    vaccine_VAA?: boolean | null
    vaccine_VPI_2?: boolean | null
    vaccine_MEN_A?: boolean | null
    vaccine_VAR_2?: boolean | null

    no_BCG_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VPO_0_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_PENTA_1_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VPO_1_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_PENTA_2_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VPO_2_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_PENTA_3_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VPO_3_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VPI_1_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VAR_1_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VAA_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VPI_2_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_MEN_A_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    no_VAR_2_reason?: 'upcoming' | 'shortage' | 'no_appointment_respect' | 'hesitancy' | 'others' | null
    












    is_birth_vaccine_ok?: boolean | null
    is_six_weeks_vaccine_ok?: boolean | null
    is_ten_weeks_vaccine_ok?: boolean | null
    is_forteen_weeks_vaccine_ok?: boolean | null
    is_nine_months_vaccine_ok?: boolean | null
    is_fifty_months_vaccine_ok?: boolean | null
    is_vaccine_referal?: boolean | null
    has_all_vaccine_done?: boolean | null

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