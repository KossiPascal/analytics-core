import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { USE_LOCAL_DATA } from '@/config/constants';
import {
  COUNTRIES,
  REGIONS,
  PREFECTURES,
  COMMUNES,
  HOSPITALS,
  DISTRICT_QUARTIERS,
  VILLAGE_SECTEURS,
  CHWS,
  RECOS,
} from '@/utils/TestData';

// Combined store type
export type AppStore = AuthSlice & UISlice;

// Create store with persistence for auth
export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'kendeya-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist auth-related state
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // Persist UI preferences
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),
      // Réhydratation: mettre à jour les org units depuis TestData si USE_LOCAL_DATA est true
      onRehydrateStorage: () => (state) => {
        if (state && state.user && USE_LOCAL_DATA) {
          // Mettre à jour les org units avec les données de test
          state.updateUser({
            countries: COUNTRIES,
            regions: REGIONS,
            prefectures: PREFECTURES,
            communes: COMMUNES,
            hospitals: HOSPITALS,
            districtQuartiers: DISTRICT_QUARTIERS,
            villageSecteurs: VILLAGE_SECTEURS,
            chws: CHWS,
            recos: RECOS,
          });
        }
      },
    }
  )
);

// Selector hooks for better performance (using useShallow to prevent infinite loops)
export const useAuth = () =>
  useStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login: state.login,
      logout: state.logout,
      setLoading: state.setLoading,
      setError: state.setError,
      updateUser: state.updateUser,
    }))
  );

export const useUI = () =>
  useStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      isSidebarCollapsed: state.isSidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
      setSidebarOpen: state.setSidebarOpen,
      setSidebarCollapsed: state.setSidebarCollapsed,
      isGlobalLoading: state.isGlobalLoading,
      setGlobalLoading: state.setGlobalLoading,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      setTheme: state.setTheme,
    }))
  );

export const useAlerts = () =>
  useStore(
    useShallow((state) => ({
      alerts: state.alerts,
      addAlert: state.addAlert,
      removeAlert: state.removeAlert,
      clearAlerts: state.clearAlerts,
    }))
  );

// Export slices
export type { AuthSlice } from './slices/authSlice';
export type { UISlice } from './slices/uiSlice';
