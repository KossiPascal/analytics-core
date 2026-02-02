// src/api/auth.ts
import { api } from "../../apis/api";
import { LoginResponse, User } from "@models/OLD/auth";


const SESSION_KEYS = {
  access: "access_token",
  accessExp: "access_token_exp",
  refresh: "refresh_token",
  refreshExp: "refresh_token_exp",
  payload: "payload",
} as const;

function storeSession(data: LoginResponse) {
  localStorage.setItem(SESSION_KEYS.access, data.access_token);
  localStorage.setItem(SESSION_KEYS.accessExp, String(data.access_token_exp));
  localStorage.setItem(SESSION_KEYS.payload, JSON.stringify(data.payload));

  if (data.refresh_token) {
    localStorage.setItem(SESSION_KEYS.refresh, data.refresh_token);
    localStorage.setItem(
      SESSION_KEYS.refreshExp,
      String(data.refresh_token_exp)
    );
  }
}

function getSession() {
  return {
    accessToken: localStorage.getItem(SESSION_KEYS.access),
    accessTokenExp: localStorage.getItem(SESSION_KEYS.accessExp),
    refreshToken: localStorage.getItem(SESSION_KEYS.refresh),
    refreshTokenExp: localStorage.getItem(SESSION_KEYS.refreshExp),
    payload: localStorage.getItem(SESSION_KEYS.payload),
  };
}

function clearSession() {
  Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
}

/* ======================================================
   LOGOUT (NO REDIRECT HERE)
====================================================== */

function forceLogout() {
  clearSession();
  return Promise.reject(new Error("SESSION_EXPIRED"));
}

export const authApi = {
  // 🔐 Login
  async login(username: string, password: string) {
    return await api.post("/auth/login", { username, password });
  },

  // 📝 Register
  async register(payload: { username: string; fullname: string; password: string; role: string; }) {
    return await api.post<User>("/auth/register", payload);
  },

  // 🚪 Logout
  async logout(token?:string) {
    const refresh_token = getSession().refreshToken;
    return await api.post("/auth/logout", { refresh_token });
  },

  // 🔄 Refresh token (manuel – fallback)
  async refreshToken() {
    const refresh_token = getSession().refreshToken;
    if (!refresh_token) {
      this.logout();
      return { success: false, status: 401 };
    }
    return await api.post("/auth/refresh", { refresh_token });
  },

  // 👤 Current user
  async me(token: string | undefined) {
    return await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // 🔑 Change password
  async changePassword(old_password: string, new_password: string) {
    return await api.post("/auth/change-password", { old_password, new_password });
  },

  // 📧 Forgot password
  async forgotPassword(email: string) {
    return await api.post("/auth/forgot-password", { email });
  },

  // 🔓 Reset password
  async resetPassword(token: string, newPassword: string) {
    return await api.post("/auth/reset-password", { token, new_password: newPassword });
  },

  async isAccessTokenValid() {
    const exp = getSession().accessTokenExp;
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < Number(exp);
  },

  async isRefreshTokenValid() {
    const exp = getSession().refreshTokenExp;
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < Number(exp);
  },

  async isUserAuthenticatedOffline() {
    const store = getSession();
    if (!store.accessToken || !store.accessTokenExp || !store.payload) return false;
    const now = Math.floor(Date.now() / 1000);
    if (now > Number(store.accessTokenExp)) return false;  // ⛔ token expiré même offline
    return true; // ✅ offline authenticated
  },

  async scheduleTokenRefresh() {
    const exp = getSession().accessTokenExp;
    if (!exp) return;

    const now = Math.floor(Date.now() / 1000);
    const delay = (Number(exp) - now - 30) * 1000; // refresh 30s avant exp

    if (delay <= 0) return;

    setTimeout(async () => {
      try {
        await authApi.refreshToken();
        this.scheduleTokenRefresh();
      } catch {
        forceLogout();
      }
    }, delay);
  },
  storeSession,
  getSession,
  clearSession,
  forceLogout,

  // // 🧹 Clear local session only (offline / manual)
  // clearSession: clearSession,
};

export default authApi;


// return await authApi.login({ username, password });
// if (!res.success) toast.error("Login failed");
// navigate("/dashboard");

