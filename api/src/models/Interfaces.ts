export interface IndicatorsDataOutput<T> {
    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    // chw: { id: string, name: string, phone: string }
    village_secteur: { id: string, name: string }
    reco: { id: string, name: string, phone: string } | null
    reco_asc_type: string
    is_validate?: boolean
    validate_user_id?: string
    already_on_dhis2?: boolean
    already_on_dhis2_user_id?: string
    data: T
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
