import { type StateCreator } from 'zustand';

export interface AlertMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UISlice {
  // Sidebar state
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;

  // Alerts/Notifications
  alerts: AlertMessage[];
  addAlert: (alert: Omit<AlertMessage, 'id'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;

  // Global loading
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;

  // Theme (for future dark mode)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Sidebar
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),

  // Alerts
  alerts: [],
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        },
      ],
    })),
  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    })),
  clearAlerts: () => set({ alerts: [] }),

  // Global loading
  isGlobalLoading: false,
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),

  // Theme
  theme: 'light',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  setTheme: (theme) => set({ theme }),
});
