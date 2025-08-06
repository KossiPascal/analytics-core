import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from "./org-unit-interface"
import { User, Roles, Routes } from "./user-role"


export interface FormsField {
  children?: FormsField[];
  control?: {
    appearance?: string;
    bodyless?:boolean
  };
  bind?: {
    calculate?: string;
    required?: string;
    relevant?: string;
    readonly?: string;
  };
  choices?: { label: { [key: string]: string }; name: any }[];
  itemset?: string;
  list_name?: string;
  parameters?: { [key: string]: string };
  default?: any;
  label?: { [key: string]: string } | string;
  hint?: { [key: string]: string };
  name: string;
  type: string;

  value?:any;
}




export interface FormField {
  type: string;
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  appearance?: string;
}


export interface IndicatorsDataOutput<T> {
  country: { id: string, name: string }
  region: { id: string, name: string }
  prefecture: { id: string, name: string }
  commune: { id: string, name: string }
  hospital: { id: string, name: string }
  district_quartier: { id: string, name: string }
  // chw: { id: string, name: string, phone: string }
  village_secteur: { id: string, name: string }
  reco: { id: string, name: string, phone: string } | null
  reco_asc_type: string
  is_validate?: boolean
  validate_user_id?: string
  already_on_dhis2?: boolean
  already_on_dhis2_user_id?: string
  data: T
}


export interface SnakBarOutPut {
  msg: string,
  position?: SnackbarPosition,
  color?: SnackbarBackgroundColor,
  duration?: number,
  fadeOutClass?: string
}

export interface NewUserUtils {
  countries: CountryMap[],
  regions: RegionsMap[],
  prefectures: PrefecturesMap[],
  communes: CommunesMap[],
  hospitals: HospitalsMap[],
  districtQuartiers: DistrictQuartiersMap[],
  villageSecteurs: VillageSecteursMap[],
  chws: ChwsMap[],
  recos: RecosMap[],
  user: User | null,
  roles: Roles[],
}


export interface NewRoleUtils {
  roles: Roles[]
  routes: Routes[]
  authorizations: string[]
  role: Roles | null,
}

export interface ChartDataSet {
  label: string;
  backgroundColor: string | string[];
  data: (number | string)[];
  fill?: boolean;
  borderColor?: string;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  pointBorderWidth?: number;
  pointRadius?: number;
  pointHoverBackgroundColor?: string;
  pointHoverBorderColor?: string;
  pointHoverBorderWidth?: number;
}

export interface ChartOptions {
  cibleId: string;
  title: string;
  type: ChartType;
  absisseLabels: (number | string)[];
  datasets: ChartDataSet[];
}

export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'doughnut' | 'polarArea' | 'bubble' | 'scatter' | 'mixed';

export type SnackbarBackgroundColor = 'danger' | 'info' | 'warning' | 'success' | 'default';

export type SnackbarPosition = 'TOP' | 'BOTTOM'

export type ModalColor = 'dark-back' | 'danger-back' | 'info-back' | 'warning-back' | 'success-back' | 'light-back';

export type ModalWidth = 'small-width' | 'medium-width' | 'large-width' | 'x-large-width' | 'xx-large-width' | 'xxx-large-width';




