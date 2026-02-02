/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// // Déclare le module virtuel pour TS
// declare module "virtual:pwa-register/react" {
//   export function useRegisterSW(options?: {
//     immediate?: boolean;
//     onRegistered?: (sw: ServiceWorker | null) => void;
//     onRegisterError?: (error) => void;
//   }): {
//     offlineReady: boolean;
//     needRefresh: boolean;
//     updateServiceWorker: (reloadPage?: boolean) => void;
//   };
// }

declare module "virtual:pwa-register/react"
declare module 'lucide-react';