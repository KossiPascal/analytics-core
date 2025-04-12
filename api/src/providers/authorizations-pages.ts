import { Routes, UserRole } from "../entities/User";

export const _superuser = '_superuser';
export const _public = '_public';

export const can_view_reports = 'can_view_reports';
export const can_view_dashboards = 'can_view_dashboards';
export const can_manage_data = 'can_manage_data';
export const must_change_default_password = 'must_change_default_password';

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
export const can_update_password = 'can_update_password';
export const can_update_language = 'can_update_language';
export const can_view_notifications = 'can_view_notifications';



export const AUTHORIZATIONS_LIST: string[] = [
    can_view_reports,
    can_view_dashboards,
    can_logout,

    can_manage_data,
    must_change_default_password,

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
    can_update_password,
    can_update_language,
    can_view_notifications,
];


// export function roleAuthorizations(userAuthorizations:string[]){
//     const isSuperUser = userAuthorizations.includes(_superuser)
//     return {
//         isSuperUser: isSuperUser,
//         canUseOfflineMode: isSuperUser ? false : userAuthorizations.includes(can_use_offline_mode),
//         canViewReports: isSuperUser ? true : userAuthorizations.includes(can_view_reports),
//         canViewDashboards: isSuperUser ? true : userAuthorizations.includes(can_view_dashboards),
//         canManageData: isSuperUser ? true : userAuthorizations.includes(can_manage_data),
//         canCreateUser: isSuperUser ? true : userAuthorizations.includes(can_create_user),
//         canUpdateUser: isSuperUser ? true : userAuthorizations.includes(can_update_user),
//         canDeleteUser: isSuperUser ? true : userAuthorizations.includes(can_delete_user),
//         canCreateRole: isSuperUser ? true : userAuthorizations.includes(can_create_role),
//         canUpdateRole: isSuperUser ? true : userAuthorizations.includes(can_update_role),
//         canDeleteRole: isSuperUser ? true : userAuthorizations.includes(can_delete_role),
//         canLogout: isSuperUser ? true : userAuthorizations.includes(can_logout),
//         changeDefaultPassword: isSuperUser ? true : userAuthorizations.includes(must_change_default_password),
//         canValidateData: isSuperUser ? true : userAuthorizations.includes(can_validate_data),
//         canSendDataToDhis2: isSuperUser ? true : userAuthorizations.includes(can_send_data_to_dhis2),
//         canViewUsers: isSuperUser ? true : userAuthorizations.includes(can_view_users),
//         canViewRoles: isSuperUser ? true : userAuthorizations.includes(can_view_roles),

//         canDownloadData: isSuperUser ? true : userAuthorizations.includes(can_download_data),
//         canSendSms: isSuperUser ? true : userAuthorizations.includes(can_send_sms),
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
    const isSuperUser = combinedAuthorizations.includes('_superuser');
    return {
        isSuperUser,
        canUseOfflineMode: isSuperUser ? false : combinedAuthorizations.includes('can_use_offline_mode'),
        canViewReports: combinedAuthorizations.includes(can_view_reports) || isSuperUser,
        canViewDashboards: combinedAuthorizations.includes(can_view_dashboards) || isSuperUser,
        canManageData: combinedAuthorizations.includes(can_manage_data) || isSuperUser,
        canCreateUser: combinedAuthorizations.includes(can_create_user) || isSuperUser,
        canUpdateUser: combinedAuthorizations.includes(can_update_user) || isSuperUser,
        canDeleteUser: combinedAuthorizations.includes(can_delete_user) || isSuperUser,
        canCreateRole: combinedAuthorizations.includes(can_create_role) || isSuperUser,
        canUpdateRole: combinedAuthorizations.includes(can_update_role) || isSuperUser,
        canDeleteRole: combinedAuthorizations.includes(can_delete_role) || isSuperUser,
        canLogout: combinedAuthorizations.includes(can_logout) || isSuperUser,
        mustChangeDefaultPassword: combinedAuthorizations.includes(must_change_default_password) || isSuperUser,
        canValidateData: combinedAuthorizations.includes(can_validate_data) || isSuperUser,
        canSendDataToDhis2: combinedAuthorizations.includes(can_send_data_to_dhis2) || isSuperUser,
        canViewUsers: combinedAuthorizations.includes(can_view_users) || isSuperUser,
        canViewRoles: combinedAuthorizations.includes(can_view_roles) || isSuperUser,
        canDownloadData: combinedAuthorizations.includes(can_download_data) || isSuperUser,
        canSendSms: combinedAuthorizations.includes(can_send_sms) || isSuperUser,
        canUpdateProfile: combinedAuthorizations.includes(can_update_profile) || isSuperUser,
        canUpdatePassword: combinedAuthorizations.includes(can_update_password) || isSuperUser,
        canUpdateLanguage: combinedAuthorizations.includes(can_update_language) || isSuperUser,
        canViewNotifications: combinedAuthorizations.includes(can_view_notifications) || isSuperUser,
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