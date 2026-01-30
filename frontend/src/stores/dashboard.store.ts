import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RecoPerformanceDashboard,
  RecoVaccinationDashboardDbOutput,
  ActiveRecoDashboard,
  RecoTasksStateDashboard,
} from '@/types/dashboard.types';

// Dashboard types
export type DashboardType =
  | 'RECOS_PERFORMANCES'
  | 'ACTIVE_RECOS'
  | 'RECOS_TASKS_STATE'
  | 'RECOS_VACCINES_ALL_DONE'
  | 'RECOS_VACCINES_PARTIAL_DONE'
  | 'RECOS_VACCINES_NOT_DONE';

// Filter parameters
export interface DashboardFilterParams {
  months: string[];
  year: number;
  recos: string[];
  start_date?: string;
  end_date?: string;
}

// Dashboard status
export interface DashboardStatus {
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

// Dashboard data state
interface DashboardData {
  RECOS_PERFORMANCES?: RecoPerformanceDashboard;
  ACTIVE_RECOS?: ActiveRecoDashboard;
  RECOS_TASKS_STATE?: RecoTasksStateDashboard[];
  RECOS_VACCINES_ALL_DONE?: RecoVaccinationDashboardDbOutput[];
  RECOS_VACCINES_PARTIAL_DONE?: RecoVaccinationDashboardDbOutput[];
  RECOS_VACCINES_NOT_DONE?: RecoVaccinationDashboardDbOutput[];
}

// Store state
interface DashboardState {
  data: DashboardData;
  status: Record<DashboardType, DashboardStatus>;
  filters: DashboardFilterParams | null;
  activeTab: 'PERFORMANCES' | 'TASKS_STATE' | 'ACTIVE_RECO';
  activeRealtimeTab: 'ALL_DONE' | 'PARTIAL_DONE' | 'NOT_DONE';

  // Actions
  setDashboardData: <K extends keyof DashboardData>(key: K, data: DashboardData[K]) => void;
  setDashboardStatus: (type: DashboardType, status: Partial<DashboardStatus>) => void;
  setFilters: (filters: DashboardFilterParams) => void;
  setActiveTab: (tab: 'PERFORMANCES' | 'TASKS_STATE' | 'ACTIVE_RECO') => void;
  setActiveRealtimeTab: (tab: 'ALL_DONE' | 'PARTIAL_DONE' | 'NOT_DONE') => void;
  clearDashboardData: (type?: DashboardType) => void;
  clearAllData: () => void;
}

const initialStatus: DashboardStatus = {
  isLoading: false,
  error: undefined,
  lastUpdated: undefined,
};

const initialData: DashboardData = {
  RECOS_PERFORMANCES: undefined,
  ACTIVE_RECOS: undefined,
  RECOS_TASKS_STATE: undefined,
  RECOS_VACCINES_ALL_DONE: undefined,
  RECOS_VACCINES_PARTIAL_DONE: undefined,
  RECOS_VACCINES_NOT_DONE: undefined,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      data: initialData,
      status: {
        RECOS_PERFORMANCES: { ...initialStatus },
        ACTIVE_RECOS: { ...initialStatus },
        RECOS_TASKS_STATE: { ...initialStatus },
        RECOS_VACCINES_ALL_DONE: { ...initialStatus },
        RECOS_VACCINES_PARTIAL_DONE: { ...initialStatus },
        RECOS_VACCINES_NOT_DONE: { ...initialStatus },
      },
      filters: null,
      activeTab: 'PERFORMANCES',
      activeRealtimeTab: 'ALL_DONE',

      setDashboardData: (key, data) =>
        set((state) => ({
          data: { ...state.data, [key]: data },
        })),

      setDashboardStatus: (type, status) =>
        set((state) => ({
          status: {
            ...state.status,
            [type]: { ...state.status[type], ...status },
          },
        })),

      setFilters: (filters) => set({ filters }),

      setActiveTab: (activeTab) => set({ activeTab }),

      setActiveRealtimeTab: (activeRealtimeTab) => set({ activeRealtimeTab }),

      clearDashboardData: (type) =>
        set((state) => {
          if (type) {
            const keyMap: Record<DashboardType, keyof DashboardData> = {
              RECOS_PERFORMANCES: 'RECOS_PERFORMANCES',
              ACTIVE_RECOS: 'ACTIVE_RECOS',
              RECOS_TASKS_STATE: 'RECOS_TASKS_STATE',
              RECOS_VACCINES_ALL_DONE: 'RECOS_VACCINES_ALL_DONE',
              RECOS_VACCINES_PARTIAL_DONE: 'RECOS_VACCINES_PARTIAL_DONE',
              RECOS_VACCINES_NOT_DONE: 'RECOS_VACCINES_NOT_DONE',
            };
            return {
              data: { ...state.data, [keyMap[type]]: undefined },
            };
          }
          return { data: initialData };
        }),

      clearAllData: () =>
        set({
          data: initialData,
          filters: null,
        }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        filters: state.filters,
        activeTab: state.activeTab,
        activeRealtimeTab: state.activeRealtimeTab,
      }),
    }
  )
);
