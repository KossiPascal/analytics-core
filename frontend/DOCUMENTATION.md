# Documentation Technique Complète - Webapp-React

## Application de Gestion de Santé Communautaire - Kendeya Analytics

> **Version:** 1.0.0
> **Dernière mise à jour:** Janvier 2026
> **Public cible:** Développeurs débutants à intermédiaires en React

---

## Table des Matières

1. [Introduction et Vue d'ensemble](#1-introduction-et-vue-densemble)
2. [Architecture de l'Application](#2-architecture-de-lapplication)
3. [Structure des Fichiers](#3-structure-des-fichiers)
4. [Le Point d'Entrée - main.tsx et App.tsx](#4-le-point-dentrée---maintsx-et-apptsx)
5. [Gestion d'État avec Zustand](#5-gestion-détat-avec-zustand)
6. [Système de Routage](#6-système-de-routage)
7. [Système d'Authentification](#7-système-dauthentification)
8. [Composants Réutilisables](#8-composants-réutilisables)
9. [Services et API](#9-services-et-api)
10. [Hooks Personnalisés](#10-hooks-personnalisés)
11. [Types TypeScript](#11-types-typescript)
12. [Styles et Thèmes](#12-styles-et-thèmes)
13. [Features/Fonctionnalités Métier](#13-featuresfonctionnalités-métier)
14. [Animations avec Framer Motion](#14-animations-avec-framer-motion)
15. [Configuration du Projet](#15-configuration-du-projet)
16. [Glossaire pour Débutants](#16-glossaire-pour-débutants)

---

## 1. Introduction et Vue d'ensemble

### Qu'est-ce que cette application ?

**Kendeya Analytics** est une application web de gestion de santé communautaire. Elle permet de :

- Visualiser des tableaux de bord (dashboards) sur les performances des agents de santé (RECO)
- Générer et valider des rapports de santé
- Afficher des cartes géographiques des interventions
- Gérer les utilisateurs et leurs permissions
- Envoyer des données vers le système DHIS2 (système national de santé)

### Technologies utilisées

| Technologie | Version | Rôle |
|------------|---------|------|
| **React** | 19.2.0 | Framework UI (interface utilisateur) |
| **TypeScript** | 5.9.3 | Typage statique du JavaScript |
| **Vite** | 7.2.4 | Outil de build et serveur de développement |
| **Zustand** | 5.0.10 | Gestion de l'état global |
| **React Router** | 6.30.3 | Navigation entre les pages |
| **TanStack Query** | 5.90.18 | Gestion du cache et des requêtes API |
| **Axios** | 1.13.2 | Client HTTP pour les requêtes API |
| **Recharts** | 3.6.0 | Bibliothèque de graphiques |
| **Leaflet** | 1.9.4 | Cartes géographiques |
| **Framer Motion** | 12.26.2 | Animations |
| **react-hook-form** | 7.71.1 | Gestion des formulaires |
| **Zod** | 4.3.5 | Validation des données |

### Prérequis

Pour travailler sur ce projet, vous devez avoir installé :

```bash
# Node.js (version 18 ou supérieure)
node --version  # v18.x.x ou plus

# npm ou yarn
npm --version   # 9.x.x ou plus
```

### Installation et Démarrage

```bash
# 1. Cloner le projet
git clone <url-du-repo>

# 2. Aller dans le dossier
cd webapp-react

# 3. Installer les dépendances
npm install

# 4. Démarrer en mode développement
npm run dev

# L'application sera accessible sur http://localhost:4200
```

---

## 2. Architecture de l'Application

### Diagramme d'Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Application                     │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         QueryClientProvider (React Query)        │    │   │
│  │  │  ┌───────────────────────────────────────────┐  │    │   │
│  │  │  │           BrowserRouter (Routes)          │  │    │   │
│  │  │  │  ┌─────────────────────────────────────┐  │  │    │   │
│  │  │  │  │            AppContent               │  │  │    │   │
│  │  │  │  │  ┌──────────┐ ┌──────────────────┐ │  │  │    │   │
│  │  │  │  │  │  Navbar  │ │     Sidebar      │ │  │  │    │   │
│  │  │  │  │  └──────────┘ └──────────────────┘ │  │  │    │   │
│  │  │  │  │  ┌──────────────────────────────┐  │  │  │    │   │
│  │  │  │  │  │      Main Content (Routes)   │  │  │  │    │   │
│  │  │  │  │  │   Pages: Dashboards, Reports │  │  │  │    │   │
│  │  │  │  │  │   Maps, Users, Admin, etc.   │  │  │  │    │   │
│  │  │  │  │  └──────────────────────────────┘  │  │  │    │   │
│  │  │  │  └─────────────────────────────────┘  │  │    │   │
│  │  │  └───────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        STORES (Zustand)                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │ AuthSlice  │ │  UISlice   │ │ Dashboard  │ │   Reports   │  │
│  │ user,token │ │ sidebar,   │ │   Store    │ │    Store    │  │
│  │ auth state │ │ theme      │ │   data     │ │    data     │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     SERVICES (API Layer)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Axios Instance                       │    │
│  │            (interceptors, auth headers)                 │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌──────┐ ┌───────┐ ┌──────────┐ ┌────┐ ┌────────┐ ┌─────┐   │
│  │ Auth │ │Reports│ │Dashboards│ │Maps│ │OrgUnits│ │DHIS2│   │
│  │ API  │ │ API   │ │   API    │ │API │ │  API   │ │ API │   │
│  └──────┘ └───────┘ └──────────┘ └────┘ └────────┘ └─────┘   │
├─────────────────────────────────────────────────────────────────┤
│                   BACKEND / Mock API                            │
│            (Node.js server ou données locales)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de Données

```
Utilisateur clique → Action (hook) → API Service → Backend/Mock
                                         ↓
                    ← UI met à jour ← Store mis à jour ←
```

### Principes d'Architecture

1. **Séparation des préoccupations** : Chaque fichier/dossier a une responsabilité unique
2. **Composants réutilisables** : Les composants UI sont génériques et réutilisables
3. **État centralisé** : Zustand gère l'état global de l'application
4. **Services découplés** : Les appels API sont isolés dans des services
5. **Types stricts** : TypeScript assure la sécurité du typage

---

## 3. Structure des Fichiers

```
webapp-react/
│
├── index.html              # Page HTML racine
├── package.json            # Dépendances et scripts npm
├── vite.config.ts          # Configuration Vite (build tool)
├── tsconfig.json           # Configuration TypeScript
├── eslint.config.js        # Configuration linting
│
└── src/                    # CODE SOURCE PRINCIPAL
    │
    ├── main.tsx            # Point d'entrée de l'application
    ├── App.tsx             # Composant racine principal
    │
    ├── animations/         # Configurations d'animations Framer Motion
    │   ├── page.ts         # Animations de transition de pages
    │   ├── list.ts         # Animations de listes
    │   ├── modal.ts        # Animations de modales
    │   └── shared.ts       # Animations réutilisables
    │
    ├── assets/             # Ressources statiques
    │   ├── css/            # Feuilles de style globales
    │   │   ├── variables.css   # Variables CSS (couleurs, espacements)
    │   │   ├── global.css      # Styles globaux
    │   │   ├── animations.css  # Keyframes CSS
    │   │   └── responsive.css  # Media queries
    │   ├── fonts/          # Polices de caractères
    │   └── images/         # Images et logos
    │
    ├── components/         # COMPOSANTS RÉUTILISABLES
    │   │
    │   ├── ui/             # Composants UI de base
    │   │   ├── Button/     # Boutons avec variants
    │   │   ├── Input/      # Champs de saisie
    │   │   ├── Select/     # Listes déroulantes
    │   │   ├── Modal/      # Fenêtres modales
    │   │   ├── Card/       # Cartes/conteneurs
    │   │   ├── Table/      # Tableaux
    │   │   ├── Spinner/    # Indicateurs de chargement
    │   │   └── Skeleton/   # Placeholders de chargement
    │   │
    │   ├── layout/         # Composants de mise en page
    │   │   ├── Navbar/     # Barre de navigation supérieure
    │   │   ├── Sidebar/    # Menu latéral
    │   │   ├── PageHeader/ # En-tête de page
    │   │   ├── PageWrapper/# Conteneur de page
    │   │   └── AuthLayout/ # Layout pour pages d'authentification
    │   │
    │   ├── charts/         # Composants graphiques (Recharts)
    │   │   ├── LineChart/
    │   │   ├── BarChart/
    │   │   ├── PieChart/
    │   │   └── AreaChart/
    │   │
    │   ├── data-display/   # Affichage de données
    │   │   ├── DataTable/
    │   │   ├── StatCard/
    │   │   └── DataGrid/
    │   │
    │   ├── filters/        # Composants de filtrage
    │   │   ├── MonthYearFilter/
    │   │   ├── OrgUnitsFilter/
    │   │   └── ReportFilters/
    │   │
    │   ├── forms/          # Composants de formulaire
    │   │
    │   ├── feedback/       # Retours utilisateur
    │   │   ├── Notification/
    │   │   ├── Alert/
    │   │   └── ConfirmDialog/
    │   │
    │   └── loaders/        # Indicateurs de chargement
    │       ├── PageLoader/
    │       └── SuspenseLoader/
    │
    ├── config/             # Configuration
    │   └── constants.ts    # Constantes de l'application
    │
    ├── features/           # FONCTIONNALITÉS MÉTIER
    │   │
    │   ├── auth/           # Authentification
    │   │   ├── pages/      # LoginPage, ChangePasswordPage
    │   │   ├── hooks/      # useAuth, useAuthActions
    │   │   └── services/   # authService
    │   │
    │   ├── dashboards/     # Tableaux de bord
    │   │   ├── pages/      # MonthlyDashboard, RealtimeDashboard
    │   │   ├── components/ # Tables, modales, graphiques
    │   │   └── hooks/
    │   │
    │   ├── reports/        # Rapports
    │   │   ├── pages/
    │   │   └── components/
    │   │
    │   ├── maps/           # Cartes géographiques
    │   │
    │   ├── users/          # Gestion utilisateurs
    │   │   ├── pages/      # UsersPage, RolesPage, etc.
    │   │   └── components/
    │   │
    │   ├── admin/          # Administration
    │   │
    │   ├── settings/       # Paramètres
    │   │
    │   ├── documentation/  # Documentation
    │   │
    │   └── errors/         # Pages d'erreur (404, 500, etc.)
    │
    ├── hooks/              # HOOKS PERSONNALISÉS
    │   ├── useDashboard.ts # Logic des dashboards
    │   ├── useReports.ts   # Logic des rapports
    │   ├── useNotification.ts # Notifications
    │   └── useUsers.ts     # Gestion utilisateurs
    │
    ├── routes/             # CONFIGURATION DES ROUTES
    │   ├── index.tsx       # Définition des routes
    │   ├── PrivateRoute.tsx# Protection des routes privées
    │   ├── PublicRoute.tsx # Routes publiques
    │   └── lazy.ts         # Chargement différé (code splitting)
    │
    ├── services/           # SERVICES API
    │   └── api/
    │       ├── axios.instance.ts   # Configuration Axios
    │       ├── api.service.ts      # Toutes les APIs
    │       └── api.mock.service.ts # APIs Mock (données de test)
    │
    ├── store/              # ÉTAT GLOBAL (Zustand)
    │   ├── index.ts        # Store principal
    │   └── slices/
    │       ├── authSlice.ts    # État authentification
    │       └── uiSlice.ts      # État interface
    │
    ├── stores/             # Stores additionnels
    │   ├── dashboard.store.ts
    │   ├── reports.store.ts
    │   └── notification.store.ts
    │
    ├── types/              # TYPES TYPESCRIPT
    │   ├── auth.types.ts       # Types authentification
    │   ├── dashboard.types.ts  # Types dashboards
    │   ├── reports.types.ts    # Types rapports
    │   ├── org-unit.types.ts   # Types organisations
    │   ├── api.types.ts        # Types API
    │   └── index.ts            # Export centralisé
    │
    └── utils/              # UTILITAIRES
        ├── helpers.ts      # Fonctions utilitaires
        ├── date.ts         # Manipulation de dates
        ├── validators.ts   # Schémas de validation Zod
        ├── formatters.ts   # Formatage de données
        ├── cn.ts           # Gestion de classes CSS
        └── TestData.ts     # Données de test
```

---

## 4. Le Point d'Entrée - main.tsx et App.tsx

### main.tsx - Le tout premier fichier exécuté

```typescript
// main.tsx - Point d'entrée de l'application
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// createRoot : Crée un point de montage React dans le DOM
// document.getElementById('root') : Récupère la div avec id="root" dans index.html
// ! : Opérateur TypeScript signifiant "je suis sûr que cet élément existe"
createRoot(document.getElementById('root')!).render(
  // StrictMode : Mode de développement qui détecte les problèmes potentiels
  // Il fait un double rendu en développement pour détecter les effets de bord
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Explication pour débutants :**
- `createRoot` est la nouvelle façon (React 18+) de monter une application React
- `StrictMode` aide à trouver les bugs pendant le développement (pas en production)
- `<App />` est le composant racine qui contient toute l'application

### App.tsx - Le Composant Racine

```typescript
// App.tsx - Composant principal qui configure l'application
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar, Sidebar } from '@components/layouts';
import { PageLoader } from '@components/loaders';
import { AppRoutes } from '@/routes';
import { useStore } from '@store';
import '@assets/css/global.css';

// Configuration de React Query pour le cache des requêtes API
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Les données sont "fraîches" pendant 5 minutes
      retry: 1,                  // Réessayer 1 fois en cas d'échec
      refetchOnWindowFocus: false, // Ne pas recharger quand on revient sur l'onglet
    },
  },
});

// AppContent : Composant qui gère le contenu principal
function AppContent() {
  // useStore : Hook pour accéder à l'état global Zustand
  const { isAuthenticated, user, isGlobalLoading } = useStore();

  // État local pour gérer l'ouverture de la sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed] = useState(false);

  // Fonction de déconnexion
  const handleLogout = () => {
    useStore.getState().logout();
  };

  // Afficher un loader pendant le chargement global
  if (isGlobalLoading) {
    return <PageLoader />;
  }

  return (
    <div className="app">
      {/* Afficher Navbar et Sidebar uniquement si l'utilisateur est connecté */}
      {isAuthenticated && (
        <>
          <Navbar
            isMenuOpen={sidebarOpen}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            userName={user?.fullname || 'Utilisateur'}
            userRole={user?.roles?.[0]?.name || 'Admin'}
            onLogout={handleLogout}
          />
          <Sidebar
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            userName={user?.fullname || 'Utilisateur'}
            userRole={user?.roles?.[0]?.name || 'Admin'}
            onLogout={handleLogout}
          />
        </>
      )}

      {/* Contenu principal - les pages */}
      <main
        className={
          isAuthenticated
            ? `main-content ${sidebarOpen ? 'with-sidebar' : ''}`
            : ''
        }
      >
        <AppRoutes />
      </main>
    </div>
  );
}

// App : Composant racine avec les providers
function App() {
  return (
    // QueryClientProvider : Fournit React Query à toute l'application
    <QueryClientProvider client={queryClient}>
      {/* BrowserRouter : Active le routage côté client */}
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

**Concepts clés pour débutants :**

1. **Provider Pattern** : Les composants "Provider" (comme `QueryClientProvider`, `BrowserRouter`) enveloppent l'application pour fournir des fonctionnalités à tous les composants enfants.

2. **Rendu conditionnel** : `{isAuthenticated && (...)}` affiche le contenu uniquement si la condition est vraie.

3. **Optional chaining** : `user?.fullname` évite les erreurs si `user` est null/undefined.

---

## 5. Gestion d'État avec Zustand

### Qu'est-ce que Zustand ?

Zustand est une bibliothèque de gestion d'état légère pour React. Elle permet de :
- Stocker des données accessibles partout dans l'application
- Persister des données dans le localStorage
- Éviter le "prop drilling" (passer des props à travers plusieurs niveaux)

### Pourquoi Zustand plutôt que Redux ?

| Aspect | Zustand | Redux |
|--------|---------|-------|
| Taille | ~1KB | ~7KB |
| Boilerplate | Minimal | Important |
| Courbe d'apprentissage | Facile | Moyenne |
| Configuration | Simple | Complexe |

### Structure du Store Principal

```typescript
// store/index.ts - Store principal Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

// Type combiné du store (AuthSlice + UISlice)
export type AppStore = AuthSlice & UISlice;

// Création du store avec persistance
export const useStore = create<AppStore>()(
  // persist : Middleware pour sauvegarder dans localStorage
  persist(
    // Fonction qui combine les slices
    (...a) => ({
      ...createAuthSlice(...a),  // État d'authentification
      ...createUISlice(...a),    // État de l'interface
    }),
    {
      name: 'kendeya-storage',   // Clé dans localStorage
      storage: createJSONStorage(() => localStorage),

      // partialize : Définit quelles données persister
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),

      // onRehydrateStorage : Appelé quand les données sont rechargées
      onRehydrateStorage: () => (state) => {
        // Recharger les données de test si configuré
        if (state && state.user) {
          state.updateUser({
            countries: COUNTRIES,
            regions: REGIONS,
            // ... autres données
          });
        }
      },
    }
  )
);

// Hooks sélecteurs pour de meilleures performances
// useShallow évite les re-renders inutiles
export const useAuth = () =>
  useStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login: state.login,
      logout: state.logout,
    }))
  );

export const useUI = () =>
  useStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      toggleSidebar: state.toggleSidebar,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
    }))
  );
```

### AuthSlice - État d'Authentification

```typescript
// store/slices/authSlice.ts
import type { StateCreator } from 'zustand';
import type { User } from '@models/old';

export interface AuthSlice {
  // État
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  // Valeurs initiales
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Définition des actions
  setUser: (user) => set({ user }),

  setToken: (token) => set({ token }),

  // Action de connexion
  login: (user, token, refreshToken) =>
    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      error: null,
    }),

  // Action de déconnexion
  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    }),

  // Mise à jour partielle de l'utilisateur
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
});
```

### UISlice - État de l'Interface

```typescript
// store/slices/uiSlice.ts
import type { StateCreator } from 'zustand';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface UISlice {
  // État
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  alerts: Alert[];
  isGlobalLoading: boolean;
  theme: 'light' | 'dark';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  setGlobalLoading: (isLoading: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Valeurs initiales
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  alerts: [],
  isGlobalLoading: false,
  theme: 'light',

  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id: Date.now().toString() }],
    })),

  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    })),

  clearAlerts: () => set({ alerts: [] }),

  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  setTheme: (theme) => set({ theme }),
});
```

### Utilisation dans un Composant

```typescript
// Exemple d'utilisation dans un composant
import { useStore, useAuth, useUI } from '@store';

function MonComposant() {
  // Méthode 1 : Accès direct au store complet
  const { user, isAuthenticated, logout } = useStore();

  // Méthode 2 : Utiliser le hook sélecteur (recommandé pour les performances)
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useUI();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Bienvenue, {user?.fullname}</p>
          <button onClick={logout}>Déconnexion</button>
          <button onClick={toggleTheme}>
            Thème: {theme}
          </button>
        </>
      ) : (
        <p>Veuillez vous connecter</p>
      )}
    </div>
  );
}
```

---

## 6. Système de Routage

### Configuration des Routes

```typescript
// routes/index.tsx
import { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SuspenseLoader } from '@components/loaders';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import * as Pages from './lazy';  // Import des pages en lazy loading

export function AppRoutes() {
  const location = useLocation();  // Récupère l'URL actuelle

  return (
    // AnimatePresence : Permet les animations de sortie/entrée
    <AnimatePresence mode="wait">
      {/* Suspense : Affiche un loader pendant le chargement des composants lazy */}
      <Suspense fallback={<SuspenseLoader />}>
        {/* Routes : Conteneur de toutes les routes */}
        <Routes location={location} key={location.pathname}>

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/dashboards/monthly" replace />} />

          {/* Routes publiques (accessibles sans connexion) */}
          <Route
            path="/auths/login"
            element={
              <PublicRoute>
                <Pages.LoginPage />
              </PublicRoute>
            }
          />

          {/* Routes privées (nécessitent une connexion) */}
          <Route
            path="/dashboards/monthly/*"
            element={
              <PrivateRoute>
                <Pages.MonthlyDashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/reports/*"
            element={
              <PrivateRoute>
                <Pages.ReportsPage />
              </PrivateRoute>
            }
          />

          {/* Page 404 - Route catch-all */}
          <Route path="*" element={<Pages.NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
```

### PrivateRoute - Protection des Routes

```typescript
// routes/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@store';

interface PrivateRouteProps {
  children: React.ReactNode;  // Les composants enfants à protéger
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, user } = useStore();
  const location = useLocation();

  // Si non connecté → rediriger vers login
  if (!isAuthenticated) {
    // state={{ from: location }} : Sauvegarde l'URL pour y retourner après connexion
    return <Navigate to="/auths/login" state={{ from: location }} replace />;
  }

  // Si doit changer le mot de passe → rediriger vers change-password
  if (user?.mustChangeDefaultPassword &&
      location.pathname !== '/auths/change-default-password') {
    return <Navigate to="/auths/change-default-password" replace />;
  }

  // Sinon, afficher le contenu protégé
  return <>{children}</>;
}
```

### PublicRoute - Routes Publiques

```typescript
// routes/PublicRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@store';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useStore();
  const location = useLocation();

  // Si déjà connecté, rediriger vers la page d'origine ou les dashboards
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboards/monthly';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
```

### Lazy Loading

```typescript
// routes/lazy.ts - Chargement différé des pages
import { lazy } from 'react';

// lazy() : Charge le composant uniquement quand nécessaire
// Cela réduit la taille du bundle initial
export const LoginPage = lazy(() => import('@pages/auths/pages/LoginPage'));
export const ChangePasswordPage = lazy(() => import('@pages/auths/pages/ChangePasswordPage'));
export const MonthlyDashboardPage = lazy(() => import('@pages/dashboards/pages/MonthlyDashboard'));
export const RealtimeDashboardPage = lazy(() => import('@pages/dashboards/pages/RealtimeDashboard'));
export const ReportsPage = lazy(() => import('@pages/reports/pages/ReportsPage'));
export const MapsPage = lazy(() => import('@pages/maps/pages/MapsPage'));
export const UsersPage = lazy(() => import('@pages/users/pages/UsersPage'));
export const RolesPage = lazy(() => import('@pages/users/pages/RolesPage'));
export const PermissionsPage = lazy(() => import('@pages/users/pages/PermissionsPage'));
export const OrganizationsPage = lazy(() => import('@pages/users/pages/OrganizationsPage'));
export const AdminPage = lazy(() => import('@pages/admin/pages/AdminPage'));
export const ManagementsPage = lazy(() => import('@pages/managements/pages/ManagementsPage'));
export const SettingsPage = lazy(() => import('@pages/settings/pages/SettingsPage'));
export const DocumentationPage = lazy(() => import('@pages/documentation/pages/DocumentationPage'));
export const NotFoundPage = lazy(() => import('@pages/errors/pages/NotFoundPage'));
export const UnauthorizedPage = lazy(() => import('@pages/errors/pages/UnauthorizedPage'));
export const ServerErrorPage = lazy(() => import('@pages/errors/pages/ServerErrorPage'));
```

### Tableau des Routes

| Route | Composant | Accès | Description |
|-------|-----------|-------|-------------|
| `/` | Redirect | - | Redirige vers `/dashboards/monthly` |
| `/auths/login` | LoginPage | Public | Page de connexion |
| `/auths/change-default-password` | ChangePasswordPage | Privé | Changement mot de passe |
| `/dashboards/monthly/*` | MonthlyDashboard | Privé | Dashboard mensuel |
| `/dashboards/realtime/*` | RealtimeDashboard | Privé | Dashboard temps réel |
| `/reports/*` | ReportsPage | Privé | Rapports |
| `/maps/*` | MapsPage | Privé | Cartes géographiques |
| `/users/list` | UsersPage | Privé | Liste des utilisateurs |
| `/users/roles` | RolesPage | Privé | Gestion des rôles |
| `/users/permissions` | PermissionsPage | Privé | Gestion permissions |
| `/users/organizations` | OrganizationsPage | Privé | Gestion organisations |
| `/administration/*` | AdminPage | Privé | Administration |
| `/managements/*` | ManagementsPage | Privé | Gestion |
| `/settings` | SettingsPage | Privé | Paramètres |
| `/documentations/*` | DocumentationPage | Public | Documentation |
| `/errors/401` | UnauthorizedPage | Public | Non autorisé |
| `/errors/404` | NotFoundPage | Public | Page non trouvée |
| `/errors/500` | ServerErrorPage | Public | Erreur serveur |
| `*` | NotFoundPage | Public | Catch-all 404 |

---

## 7. Système d'Authentification

### Flux d'Authentification

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  LoginPage   │ ──► │  useAuthActions │ ──► │  authService │
│  (formulaire)│     │  (hook)         │     │  (API)       │
└──────────────┘     └─────────────────┘     └──────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Store Zustand  │
                     │  (user, token)  │
                     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  localStorage   │
                     │  (persistance)  │
                     └─────────────────┘
```

### LoginPage - Page de Connexion

```typescript
// features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Lock, LogIn } from 'lucide-react';
import { AuthLayout } from '@components/layouts';
import { Input, Button } from '@components/ui';
import { loginFormSchema, type LoginFormData } from '@utils/validators';
import { useAuthActions } from '../hooks/useAuth';
import { useStore } from '@store';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  // Hook personnalisé pour les actions d'authentification
  const { login } = useAuthActions();

  // Récupération de l'état de chargement et d'erreur depuis le store
  const { isLoading, error } = useStore();

  // État local pour afficher/masquer les erreurs
  const [showError, setShowError] = useState(false);

  // Configuration du formulaire avec react-hook-form et Zod
  const {
    register,      // Fonction pour enregistrer les champs
    handleSubmit,  // Gestionnaire de soumission
    formState: { errors },  // Erreurs de validation
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),  // Validation avec Zod
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Fonction appelée à la soumission du formulaire
  const onSubmit = async (data: LoginFormData) => {
    setShowError(false);
    try {
      await login(data);  // Appel de l'action de connexion
    } catch {
      setShowError(true);  // Afficher l'erreur en cas d'échec
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Connectez-vous pour accéder à votre tableau de bord"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Message d'erreur animé */}
        {showError && error && (
          <motion.div
            className={styles.errorAlert}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Champ nom d'utilisateur */}
        <Input
          label="Nom d'utilisateur"
          placeholder="Entrez votre nom d'utilisateur"
          leftIcon={<User size={18} />}
          error={errors.username?.message}
          autoComplete="username"
          {...register('username')}  // Enregistrement du champ
        />

        {/* Champ mot de passe */}
        <Input
          type="password"
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />

        {/* Lien mot de passe oublié */}
        <div className={styles.forgotPassword}>
          <a href="/auths/forgot-password">Mot de passe oublié ?</a>
        </div>

        {/* Bouton de soumission */}
        <Button
          type="submit"
          isFullWidth
          isLoading={isLoading}  // Affiche un spinner pendant le chargement
          rightIcon={<LogIn size={18} />}
        >
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
}
```

### useAuthActions - Hook d'Authentification

```typescript
// features/auth/hooks/useAuth.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@store';
import { authService } from '@services/auth.service';
import type { LoginCredentials, ChangePasswordPayload } from '@models/old';

export function useAuthActions() {
  const navigate = useNavigate();

  // Récupération des actions du store
  const {
    login: storeLogin,     // Action de connexion du store
    logout: storeLogout,   // Action de déconnexion du store
    setLoading,
    setError,
    updateUser,
  } = useStore();

  // Action de connexion
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);    // Activer le loader
      setError(null);      // Effacer les erreurs précédentes

      try {
        // Appel à l'API d'authentification
        const response = await authService.login(credentials);

        // Mise à jour du store avec les données utilisateur
        storeLogin(response.user, response.token, response.refreshToken ?? '');

        // Redirection selon l'état de l'utilisateur
        if (response.user.mustChangeDefaultPassword) {
          navigate('/auths/change-default-password');
        } else {
          navigate('/reports');
        }

        return response;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Erreur de connexion';
        setError(message);
        throw error;
      } finally {
        setLoading(false);  // Désactiver le loader
      }
    },
    [navigate, setError, setLoading, storeLogin]
  );

  // Action de déconnexion
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authService.logout();  // Appel API (optionnel)
    } catch {
      // Ignorer les erreurs de déconnexion
    } finally {
      storeLogout();               // Nettoyer le store
      setLoading(false);
      navigate('/auths/login');    // Redirection vers login
    }
  }, [navigate, setLoading, storeLogout]);

  // Action de changement de mot de passe
  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      setLoading(true);
      setError(null);

      try {
        await authService.changePassword(payload);
        updateUser({ mustChangeDefaultPassword: false });
        navigate('/reports');
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Erreur lors du changement de mot de passe';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, setError, setLoading, updateUser]
  );

  // Rafraîchir les données utilisateur
  const refreshUserData = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      updateUser(user);
      return user;
    } catch (error) {
      storeLogout();
      throw error;
    }
  }, [storeLogout, updateUser]);

  return {
    login,
    logout,
    changePassword,
    refreshUserData,
  };
}
```

### Validation avec Zod

```typescript
// utils/validators.ts
import { z } from 'zod';

// Schéma de validation pour le formulaire de connexion
export const loginFormSchema = z.object({
  username: z
    .string()
    .min(1, 'Le nom d\'utilisateur est requis')
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

// Type inféré du schéma
export type LoginFormData = z.infer<typeof loginFormSchema>;

// Schéma pour le changement de mot de passe
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'La confirmation est requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
```

---

## 8. Composants Réutilisables

### Button - Composant Bouton

```typescript
// components/ui/Button/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@utils/cn';
import styles from './Button.module.css';

// Types pour les variantes et tailles
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Interface des props du bouton
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: ButtonVariant;      // Style visuel
  size?: ButtonSize;            // Taille
  isLoading?: boolean;          // Affiche un spinner
  isFullWidth?: boolean;        // Prend toute la largeur
  leftIcon?: ReactNode;         // Icône à gauche
  rightIcon?: ReactNode;        // Icône à droite
  children: ReactNode;          // Contenu du bouton
}

// forwardRef permet de transmettre une ref au composant
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',    // Valeur par défaut
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Le bouton est désactivé si disabled OU si en chargement
    const isDisabled = disabled || isLoading;

    return (
      // motion.button : Bouton avec animations Framer Motion
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          styles.button,                           // Classe de base
          styles[variant],                         // Classe de variante
          styles[size],                            // Classe de taille
          isFullWidth && styles.fullWidth,         // Pleine largeur
          isLoading && styles.loading,             // État chargement
          className                                // Classes additionnelles
        )}
        // Animations
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}    // Réduit au clic
        whileHover={{ scale: isDisabled ? 1 : 1.01 }}  // Agrandit au survol
        transition={{ duration: 0.15 }}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {/* Spinner de chargement */}
        {isLoading && (
          <span className={styles.spinner}>
            <Loader2 className={styles.spinnerIcon} />
          </span>
        )}

        {/* Icône gauche (si pas en chargement) */}
        {!isLoading && leftIcon && <span className={styles.icon}>{leftIcon}</span>}

        {/* Contenu principal */}
        <span className={styles.content}>{children}</span>

        {/* Icône droite (si pas en chargement) */}
        {!isLoading && rightIcon && <span className={styles.icon}>{rightIcon}</span>}
      </motion.button>
    );
  }
);

// displayName aide au débogage dans React DevTools
Button.displayName = 'Button';

export { Button };
```

### Exemples d'Utilisation

```tsx
// Exemples d'utilisation du composant Button
import { Button } from '@components/ui';
import { Plus, Check, Trash, Download } from 'lucide-react';

// Bouton primaire (par défaut)
<Button>Enregistrer</Button>

// Bouton avec icône à gauche
<Button leftIcon={<Plus size={16} />}>Ajouter</Button>

// Bouton avec icône à droite
<Button rightIcon={<Download size={16} />}>Télécharger</Button>

// Bouton de danger
<Button variant="danger" leftIcon={<Trash size={16} />}>Supprimer</Button>

// Bouton de succès
<Button variant="success" leftIcon={<Check size={16} />}>Valider</Button>

// Bouton en chargement
<Button isLoading>Chargement...</Button>

// Bouton pleine largeur
<Button isFullWidth>Se connecter</Button>

// Bouton outline
<Button variant="outline">Annuler</Button>

// Bouton ghost (transparent)
<Button variant="ghost">Voir plus</Button>

// Combinaison de props
<Button
  variant="success"
  size="lg"
  rightIcon={<Check size={18} />}
  isLoading={isSubmitting}
  isFullWidth
>
  Confirmer la commande
</Button>
```

### Input - Composant Champ de Saisie

```typescript
// components/ui/Input/Input.tsx
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;           // Label au-dessus du champ
  error?: string;           // Message d'erreur
  helperText?: string;      // Texte d'aide
  leftIcon?: ReactNode;     // Icône à gauche
  rightIcon?: ReactNode;    // Icône à droite
  isFullWidth?: boolean;    // Prend toute la largeur
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isFullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Générer un ID unique si non fourni
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={cn(styles.wrapper, isFullWidth && styles.fullWidth)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        {/* Container de l'input */}
        <div className={cn(styles.inputContainer, error && styles.hasError)}>
          {/* Icône gauche */}
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              styles.input,
              leftIcon && styles.withLeftIcon,
              rightIcon && styles.withRightIcon,
              className
            )}
            {...props}
          />

          {/* Icône droite */}
          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </div>

        {/* Message d'erreur ou texte d'aide */}
        {error ? (
          <span className={styles.error}>{error}</span>
        ) : helperText ? (
          <span className={styles.helperText}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

### Structure des Composants UI

Chaque composant UI suit cette structure :

```
components/ui/Button/
├── Button.tsx         # Composant principal
├── Button.module.css  # Styles CSS Modules
└── index.ts           # Export du composant
```

```typescript
// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
```

### Utilitaire cn (classnames)

```typescript
// utils/cn.ts
import { clsx, type ClassValue } from 'clsx';

/**
 * Combine des classes CSS conditionnellement
 * @example cn('base-class', condition && 'conditional-class', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Utilisation
cn('button', isActive && 'active', className)
// Si isActive est true: "button active [className]"
// Si isActive est false: "button [className]"
```

---

## 9. Services et API

### Configuration Axios

```typescript
// services/api/axios.instance.ts
import axios from 'axios';

// Création de l'instance Axios avec configuration de base
export const axiosInstance = axios.create({
  baseURL: '/api',              // URL de base pour toutes les requêtes
  timeout: 30000,               // Timeout de 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTEUR DE REQUÊTE
// Exécuté AVANT chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis localStorage
    const authData = localStorage.getItem('kendeya-storage');
    if (authData) {
      const { state } = JSON.parse(authData);
      const token = state?.token;

      // Ajouter le token dans les headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTEUR DE RÉPONSE
// Exécuté APRÈS chaque réponse
axiosInstance.interceptors.response.use(
  (response) => response,  // Succès : retourner la réponse
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 (non autorisé) et pas déjà réessayé
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tenter de rafraîchir le token
        const authData = localStorage.getItem('kendeya-storage');
        const { state } = JSON.parse(authData || '{}');
        const refreshToken = state?.refreshToken;

        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const newToken = response.data.token;

          // Mettre à jour le store
          // Note: En pratique, utiliser une méthode du store

          // Réessayer la requête originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Échec du refresh : déconnecter l'utilisateur
        localStorage.removeItem('kendeya-storage');
        window.location.href = '/auths/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Service API Générique

```typescript
// services/api/api.service.ts

// Flag pour basculer entre Mock et API réelle
const USE_MOCK_API = true;

// Classe générique pour les requêtes API
class ApiService {
  // GET générique
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await axiosInstance.get<T>(url, { params });
    return response.data;
  }

  // POST générique
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.post<T>(url, data);
    return response.data;
  }

  // PUT générique
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.put<T>(url, data);
    return response.data;
  }

  // DELETE générique
  async delete<T>(url: string): Promise<T> {
    const response = await axiosInstance.delete<T>(url);
    return response.data;
  }

  // GET paginé
  async getPaginated<T>(url: string, params?: PaginationParams): Promise<PaginatedResponse<T>> {
    const response = await axiosInstance.get<PaginatedResponse<T>>(url, { params });
    return response.data;
  }

  // Upload de fichier
  async uploadFile<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await axiosInstance.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Téléchargement de fichier
  async downloadFile(url: string, filename: string): Promise<void> {
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const apiService = new ApiService();
```

### APIs Spécifiques

```typescript
// API d'Authentification
export const AuthApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axiosInstance.post('/auth-user/login', {
      credential: credentials.username,
      password: credentials.password,
      loginModeCredents: true,
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await axiosInstance.post('/auth-user/users', {});
    return response.data;
  },

  getRoles: async () => {
    const response = await axiosInstance.post('/auth-user/roles', {});
    return response.data;
  },

  createUser: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post('/auth-user/create-user', user);
    return response.data;
  },

  updateUser: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post('/auth-user/update-user', user);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await axiosInstance.post('/auth-user/delete-user', { id: userId });
    return response.data;
  },
};

// API des Dashboards
export const DashboardsApi = {
  getRecoPerformance: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/dashboards/reco-performance-dashboards', params);
    return response.data;
  },

  getActiveReco: async (params: { year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/dashboards/active-reco-dashboards', params);
    return response.data;
  },

  getRecoTasksState: async (params: { start_date: string; end_date: string; recos: string[] }) => {
    const response = await axiosInstance.post('/dashboards/reco-tasks-state-dashboards', params);
    return response.data;
  },

  getRecoVaccinationAllDone: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/dashboards/reco-vaccination-all-done-dashboards', params);
    return response.data;
  },

  getRecoVaccinationPartialDone: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/dashboards/reco-vaccination-partial-done-dashboards', params);
    return response.data;
  },

  getRecoVaccinationNotDone: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/dashboards/reco-vaccination-not-done-dashboards', params);
    return response.data;
  },
};

// API des Rapports
export const ReportsApi = {
  getPromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/reports/promotion-reports', params);
    return response.data;
  },

  getFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/reports/family-planning-reports', params);
    return response.data;
  },

  getMorbidityReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/reports/morbidity-reports', params);
    return response.data;
  },

  validatePromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post('/reports/promotion-reports-validation', params);
    return response.data;
  },
};

// API DHIS2
export const Dhis2Api = {
  sendChwsRecoReports: async (params: Dhis2Params) => {
    const response = await axiosInstance.post('/dhis2/send/monthly-activity', params);
    return response.data;
  },

  sendFamilyPlanningActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post('/dhis2/send/family-planning-activity', params);
    return response.data;
  },
};
```

---

## 10. Hooks Personnalisés

### useDashboard - Hook des Dashboards

```typescript
// hooks/useDashboard.ts
import { useCallback } from 'react';
import { useDashboardStore } from '@stores/dashboard.store';
import { DashboardsApi } from '@services/api/api.service';
import { useNotification } from './useNotification';

export function useDashboard() {
  // Récupération de l'état et des actions du store
  const {
    data,                    // Données des dashboards
    status,                  // États de chargement/erreur
    filters,                 // Filtres actuels
    activeTab,               // Onglet actif
    setDashboardData,        // Setter pour les données
    setDashboardStatus,      // Setter pour le status
    setFilters,              // Setter pour les filtres
    clearDashboardData,      // Effacer les données
  } = useDashboardStore();

  // Hook de notifications
  const { showSuccess, showError, showWarning } = useNotification();

  // Récupérer les performances RECO
  const fetchRecoPerformance = useCallback(
    async (filterParams: DashboardFilterParams) => {
      // 1. Mettre le status en "loading"
      setDashboardStatus('RECOS_PERFORMANCES', { isLoading: true, error: undefined });

      try {
        // 2. Appeler l'API
        const response = await DashboardsApi.getRecoPerformance({
          months: filterParams.months,
          year: filterParams.year,
          recos: filterParams.recos,
        });

        // 3. Traiter la réponse
        if (response?.status === 200 && response?.data) {
          // Succès : mettre à jour les données
          setDashboardData('RECOS_PERFORMANCES', response.data);
          setDashboardStatus('RECOS_PERFORMANCES', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('Performances RECO récupérées avec succès');
        } else {
          // Pas de données
          setDashboardStatus('RECOS_PERFORMANCES', { isLoading: false });
          showWarning('Aucune donnée de performance trouvée');
        }
      } catch (error) {
        // 4. Gérer les erreurs
        const errorMessage = error instanceof Error
          ? error.message
          : 'Erreur lors du chargement';
        setDashboardStatus('RECOS_PERFORMANCES', {
          isLoading: false,
          error: errorMessage
        });
        showError('Erreur lors du chargement des performances RECO');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Récupérer tous les dashboards mensuels en parallèle
  const fetchAllMonthlyDashboards = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setFilters(filterParams);

      // Promise.all exécute toutes les requêtes en parallèle
      await Promise.all([
        fetchRecoPerformance(filterParams),
        fetchActiveReco(filterParams),
        fetchRecoTasksState(filterParams),
      ]);
    },
    [setFilters, fetchRecoPerformance, fetchActiveReco, fetchRecoTasksState]
  );

  // Helper pour déterminer le statut vaccinal
  const getVaccineStatus = useCallback(
    (vaccinated: boolean, ageValue: number, minAge: number): 'on' | 'off' | 'na' => {
      if (ageValue >= minAge) return vaccinated === true ? 'on' : 'off';
      return 'na';  // Non applicable si trop jeune
    },
    []
  );

  // Retourner tout ce dont les composants ont besoin
  return {
    // État
    data,
    status,
    filters,
    activeTab,

    // Actions
    fetchDashboard,
    fetchRecoPerformance,
    fetchActiveReco,
    fetchAllMonthlyDashboards,
    setFilters,
    clearDashboardData,

    // Helpers
    getVaccineStatus,
    getVaccineDisplay,

    // Valeurs calculées
    isAnyLoading: Object.values(status).some((s) => s.isLoading),
    performanceData: data.RECOS_PERFORMANCES,
    activeRecoData: data.ACTIVE_RECOS,
  };
}
```

### useNotification - Hook des Notifications

```typescript
// hooks/useNotification.ts
import { useCallback } from 'react';
import { useNotificationStore } from '@stores/notification.store';

export function useNotification() {
  const { addNotification, removeNotification, clearAll } = useNotificationStore();

  // Afficher une notification de succès
  const showSuccess = useCallback(
    (message: string, duration = 3000) => {
      addNotification({
        type: 'success',
        message,
        duration,
      });
    },
    [addNotification]
  );

  // Afficher une notification d'erreur
  const showError = useCallback(
    (message: string, duration = 5000) => {
      addNotification({
        type: 'error',
        message,
        duration,
      });
    },
    [addNotification]
  );

  // Afficher un avertissement
  const showWarning = useCallback(
    (message: string, duration = 4000) => {
      addNotification({
        type: 'warning',
        message,
        duration,
      });
    },
    [addNotification]
  );

  // Afficher une info
  const showInfo = useCallback(
    (message: string, duration = 3000) => {
      addNotification({
        type: 'info',
        message,
        duration,
      });
    },
    [addNotification]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll,
  };
}
```

### Règles pour Créer un Hook

1. **Nom** : Toujours commencer par `use` (ex: `useUsers`, `useReports`)
2. **Responsabilité unique** : Un hook = une fonctionnalité
3. **Mémoïsation** : Utiliser `useCallback` pour les fonctions, `useMemo` pour les valeurs
4. **Retour** : Retourner un objet avec l'état et les actions

---

## 11. Types TypeScript

### Types d'Authentification

```typescript
// types/auth.types.ts

// Interface de permission de route
export interface Routes {
  path: string;              // Chemin de la route
  label: string;             // Libellé affiché
  authorizations: string[];  // Autorisations requises
}

// Interface de rôle
export interface Roles {
  id: number;
  name: string;
  authorizations: string[] | null;
  routes: string[] | Routes[] | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}

// Capacités d'un rôle utilisateur
export interface UserRole {
  isSuperUser: boolean;
  canUseOfflineMode: boolean;
  canViewMaps: boolean;
  canViewReports: boolean;
  canViewDashboards: boolean;
  canManageData: boolean;
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canValidateData: boolean;
  canSendDataToDhis2: boolean;
  mustChangeDefaultPassword: boolean;
}

// Interface utilisateur complète
export interface User {
  id: string;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  routes: Routes[];
  authorizations: string[];
  exp: number;
  iat: number;
  rolesIds: number[];
  rolesNames: string[];
  roles: Roles[];

  // Unités organisationnelles assignées
  countries: CountryMap[];
  regions: RegionsMap[];
  prefectures: PrefecturesMap[];
  communes: CommunesMap[];
  hospitals: HospitalsMap[];
  districtQuartiers: DistrictQuartiersMap[];
  villageSecteurs: VillageSecteursMap[];
  chws: ChwsMap[];
  recos: RecosMap[];

  role: UserRole;
  isActive: boolean;
  token: string;
  userLogo: string;
  mustLogin: boolean;
  mustChangeDefaultPassword: boolean;
  isDeleted: boolean;
}

// Credentials de connexion
export interface LoginCredentials {
  username: string;
  password: string;
}

// Réponse de connexion
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
  mustChangeDefaultPassword: boolean;
}

// État d'authentification pour le store
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Payload de changement de mot de passe
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

### Types d'Organisation

```typescript
// types/org-unit.types.ts

// Hiérarchie organisationnelle complète
// Country → Region → Prefecture → Commune → Hospital → District → Village → CHW → RECO

export interface CountryMap {
  id: string;
  name: string;
  code: string;
  external_id?: string;
}

export interface RegionsMap {
  id: string;
  name: string;
  code: string;
  country_id: string;
  external_id?: string;
}

export interface PrefecturesMap {
  id: string;
  name: string;
  code: string;
  region_id: string;
  external_id?: string;
}

export interface CommunesMap {
  id: string;
  name: string;
  code: string;
  prefecture_id: string;
  external_id?: string;
}

export interface HospitalsMap {
  id: string;
  name: string;
  code: string;
  commune_id: string;
  external_id?: string;
}

export interface DistrictQuartiersMap {
  id: string;
  name: string;
  code: string;
  hospital_id: string;
  external_id?: string;
}

export interface VillageSecteursMap {
  id: string;
  name: string;
  code: string;
  district_quartier_id: string;
  external_id?: string;
}

export interface ChwsMap {
  id: string;
  name: string;
  code: string;
  phone?: string;
  village_secteur_id: string;
  external_id?: string;
}

export interface RecosMap {
  id: string;
  name: string;
  code: string;
  phone?: string;
  chw_id: string;
  external_id?: string;
}
```

### Types API

```typescript
// types/api.types.ts

// Réponse API générique
export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  message?: string;
}

// Paramètres de pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Réponse paginée
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## 12. Styles et Thèmes

### Variables CSS

```css
/* assets/css/variables.css */

:root {
  /* ==================== COULEURS ==================== */

  /* Couleur primaire - Bleu foncé */
  --color-primary: #003366;
  --color-primary-light: #1a4d80;
  --color-primary-dark: #002244;
  --color-primary-hover: #004488;

  /* Couleur secondaire - Gris */
  --color-secondary: #64748b;
  --color-secondary-light: #94a3b8;
  --color-secondary-dark: #475569;

  /* Couleurs de statut */
  --color-success: #22c55e;
  --color-success-light: #4ade80;
  --color-success-dark: #16a34a;

  --color-danger: #ef4444;
  --color-danger-light: #f87171;
  --color-danger-dark: #dc2626;

  --color-warning: #f59e0b;
  --color-warning-light: #fbbf24;
  --color-warning-dark: #d97706;

  --color-info: #06b6d4;
  --color-info-light: #22d3ee;
  --color-info-dark: #0891b2;

  /* Couleurs de fond */
  --color-background: #f8fafc;
  --color-background-alt: #f1f5f9;
  --color-surface: #ffffff;

  /* Couleurs de texte */
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;

  /* Couleurs spécifiques */
  --color-navbar: #004422;
  --color-sidebar: #003366;

  /* ==================== ESPACEMENTS ==================== */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;

  /* ==================== BORDURES ==================== */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-2xl: 20px;
  --border-radius-full: 9999px;

  /* Rayons spécifiques */
  --border-radius-input: 12px;
  --border-radius-button: 10px;
  --border-radius-card: 16px;
  --border-radius-modal: 20px;

  /* ==================== OMBRES ==================== */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* ==================== TYPOGRAPHIE ==================== */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Fira Code', 'Monaco', 'Consolas', monospace;

  /* Tailles de police */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;

  /* Poids de police */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ==================== TRANSITIONS ==================== */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
  --transition-slower: 500ms ease-in-out;

  /* ==================== Z-INDEX ==================== */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;

  /* ==================== DIMENSIONS ==================== */
  --navbar-height: 64px;
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 80px;
}
```

### CSS Modules - Exemple

```css
/* components/ui/Button/Button.module.css */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  border-radius: var(--border-radius-button);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

/* Variantes */
.primary {
  background-color: var(--color-primary);
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.secondary {
  background-color: var(--color-secondary);
  color: white;
}

.danger {
  background-color: var(--color-danger);
  color: white;
}

.success {
  background-color: var(--color-success);
  color: white;
}

.ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

.outline {
  background-color: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

/* Tailles */
.sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
}

.md {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
}

.lg {
  padding: var(--spacing-4) var(--spacing-6);
  font-size: var(--font-size-lg);
}

/* États */
.fullWidth {
  width: 100%;
}

.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animation du spinner */
.spinnerIcon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 13. Features/Fonctionnalités Métier

### Structure d'une Feature

Chaque feature suit cette structure :

```
features/dashboards/
├── pages/              # Pages de la feature
│   ├── MonthlyDashboard.tsx
│   └── RealtimeDashboard.tsx
├── components/         # Composants spécifiques
│   ├── RecoPerformanceTable/
│   ├── VaccinationTable/
│   └── ChartModals/
├── hooks/              # Hooks spécifiques (optionnel)
└── types/              # Types spécifiques (optionnel)
```

### Liste des Features

| Feature | Description | Pages principales |
|---------|-------------|-------------------|
| **auth** | Authentification | Login, ChangePassword |
| **dashboards** | Tableaux de bord | Monthly, Realtime |
| **reports** | Rapports | ReportsPage |
| **maps** | Cartes géographiques | MapsPage |
| **users** | Gestion utilisateurs | Users, Roles, Permissions, Organizations |
| **admin** | Administration | API Access, Database, PDF, Signatures |
| **managements** | Gestion | Visualizations |
| **settings** | Paramètres | SettingsPage |
| **documentation** | Documentation | DocumentationPage |
| **errors** | Pages d'erreur | 404, 401, 500 |

### Exemple : Dashboard Mensuel

```tsx
// features/dashboards/pages/MonthlyDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, PageWrapper } from '@components/layouts';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@components/ui';
import { RecoPerformanceTable } from '../components/RecoPerformanceTable';
import { ActiveRecoTable } from '../components/ActiveRecoTable';
import { TasksStateTable } from '../components/TasksStateTable';
import { MonthYearFilter, OrgUnitsFilter } from '@components/filters';
import { useDashboard } from '@contexts/useDashboard';
import { useStore } from '@store';
import { pageAnimations } from '@animations/page';
import styles from './MonthlyDashboard.module.css';

export default function MonthlyDashboard() {
  const { user } = useStore();
  const {
    performanceData,
    activeRecoData,
    tasksStateData,
    status,
    activeTab,
    setActiveTab,
    fetchAllMonthlyDashboards,
  } = useDashboard();

  // État des filtres
  const [filters, setFilters] = useState({
    months: [],
    year: new Date().getFullYear(),
    recos: [],
  });

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    if (filters.recos.length > 0) {
      fetchAllMonthlyDashboards(filters);
    }
  }, [filters, fetchAllMonthlyDashboards]);

  return (
    <motion.div
      variants={pageAnimations.fadeSlideUp}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageWrapper>
        <PageHeader
          title="Tableau de Bord Mensuel"
          subtitle="Performances et activités des RECO"
        />

        {/* Filtres */}
        <div className={styles.filtersContainer}>
          <MonthYearFilter
            value={{ months: filters.months, year: filters.year }}
            onChange={(value) => setFilters(prev => ({ ...prev, ...value }))}
          />
          <OrgUnitsFilter
            userOrgUnits={user?.recos || []}
            value={filters.recos}
            onChange={(recos) => setFilters(prev => ({ ...prev, recos }))}
          />
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab value="performances">Performances</Tab>
            <Tab value="active-reco">RECO Actifs</Tab>
            <Tab value="tasks-state">État des Tâches</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="performances">
              <RecoPerformanceTable
                data={performanceData}
                isLoading={status.RECOS_PERFORMANCES.isLoading}
              />
            </TabPanel>
            <TabPanel value="active-reco">
              <ActiveRecoTable
                data={activeRecoData}
                isLoading={status.ACTIVE_RECOS.isLoading}
              />
            </TabPanel>
            <TabPanel value="tasks-state">
              <TasksStateTable
                data={tasksStateData}
                isLoading={status.RECOS_TASKS_STATE.isLoading}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </PageWrapper>
    </motion.div>
  );
}
```

---

## 14. Animations avec Framer Motion

### Animations de Page

```typescript
// animations/page.ts
import type { Variants } from 'framer-motion';

// Animation de fondu avec glissement vers le haut
export const fadeSlideUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// Animation de fondu simple
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// Animation de mise à l'échelle
export const scale: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

export const pageAnimations = {
  fadeSlideUp,
  fade,
  scale,
};
```

### Animations de Liste

```typescript
// animations/list.ts
import type { Variants } from 'framer-motion';

// Conteneur qui orchestre l'animation des enfants
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Animation d'un élément de liste
export const listItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};
```

### Utilisation des Animations

```tsx
import { motion } from 'framer-motion';
import { pageAnimations, staggerContainer, listItem } from '@animations/index';

// Animation de page
function MyPage() {
  return (
    <motion.div
      variants={pageAnimations.fadeSlideUp}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <h1>Ma Page</h1>
    </motion.div>
  );
}

// Animation de liste
function MyList({ items }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {items.map(item => (
        <motion.li key={item.id} variants={listItem}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

---

## 15. Configuration du Projet

### Configuration Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@animations/index': path.resolve(__dirname, './src/animations'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },

  server: {
    port: 4200,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          animations: ['framer-motion'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
          utils: ['axios', 'date-fns', 'lodash'],
        },
      },
    },
  },
});
```

### Configuration TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@contexts/*": ["src/contexts/*"],
      "@services/*": ["src/services/*"],
      "@store/*": ["src/store/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@assets/*": ["src/assets/*"],
      "@animations/*": ["src/animations/*"],
      "@config/*": ["src/config/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Scripts npm

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 16. Glossaire pour Débutants

### Concepts React

| Terme | Définition |
|-------|------------|
| **Composant** | Bloc de construction réutilisable de l'interface utilisateur |
| **Props** | Propriétés passées à un composant (comme des paramètres) |
| **State** | Données internes d'un composant qui peuvent changer |
| **Hook** | Fonction spéciale qui permet d'utiliser les fonctionnalités React |
| **useState** | Hook pour gérer l'état local d'un composant |
| **useEffect** | Hook pour exécuter du code après le rendu |
| **useCallback** | Hook pour mémoriser une fonction |
| **useMemo** | Hook pour mémoriser une valeur calculée |
| **Context** | Permet de partager des données sans passer par les props |
| **Ref** | Référence directe à un élément DOM ou une valeur persistante |

### Concepts TypeScript

| Terme | Définition |
|-------|------------|
| **interface** | Définit la structure d'un objet |
| **type** | Alias pour un type (similaire à interface) |
| **generic `<T>`** | Type paramétré (comme les templates en C++) |
| **Partial`<T>`** | Rend toutes les propriétés optionnelles |
| **Pick`<T, K>`** | Sélectionne certaines propriétés |
| **Omit`<T, K>`** | Exclut certaines propriétés |
| **union type (`\|`)** | Un type peut être plusieurs types |
| **optional (`?`)** | Propriété facultative |
| **non-null assertion (`!`)** | Affirme qu'une valeur n'est pas null |

### Termes de l'Application

| Terme | Définition |
|-------|------------|
| **RECO** | Relais Communautaire - Agent de santé terrain |
| **CHW** | Community Health Worker - Superviseur des RECO |
| **DHIS2** | Système d'information sanitaire national |
| **Org Unit** | Unité organisationnelle (région, commune, hôpital...) |
| **Dashboard** | Tableau de bord avec indicateurs visuels |
| **Store** | Stockage centralisé de l'état de l'application |
| **Slice** | Partie du store dédiée à un domaine |
| **Mock** | Données de test simulant l'API |

### Patterns de Code

| Pattern | Description |
|---------|-------------|
| **Provider Pattern** | Composant qui fournit des données à ses enfants |
| **Container/Presentational** | Séparation logique/affichage |
| **Custom Hook** | Hook réutilisable avec logique métier |
| **Lazy Loading** | Chargement différé des composants |
| **Code Splitting** | Division du code en plusieurs fichiers |
| **CSS Modules** | Styles scopés (isolés) par composant |

---

## Ressources Complémentaires

### Documentation Officielle

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Router Documentation](https://reactrouter.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Recharts Documentation](https://recharts.org/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

### Tutoriels Recommandés

1. **React pour débutants** : Comprendre les composants, props et state
2. **TypeScript pour React** : Typer vos composants
3. **Gestion d'état avec Zustand** : Alternative simple à Redux
4. **React Router v6** : Navigation dans une SPA
5. **Formulaires avec react-hook-form** : Gestion performante des formulaires

---

## Conclusion

Cette application est construite sur une architecture moderne et modulaire :

1. **Séparation des préoccupations** : Chaque partie du code a un rôle spécifique
2. **Réutilisabilité** : Composants et hooks réutilisables
3. **Typage fort** : TypeScript pour éviter les erreurs
4. **État centralisé** : Zustand pour une gestion d'état simple
5. **Performance** : Lazy loading et code splitting
6. **UX soignée** : Animations fluides avec Framer Motion

### Pour Commencer à Contribuer

1. Comprendre la structure des fichiers
2. Étudier les composants UI de base (`src/components/ui`)
3. Analyser un hook personnalisé (`src/hooks`)
4. Suivre le flux d'authentification
5. Explorer une feature complète (ex: `src/pages/dashboards`)

### Commandes Utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Compiler pour la production
npm run build

# Vérifier les types TypeScript
npm run type-check

# Linter le code
npm run lint
```

---

*Documentation générée pour Kendeya Analytics - Webapp React*
