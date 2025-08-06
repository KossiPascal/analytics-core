import { RecoDataMaps } from "./maps";
import { IndicatorsDataOutput } from "./interfaces";

export interface MapsHealth {
  ON_FETCHING: MapsActions;
}
  
export interface MapsData {
  RECOS_MAPS: IndicatorsDataOutput<RecoDataMaps> | undefined;
  FS_MAPS: IndicatorsDataOutput<RecoDataMaps[]> | undefined;
}

export interface MapsActions {
  RECOS_MAPS?: boolean | string;
  FS_MAPS?: boolean | string;
}
