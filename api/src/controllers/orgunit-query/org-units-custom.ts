import { DataSource } from "typeorm";
import { AppDataSource } from "../../data_source";



// ###################### ORG UNITS ##########################

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
    // country_manager: { id: string, name: string, phone: string }
    region: { id: string, name: string }
    // region_manager: { id: string, name: string, phone: string }
    prefecture: { id: string, name: string }
    // prefecture_manager: { id: string, name: string, phone: string }
    commune: { id: string, name: string }
    // commune_manager: { id: string, name: string, phone: string }
    hospital: { id: string, name: string }
    // hospital_manager: { id: string, name: string, phone: string }
    district_quartier: { id: string, name: string }
    // chw: { id: string, name: string, phone: string }
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



let Connection: DataSource = AppDataSource.manager.connection;

export async function COUNTRIES_CUSTOM_QUERY(): Promise<CountryCustomQuery[]> {
    return await Connection.query(`SELECT c.* FROM country c`);
}
export async function COUNTRIES_MANAGER_CUSTOM_QUERY(): Promise<CountryManagerCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        c.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country 
    FROM 
        country_manager c 
    JOIN 
        country cy ON c.country_id = cy.id
`);
}

export async function REGIONS_CUSTOM_QUERY(): Promise<RegionCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        r.*,
        json_build_object('id', c.id, 'name', c.name) AS country 
    FROM 
        region r 
    JOIN 
        country c ON r.country_id = c.id
`);
}
export async function REGIONS_MANAGER_CUSTOM_QUERY(): Promise<RegionManagerCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        r.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region 
    FROM 
        region_manager r 
    JOIN 
        country cy ON r.country_id = cy.id
    JOIN 
        region rg ON r.region_id = rg.id
`);
}

export async function PREFECTURES_CUSTOM_QUERY(): Promise<PrefectureCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        pr.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country,
        json_build_object('id', rg.id, 'name', rg.name) AS region 
    FROM 
        prefecture pr
    JOIN 
        country cy ON pr.country_id = cy.id
    JOIN 
        region rg ON pr.region_id = rg.id
`);
}
export async function PREFECTURES_MANAGER_CUSTOM_QUERY(): Promise<PrefectureManagerCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        p.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture 
    FROM 
        prefecture_manager p 
    JOIN 
        country cy ON p.country_id = cy.id
    JOIN 
        region rg ON p.region_id = rg.id
    JOIN 
        prefecture pr ON p.prefecture_id = pr.id
`);
}

export async function COMMUNES_CUSTOM_QUERY(): Promise<CommuneCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        co.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture 
    FROM 
        commune co 
    JOIN 
        country cy ON co.country_id = cy.id
    JOIN 
        region rg ON co.region_id = rg.id
    JOIN 
        prefecture pr ON co.prefecture_id = pr.id
`);
}
export async function COMMUNES_MANAGER_CUSTOM_QUERY(): Promise<CommuneManagerCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        c.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune 
    FROM 
        commune_manager c 
    JOIN 
        country cy ON c.country_id = cy.id
    JOIN 
        region rg ON c.region_id = rg.id
    JOIN 
        prefecture pr ON c.prefecture_id = pr.id
    JOIN 
        commune co ON c.commune_id = co.id
`);
}

export async function HOSPITALS_CUSTOM_QUERY(): Promise<HospitalCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        ho.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune 
    FROM 
        hospital ho
    JOIN 
        country cy ON ho.country_id = cy.id
    JOIN 
        region rg ON ho.region_id = rg.id
    JOIN 
        prefecture pr ON ho.prefecture_id = pr.id
    JOIN 
        commune co ON ho.commune_id = co.id
`);
}
export async function HOSPITALS_MANAGER_CUSTOM_QUERY(): Promise<HospitalManagerCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        h.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital 
    FROM 
        hospital_manager h 
    JOIN 
        country cy ON h.country_id = cy.id
    JOIN 
        region rg ON h.region_id = rg.id
    JOIN 
        prefecture pr ON h.prefecture_id = pr.id
    JOIN 
        commune co ON h.commune_id = co.id
    JOIN 
        hospital ho ON h.hospital_id = ho.id
`);
}

export async function DISTRICTS_QUARTIERS_CUSTOM_QUERY(): Promise<DistrictQuartierCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        dq.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital 
    FROM 
        district_quartier dq
    JOIN 
        country cy ON dq.country_id = cy.id
    JOIN 
        region rg ON dq.region_id = rg.id
    JOIN 
        prefecture pr ON dq.prefecture_id = pr.id
    JOIN 
        commune co ON dq.commune_id = co.id
    JOIN 
        hospital ho ON dq.hospital_id = ho.id 
`);
}
export async function CHWS_CUSTOM_QUERY(): Promise<ChwCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        c.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital,
        json_build_object('id', dq.id, 'name', dq.name) AS district_quartier 
    FROM 
        chw c 
    JOIN 
        country cy ON c.country_id = cy.id
    JOIN 
        region rg ON c.region_id = rg.id
    JOIN 
        prefecture pr ON c.prefecture_id = pr.id
    JOIN 
        commune co ON c.commune_id = co.id
    JOIN 
        hospital ho ON c.hospital_id = ho.id
    JOIN 
        district_quartier dq ON c.district_quartier_id = dq.id
`);
}

export async function VILLAGES_SECTEURS_CUSTOM_QUERY(): Promise<VillageSecteurCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        vs.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital,
        json_build_object('id', dq.id, 'name', dq.name) AS district_quartier,
        json_build_object('id', rc.id, 'name', rc.name) AS reco 

    FROM 
        village_secteur vs
    JOIN 
        country cy ON vs.country_id = cy.id
    JOIN 
        region rg ON vs.region_id = rg.id
    JOIN 
        prefecture pr ON vs.prefecture_id = pr.id
    JOIN 
        commune co ON vs.commune_id = co.id
    JOIN 
        hospital ho ON vs.hospital_id = ho.id
    JOIN 
        district_quartier dq ON vs.district_quartier_id = dq.id
    JOIN 
        reco rc ON vs.reco_id = rc.id
`);
}
export async function RECOS_CUSTOM_QUERY(): Promise<RecoCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        r.*,
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital,
        json_build_object('id', dq.id, 'name', dq.name) AS district_quartier,
        json_build_object('id', vs.id, 'name', vs.name) AS village_secteur 
    FROM 
        reco r 
    JOIN 
        country cy ON r.country_id = cy.id
    JOIN 
        region rg ON r.region_id = rg.id
    JOIN 
        prefecture pr ON r.prefecture_id = pr.id
    JOIN 
        commune co ON r.commune_id = co.id
    JOIN 
        hospital ho ON r.hospital_id = ho.id
    JOIN 
        district_quartier dq ON r.district_quartier_id = dq.id
    JOIN 
        village_secteur vs ON r.village_secteur_id = vs.id 
    `);
}

export async function FAMILIES_CUSTOM_QUERY(): Promise<FamilyCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        f.*, 
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital,
        json_build_object('id', dq.id, 'name', dq.name) AS district_quartier,
        json_build_object('id', vs.id, 'name', vs.name) AS village_secteur,
        json_build_object('id', ro.id, 'name', ro.name) AS reco
        
    FROM 
        family f 
    JOIN 
        country cy ON f.country_id = cy.id
    JOIN 
        region rg ON f.region_id = rg.id
    JOIN 
        prefecture pr ON f.prefecture_id = pr.id
    JOIN 
        commune co ON f.commune_id = co.id
    JOIN 
        hospital ho ON f.hospital_id = ho.id
    JOIN 
        district_quartier dq ON f.district_quartier_id = dq.id
    JOIN 
        village_secteur vs ON f.village_secteur_id = vs.id
    JOIN 
        reco ro ON f.reco_id = ro.id
`);
}

export async function PATIENTS_CUSTOM_QUERY(): Promise<PatientCustomQuery[]> {
    return await Connection.query(`
    SELECT 
        p.*, 
        json_build_object('id', cy.id, 'name', cy.name) AS country, 
        json_build_object('id', rg.id, 'name', rg.name) AS region, 
        json_build_object('id', pr.id, 'name', pr.name) AS prefecture, 
        json_build_object('id', co.id, 'name', co.name) AS commune, 
        json_build_object('id', ho.id, 'name', ho.name) AS hospital,
        json_build_object('id', dq.id, 'name', dq.name) AS district_quartier,
        json_build_object('id', vs.id, 'name', vs.name) AS village_secteur,
        json_build_object('id', fm.id, 'name', fm.name) AS family,
        json_build_object('id', ro.id, 'name', ro.name) AS reco,

    FROM 
        patient p 
    JOIN 
        country cy ON p.country_id = cy.id
    JOIN 
        region rg ON p.region_id = rg.id
    JOIN 
        prefecture pr ON p.prefecture_id = pr.id
    JOIN 
        commune co ON p.commune_id = co.id
    JOIN 
        hospital ho ON p.hospital_id = ho.id
    JOIN 
        district_quartier dq ON p.district_quartier_id = dq.id
    JOIN 
        village_secteur vs ON p.village_secteur_id = vs.id
    JOIN 
        family fm ON p.family_id = fm.id
    JOIN 
        reco ro ON p.reco_id = ro.id
`);
}

// export async function RECO_QUERY(): Promise<Reco[]> {
//     return await Connection.query(`
//     SELECT 
//         r.id, 
//         r.name,
//         json_build_object('id', c.id, 'name', c.name) AS country, 
//         json_build_object('id', rg.id, 'name', rg.name, 
//             'country', json_build_object('id', rg.country_id)
//         ) AS region, 
//         json_build_object('id', pr.id, 'name', pr.name, 
//             'country', json_build_object('id', pr.country_id), 
//             'region', json_build_object('id', pr.region_id)
//         ) AS prefecture, 
//         json_build_object('id', co.id, 'name', co.name, 
//             'country', json_build_object('id', co.country_id), 
//             'region', json_build_object('id', co.region_id), 
//             'prefecture', json_build_object('id', co.prefecture_id)
//         ) AS commune, 
//         json_build_object('id', ho.id, 'name', ho.name, 
//             'country', json_build_object('id', ho.country_id), 
//             'region', json_build_object('id', ho.region_id), 
//             'prefecture', json_build_object('id', ho.prefecture_id),
//             'commune', json_build_object('id', ho.commune_id)
//         ) AS hospital,
//         json_build_object('id', dq.id, 'name', dq.name, 
//             'country', json_build_object('id', dq.country_id), 
//             'region', json_build_object('id', dq.region_id), 
//             'prefecture', json_build_object('id', dq.prefecture_id),
//             'commune', json_build_object('id', dq.commune_id),
//             'hospital', json_build_object('id', dq.hospital_id),
//             'chw_id', dq.chw_id
//         ) AS district_quartier, 
//         json_build_object('id', ch.id, 'name', ch.name, 
//             'country', json_build_object('id', ch.country_id),
//             'region', json_build_object('id', ch.region_id), 
//             'prefecture', json_build_object('id', ch.prefecture_id),
//             'commune', json_build_object('id', ch.commune_id),
//             'hospital', json_build_object('id', ch.hospital_id),
//             'district_quartier', json_build_object('id', ch.district_quartier_id)
//         ) AS chw,
//         json_build_object('id', vs.id, 'name', vs.name, 
//             'country', json_build_object('id', vs.country_id),
//             'region', json_build_object('id', vs.region_id), 
//             'prefecture', json_build_object('id', vs.prefecture_id),
//             'commune', json_build_object('id', vs.commune_id),
//             'hospital', json_build_object('id', vs.hospital_id),
//             'district_quartier', json_build_object('id', vs.district_quartier_id)
//         ) AS village_secteur
//     FROM 
//         reco r 
//     JOIN 
//         country c ON r.country_id = c.id
//     JOIN 
//         region rg ON r.region_id = rg.id
//     JOIN 
//         prefecture pr ON r.prefecture_id = pr.id
//     JOIN 
//         commune co ON r.commune_id = co.id
//     JOIN 
//         hospital ho ON r.hospital_id = ho.id
//     JOIN 
//         district_quartier dq ON r.district_quartier_id = dq.id
//     JOIN 
//         village_secteur vs ON r.village_secteur_id = vs.id
//     JOIN 
//         chw ch ON r.chw_id = ch.id
// `);
// }