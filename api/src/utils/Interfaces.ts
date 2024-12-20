import { Roles } from "../entities/Roles"
import { ChwsMap, CommunesMap, CountryMap, DistrictQuartiersMap, HospitalsMap, PrefecturesMap, RecosMap, RegionsMap, VillageSecteursMap } from "./org-unit-interface"

export interface TokenUser {
    id: string
    username: string
    fullname: string
    email: string
    isAdmin: boolean
    can_use_offline_mode: boolean
    can_view_reports: boolean
    can_view_dashboards: boolean
    can_manage_data: boolean
    can_create_user: boolean
    can_update_user: boolean
    can_delete_user: boolean
    can_create_role: boolean
    can_update_role: boolean
    can_delete_role: boolean
    can_logout: boolean
    roleIds?: string[]
    roles?: Roles[]
    routes: Routes[]
    default_route: Routes
    autorizations: string[]
    countries?: CountryMap[]
    regions?: RegionsMap[]
    prefectures?: PrefecturesMap[]
    communes?: CommunesMap[]
    hospitals?: HospitalsMap[]
    districtQuartiers?: DistrictQuartiersMap[]
    villageSecteurs?: VillageSecteursMap[]
    chws?: ChwsMap[]
    recos?: RecosMap[]
}

export interface ChwsRecoReportElements {
    index: number
    group: string
    position: string
    bigGroup?: string | null
    data: ChwsRecoReportElementsUtils[]
}

export interface ChwsRecoReportElementsUtils {
    index: number
    indicator: string
    de_number: number
    observation: string | null
}

export interface FP_Utils {
    nbr_new_user: number
    nbr_regular_user: number
    nbr_total_user: number
    nbr_delivered: number
    nbr_in_stock: number
    nbr_referred: number
    nbr_side_effect: number
}

export interface Routes {
    path: string;
    group: string;
    label: string
    autorisations: string[];
}

export interface MorbidityUtils {
    indicator: string
    nbr_5_14_years: number
    nbr_14_25_years: number
    nbr_25_60_years: number
    nbr_60_more_years: number
    nbr_pregnant_woman: number|undefined
    nbr_total: number
    nbr_referred: number|undefined
}

export interface CouchDbFetchData {
    viewName: string,
    startKey: string[];
    endKey: string[];
    // medic_host: string;
    // medic_username: string;
    // medic_password: string;
    // port: number;
    // ssl_verification: boolean;
    descending: boolean
    dhisusername: string
    dhispassword: string
}

export interface PcimneNewbornReportUtils {
    index: number
    indicator: string
    nbr_malaria_0_2_months_F: number|undefined
    nbr_malaria_0_2_months_M: number|undefined
    nbr_malaria_2_12_months_F: number|undefined
    nbr_malaria_2_12_months_M: number|undefined
    nbr_malaria_12_60_months_F: number|undefined
    nbr_malaria_12_60_months_M: number|undefined

    nbr_cough_pneumonia_0_2_months_F: number|undefined
    nbr_cough_pneumonia_0_2_months_M: number|undefined
    nbr_cough_pneumonia_2_12_months_F: number|undefined
    nbr_cough_pneumonia_2_12_months_M: number|undefined
    nbr_cough_pneumonia_12_60_months_F: number|undefined
    nbr_cough_pneumonia_12_60_months_M: number|undefined

    nbr_diarrhea_0_2_months_F: number|undefined
    nbr_diarrhea_0_2_months_M: number|undefined
    nbr_diarrhea_2_12_months_F: number|undefined
    nbr_diarrhea_2_12_months_M: number|undefined
    nbr_diarrhea_12_60_months_F: number|undefined
    nbr_diarrhea_12_60_months_M: number|undefined
    nbr_malnutrition_0_2_months_F: number|undefined
    nbr_malnutrition_0_2_months_M: number|undefined
    nbr_malnutrition_2_12_months_F: number|undefined
    nbr_malnutrition_2_12_months_M: number|undefined
    nbr_malnutrition_12_60_months_F: number|undefined
    nbr_malnutrition_12_60_months_M: number|undefined
    nbr_total: number|undefined
}


// ######################### DASHBOARDS #########################
export interface RecoPerformanceDashboardUtils {
    title: string
    type: 'line' | 'bar',
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

export interface RecoVaccinationDashboardUtils {
    child_name: string
    child_code: string
    child_sex: string
    child_phone: string
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

// ###########################################################

export interface FullRolesUtils {
    rolesObj: Roles[]
    roles: string[]
    routes: Routes[]
    default_routes: Routes[]
    autorizations: string[]
}


export interface RecoMegQuantityUtils {
    index: number,
    label: string
    month_beginning: number
    month_received: number
    month_total_start: number
    month_consumption: number
    month_theoreticaly: number
    month_inventory: number
    month_loss: number
    month_damaged: number
    month_broken: number
    month_expired: number
  }