
export interface FsMegDataView {
    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string

    action_date?: string | null

    month_date_selected?: string | null

    month_day?: string | null
    all_med_shortage_days_number?: number | null
    all_med_number?: number | null
    meg_average_out_of?: number | null
    meg_average_available?: number | null

    country_id?: string | null
    region_id?: string | null
    prefecture_id?: string | null
    commune_id?: string | null
    hospital_id?: string | null

    hospital_manager_id?: string | null

    reported_date_timestamp?: number
    reported_date?: string | null
    reported_full_date?: string | null

    geolocation?: object | null;

}
