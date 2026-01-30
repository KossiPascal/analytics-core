// Auth types
export type {
  User,
  Role,
  Roles,
  Routes,
  UserRole,
  RoutePermission,
  LoginCredentials,
  LoginResponse,
  AuthResponse,
  AuthState,
  ChangePasswordPayload,
  TokenPayload,
} from './auth.types';

// API types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
  RequestMethod,
  RequestConfig,
} from './api.types';

// Organization unit types
export type {
  OrgUnit,
  OrgUnitType,
  Coordinates,
  OrgUnitFilter,
  OrgUnitHierarchy,
  OrgUnitSelection,
  LocationInfo,
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  ChwsMap,
  RecosMap,
} from './org-unit.types';

export {
  getCountryMap,
  getRegionsMap,
  getPrefecturesMap,
  getCommunesMap,
  getHospitalsMap,
} from './org-unit.types';

// Dashboard types
export type {
  ChartDataSet,
  RecoPerformanceUtils,
  RecoPerformanceFullYearUtils,
  RecoPerformanceDashboardTotal,
  RecoPerformanceDashboardDbOutput,
  RecoPerformanceDashboardFullYearUtils,
  RecoPerformanceDashboardFullYearDbOutput,
  RecoPerformanceDashboardUtils,
  RecoPerformanceDashboard,
  RecoVaccinationDashboard,
  RecoVaccinationDashboardDbOutput,
  ActiveRecoUtils,
  ActiveRecoTotalUtils,
  ActiveRecoDashboardDbOutput,
  ActiveRecoRecord,
  ActiveRecoTotal,
  ActiveRecoDashboard,
  RecoTasksStateDashboardUtils,
  RecoTasksStateDashboardDbOutput,
  RecoTasksStateFamilies,
  RecoTasksStatePatients,
  RecoTasksStateDashboard,
  DashboardFilterParams,
} from './dashboard.types';

// Report types
export type {
  BaseReport,
  FP_Utils,
  FamilyPlanningReport,
  MorbidityUtils,
  MorbidityReport,
  DomainsThemesUtils,
  PromotionReport,
  HouseholdRecapReport,
  PcimneNewbornReportUtils,
  PcimneNewbornReport,
  ChwsRecoReportElementsUtils,
  ChwsRecoReportElements,
  ChwsRecoReport,
  RecoMegQuantityUtils,
  RecoMegSituationReport,
  ReportFilterParams,
  ReportType,
  ReportMetadata,
} from './reports.types';

export { REPORTS_CONFIG } from './reports.types';

// Common types
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface MonthYear {
  month: number;
  year: number;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessage {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
}

// Month names for filtering
export const MONTHS = [
  { value: '01', label: 'Janvier', short: 'jan' },
  { value: '02', label: 'Fevrier', short: 'fev' },
  { value: '03', label: 'Mars', short: 'mar' },
  { value: '04', label: 'Avril', short: 'avr' },
  { value: '05', label: 'Mai', short: 'mai' },
  { value: '06', label: 'Juin', short: 'jui' },
  { value: '07', label: 'Juillet', short: 'jul' },
  { value: '08', label: 'Aout', short: 'aou' },
  { value: '09', label: 'Septembre', short: 'sep' },
  { value: '10', label: 'Octobre', short: 'oct' },
  { value: '11', label: 'Novembre', short: 'nov' },
  { value: '12', label: 'Decembre', short: 'dec' },
] as const;

// Current year helper
export const getCurrentYear = () => new Date().getFullYear();

// Generate years array
export const getYears = (startYear = 2020) => {
  const currentYear = getCurrentYear();
  const years: number[] = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};
