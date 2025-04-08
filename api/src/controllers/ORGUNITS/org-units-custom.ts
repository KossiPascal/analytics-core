import { DataSource } from "typeorm";
import { AppDataSource } from "../../data-source";
import { CountryCustomQuery, CountryManagerCustomQuery, RegionCustomQuery, RegionManagerCustomQuery, PrefectureCustomQuery, PrefectureManagerCustomQuery, CommuneCustomQuery, CommuneManagerCustomQuery, HospitalCustomQuery, HospitalManagerCustomQuery, DistrictQuartierCustomQuery, ChwCustomQuery, VillageSecteurCustomQuery, RecoCustomQuery, FamilyCustomQuery, PatientCustomQuery } from "../../models/org-units/orgunits-query";

let Connection: DataSource = AppDataSource.manager.connection;

export async function COUNTRIES_CUSTOM_QUERY(): Promise<CountryCustomQuery[]> {
    return await Connection.query(`SELECT * FROM country_view;`);
}

export async function COUNTRIES_MANAGER_CUSTOM_QUERY(): Promise<CountryManagerCustomQuery[]> {
    return await Connection.query(`SELECT * FROM country_manager_view;`);
}

export async function REGIONS_CUSTOM_QUERY(): Promise<RegionCustomQuery[]> {
    return await Connection.query(`SELECT * FROM region_view;`);
}
export async function REGIONS_MANAGER_CUSTOM_QUERY(): Promise<RegionManagerCustomQuery[]> {
    return await Connection.query(` * FROM region_manager_view;`);
}

export async function PREFECTURES_CUSTOM_QUERY(): Promise<PrefectureCustomQuery[]> {
    return await Connection.query(`SELECT * FROM prefecture_view;`);
}
export async function PREFECTURES_MANAGER_CUSTOM_QUERY(): Promise<PrefectureManagerCustomQuery[]> {
    return await Connection.query(`SELECT * FROM prefecture_manager_view;`);
}

export async function COMMUNES_CUSTOM_QUERY(): Promise<CommuneCustomQuery[]> {
    return await Connection.query(`SELECT * FROM commune_view;`);
}
export async function COMMUNES_MANAGER_CUSTOM_QUERY(): Promise<CommuneManagerCustomQuery[]> {
    return await Connection.query(`SELECT * FROM commune_manager_view;`);
}

export async function HOSPITALS_CUSTOM_QUERY(): Promise<HospitalCustomQuery[]> {
    return await Connection.query(`SELECT * FROM hospital_view;`);
}
export async function HOSPITALS_MANAGER_CUSTOM_QUERY(): Promise<HospitalManagerCustomQuery[]> {
    return await Connection.query(`SELECT * FROM hospital_manager_view;`);
}

export async function DISTRICTS_QUARTIERS_CUSTOM_QUERY(): Promise<DistrictQuartierCustomQuery[]> {
    return await Connection.query(`SELECT * FROM district_quartier_view;`);
}
export async function CHWS_CUSTOM_QUERY(): Promise<ChwCustomQuery[]> {
    return await Connection.query(`SELECT * FROM chw_view;`);
}

export async function VILLAGES_SECTEURS_CUSTOM_QUERY(): Promise<VillageSecteurCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        vs.*,
        json_build_object('id', rc.id, 'name', rc.name) AS reco 
    FROM 
        village_secteur_view vs
    LEFT JOIN 
        reco_view rc ON vs.reco_id = rc.id
`);
}
export async function RECOS_CUSTOM_QUERY(): Promise<RecoCustomQuery[]> {
    return await Connection.query(`SELECT * FROM reco_view;`);
}

export async function FAMILIES_CUSTOM_QUERY(): Promise<FamilyCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        f.*, 
        json_build_object('id', ro.id, 'name', ro.name) AS reco
    FROM 
        family_view f 
    LEFT JOIN 
        reco_view ro ON f.reco_id = ro.id
`);
}

export async function PATIENTS_CUSTOM_QUERY(): Promise<PatientCustomQuery[]> {
    return await Connection.query(`SELECT * FROM patient_view;`);
}
