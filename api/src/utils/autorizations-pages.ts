import { Routes } from "./Interfaces";

export const AUTORISATIONS_LIST:string[] = [
    'can_use_offline_mode',
    'can_view_reports',
    'can_view_dashboards',
    'can_manage_data',
    'can_logout',

    'can_validate_data',
    'can_send_data_to_dhis2',

    'can_create_user',
    'can_update_user',
    'can_delete_user',

    'can_create_role',
    'can_update_role',
    'can_delete_role',
];

export const ROUTES_LIST: Routes[] = [
    { path: "admin/users", label: 'Users', group: "ADMINISTRATION", autorisations: ["_admin", "can_create_user", "can_update_user", "can_delete_user"] },
    { path: "admin/roles", label: 'Roles', group: "ADMINISTRATION", autorisations: ["_admin", "can_create_role", "can_update_role", "can_delete_role"] },
    { path: "admin/api-access", label: 'API ACCESS', group: "ADMINISTRATION", autorisations: ["_admin"] },
    { path: "admin/delete-couchdb-data", label: 'Delete Couchdb Data', group: "ADMINISTRATION", autorisations: ["_admin"] },
    { path: "admin/truncate-database", label: 'Truncate Database', group: "ADMINISTRATION", autorisations: ["_admin"] },
    { path: "admin/documentations", label: 'Documentations', group: "ADMINISTRATION", autorisations: ["_admin"] },

    { path: "manages/sync-calculate-all-data", label: 'Sync Calculate All Data', group: "MANAGEMENT", autorisations: ["_admin", 'can_manage_data'] },
    { path: "manages/sync-to-dhis2", label: 'Sync To Dhis2', group: "MANAGEMENT", autorisations: ["_admin"] },

    { path: "dashboards/reco-vaccination-dashboard", label: 'Vaccination des enfants', group: "DASHBOARDS", autorisations: ["_admin", "can_view_dashboards", "can_use_offline_mode"] },
    { path: "dashboards/reco-performance-dashboard", label: 'Performance des Reco', group: "DASHBOARDS", autorisations: ["_admin", "can_view_dashboards", "can_use_offline_mode"] },

    { path: "reports/promotion", label: "PROMOTIONS", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "PROMOTION REPORTS"
    { path: "reports/family-planning", label: "PLANIFICATION FAMILIALE", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "FAMILY PLANNING REPORTS"
    { path: "reports/morbidity", label: "MORBIDITÉ", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "MALARIA MORBIDITY REPORTS"
    { path: "reports/pcimne", label: "RAPPORT PCIMNE", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "PCIME REPORTS"
    { path: "reports/chw-reco-activity", label: "RAPPORT MENSUEL D'ACTIVITÉ", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "CHWS_RECO REPORTS"
    { path: "reports/household-recap", label: "RÉCAP DES MÉNAGES", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "RÉCAP DES MÉNAGES"
    { path: "reports/reco-meg-situation", label: "GESTION MEDICAMENTS RECO", group: 'RAPPORTS', autorisations: ["_admin", "can_view_reports", "can_use_offline_mode"] }, // "GESTION MEDICAMENTS RECO"
];