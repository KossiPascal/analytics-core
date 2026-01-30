/**
 * ROUTES - URL generation functions for navigation
 *
 * Inspired by Django's reverse() function, this file provides type-safe
 * URL generation with parameter substitution.
 *
 * Usage:
 * - import { ROUTES } from '@routes';
 * - navigate(ROUTES.users.detail('123'));
 * - <Link to={ROUTES.reports.byType('monthly')}>
 */

import { PATHS } from './paths';

// ============================================
// URL GENERATION HELPER
// ============================================

/**
 * Replaces route parameters with actual values
 * @param path - The path pattern with :param placeholders
 * @param params - Object with parameter values
 * @returns The resolved URL
 */
function buildUrl(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;

  let url = path;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

/**
 * Adds query parameters to a URL
 * @param path - The base path
 * @param query - Object with query parameters
 * @returns The URL with query string
 */
function withQuery(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

// ============================================
// ROUTES - Navigation helpers
// ============================================

export const ROUTES = {
  // ============================================
  // ROOT
  // ============================================
  home: () => PATHS.HOME,

  // ============================================
  // MENU GROUPS (for navigation structure only)
  // ============================================
  visualization: () => PATHS.VISUALIZATION,

  // ============================================
  // QUERY BUILDER
  // ============================================
  queryBuilder: () => PATHS.QUERY_BUILDER,

  // ============================================
  // AUTHENTICATION
  // ============================================
  auth: {
    login: (returnTo?: string) =>
      returnTo ? withQuery(PATHS.AUTH.LOGIN, { returnTo }) : PATHS.AUTH.LOGIN,
    changePassword: () => PATHS.AUTH.CHANGE_PASSWORD,
    forgotPassword: () => PATHS.AUTH.FORGOT_PASSWORD,
    resetPassword: (token: string) => buildUrl(PATHS.AUTH.RESET_PASSWORD, { token }),
  },

  // ============================================
  // DASHBOARDS
  // ============================================
  dashboards: {
    root: () => PATHS.DASHBOARDS.ROOT,
    monthly: () => PATHS.DASHBOARDS.MONTHLY,
    realtime: () => PATHS.DASHBOARDS.REALTIME,
  },

  // ============================================
  // REPORTS
  // ============================================
  reports: {
    root: () => PATHS.REPORTS.ROOT,
    detail: (reportId: string | number) => buildUrl(PATHS.REPORTS.DETAIL, { reportId }),
    byType: (type: string) => buildUrl(PATHS.REPORTS.BY_TYPE, { type }),
  },

  // ============================================
  // MAPS
  // ============================================
  maps: {
    root: () => PATHS.MAPS.ROOT,
    region: (regionId: string | number) => buildUrl(PATHS.MAPS.REGION, { regionId }),
  },

  // ============================================
  // USERS
  // ============================================
  users: {
    root: () => PATHS.USERS.ROOT,
    list: () => PATHS.USERS.LIST,
    detail: (userId: string | number) => buildUrl(PATHS.USERS.DETAIL, { userId }),
    organizations: () => PATHS.USERS.ORGANIZATIONS,
    organizationDetail: (orgId: string | number) =>
      buildUrl(PATHS.USERS.ORGANIZATION_DETAIL, { orgId }),
    permissions: () => PATHS.USERS.PERMISSIONS,
    roles: () => PATHS.USERS.ROLES,
    roleDetail: (roleId: string | number) => buildUrl(PATHS.USERS.ROLE_DETAIL, { roleId }),
  },

  // ============================================
  // ADMINISTRATION
  // ============================================
  admin: {
    root: () => PATHS.ADMIN.ROOT,
    section: (section: string) => buildUrl(PATHS.ADMIN.SECTION, { section }),
  },

  // ============================================
  // MANAGEMENTS
  // ============================================
  managements: {
    root: () => PATHS.MANAGEMENTS.ROOT,
    section: (section: string) => buildUrl(PATHS.MANAGEMENTS.SECTION, { section }),
  },

  // ============================================
  // DOCUMENTATION
  // ============================================
  documentation: {
    root: () => PATHS.DOCUMENTATION.ROOT,
    page: (page: string) => buildUrl(PATHS.DOCUMENTATION.PAGE, { page }),
  },

  // ============================================
  // SETTINGS
  // ============================================
  settings: {
    root: () => PATHS.SETTINGS.ROOT,
    section: (section: string) => buildUrl(PATHS.SETTINGS.SECTION, { section }),
  },

  // ============================================
  // ERRORS
  // ============================================
  errors: {
    unauthorized: () => PATHS.ERRORS.UNAUTHORIZED,
    notFound: () => PATHS.ERRORS.NOT_FOUND,
    serverError: () => PATHS.ERRORS.SERVER_ERROR,
  },
} as const;

// ============================================
// NAVIGATION ITEMS (for menus)
// ============================================

export interface NavItem {
  name: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
  requiredPermission?: string;
  isPublic?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: 'visualization',
    label: 'Visualisation',
    path: PATHS.VISUALIZATION,
    children: [
      {
        name: 'dashboards.monthly',
        label: 'Tableau de bord mensuel',
        path: ROUTES.dashboards.monthly(),
      },
      {
        name: 'dashboards.realtime',
        label: 'Tableau de bord temps réel',
        path: ROUTES.dashboards.realtime(),
      },
      {
        name: 'reports',
        label: 'Rapports',
        path: ROUTES.reports.root(),
      },
      {
        name: 'maps',
        label: 'Cartes',
        path: ROUTES.maps.root(),
      },
    ],
  },
  {
    name: 'users',
    label: 'Utilisateurs',
    path: ROUTES.users.root(),
    children: [
      {
        name: 'users.list',
        label: 'Liste',
        path: ROUTES.users.list(),
      },
      {
        name: 'users.organizations',
        label: 'Organisations',
        path: ROUTES.users.organizations(),
      },
      {
        name: 'users.permissions',
        label: 'Permissions',
        path: ROUTES.users.permissions(),
      },
      {
        name: 'users.roles',
        label: 'Rôles',
        path: ROUTES.users.roles(),
      },
    ],
  },
  {
    name: 'admin',
    label: 'Administration',
    path: ROUTES.admin.root(),
  },
  {
    name: 'documentation',
    label: 'Documentation',
    path: ROUTES.documentation.root(),
    isPublic: true,
  },
];

// App menu items (for quick access grid)
export const APP_MENU_ITEMS: NavItem[] = [
  {
    name: 'dashboards.monthly',
    label: 'Tableau de bord mensuel',
    path: ROUTES.dashboards.monthly(),
  },
  {
    name: 'dashboards.realtime',
    label: 'Tableau de bord temps réel',
    path: ROUTES.dashboards.realtime(),
  },
  {
    name: 'reports',
    label: 'Rapports',
    path: ROUTES.reports.root(),
  },
  {
    name: 'maps',
    label: 'Cartes',
    path: ROUTES.maps.root(),
  },
  {
    name: 'query-builder',
    label: 'Query Builder',
    path: ROUTES.queryBuilder(),
  },
  {
    name: 'users',
    label: 'Utilisateurs',
    path: ROUTES.users.list(),
  },
  {
    name: 'admin',
    label: 'Administration',
    path: ROUTES.admin.root(),
  },
  {
    name: 'documentation',
    label: 'Documentations',
    path: ROUTES.documentation.root(),
  },
];

// ============================================
// TYPE EXPORTS
// ============================================

export type Routes = typeof ROUTES;
