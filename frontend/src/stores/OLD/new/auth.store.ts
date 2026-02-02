import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PayloadUser } from "@/models/auth.model";

interface AuthState {
  user: PayloadUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  setSession: (data: {
    user: PayloadUser;
    accessToken: string;
    refreshToken?: string;
  }) => void;

  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
