import { RecoPerformanceDashboard, RecoVaccinationDashboard } from "./dashboards";
import { IndicatorsDataOutput } from "./interfaces";

export interface DashboardsHealth {
  ON_FETCHING: DashboardsActions;
}
  
export interface DashboardsData {
  RECOS_PERFORMANCES: IndicatorsDataOutput<RecoPerformanceDashboard> | undefined;
  RECOS_VACCINES_NOT_DONE: IndicatorsDataOutput<RecoVaccinationDashboard[]> | undefined;
  RECOS_VACCINES_PARTIAL_DONE: IndicatorsDataOutput<RecoVaccinationDashboard[]> | undefined;
  RECOS_VACCINES_ALL_DONE: IndicatorsDataOutput<RecoVaccinationDashboard[]> | undefined;
}

export interface DashboardsActions {
  RECOS_PERFORMANCES?: boolean | string;
  RECOS_VACCINES_NOT_DONE?: boolean | string;
  RECOS_VACCINES_PARTIAL_DONE?: boolean | string;
  RECOS_VACCINES_ALL_DONE?: boolean | string;
}
