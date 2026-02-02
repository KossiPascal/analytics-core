// routes.constants.ts
import { getGridNavItems, getTopNavItems, getSideNavItems, AppRoutes } from "./routes";
import { NavItem } from "./utils";
import { ROUTES } from "./configs";

// ================= HELPERS =================
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.home();
export const LOGIN_ROUTE = ROUTES.auth.login();
export const NOT_FOUND_ROUTE = ROUTES.errors.notFound();

// ================= RE-EXPORTS =================
export { ROUTES, getGridNavItems, getTopNavItems, getSideNavItems, AppRoutes, type NavItem };

// export type Routes = typeof ROUTES;


