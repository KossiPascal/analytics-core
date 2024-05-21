import { Roles } from "../entities/Roles"

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
    countries?: CountryCoustomQuery[]
    regions?: RegionCoustomQuery[]
    prefectures?: PrefectureCoustomQuery[]
    communes?: CommuneCoustomQuery[]
    hospitals?: HospitalCoustomQuery[]
    districtQuartiers?: DistrictQuartierCoustomQuery[]
    villageSecteurs?: VillageSecteurCoustomQuery[]
    chws?: ChwCoustomQuery[]
    recos?: RecoCoustomQuery[]
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
    nbr_pregnant_woman: number
    nbr_total: number
    nbr_referred: number
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
    nbr_malaria_0_2_months_F: number
    nbr_malaria_0_2_months_M: number
    nbr_malaria_2_12_months_F: number
    nbr_malaria_2_12_months_M: number
    nbr_malaria_12_60_months_F: number
    nbr_malaria_12_60_months_M: number

    nbr_cough_pneumonia_0_2_months_F: number
    nbr_cough_pneumonia_0_2_months_M: number
    nbr_cough_pneumonia_2_12_months_F: number
    nbr_cough_pneumonia_2_12_months_M: number
    nbr_cough_pneumonia_12_60_months_F: number
    nbr_cough_pneumonia_12_60_months_M: number

    nbr_diarrhea_0_2_months_F: number
    nbr_diarrhea_0_2_months_M: number
    nbr_diarrhea_2_12_months_F: number
    nbr_diarrhea_2_12_months_M: number
    nbr_diarrhea_12_60_months_F: number
    nbr_diarrhea_12_60_months_M: number
    nbr_malnutrition_0_2_months_F: number
    nbr_malnutrition_0_2_months_M: number
    nbr_malnutrition_2_12_months_F: number
    nbr_malnutrition_2_12_months_M: number
    nbr_malnutrition_12_60_months_F: number
    nbr_malnutrition_12_60_months_M: number
    nbr_total: number
}


// ######################### DASHBOARDS #########################

export interface RecoMegDashboardUtils {
    index: number,
    label: string
    month_stock: number,
    available_stock: number,
    consumption: number,
    loss: number,
    damaged: number,
    broken: number,
    obselete: number
}

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
}

// ###########################################################

export interface FullRolesUtils {
    rolesObj: Roles[]
    roles: string[]
    routes: Routes[]
    default_routes: Routes[]
    autorizations: string[]
}

// ###################### ORG UNITS ##########################

export interface CountryCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string
}

export interface RegionCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string
    country_id: string
    country: { id: string, name: string }
}

export interface PrefectureCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string

    country_id: string
    region_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
}

export interface CommuneCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
}

export interface HospitalCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
}

export interface DistrictQuartierCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string
    hospital_id: string
    chw_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    chw: { id: string, name: string, phone: string }
}

export interface VillageSecteurCoustomQuery {
    id: string
    name: string
    external_id: string
    code: string
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string
    hospital_id: string
    district_quartier_id: string
    reco_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    reco: { id: string, name: string, phone: string }
}

export interface FamilyCoustomQuery {
    id: string
    name: string
    given_name: string
    external_id: string
    code: string
    household_has_working_latrine: boolean
    household_has_good_water_access: boolean
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string
    hospital_id: string
    district_quartier_id: string
    village_secteur_id: string
    chw_id: string
    reco_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    chw: { id: string, name: string, phone: string }
    reco: { id: string, name: string, phone: string }
}

export interface ChwCoustomQuery {
    id: string
    name: string
    phone: string
    code: string
    external_id: string
    role: string
    sex: string
    date_of_birth: string
    email: string
    profession: string
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string
    hospital_id: string
    district_quartier_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
}

export interface RecoCoustomQuery {
    id: string
    name: string
    phone: string
    code: string
    external_id: string
    role: string
    sex: string
    date_of_birth: string
    email: string
    profession: string
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string
    hospital_id: string
    district_quartier_id: string
    chw_id: string
    village_secteur_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    chw: { id: string, name: string, phone: string }
    village_secteur: { id: string, name: string }
}

export interface PatientCoustomQuery {
    id: string
    name: string
    phone: string
    code: string
    external_id: string
    role: string
    sex: string
    date_of_birth: string
    profession: string
    relationship_with_household_head: string
    has_birth_certificate: boolean
    geolocation: string

    country_id: string
    region_id: string
    prefecture_id: string
    commune_id: string
    hospital_id: string
    district_quartier_id: string
    village_secteur_id: string
    family_id: string
    chw_id: string
    reco_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    family: { id: string, name: string, phone: string }
    chw: { id: string, name: string, phone: string }
    reco: { id: string, name: string, phone: string }
}


