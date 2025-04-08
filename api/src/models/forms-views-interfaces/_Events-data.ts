
export interface EventsDataView {
    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string

    events?: string[] | null

    other_event?: string | null
    event_name?: string | null
    event_date?: string | null
    village_location_name?: string | null
    name_person_in_charge?: string | null
    phone_person_in_charge?: string | null
    health_center_feedback_date?: string | null
    feedback_manager?: string | null

    is_flood?: boolean | null
    is_fire?: boolean | null
    is_shipwreck?: boolean | null
    is_landslide?: boolean | null
    is_grouped_animal_deaths?: boolean | null
    is_pfa?: boolean | null
    is_bloody_diarrhea?: boolean | null
    is_yellow_fever?: boolean | null
    is_cholera?: boolean | null
    is_maternal_and_neonatal_tetanus?: boolean | null
    is_viral_diseases?: boolean | null
    is_meningitis?: boolean | null
    is_maternal_deaths?: boolean | null
    is_community_deaths?: boolean | null
    is_influenza_fever?: boolean | null

    country_id?: string | null
    region_id?: string | null
    prefecture_id?: string | null
    commune_id?: string | null
    hospital_id?: string | null
    district_quartier_id?: string | null
    village_secteur_id?: string | null
    reco_id?: string | null

    reported_date_timestamp?: number
    reported_date?: string
    reported_full_date?: string | null

    geolocation?: object | null;

}
