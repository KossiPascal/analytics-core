export interface CountryCustomQuery {
    id: string
    name: string
    external_id: string
}

export interface RegionCustomQuery {
    id: string
    name: string
    external_id: string

    country: { id: string, name: string }
}

export interface PrefectureCustomQuery {
    id: string
    name: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
}

export interface CommuneCustomQuery {
    id: string
    name: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
}
export interface HospitalCustomQuery {
    id: string
    name: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
}
export interface DistrictQuartierCustomQuery {
    id: string
    name: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    // chw: { id: string, name: string, phone: string }
}
export interface VillageSecteurCustomQuery {
    id: string
    name: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    reco: { id: string, name: string, phone: string }
}
export interface FamilyCustomQuery {
    id: string
    name: string
    external_id: string
    household_has_working_latrine: boolean
    household_has_good_water_access: boolean

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    // chw: { id: string, name: string, phone: string }
    reco: { id: string, name: string, phone: string }
}

export interface CountryManagerCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string

    country: { id: string, name: string }
}

export interface RegionManagerCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
}

export interface PrefectureManagerCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
}

export interface CommuneManagerCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
}

export interface HospitalManagerCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
}

export interface ChwCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
}
export interface RecoCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
}
export interface PatientCustomQuery {
    id: string
    name: string
    phone: string
    external_id: string
    sex: string
    date_of_birth: string
    has_birth_certificate: boolean
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    family: { id: string, name: string, phone: string }
    // chw: { id: string, name: string, phone: string }
    reco: { id: string, name: string, phone: string }
}






