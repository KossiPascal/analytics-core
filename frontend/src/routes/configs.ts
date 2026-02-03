import { lazy } from 'react';
import { buildUrl, withQuery } from './utils';

export const PAGES = {

    // Home page
    VisualizationHomePage: lazy(() => import('@pages/visualizations/VisualizationHome')),

    // Auth pages
    LoginPage: lazy(() => import('@pages/auths/LoginPage')),
    ChangePasswordPage: lazy(() => import('@pages/auths/ChangePasswordPage')),

    // Dashboard pages
    MonthlyDashboardPage: lazy(() => import('@pages/dashboards/monthly/MonthlyDashboard')),
    RealtimeDashboardPage: lazy(() => import('@pages/dashboards/realtime/RealtimeDashboard')),

    // Reports pages
    ReportsPage: lazy(() => import('@pages/reports/ReportsPage')),

    // Maps page
    MapsPage: lazy(() => import('@pages/maps/MapsPage')),

    // Query Builder page
    SqlBuilderPage: lazy(() => import('@/pages/queries/SqlBuilder/SqlBuilderPage')) as any,
    QueryBuilderPage: lazy(() => import('@/pages/queries/QueryBuilder/QueryBuilderPage')) as any,

    // Users pages
    UsersPage: lazy(() => import('@pages/users/UsersPage')),

    // Admin pages
    AdminPage: lazy(() => import('@/pages/admins/AdminPage')),

    // Managements page
    ManagementsPage: lazy(() => import('@pages/managements/ManagementsPage')),

    // Documentation page
    DocumentationPage: lazy(() => import('@pages/documentation/DocumentationPage')),

    // Settings page
    SettingsPage: lazy(() => import('@pages/settings/SettingsPage')),

    // Error pages
    NotFoundPage: lazy(() => import('@pages/errors/NotFoundPage')),
    ServerErrorPage: lazy(() => import('@pages/errors/ServerErrorPage')),
    UnauthorizedPage: lazy(() => import('@pages/errors/UnauthorizedPage')),
}


const LOGIN_ROUTE = '/auths/login';

// ROUTES - Navigation helpers
export const ROUTES = {
    // ROOT
    home: () => '/',

    // MENU GROUPS (for navigation structure only)
    visualization: () => '/visualization',

    // QUERY BUILDER
    builder: {
        root: () => '/queries',
        sqlBuilder: () => '/sql-builder',
        queryBuilder: () => '/query-builder',
    },

    // AUTHENTICATION
    auth: {
        login: (returnTo?: string) => returnTo ? withQuery(LOGIN_ROUTE, { returnTo }) : LOGIN_ROUTE,
        changePassword: () => '/auths/change-default-password',
        forgotPassword: () => '/auths/forgot-password',
        resetPassword: (token: string) => buildUrl('/auths/reset-password/:token', { token }),
    },

    // DASHBOARDS
    dashboards: {
        root: () => '/dashboards',
        monthly: () => '/dashboards/monthly',
        realtime: () => '/dashboards/realtime',
        detail: (reportId: string | number) => buildUrl('/dashboards/:reportId', { reportId }),
        byType: (type: string) => buildUrl('/dashboards/type/:type', { type }),
    },
    // MAPS
    maps: {
        root: () => '/maps',
        region: (regionId: string | number) => buildUrl('/maps/region/:regionId', { regionId }),
    },

    // USERS
    users: {
        root: () => '/users',
        list: () => '/users/list',
        detail: (userId: string | number) => buildUrl('/users/:userId', { userId }),
        organizations: () => '/users/organizations',
        organizationDetail: (orgId: string | number) => buildUrl('/users/organizations/:orgId', { orgId }),
        permissions: () => '/users/permissions',
        roles: () => '/users/roles',
        roleDetail: (roleId: string | number) => buildUrl('/users/roles/:roleId', { roleId }),
    },

    // ADMINISTRATION
    admin: {
        root: () => '/administration',
        section: (section: string) => buildUrl('/administration/:section', { section }),
    },

    // MANAGEMENTS
    managements: {
        root: () => '/managements',
        section: (section: string) => buildUrl('/managements/:section', { section }),
    },

    // DOCUMENTATION
    documentation: {
        root: () => '/documentations',
        page: (page: string) => buildUrl('/documentations/:page', { page }),
    },

    // SETTINGS
    settings: {
        root: () => '/settings',
        section: (section: string) => buildUrl('/settings/:section', { section }),
    },

    // ERRORS
    errors: {
        unrecognized: () => '/errors/401',
        unauthorized: () => '/errors/403',
        notFound: () => '/errors/404',
        serverError: () => '/errors/500',
    },
} as const;
