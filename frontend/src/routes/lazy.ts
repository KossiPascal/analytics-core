import { lazy } from 'react';

// Home page
export const VisualizationHomePage = lazy(() => import('@features/home/pages/VisualizationHome'));

// Auth pages
export const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
export const ChangePasswordPage = lazy(() => import('@features/auth/pages/ChangePasswordPage'));

// Reports pages
export const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage'));

// Dashboard pages
export const MonthlyDashboardPage = lazy(() => import('@features/dashboards/pages/monthly/MonthlyDashboard'));
export const RealtimeDashboardPage = lazy(() => import('@features/dashboards/pages/realtime/RealtimeDashboard'));

// Maps page
export const MapsPage = lazy(() => import('@features/maps/pages/MapsPage'));

// Query Builder page
export const QueryBuilderPage = lazy(() => import('@features/query-builder/pages/QueryBuilderPage'));

// Users pages
export const UsersPage = lazy(() => import('@features/users/pages/UsersPage'));
export const OrganizationsPage = lazy(() => import('@features/users/pages/OrganizationsPage'));
export const PermissionsPage = lazy(() => import('@features/users/pages/PermissionsPage'));
export const RolesPage = lazy(() => import('@features/users/pages/RolesPage'));

// Admin pages
export const AdminPage = lazy(() => import('@features/admin/pages/AdminPage'));

// Managements page
export const ManagementsPage = lazy(() => import('@features/managements/pages/ManagementsPage'));

// Documentation page
export const DocumentationPage = lazy(() => import('@features/documentation/pages/DocumentationPage'));

// Settings page
export const SettingsPage = lazy(() => import('@features/settings/pages/SettingsPage'));

// Error pages
export const NotFoundPage = lazy(() => import('@features/errors/pages/NotFoundPage'));
export const ServerErrorPage = lazy(() => import('@features/errors/pages/ServerErrorPage'));
export const UnauthorizedPage = lazy(() => import('@features/errors/pages/UnauthorizedPage'));
