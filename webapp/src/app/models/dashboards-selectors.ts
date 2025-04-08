import { RecoPerformanceDashboard, RecoVaccinationDashboard } from "./dashboards";
import { IndicatorsDataOutput } from "./interfaces";

export interface DashboardsHealth {
  ON_FETCHING: DashboardsActions;
}
  
export interface DashboardsData {
  RECOS_PERFORMANCES: IndicatorsDataOutput<RecoPerformanceDashboard> | undefined;
  RECOS_VACCINES: IndicatorsDataOutput<RecoVaccinationDashboard[]> | undefined;
}

export interface DashboardsActions {
  RECOS_PERFORMANCES?: boolean | string;
  RECOS_VACCINES?: boolean | string;
}
