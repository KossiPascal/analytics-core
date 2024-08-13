export interface ReportsHealth {
  LOGO_TITLE1?: string | null | undefined;
  LOGO_TITLE2?: string | null | undefined;
  LOGO_TITLE3?: string | null | undefined;
  REPPORT_TITLE?: string | null | undefined;
  REPPORT_SUBTITLE?: string | null | undefined;
  REGION_NAME?: string | null | undefined;
  PREFECTURE_NAME?: string | null | undefined;
  COMMUNE_NAME?: string | null | undefined;
  MONTH?: string | null | undefined;
  YEAR?: number | null | undefined;
  VILLAGE_SECTEUR_NAME?: string | null | undefined;
  VILLAGE_CHIEF_NAME?: string | null | undefined;
  VILLAGE_CHIEF_CONTACT?: string | null | undefined;
  RECO_ASC_TYPE?: string | null | undefined;
  RECO_ASC_NAME?: string | null | undefined;
  RECO_ASC_PHONE?: string | null | undefined;
  HEALTH_CENTER_NAME?: string | null | undefined;
  DISTRICT_QUARTIER_NAME?: string | null | undefined;

  CAN_VISIBLE?: boolean | null | undefined;
  IS_VALIDATED?: boolean | null | undefined;
  IS_ALREADY_ON_DHIS2?: boolean | null | undefined;

  ON_FETCHING?: boolean | null | undefined;
  ON_VALIDATION?: boolean | null | undefined;
  ON_DHIS2_SENDING?: boolean | null | undefined;
}
