import { tokenProvider, TokenStrParam } from "@/apis/token.provider";
import type { LoginResponse } from "@/models/auth.model";
import { CRUDService } from "@services/acrud.service";


const auth = new CRUDService("/auth");

export const authService = {
  async login(username: string, password: string, isOnline: boolean) {
    const session = await auth.post<LoginResponse>("/login", { username, password } as any, { options: { withCredentials: true } });
    if (!session) throw new Error("Login failed");
    return session;
  },

  async refresh() {
    // const current = ;
    const session = await auth.post<LoginResponse>("/refresh", {}, { options: { withCredentials: true } });
    if (!session) throw new Error("Refresh failed");
    return session;
  },

  async refreshWithToken(refresh_token:TokenStrParam = tokenProvider.getRefreshToken()) {
    if (!refresh_token) throw new Error("NO_REFRESH_TOKEN");
    const session = await auth.post<LoginResponse>("/refresh", { refresh_token }, { options: { withCredentials: true } });
    if (!session) throw new Error("Refresh failed");
    return session;
  },

  async logout() {
    // authScheduler.clear();
    await auth.post("/logout", {}, { options: { withCredentials: true } });
  },

};
