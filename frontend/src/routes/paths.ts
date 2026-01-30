/**
 * PATHS - Route patterns for React Router
 *
 * Inspired by Django's URL patterns, this file defines all route patterns
 * with support for dynamic parameters using :param syntax.
 *
 * Usage:
 * - Use PATHS for defining routes in the router
 * - Use ROUTES (from routes.ts) for navigation with parameters
 */

export const PATHS = {
  // ============================================
  // ROOT
  // ============================================
  HOME: '/',

  // ============================================
  // MENU GROUPS (for navigation structure only)
  // ============================================
  VISUALIZATION: '/visualization',

  // ============================================
  // QUERY BUILDER
  // ============================================
  QUERY_BUILDER: '/query-builder',

  // ============================================
  // AUTHENTICATION
  // ============================================
  AUTH: {
    LOGIN: '/auths/login',
    CHANGE_PASSWORD: '/auths/change-default-password',
    FORGOT_PASSWORD: '/auths/forgot-password',
    RESET_PASSWORD: '/auths/reset-password/:token',
  },

  // ============================================
  // DASHBOARDS
  // ============================================
  DASHBOARDS: {
    ROOT: '/dashboards',
    MONTHLY: '/dashboards/monthly',
    REALTIME: '/dashboards/realtime',
  },

  // ============================================
  // REPORTS
  // ============================================
  REPORTS: {
    ROOT: '/reports',
    DETAIL: '/reports/:reportId',
    BY_TYPE: '/reports/type/:type',
  },

  // ============================================
  // MAPS
  // ============================================
  MAPS: {
    ROOT: '/maps',
    REGION: '/maps/region/:regionId',
  },

  // ============================================
  // USERS
  // ============================================
  USERS: {
    ROOT: '/users',
    LIST: '/users/list',
    DETAIL: '/users/:userId',
    ORGANIZATIONS: '/users/organizations',
    ORGANIZATION_DETAIL: '/users/organizations/:orgId',
    PERMISSIONS: '/users/permissions',
    ROLES: '/users/roles',
    ROLE_DETAIL: '/users/roles/:roleId',
  },

  // ============================================
  // ADMINISTRATION
  // ============================================
  ADMIN: {
    ROOT: '/administration',
    SECTION: '/administration/:section',
  },

  // ============================================
  // MANAGEMENTS
  // ============================================
  MANAGEMENTS: {
    ROOT: '/managements',
    SECTION: '/managements/:section',
  },

  // ============================================
  // DOCUMENTATION
  // ============================================
  DOCUMENTATION: {
    ROOT: '/documentations',
    PAGE: '/documentations/:page',
  },

  // ============================================
  // SETTINGS
  // ============================================
  SETTINGS: {
    ROOT: '/settings',
    SECTION: '/settings/:section',
  },

  // ============================================
  // ERRORS
  // ============================================
  ERRORS: {
    UNAUTHORIZED: '/errors/401',
    NOT_FOUND: '/errors/404',
    SERVER_ERROR: '/errors/500',
  },
} as const;

// Type helper for extracting path values
export type PathValue = string;

// Flatten PATHS for easy iteration
export const getAllPaths = (): string[] => {
  const paths: string[] = [];

  const extractPaths = (obj: Record<string, unknown>, prefix = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        paths.push(value);
      } else if (typeof value === 'object' && value !== null) {
        extractPaths(value as Record<string, unknown>, `${prefix}${key}.`);
      }
    }
  };

  extractPaths(PATHS);
  return paths;
};
