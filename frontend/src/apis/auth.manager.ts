import axios, { AxiosInstance } from "axios";
import { LoginResponse } from "./api";
import { tokenProvider } from "./token.provider";





export class AuthManager {

  // GLOBAL AUTH STATE (CRITICAL SECTION)
  private static refreshPromise: Promise<void> | null = null;
  private static isLoggingOut = false;
  private static refreshQueue: ((token: string) => void)[] = [];

  static async ensureValidToken(axiosInstance: AxiosInstance) {
    const token = tokenProvider.getAccessToken();
    if (!token) return;

    if (!tokenProvider.isExpiringSoon(30)) return;
    // 30s avant expiration

    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh(axiosInstance);
    }

    await this.refreshPromise;

    // new Promise((resolve, reject) => {
    //   refreshQueue.push(token => {
    //     if (!token) return reject(error);
    //     original.headers = generateHeaders(original, token);
    //     resolve(axiosInstance(original));
    //   });
    // });

  }

  private static async refresh(axiosInstance: AxiosInstance) {
    try {
      const res = await axiosInstance.post<LoginResponse>(
        "/auth/refresh?cookie=true",
        {},
        { withCredentials: true }
      );

      const { access_token, access_token_exp } = res.data;
      tokenProvider.set(access_token, access_token_exp);

      this.refreshQueue.forEach(cb => cb(access_token));
      this.refreshQueue = [];

    } catch (e) {
      this.logout()
    } finally {
      this.refreshPromise = null;
    }
  }

  static logout() {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;

    tokenProvider.clear();
    this.refreshQueue.forEach(cb => cb(""));
    this.refreshQueue = [];
    window.dispatchEvent(new Event("auth:logout"));

    setTimeout(() => {
      this.isLoggingOut = false;
    }, 1000);
  };
}