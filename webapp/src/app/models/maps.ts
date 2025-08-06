
export interface RecoDataMaps {
    year: number
    month: string
    form: string
    reported_date: string
    latitude: number
    longitude: number
    reco: { id: string, name: string, phone: string }
    patient: { id: string, name: string, external_id: string, code: string, sex: 'M' | 'F', birth_date: string }
    family: { id: string, name: string, given_name: string, external_id: string, code: string }
}



export interface RecoDataMapsDbOutput {
    id: string
    form: string
    year: number
    month: string
    patient_id: string
    reported_date: string
    reco_id: string
    latitude: number
    longitude: number
    accuracy: number
    altitude: number
    altitudeAccuracy: number
    heading: number
    speed: number

    country: { id: string, name: string }
    region: { id: string, name: string }
    prefecture: { id: string, name: string }
    commune: { id: string, name: string }
    hospital: { id: string, name: string }
    district_quartier: { id: string, name: string }
    village_secteur: { id: string, name: string }
    reco: { id: string, name: string, phone: string }
    patient: { id: string, name: string, external_id: string, code: string, sex: 'M' | 'F', birth_date: string }
    family: { id: string, name: string, given_name: string, external_id: string, code: string }
}


