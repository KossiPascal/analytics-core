import { create } from 'zustand';
import type {
  ChwRecoActivityReport,
  FamilyPlanningReport,
  MorbidityReport,
  PcimneNewbornReport,
  PromotionReport,
  HouseholdRecapReport,
  RecoMegSituationReport,
  ReportType,
} from '@/models/OLD/old/reports.types';

export interface ReportsData {
  MONTHLY_ACTIVITY?: ChwRecoActivityReport;
  FAMILY_PLANNING?: FamilyPlanningReport;
  HOUSE_HOLD_RECAP?: HouseholdRecapReport[];
  MORBIDITY?: MorbidityReport;
  PCIMNE_NEWBORN?: PcimneNewbornReport;
  PROMOTION?: PromotionReport;
  RECO_MEG_QUANTITIES?: RecoMegSituationReport[];
}

export interface ReportStatus {
  isLoading: boolean;
  isValidated: boolean;
  isOnDhis2: boolean;
  isValidating: boolean;
  isCancellingValidation: boolean;
  isSendingToDhis2: boolean;
  error?: string;
}

export type ReportsStatus = Record<ReportType, ReportStatus>;

export interface FilterParams {
  start_date: string;
  end_date: string;
  recos: string[];
  selectedRecosIds: string[];
  allRecosIds: string[];
  orgUnits: {
    country?: string;
    region?: string;
    prefecture?: string;
    commune?: string;
    hospital?: string;
    district?: string;
    village?: string;
  };
}

interface ReportsState {
  // Data
  data: ReportsData;

  // Status for each report
  status: ReportsStatus;

  // Filter parameters
  filters: FilterParams | null;

  // Active tab
  activeTab: ReportType;

  // Hide zero values
  hideZeroValues: boolean;

  // Actions
  setReportData: <K extends keyof ReportsData>(reportType: K, data: ReportsData[K]) => void;
  setReportStatus: (reportType: ReportType, status: Partial<ReportStatus>) => void;
  setFilters: (filters: FilterParams) => void;
  setActiveTab: (tab: ReportType) => void;
  setHideZeroValues: (hide: boolean) => void;
  clearReportData: (reportType?: ReportType) => void;
  resetStore: () => void;
}

const initialStatus: ReportStatus = {
  isLoading: false,
  isValidated: false,
  isOnDhis2: false,
  isValidating: false,
  isCancellingValidation: false,
  isSendingToDhis2: false,
};

const createInitialStatus = (): ReportsStatus => ({
  MONTHLY_ACTIVITY: { ...initialStatus },
  FAMILY_PLANNING: { ...initialStatus },
  HOUSE_HOLD_RECAP: { ...initialStatus },
  MORBIDITY: { ...initialStatus },
  PCIMNE_NEWBORN: { ...initialStatus },
  PROMOTION: { ...initialStatus },
  RECO_MEG_QUANTITIES: { ...initialStatus },
});

export const useReportsStore = create<ReportsState>((set) => ({
  data: {},
  status: createInitialStatus(),
  filters: null,
  activeTab: 'MONTHLY_ACTIVITY',
  hideZeroValues: false,

  setReportData: (reportType, data) =>
    set((state) => ({
      data: { ...state.data, [reportType]: data },
    })),

  setReportStatus: (reportType, status) =>
    set((state) => ({
      status: {
        ...state.status,
        [reportType]: { ...state.status[reportType], ...status },
      },
    })),

  setFilters: (filters) => set({ filters }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setHideZeroValues: (hide) => set({ hideZeroValues: hide }),

  clearReportData: (reportType) =>
    set((state) => {
      if (reportType) {
        const newData = { ...state.data };
        delete newData[reportType];
        return { data: newData, status: { ...state.status, [reportType]: { ...initialStatus } } };
      }
      return { data: {}, status: createInitialStatus() };
    }),

  resetStore: () =>
    set({
      data: {},
      status: createInitialStatus(),
      filters: null,
      activeTab: 'MONTHLY_ACTIVITY',
      hideZeroValues: false,
    }),
}));
