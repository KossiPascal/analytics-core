import * as jwt from 'jsonwebtoken';
import { Entity, Column, Repository, DataSource, PrimaryColumn, In } from "typeorm"
import { AppDataSource } from '../data_source';
import { notEmpty } from '../utils/functions';
import { Routes, TokenUser } from '../utils/Interfaces';
import { GetRolesAndNamesPagesAutorizations, Roles, getRolesRepository } from './Roles';
import { ROUTES_LIST, AUTORISATIONS_LIST } from '../utils/autorizations-pages';
import { COUNTRIES_CUSTOM_QUERY, REGIONS_CUSTOM_QUERY, PREFECTURES_CUSTOM_QUERY, COMMUNES_CUSTOM_QUERY, HOSPITALS_CUSTOM_QUERY, DISTRICTS_QUARTIERS_CUSTOM_QUERY, CHWS_CUSTOM_QUERY, VILLAGES_SECTEURS_CUSTOM_QUERY, RECOS_CUSTOM_QUERY, FAMILIES_CUSTOM_QUERY, PATIENTS_CUSTOM_QUERY } from '../controllers/orgunit-query/org-units-custom';
import { ChwsMap, CommunesMap, CountryMap, DistrictQuartiersMap, GetChwsMap, GetCommunesMap, GetCountryMap, GetDistrictQuartiersMap, GetHospitalsMap, GetPrefecturesMap, GetRecosMap, GetRegionsMap, GetVillageSecteursMap, HospitalsMap, PrefecturesMap, RecosMap, RegionsMap, VillageSecteursMap } from '../utils/org-unit-interface';

let Connection: DataSource = AppDataSource.manager.connection;

@Entity("user", {
    orderBy: {
        username: "ASC",
        id: "DESC"
    }
})
export class Users {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ unique: true, type: 'varchar', nullable: false })
    username!: string

    @Column({ nullable: true })
    fullname!: string

    @Column({ type: 'varchar', nullable: true })
    email!: string

    @Column({ type: 'timestamp', nullable: true })
    email_verified_at!: Date;

    @Column({ type: 'varchar', nullable: true })
    remember_token!: string

    @Column({ type: 'text', nullable: true })
    password!: string

    @Column({ type: 'text', nullable: true })
    salt!: string

    @Column({ type: 'jsonb', nullable: true })
    roles!: string[]

    @Column({ type: 'text', nullable: true })
    token!: string

    @Column({ nullable: false, default: false })
    isActive!: boolean

    @Column({ nullable: false, default: false })
    isDeleted!: boolean

    @Column({ nullable: false, default: false })
    mustLogin!: boolean

    @Column({ type: 'jsonb', nullable: true })
    countries!: CountryMap[]

    @Column({ type: 'jsonb', nullable: true })
    regions!: RegionsMap[]

    @Column({ type: 'jsonb', nullable: true })
    prefectures!: PrefecturesMap[]

    @Column({ type: 'jsonb', nullable: true })
    communes!: CommunesMap[]

    @Column({ type: 'jsonb', nullable: true })
    hospitals!: HospitalsMap[]

    @Column({ type: 'jsonb', nullable: true })
    districtQuartiers!: DistrictQuartiersMap[]

    @Column({ type: 'jsonb', nullable: true })
    villageSecteurs!: VillageSecteursMap[]

    @Column({ type: 'jsonb', nullable: true })
    chws!: ChwsMap[]

    @Column({ type: 'jsonb', nullable: true })
    recos!: RecosMap[]

    @Column({ type: 'timestamp', nullable: true })
    deletedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date
}

export async function getUsersRepository(): Promise<Repository<Users>> {
    return Connection.getRepository(Users);
}

export async function jwSecretKey(data: { userId?: string, user?: Users }): Promise<{ expiredIn: number, secretOrPrivateKey: string }> {
    const second1 = 1000 * 60 * 60 * 24 * 366;
    const second2 = 1000 * 60 * 60 * 12;
    return {
        expiredIn: second2,
        secretOrPrivateKey: 'Kossi-TSOLEGNAGBO-secretfortoken',
    }
}

export async function userToken(user: Users, param: { hashToken?: boolean, checkValidation?: boolean, outPutInitialRoles?: boolean, outPutOrgUnits?: boolean } = { hashToken: true, checkValidation: true, outPutInitialRoles: false, outPutOrgUnits: false }): Promise<TokenUser | string | null> {
    const secret = await jwSecretKey({ user: user });
    var roleIds: string[] = [];
    var roles: Roles[] = [];
    var routes: Routes[] = [];
    var default_routes: Routes[] = [];
    var autorizations: string[] = [];
    var isAdmin: boolean = false;
    var can_use_offline_mode: boolean = false;
    var can_view_reports: boolean = false;
    var can_view_dashboards: boolean = false;
    var can_manage_data: boolean = false;
    var can_create_user: boolean = false;
    var can_update_user: boolean = false;
    var can_delete_user: boolean = false;
    var can_create_role: boolean = false;
    var can_update_role: boolean = false;
    var can_delete_role: boolean = false;
    var can_logout: boolean = false;

    

    const data = await GetRolesAndNamesPagesAutorizations(user.roles);

    if (data && notEmpty(data)) {
        roleIds = data.roles;
        roles = data.rolesObj;
        autorizations = data.autorizations;
        isAdmin = data.autorizations.includes('_admin');
        can_use_offline_mode = isAdmin ? false : data.autorizations.includes('can_use_offline_mode');
        can_view_reports = isAdmin ? true : data.autorizations.includes('can_view_reports');
        can_view_dashboards = isAdmin ? true : data.autorizations.includes('can_view_dashboards');
        can_manage_data = isAdmin ? true : data.autorizations.includes('can_manage_data');
        can_create_user = isAdmin ? true : data.autorizations.includes('can_create_user');
        can_update_user = isAdmin ? true : data.autorizations.includes('can_update_user');
        can_delete_user = isAdmin ? true : data.autorizations.includes('can_delete_user');
        can_create_role = isAdmin ? true : data.autorizations.includes('can_create_role');
        can_update_role = isAdmin ? true : data.autorizations.includes('can_update_role');
        can_delete_role = isAdmin ? true : data.autorizations.includes('can_delete_role');
        can_logout = isAdmin ? true : data.autorizations.includes('can_logout');

        routes = data.routes;
        default_routes = data.default_routes;
    }
    
    if (param.checkValidation === true) {
        if (!user.isActive || user.isDeleted || roleIds.length == 0 && !isAdmin || routes.length == 0 && !isAdmin || autorizations.length == 0) {
            return null;
        }
    }

    const tokenUser: TokenUser = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        isAdmin: isAdmin,
        can_use_offline_mode: can_use_offline_mode,
        can_view_reports: can_view_reports,
        can_view_dashboards: can_view_dashboards,
        can_manage_data: can_manage_data,
        can_create_user: can_create_user,
        can_update_user: can_update_user,
        can_delete_user: can_delete_user,
        can_create_role: can_create_role,
        can_update_role: can_update_role,
        can_delete_role: can_delete_role,
        can_logout: can_logout,
        routes: isAdmin ? ROUTES_LIST : routes,
        default_route: isAdmin ? routes[0] : default_routes[0],
        autorizations: isAdmin ? AUTORISATIONS_LIST : autorizations,
        // roleIds: roleIds,
        // roles: roles,
        // countries: countries,
        // regions: regions,
        // prefectures: prefectures,
        // communes: communes,
        // hospitals: hospitals,
        // districtQuartiers: districtQuartiers,
        // villageSecteurs: villageSecteurs,
        // chws: chws,
        // recos: recos
    };

    if (param.outPutOrgUnits === true) {
        tokenUser.countries = isAdmin !== true ? user.countries : (await COUNTRIES_CUSTOM_QUERY()).map(d => GetCountryMap(d));
        tokenUser.regions = isAdmin !== true ? user.regions : (await REGIONS_CUSTOM_QUERY()).map(d => GetRegionsMap(d));
        tokenUser.prefectures = isAdmin !== true ? user.prefectures : (await PREFECTURES_CUSTOM_QUERY()).map(d => GetPrefecturesMap(d));
        tokenUser.communes = isAdmin !== true ? user.communes : (await COMMUNES_CUSTOM_QUERY()).map(d => GetCommunesMap(d));
        tokenUser.hospitals = isAdmin !== true ? user.hospitals : (await HOSPITALS_CUSTOM_QUERY()).map(d => GetHospitalsMap(d));
        tokenUser.districtQuartiers = isAdmin !== true ? user.districtQuartiers : (await DISTRICTS_QUARTIERS_CUSTOM_QUERY()).map(d => GetDistrictQuartiersMap(d));
        tokenUser.villageSecteurs = isAdmin !== true ? user.villageSecteurs : (await VILLAGES_SECTEURS_CUSTOM_QUERY()).map(d => GetVillageSecteursMap(d));
        tokenUser.chws = isAdmin !== true ? user.chws : (await CHWS_CUSTOM_QUERY()).map(d => GetChwsMap(d));
        tokenUser.recos = isAdmin !== true ? user.recos : (await RECOS_CUSTOM_QUERY()).map(d => GetRecosMap(d));
        // FAMILIES_CUSTOM_QUERY();
        // PATIENTS_CUSTOM_QUERY();
    }

    if (param.outPutInitialRoles === true) {
        const _repoRole = await getRolesRepository();
        var rolesList: Roles[] = await _repoRole.find({ where: { id: In(user.roles.map(r => parseInt(r))) } });
        tokenUser.roleIds = user.roles;
        tokenUser.roles = rolesList;
    }

    if (param.hashToken === true) {
        return jwt.sign(
            tokenUser,
            secret.secretOrPrivateKey,
            { expiresIn: `${secret.expiredIn}s` }
        );
    }
    return tokenUser;

}
