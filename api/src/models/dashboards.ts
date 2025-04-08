export interface RecoPerformanceDashboard {
    id: string
    year: number
    month: string
    household_count: number
    patient_count: number
    newborn_less_02_months_count: number
    child_02_to_60_months_count: number
    child_05_to_14_years_count: number
    adult_over_14_years_count: number
    consultation_count: number
    followup_count: number
    all_actions_count: number
    linechart:RecoPerformanceDashboardUtils
    barchart:RecoPerformanceDashboardUtils
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    reco: { id: string, name: string, phone: string }

}

export interface RecoChartPerformanceDashboard {
    id: string
    year: number
    chart: RecoPerformanceDashboardUtils
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    reco: { id: string, name: string, phone: string }
}

export interface RecoPerformanceDashboardUtils {
    title?: string
    type?: 'line' | 'bar',
    absisseLabels: number[] | string[],
    datasets: {
        label: string,
        backgroundColor: string[] | string,
        data: number[] | string[] | { [key: string]: number[] | string[] },
        borderColor?: string[] | string,
        pointBackgroundColor?: string,
        pointHoverBorderColor?: string,
        fill?: boolean
    }[]
}



export interface RecoVaccinationDashboardDbOutput {
    id: string
    year: number
    month: string
    children_vaccines: ChildrenVaccines[]
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    reco: { id: string, name: string, phone: string }
}


export interface ChildrenVaccines { 
    family_id: string, 
    family_name: string, 
    family_code: string, 
    family_fullname: string, 
    data: RecoVaccinationDashboard[] 
}


export interface RecoVaccinationDashboard {
    family_id: string, 
    family_name: string, 
    family_code: string, 
    family_fullname: string, 
    child_id: string
    child_name: string
    child_code: string
    child_sex: string
    reco_phone: string
    parent_phone: string
    neighbor_phone: string
    child_age_in_days: number
    child_age_in_months: number
    child_age_in_years: number
    child_age_str: string
    vaccine_BCG: boolean
    vaccine_VPO_0: boolean
    vaccine_PENTA_1: boolean
    vaccine_VPO_1: boolean
    vaccine_PENTA_2: boolean
    vaccine_VPO_2: boolean
    vaccine_PENTA_3: boolean
    vaccine_VPO_3: boolean
    vaccine_VPI_1: boolean
    vaccine_VAR_1: boolean
    vaccine_VAA: boolean
    vaccine_VPI_2: boolean
    vaccine_MEN_A: boolean
    vaccine_VAR_2: boolean

    no_BCG_reason: string | null | ''
    no_VPO_0_reason: string | null | ''
    no_PENTA_1_reason: string | null | ''
    no_VPO_1_reason: string | null | ''
    no_PENTA_2_reason: string | null | ''
    no_VPO_2_reason: string | null | ''
    no_PENTA_3_reason: string | null | ''
    no_VPO_3_reason: string | null | ''
    no_VPI_1_reason: string | null | ''
    no_VAR_1_reason: string | null | ''
    no_VAA_reason: string | null | ''
    no_VPI_2_reason: string | null | ''
    no_MEN_A_reason: string | null | ''
    no_VAR_2_reason: string | null | ''
}
