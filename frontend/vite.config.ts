import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";


// Liste des chemins possibles pour le .env
const envPaths = ["./.env", "../.env", "../../.env"];

let envLoaded = false;

for (const env of envPaths) {
  const envPath = path.resolve(__dirname, env)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn("⚠️ No .env file found in ./, ../, or ../../");
}

export default defineConfig({
  // base: "/app/",
  plugins: [
    react(),

    VitePWA({
      // strategies: "injectManifest",
      includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "icons/*.png", "offline.html"],
      srcDir: "src/pwa",
      filename: "service-worker.js", // obligatoire
      registerType: "autoUpdate", // 🔁 auto check updates
      devOptions: {
        enabled: (process.env.APP_ENV ?? "development") === "development", // PWA actif même en dev
      },
      manifest: {
        name: "Analytics Platform",
        short_name: "Analytics",
        theme_color: "#1976d2",
        background_color: "#fafafa",
        display: "standalone",
        scope: "/",
        start_url: "/",
        dir: "ltr",
        lang: "en",
        description: "Analytics PWA",
        orientation: "any",
        icons: [
          { src: "/icons/icon-48x48.png", sizes: "48x48", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "maskable any" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        // navigateFallback: "/offline.html",
        navigateFallback: "/index.html", // ✅ SPA fallback
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5, // fallback si pas de réponse réseau rapide
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 10, // 1 heure
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: { cacheName: "image-cache", expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 } },
          },
          {
            urlPattern: /^\/icons\/.*\.png$/,
            handler: "CacheFirst",
            options: {
              cacheName: "icons-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
            },
          },
        ],
      },
    })
  ],

  build: {
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("monaco-editor")) {
              return "monaco";
            }
            return "vendor";
          }

          // if (id.includes("framer-motion")) {
          //   return "animations"
          // }

          // manualChunks: {
          //   vendor: ['react', 'react-dom', 'react-router-dom'],
          //   animations: ['framer-motion'],
          //   charts: ['recharts'],
          //   maps: ['leaflet', 'react-leaflet'],
          //   utils: ['lodash', 'date-fns', 'axios'],
          // },
        }
      }
    },

    commonjsOptions: {
      include: [/monaco-editor/, /node_modules/]
    }
  },

  define: {
    "import.meta.env.VITE_ENV": JSON.stringify(process.env.APP_ENV ?? "development"),
    "import.meta.env.VITE_APP_NAME": JSON.stringify(process.env.APP_NAME ?? "ANALYTICS APP"),
    "import.meta.env.VITE_APP_SUBNAME": JSON.stringify(process.env.APP_SUBNAME ?? "ANALYTICS APP"),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.APP_VERSION ?? "1"),

    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.API_URL),
    "import.meta.env.VITE_TIMEOUT": JSON.stringify(process.env.TIMEOUT ?? "60")
  },

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@models': path.resolve(__dirname, './src/models'),
      '@assets': path.resolve(__dirname, './assets'),
      '@animations': path.resolve(__dirname, './src/animations'),
      '@config': path.resolve(__dirname, './src/config'),
      '@routes': path.resolve(__dirname, './src/routes'),
    }
  },

  optimizeDeps: {
    include: [
      "@monaco-editor/react",
      "monaco-editor",
      "@emotion/react",
      "@emotion/styled",
      "@mui/material"
    ]
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
