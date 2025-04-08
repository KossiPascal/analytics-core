import { Routes, UserRole } from "../entities/User";

export const _admin = '_admin';
export const _public = '_public';

export const can_view_reports = 'can_view_reports';
export const can_view_dashboards = 'can_view_dashboards';
export const can_manage_data = 'can_manage_data';
export const change_default_password = 'change_default_password';

export const can_view_users = 'can_view_users';
export const can_create_user = 'can_create_user';
export const can_update_user = 'can_update_user';
export const can_delete_user = 'can_delete_user';

export const can_view_roles = 'can_view_roles';
export const can_create_role = 'can_create_role';
export const can_update_role = 'can_update_role';
export const can_delete_role = 'can_delete_role';

export const can_validate_data = 'can_validate_data';
export const can_send_data_to_dhis2 = 'can_send_data_to_dhis2';
export const can_use_offline_mode = 'can_use_offline_mode';

export const can_download_data = 'can_download_data';
export const can_send_sms = 'can_send_sms';

export const is_administration = 'is_administration';

export const can_logout = 'can_logout';
export const can_update_profile = 'can_update_profile';
export const can_update_language = 'can_update_language';
export const can_view_notifications = 'can_view_notifications';



export const AUTHORIZATIONS_LIST: string[] = [
    can_view_reports,
    can_view_dashboards,
    can_logout,

    can_manage_data,
    change_default_password,

    can_validate_data,
    can_send_data_to_dhis2,
    can_use_offline_mode,

    can_view_users,
    can_create_user,
    can_update_user,
    can_delete_user,

    can_view_roles,
    can_create_role,
    can_update_role,
    can_delete_role,

    can_download_data,
    can_send_sms,

    can_update_profile,
    can_update_language,
    can_view_notifications,
];


// export function roleAuthorizations(userAuthorizations:string[]){
//     const isAdmin = userAuthorizations.includes(_admin)
//     return {
//         isAdmin: isAdmin,
//         canUseOfflineMode: isAdmin ? false : userAuthorizations.includes(can_use_offline_mode),
//         canViewReports: isAdmin ? true : userAuthorizations.includes(can_view_reports),
//         canViewDashboards: isAdmin ? true : userAuthorizations.includes(can_view_dashboards),
//         canManageData: isAdmin ? true : userAuthorizations.includes(can_manage_data),
//         canCreateUser: isAdmin ? true : userAuthorizations.includes(can_create_user),
//         canUpdateUser: isAdmin ? true : userAuthorizations.includes(can_update_user),
//         canDeleteUser: isAdmin ? true : userAuthorizations.includes(can_delete_user),
//         canCreateRole: isAdmin ? true : userAuthorizations.includes(can_create_role),
//         canUpdateRole: isAdmin ? true : userAuthorizations.includes(can_update_role),
//         canDeleteRole: isAdmin ? true : userAuthorizations.includes(can_delete_role),
//         canLogout: isAdmin ? true : userAuthorizations.includes(can_logout),
//         changeDefaultPassword: isAdmin ? true : userAuthorizations.includes(change_default_password),
//         canValidateData: isAdmin ? true : userAuthorizations.includes(can_validate_data),
//         canSendDataToDhis2: isAdmin ? true : userAuthorizations.includes(can_send_data_to_dhis2),
//         canViewUsers: isAdmin ? true : userAuthorizations.includes(can_view_users),
//         canViewRoles: isAdmin ? true : userAuthorizations.includes(can_view_roles),

//         canDownloadData: isAdmin ? true : userAuthorizations.includes(can_download_data),
//         canSendSms: isAdmin ? true : userAuthorizations.includes(can_send_sms),
//     }
// }

export function roleAuthorizations(userAuthorizations: string[], routes: Routes[]): UserRole {
    const allAuthorizations: string[] = [];

    for (const route of routes) {
        if (route.authorizations && route.authorizations.length > 0) {
            for (const auth of route.authorizations) {
                if (!allAuthorizations.includes(auth)) {
                    allAuthorizations.push(auth);
                }
            }
        }
    }
    const combinedAuthorizations = Array.from(new Set([...userAuthorizations, ...allAuthorizations]));
    const isAdmin = combinedAuthorizations.includes('_admin');
    return {
        isAdmin,
        canUseOfflineMode: isAdmin ? false : combinedAuthorizations.includes('can_use_offline_mode'),
        canViewReports: combinedAuthorizations.includes(can_view_reports) || isAdmin,
        canViewDashboards: combinedAuthorizations.includes(can_view_dashboards) || isAdmin,
        canManageData: combinedAuthorizations.includes(can_manage_data) || isAdmin,
        canCreateUser: combinedAuthorizations.includes(can_create_user) || isAdmin,
        canUpdateUser: combinedAuthorizations.includes(can_update_user) || isAdmin,
        canDeleteUser: combinedAuthorizations.includes(can_delete_user) || isAdmin,
        canCreateRole: combinedAuthorizations.includes(can_create_role) || isAdmin,
        canUpdateRole: combinedAuthorizations.includes(can_update_role) || isAdmin,
        canDeleteRole: combinedAuthorizations.includes(can_delete_role) || isAdmin,
        canLogout: combinedAuthorizations.includes(can_logout) || isAdmin,
        changeDefaultPassword: combinedAuthorizations.includes(change_default_password) || isAdmin,
        canValidateData: combinedAuthorizations.includes(can_validate_data) || isAdmin,
        canSendDataToDhis2: combinedAuthorizations.includes(can_send_data_to_dhis2) || isAdmin,
        canViewUsers: combinedAuthorizations.includes(can_view_users) || isAdmin,
        canViewRoles: combinedAuthorizations.includes(can_view_roles) || isAdmin,
        canDownloadData: combinedAuthorizations.includes(can_download_data) || isAdmin,
        canSendSms: combinedAuthorizations.includes(can_send_sms) || isAdmin,
        canUpdateProfile: combinedAuthorizations.includes(can_update_profile) || isAdmin,
        canUpdateLanguage: combinedAuthorizations.includes(can_update_language) || isAdmin,
        canViewNotifications: combinedAuthorizations.includes(can_view_notifications) || isAdmin,
    };
}


export const dashboardsRoute = { path: "dashboards", label: 'DASHBOARDS', authorizations: [can_view_dashboards] };
export const reportsRoute = { path: "reports", label: "RAPPORTS", authorizations: [can_view_reports] };
export const usersRoute = { path: "users", label: 'USERS', authorizations: [_public, can_view_users] };
export const managementsRoute = { path: "managements", label: 'MANAGEMENT', authorizations: [can_manage_data] };
export const administrationRoute = { path: "administration", label: 'ADMINISTRATION', authorizations: [is_administration] };
export const documentationsRoute = { path: "documentations", label: 'Documentations', authorizations: [_public] };

export const ROUTES_LIST: Routes[] = [
    dashboardsRoute,
    reportsRoute,
    managementsRoute,
    usersRoute,
    administrationRoute,
    documentationsRoute
];