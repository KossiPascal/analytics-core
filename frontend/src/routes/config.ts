/**
 * Route Configuration
 *
 * Centralized route configuration with metadata for each route.
 * Includes information about authentication, permissions, and components.
 */

import { ComponentType, LazyExoticComponent } from 'react';
import { PATHS } from './paths';
import * as Pages from './lazy';

// ============================================
// TYPES
// ============================================

export type RouteGuard = 'public' | 'private' | 'guest';

export interface RouteConfig {
  /** Unique route name for identification */
  name: string;
  /** URL pattern (from PATHS) */
  path: string;
  /** Lazy-loaded page component */
  component: LazyExoticComponent<ComponentType<unknown>>;
  /** Route protection level */
  guard: RouteGuard;
  /** Route title for document.title */
  title?: string;
  /** Redirect to this path (for index routes) */
  redirectTo?: string;
  /** Required permission to access */
  permission?: string;
  /** Enable wildcard matching (adds /*) */
  wildcard?: boolean;
}

export interface RedirectConfig {
  /** Source path */
  from: string;
  /** Destination path */
  to: string;
}

// ============================================
// ROUTE DEFINITIONS
// ============================================

export const routeConfigs: RouteConfig[] = [
  // ----------------------------------------
  // Home (Visualization Dashboard)
  // ----------------------------------------
  {
    name: 'home',
    path: PATHS.HOME,
    component: Pages.VisualizationHomePage,
    guard: 'private',
    title: 'Accueil - Visualisations',
  },

  // ----------------------------------------
  // Authentication
  // ----------------------------------------
  {
    name: 'auth.login',
    path: PATHS.AUTH.LOGIN,
    component: Pages.LoginPage,
    guard: 'guest',
    title: 'Connexion',
  },
  {
    name: 'auth.changePassword',
    path: PATHS.AUTH.CHANGE_PASSWORD,
    component: Pages.ChangePasswordPage,
    guard: 'private',
    title: 'Changer le mot de passe',
  },

  // ----------------------------------------
  // Dashboards
  // ----------------------------------------
  {
    name: 'dashboards.monthly',
    path: PATHS.DASHBOARDS.MONTHLY,
    component: Pages.MonthlyDashboardPage,
    guard: 'private',
    title: 'Tableau de bord mensuel',
    wildcard: true,
  },
  {
    name: 'dashboards.realtime',
    path: PATHS.DASHBOARDS.REALTIME,
    component: Pages.RealtimeDashboardPage,
    guard: 'private',
    title: 'Tableau de bord temps réel',
    wildcard: true,
  },

  // ----------------------------------------
  // Reports
  // ----------------------------------------
  {
    name: 'reports',
    path: PATHS.REPORTS.ROOT,
    component: Pages.ReportsPage,
    guard: 'private',
    title: 'Rapports',
    wildcard: true,
  },

  // ----------------------------------------
  // Maps
  // ----------------------------------------
  {
    name: 'maps',
    path: PATHS.MAPS.ROOT,
    component: Pages.MapsPage,
    guard: 'private',
    title: 'Cartes',
    wildcard: true,
  },

  // ----------------------------------------
  // Query Builder
  // ----------------------------------------
  {
    name: 'query-builder',
    path: PATHS.QUERY_BUILDER,
    component: Pages.QueryBuilderPage,
    guard: 'private',
    title: 'Query Builder',
  },

  // ----------------------------------------
  // Users
  // ----------------------------------------
  {
    name: 'users.list',
    path: PATHS.USERS.LIST,
    component: Pages.UsersPage,
    guard: 'private',
    title: 'Utilisateurs',
  },
  {
    name: 'users.organizations',
    path: PATHS.USERS.ORGANIZATIONS,
    component: Pages.OrganizationsPage,
    guard: 'private',
    title: 'Organisations',
  },
  {
    name: 'users.permissions',
    path: PATHS.USERS.PERMISSIONS,
    component: Pages.PermissionsPage,
    guard: 'private',
    title: 'Permissions',
  },
  {
    name: 'users.roles',
    path: PATHS.USERS.ROLES,
    component: Pages.RolesPage,
    guard: 'private',
    title: 'Rôles',
  },

  // ----------------------------------------
  // Administration
  // ----------------------------------------
  {
    name: 'admin',
    path: PATHS.ADMIN.ROOT,
    component: Pages.AdminPage,
    guard: 'private',
    title: 'Administration',
    wildcard: true,
  },

  // ----------------------------------------
  // Managements
  // ----------------------------------------
  {
    name: 'managements',
    path: PATHS.MANAGEMENTS.ROOT,
    component: Pages.ManagementsPage,
    guard: 'private',
    title: 'Gestion',
    wildcard: true,
  },

  // ----------------------------------------
  // Documentation
  // ----------------------------------------
  {
    name: 'documentation',
    path: PATHS.DOCUMENTATION.ROOT,
    component: Pages.DocumentationPage,
    guard: 'public',
    title: 'Documentation',
    wildcard: true,
  },

  // ----------------------------------------
  // Settings
  // ----------------------------------------
  {
    name: 'settings',
    path: PATHS.SETTINGS.ROOT,
    component: Pages.SettingsPage,
    guard: 'private',
    title: 'Paramètres',
  },

  // ----------------------------------------
  // Error Pages
  // ----------------------------------------
  {
    name: 'errors.unauthorized',
    path: PATHS.ERRORS.UNAUTHORIZED,
    component: Pages.UnauthorizedPage,
    guard: 'public',
    title: 'Non autorisé',
  },
  {
    name: 'errors.serverError',
    path: PATHS.ERRORS.SERVER_ERROR,
    component: Pages.ServerErrorPage,
    guard: 'public',
    title: 'Erreur serveur',
  },
  {
    name: 'errors.notFound',
    path: PATHS.ERRORS.NOT_FOUND,
    component: Pages.NotFoundPage,
    guard: 'public',
    title: 'Page non trouvée',
  },
];

// ============================================
// REDIRECTS
// ============================================

export const redirectConfigs: RedirectConfig[] = [
  { from: PATHS.DASHBOARDS.ROOT, to: PATHS.DASHBOARDS.MONTHLY },
  { from: PATHS.USERS.ROOT, to: PATHS.USERS.LIST },
];

// ============================================
// HELPERS
// ============================================

/**
 * Get route config by name
 */
export function getRouteByName(name: string): RouteConfig | undefined {
  return routeConfigs.find((route) => route.name === name);
}

/**
 * Get route config by path
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return routeConfigs.find((route) => route.path === path);
}

/**
 * Get all routes by guard type
 */
export function getRoutesByGuard(guard: RouteGuard): RouteConfig[] {
  return routeConfigs.filter((route) => route.guard === guard);
}

/**
 * Default redirect path after login
 */
export const DEFAULT_AUTHENTICATED_ROUTE = PATHS.HOME;

/**
 * Login page path
 */
export const LOGIN_ROUTE = PATHS.AUTH.LOGIN;

/**
 * 404 page path
 */
export const NOT_FOUND_ROUTE = PATHS.ERRORS.NOT_FOUND;
