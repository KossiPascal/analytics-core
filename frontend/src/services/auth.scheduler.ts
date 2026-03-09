// import { authService } from "@/services/auth.service";

// let refreshTimer: number | null = null;

// export const authScheduler = {
//   clear() {
//     if (refreshTimer) {
//       clearTimeout(refreshTimer);
//       refreshTimer = null;
//     }
//   },

//   schedule(expUnixSeconds: number) {
//     this.clear();

//     const now = Date.now();
//     const refreshAt = expUnixSeconds * 1000 - 10_000; // refresh 10s early
//     const delay = Math.max(refreshAt - now, 0);

//     if (expUnixSeconds * 1000 <= Date.now()) {
//       // token already expired → refresh immediately once
//       authService.refresh().catch(() => { });
//       return;
//     }

//     refreshTimer = window.setTimeout(async () => {
//       try {
//         await authService.refresh();
//       } catch {
//         // refresh failed → hard logout handled downstream
//       }
//     }, delay);
//   }
// };
