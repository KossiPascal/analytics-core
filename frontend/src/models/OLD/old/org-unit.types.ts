// Organization Unit Map Types
export interface CountryMap {
  id: string;
  external_id: string;
  name: string;
}

export interface RegionsMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
}

export interface PrefecturesMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
}

export interface CommunesMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
  prefecture_id: string;
}

export interface HospitalsMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
  prefecture_id: string;
  commune_id: string;
}

export interface DistrictQuartiersMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
  prefecture_id: string;
  commune_id: string;
  hospital_id: string;
}

export interface VillageSecteursMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
  prefecture_id: string;
  commune_id: string;
  hospital_id: string;
  district_quartier_id: string;
}

export interface ChwsMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
  prefecture_id: string;
  commune_id: string;
  hospital_id: string;
  district_quartier_id: string;
}

export interface RecosMap {
  id: string;
  external_id: string;
  name: string;
  country_id: string;
  region_id: string;
  prefecture_id: string;
  commune_id: string;
  hospital_id: string;
  district_quartier_id: string;
  village_secteur_id: string;
}

// Generic OrgUnit interface
export interface OrgUnit {
  id: string;
  name: string;
  code?: string;
  external_id?: string;
  type: OrgUnitType;
  parentId: string | null;
  parent?: OrgUnit;
  children?: OrgUnit[];
  level: number;
  path?: string;
  isActive?: boolean;
  coordinates?: Coordinates;
  metadata?: Record<string, unknown>;
}

export type OrgUnitType =
  | 'country'
  | 'region'
  | 'prefecture'
  | 'commune'
  | 'hospital'
  | 'district_quartier'
  | 'village_secteur'
  | 'chw'
  | 'reco';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OrgUnitFilter {
  countryId?: string;
  regionId?: string;
  prefectureId?: string;
  communeId?: string;
  hospitalId?: string;
  districtQuartierId?: string;
  villageSecteurId?: string;
  chwId?: string;
  recoId?: string;
  type?: OrgUnitType;
  isActive?: boolean;
}

export interface OrgUnitHierarchy {
  countries: CountryMap[];
  regions: RegionsMap[];
  prefectures: PrefecturesMap[];
  communes: CommunesMap[];
  hospitals: HospitalsMap[];
  districtQuartiers: DistrictQuartiersMap[];
  villageSecteurs: VillageSecteursMap[];
  chws: ChwsMap[];
  recos: RecosMap[];
}

export interface OrgUnitSelection {
  country: CountryMap | null;
  region: RegionsMap | null;
  prefecture: PrefecturesMap | null;
  commune: CommunesMap | null;
  hospital: HospitalsMap | null;
  districtQuartier: DistrictQuartiersMap | null;
  villageSecteur: VillageSecteursMap | null;
  chw: ChwsMap | null;
  reco: RecosMap | null;
}

// Location info used in reports/dashboards
export interface LocationInfo {
  country: { id: string; name: string };
  region: { id: string; name: string };
  prefecture: { id: string; name: string };
  commune: { id: string; name: string };
  hospital: { id: string; name: string };
  district_quartier: { id: string; name: string };
  village_secteur: { id: string; name: string };
  reco?: { id: string; name: string; phone: string } | null;
  chw?: { id: string; name: string; phone: string } | null;
}

// Helper functions for mapping
export function getCountryMap<T extends { id: string; external_id: string; name: string }>(
  data: T
): CountryMap {
  return { id: data.id, external_id: data.external_id, name: data.name };
}

export function getRegionsMap<T extends { id: string; external_id: string; name: string; country: { id: string } }>(
  data: T
): RegionsMap {
  return {
    id: data.id,
    external_id: data.external_id,
    name: data.name,
    country_id: data.country.id,
  };
}

export function getPrefecturesMap<T extends { id: string; external_id: string; name: string; country: { id: string }; region: { id: string } }>(
  data: T
): PrefecturesMap {
  return {
    id: data.id,
    external_id: data.external_id,
    name: data.name,
    country_id: data.country.id,
    region_id: data.region.id,
  };
}

export function getCommunesMap<T extends { id: string; external_id: string; name: string; country: { id: string }; region: { id: string }; prefecture: { id: string } }>(
  data: T
): CommunesMap {
  return {
    id: data.id,
    external_id: data.external_id,
    name: data.name,
    country_id: data.country.id,
    region_id: data.region.id,
    prefecture_id: data.prefecture.id,
  };
}

export function getHospitalsMap<T extends { id: string; external_id: string; name: string; country: { id: string }; region: { id: string }; prefecture: { id: string }; commune: { id: string } }>(
  data: T
): HospitalsMap {
  return {
    id: data.id,
    external_id: data.external_id,
    name: data.name,
    country_id: data.country.id,
    region_id: data.region.id,
    prefecture_id: data.prefecture.id,
    commune_id: data.commune.id,
  };
}
