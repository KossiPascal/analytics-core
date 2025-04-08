import { IndicatorsDataOutput } from "./interfaces";
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, RecoMegQuantityUtils } from "./reports";

export interface ReportsHealth {
  IS_VALIDATED: ReportsActions;
  IS_ON_DHIS2: ReportsActions;
  ON_FETCHING: ReportsActions;
  ON_VALIDATION: ReportsActions;
  ON_CANCEL_VALIDATION: ReportsActions;
  ON_DHIS2_SENDING: ReportsActions;
  ON_DHIS2_SENDING_ERROR: ReportsActions;
}

export interface ReportsFilterData {
  RECOS_NEEDED: string[];
  RECOS_SELECTED: string[];
  SEND_DHIS2_ORGUNITS: { id?: string, external_id?: string, name?: string }[];
}


export interface ReportsData {
  MONTHLY_ACTIVITY: IndicatorsDataOutput<ChwsRecoReport> | undefined;
  FAMILY_PLANNING: IndicatorsDataOutput<FamilyPlanningReport> | undefined;
  HOUSE_HOLD_RECAP: IndicatorsDataOutput<HouseholdRecapReport[]> | undefined;
  MORBIDITY: IndicatorsDataOutput<MorbidityReport> | undefined;
  PCIMNE_NEWBORN: PcimneNewbornReport | undefined;
  PROMOTION: IndicatorsDataOutput<PromotionReport> | undefined;
  RECO_MEG_QUANTITIES: IndicatorsDataOutput<RecoMegQuantityUtils[]> | undefined;
}

export interface ReportsActions {
  MONTHLY_ACTIVITY?: boolean | string;
  FAMILY_PLANNING?: boolean | string;
  HOUSE_HOLD_RECAP?: boolean | string;
  MORBIDITY?: boolean | string;
  PCIMNE_NEWBORN?: boolean | string;
  PROMOTION?: boolean | string;
  RECO_MEG_QUANTITIES?: boolean | string;
}


// export interface ReportsElements {
//   MONTHLY_ACTIVITY: ChwsRecoReport | undefined;
//   FAMILY_PLANNING: FamilyPlanningReport | undefined;
//   HOUSE_HOLD_RECAP: HouseholdRecapReport[] | undefined;
//   MORBIDITY: MorbidityReport | undefined;
//   PCIMNE_NEWBORN: PcimneNewbornReport | undefined;
//   PROMOTION: PromotionReport | undefined;
//   RECO_MEG_QUANTITIES: RecoMegQuantityUtils[] | undefined;
// }
