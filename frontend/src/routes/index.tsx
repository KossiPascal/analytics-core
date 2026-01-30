/**
 * AppRoutes - Main routing component
 *
 * Uses centralized route configuration to generate routes dynamically.
 * Supports public, private, and guest-only routes with guards.
 */

import { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SuspenseLoader } from '@components/loaders';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { routeConfigs, redirectConfigs } from './config';
import type { RouteConfig } from './config';
import * as Pages from './lazy';

// ============================================
// ROUTE WRAPPER COMPONENTS
// ============================================

interface RouteWrapperProps {
  config: RouteConfig;
}

/**
 * Wraps route component with appropriate guard
 */
function RouteWrapper({ config }: RouteWrapperProps) {
  const Component = config.component;

  switch (config.guard) {
    case 'private':
      return (
        <PrivateRoute>
          <Component />
        </PrivateRoute>
      );

    case 'guest':
      // Guest routes are for unauthenticated users only (e.g., login)
      return (
        <PublicRoute>
          <Component />
        </PublicRoute>
      );

    case 'public':
    default:
      return <Component />;
  }
}

// ============================================
// ROUTE GENERATOR
// ============================================

/**
 * Generates Route elements from route configuration
 */
function generateRoutes(configs: RouteConfig[]) {
  return configs.map((config) => {
    const path = config.wildcard ? `${config.path}/*` : config.path;

    return (
      <Route
        key={config.name}
        path={path}
        element={<RouteWrapper config={config} />}
      />
    );
  });
}

/**
 * Generates redirect Route elements
 */
function generateRedirects() {
  return redirectConfigs.map(({ from, to }) => (
    <Route
      key={`redirect-${from}`}
      path={from}
      element={<Navigate to={to} replace />}
    />
  ));
}

// ============================================
// MAIN APP ROUTES COMPONENT
// ============================================

export function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<SuspenseLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Redirects */}
          {generateRedirects()}

          {/* Dynamic routes from configuration */}
          {generateRoutes(routeConfigs)}

          {/* Catch all - 404 */}
          <Route path="*" element={<Pages.NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

// ============================================
// RE-EXPORTS for convenient imports
// ============================================

export { PATHS } from './paths';
export { ROUTES, NAV_ITEMS, APP_MENU_ITEMS } from './routes';
export type { NavItem } from './routes';
export {
  routeConfigs,
  redirectConfigs,
  getRouteByName,
  getRouteByPath,
  getRoutesByGuard,
  DEFAULT_AUTHENTICATED_ROUTE,
  LOGIN_ROUTE,
  NOT_FOUND_ROUTE,
} from './config';
export type { RouteConfig, RouteGuard, RedirectConfig } from './config';
