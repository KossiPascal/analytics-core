// Re-export stores
export * from './dashboard.store';
export * from './reports.store';
export * from './users.store';
export * from './notification.store';

// Create combined store with slices
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

type StoreState = AuthSlice & UISlice;

export const useStore = create<StoreState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        theme: state.theme,
      }),
    }
  )
);
