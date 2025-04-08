
export interface CountryMap { id: string, external_id: string, name: string }
export interface RegionsMap { id: string, external_id: string, name: string, country_id: string }
export interface PrefecturesMap { id: string, external_id: string, name: string, country_id: string, region_id: string }
export interface CommunesMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string }
export interface HospitalsMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string }
export interface DistrictQuartiersMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string }
export interface VillageSecteursMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string, district_quartier_id: string }
export interface ChwsMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string, district_quartier_id: string }
export interface RecosMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string, district_quartier_id: string, village_secteur_id: string }



export function GetCountryMap<T>(data:T|any):CountryMap {
    return { id: data.id, external_id: data.external_id, name: data.name };
}
export function GetRegionsMap<T>(data:T|any):RegionsMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id };
}
export function GetPrefecturesMap<T>(data:T|any):PrefecturesMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id };
}
export function GetCommunesMap<T>(data:T|any):CommunesMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id, prefecture_id: data.prefecture.id };
}
export function GetHospitalsMap<T>(data:T|any):HospitalsMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id, prefecture_id: data.prefecture.id, commune_id: data.commune.id };
}
export function GetDistrictQuartiersMap<T>(data:T|any):DistrictQuartiersMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id, prefecture_id: data.prefecture.id, commune_id: data.commune.id, hospital_id: data.hospital.id };
}
export function GetVillageSecteursMap<T>(data:T|any):VillageSecteursMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id, prefecture_id: data.prefecture.id, commune_id: data.commune.id, hospital_id: data.hospital.id, district_quartier_id: data.district_quartier.id };
}
export function GetChwsMap<T>(data:T|any):ChwsMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id, prefecture_id: data.prefecture.id, commune_id: data.commune.id, hospital_id: data.hospital.id, district_quartier_id: data.district_quartier.id };
}
export function GetRecosMap<T>(data:T|any):RecosMap {
    return { id: data.id, external_id: data.external_id, name: data.name, country_id: data.country.id, region_id: data.region.id, prefecture_id: data.prefecture.id, commune_id: data.commune.id, hospital_id: data.hospital.id, district_quartier_id: data.district_quartier.id, village_secteur_id: data.village_secteur.id };
}
