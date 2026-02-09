import { tokenProvider } from "@/apis/token.provider";
import { authService } from "@/services/auth.service";

let refreshTimer: number | null = null;

export const authScheduler = {
  clear() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },

  schedule(expUnixSeconds: number, refresh_token: string | null) {
    this.clear();

    const now = Date.now();
    const refreshAt = expUnixSeconds * 1000 - 10_000; // refresh 10s early
    const delay = Math.max(refreshAt - now, 0);

    refreshTimer = window.setTimeout(async () => {
      try {
        await authService.refresh(refresh_token);
      } catch {
        // refresh failed → hard logout handled downstream
      }
    }, delay);
  }
};
