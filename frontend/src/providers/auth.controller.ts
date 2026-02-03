// import authService from "@/services/OLD/auth.service";
// import { useAuthStore } from "@stores/OLD/new/auth.store";
// import type { LoginResponse } from "@models/OLD/auth";

// export function useAuthController() {
//   const { setSession, clearSession } = useAuthStore();

//   const login = async (username: string, password: string) => {
//     const res = await authService.login(username, password);

//     if (!res.success || !res.data) {
//       throw new Error(res.message || "Login failed");
//     }

//     const data = res.data as LoginResponse;

//     setSession({
//       user: data.payload,
//       accessToken: data.access_token,
//       refreshToken: data.refresh_token,
//     });

//     return data.payload;
//   };

//   const logout = async () => {
//     try {
//       await authService.logout(useAuthStore.getState().refreshToken ?? undefined);
//     } finally {
//       clearSession();
//     }
//   };

//   const hasPermission = (perms: string | string[]) => {
//     const user = useAuthStore.getState().user;
//     if (!user) return false;

//     const required = Array.isArray(perms) ? perms : [perms];
//     return required.some(p => user.roles.includes(p));
//   };

//   return {
//     login,
//     logout,
//     hasPermission,
//   };
// }
