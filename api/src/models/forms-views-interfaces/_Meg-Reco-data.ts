
export interface RecoMegDataView {

    id?: string
    rev?: string
    form?: string
    year?: number
    month?: string

    meg_type?: 'stock' | 'inventory' | 'consumption' | 'loss' | 'damaged' | 'broken' | 'expired'
 
    fp_method?: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null

    pill_coc?: number | null
    pill_cop?: number | null
    condoms?: number | null
    depo_provera_im?: number | null
    dmpa_sc?: number | null
    diu?: number | null
    implant?: number | null
    
    cycle_necklace?: number | null
    tubal_ligation?: number | null

    cta_nn?: number
    cta_pe?: number
    cta_ge?: number
    cta_ad?: number

    tdr?: number | null
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
    is_fp_referred?: boolean|null
    has_fp_side_effect?: boolean|null

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

