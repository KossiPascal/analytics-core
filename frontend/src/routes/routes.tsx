import { Suspense, useEffect } from "react";
import { Home, FileText, Map, Users, Shield, BookOpen, Gauge, Activity, Eye, ChevronRight, User, Settings, LogOut, Smartphone, Mic } from 'lucide-react';
import { generateRouteConfig, generateNavItems, type RouteConfig, generateGridNavItems, RouteItem, NavItem, slugify } from './utils';
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SuspenseLoader } from "@components/loaders/SuspenseLoader/SuspenseLoader";
import { PAGES, ROUTES} from "./configs";
import { RouteAccess } from "./access";





// ################################################################

export const ROUTES_ITEMS: RouteItem[] = [
  {
    path: ROUTES.home(),
    component: PAGES.VisualizationHomePage,
    label: "Accueil - Visualisations",
    access: "authenticated",
    icon: <Home size={20} />,
    permissions:['_admin', '_superadmin']
  },

  // 
  
  {
    path: ROUTES.auth.login(),
    component: PAGES.LoginPage,
    label: "Connexion",
    icon: <Home size={20} />,
    permissions:['_admin', '_superadmin']
  },

  // Visualisation
  {
    label: 'Visualisation',
    path: ROUTES.visualization(),
    component: PAGES.VisualizationHomePage,
    icon: <Eye size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInTopNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
  },

  // Visualisation
  {
    label: 'Tableau de bord',
    path: ROUTES.dashboards.root(),
    icon: <Eye size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInTopNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
    children: [
      { path: ROUTES.dashboards.monthly(), label: 'Tableau de bord mensuel', component: PAGES.MonthlyDashboardPage, icon: <Gauge size={18} />,permissions:['_admin', '_superadmin'] },
      { path: ROUTES.dashboards.realtime(), label: 'Tableau de bord temps réel', component: PAGES.RealtimeDashboardPage, icon: <Activity size={18} />,permissions:['_admin', '_superadmin'] },
      // { path: ROUTES.reports.root(), label: 'Rapports', component: PAGES.ReportsPage, icon: <FileText size={18} />,permissions:['_admin', '_superadmin'] },
      // { path: ROUTES.maps.root(), label: 'Cartes', component: PAGES.MapsPage, icon: <Map size={18} />,permissions:['_admin', '_superadmin'] },
    ],
  },

  // Utilisateurs
  {
    label: 'Utilisateurs',
    path: ROUTES.users.list(),
    component: PAGES.IdentitiesPage,
    icon: <Users size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
  },
  {
    label: 'DataAssetsPage',
    path: ROUTES.dataassets.list(),
    component: PAGES.DataAssetsPage,
    icon: <Users size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
  },
  {
    label: 'Administration',
    path: ROUTES.admin.root(),
    icon: <Shield size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInTopNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
    children: [
      { path: ROUTES.admin.root(), component: PAGES.AdminPage, label: 'Configurations', icon: <Shield size={18} />, permissions:['_admin', '_superadmin'] },
      { path: ROUTES.admin.section('configurations'), component: PAGES.AdminPage, label: 'Configurations', icon: <Shield size={18} />, permissions:['_admin', '_superadmin'] },
      { path: ROUTES.admin.section('managements'), component: PAGES.AdminPage, label: 'Managements', icon: <Shield size={18} />, permissions:['_admin', '_superadmin'] },
    ],
  },

  // QUERY BUILDER
  {
    path: ROUTES.builder.root(),
    label: "Query Builder",
    access: "authenticated",
    icon: <Shield size={20} />,
    showInGridpNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
    children: [
      {label: "SQL Builder", path: ROUTES.builder.sqlBuilder(), component: PAGES.SqlBuilderPage, icon: <Shield size={20} />, permissions:['_admin', '_superadmin']},
      {label: "Query Builder", path: ROUTES.builder.queryBuilder(), component: PAGES.QueryBuilderPage, icon: <Shield size={20} />, permissions:['_admin', '_superadmin']},
      {label: "Dashboard Builder", path: ROUTES.builder.dashboardBuilder(), component: PAGES.DashboardBuilderPage, icon: <Shield size={20} />, permissions:['_admin', '_superadmin']},
      {label: "Custom Builder", path: ROUTES.builder.customBuilder(), component: PAGES.CustomBuilderPage, icon: <Shield size={20} />, permissions:['_admin', '_superadmin']},
    ]
  },

  // EQUIPMENT MANAGER
  {
    label: 'Gestion des Equipements',
    path: ROUTES.equipmentManager.root(),
    component: PAGES.EquipmentManagerPage,
    icon: <Smartphone size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInSideNav: true,
    permissions: ['_admin', '_superadmin'],
  },

  // MEETING INTELLIGENCE
  {
    label: 'Intelligence Réunion',
    path: ROUTES.meetingIntelligence.root(),
    component: PAGES.MeetingIntelligencePage,
    icon: <Mic size={20} />,
    access: "authenticated",
    showInGridpNav: true,
    showInSideNav: true,
    permissions: ['_admin', '_superadmin'],
  },

  // SETTINGS
  {
    path: ROUTES.settings.root(),
    component: PAGES.SettingsPage,
    label: "Paramètres",
    access: "authenticated",
    icon: <Shield size={20} />,
    showInGridpNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
  },

  {
    label: 'Documentation',
    path: ROUTES.documentation.root(),
    component: PAGES.DocumentationPage,
    isPublic: true,
    icon: <BookOpen size={20} />,
    showInGridpNav: true,
    showInSideNav: true,
    permissions:['_admin', '_superadmin'],
  },

  // ERRORS
  {
    path: ROUTES.errors.unauthorized(),
    component: PAGES.UnauthorizedPage,
    label: "Non autorisé",
    icon: <BookOpen size={20} />,
    permissions:['_admin', '_superadmin'],
    children: [
      { path: ROUTES.errors.unauthorized(), component: PAGES.UnauthorizedPage, label: "Non autorisé", icon: <BookOpen size={20} />, permissions:['_admin', '_superadmin'] },
      { path: ROUTES.errors.serverError(), component: PAGES.ServerErrorPage, label: "Erreur serveur", icon: <BookOpen size={20} />, permissions:['_admin', '_superadmin'] },
      { path: ROUTES.errors.notFound(), component: PAGES.NotFoundPage, label: "Page non trouvée", icon: <BookOpen size={20} />, permissions:['_admin', '_superadmin'] },
    ]
  },
];



export const getGridNavItems = (userPermissions: string[])=>generateGridNavItems(ROUTES_ITEMS, userPermissions);
export const getTopNavItems = (userPermissions: string[])=>generateNavItems(ROUTES_ITEMS, 'top', userPermissions);
export const getSideNavItems = (userPermissions: string[])=>generateNavItems(ROUTES_ITEMS, 'side', userPermissions);

// export const TOP_NAV_ITEMS: NavItem[] = generateNavItems(ROUTES_ITEMS, 'top');

// export const SIDE_NAV_ITEMS: NavItem[] = generateNavItems(ROUTES_ITEMS, 'side');

// export const GRID_NAV_ITEMS: NavItem[] = generateGridNavItems(ROUTES_ITEMS);

// export const MENU_ITEMS: NavItem[] = generateMenuItems(ROUTES_ITEMS);



const RouteElement: React.FC<{ config: RouteConfig }> = ({ config }) => {
  const Component = config.component;
  useEffect(() => {
    if (config.label) document.title = config.label;
  }, [config.label]);
  return (<RouteAccess access={config.access} permissions={config.permissions}><Component /></RouteAccess>);
}

// MAIN ROUTES
export const AppRoutes: React.FC = () => {
  const location = useLocation();
  const ROUTE_CONFIG: RouteConfig[] = generateRouteConfig(ROUTES_ITEMS);
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<SuspenseLoader />}>
        <Routes location={location} key={location.pathname}>
          {ROUTE_CONFIG.map((config) => {
            const path = config.allowSubRoutes ? `${config.path}/*` : config.path;
            return (<Route key={slugify(config.label)} path={path} element={<RouteElement config={config} />} />);
          })}

          {/* Catch-all */}
          <Route path="*" element={<PAGES.NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}


// Re-export needed items
export { ROUTES } from './configs';
export type { NavItem } from './utils';
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.home();
export const LOGIN_ROUTE = ROUTES.auth.login();
