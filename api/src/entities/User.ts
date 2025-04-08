import * as jwt from 'jsonwebtoken';
import { Entity, Column, Repository, DataSource, PrimaryColumn, In } from "typeorm"
import { AppDataSource } from '../data-source';
import { notEmpty } from '../functions/functions';
import { GetRolesAndNamesPagesAuthorizations, Roles } from './Roles';
import { ROUTES_LIST, AUTHORIZATIONS_LIST, _admin, can_use_offline_mode } from '../providers/authorizations-pages';
import { COUNTRIES_CUSTOM_QUERY, REGIONS_CUSTOM_QUERY, PREFECTURES_CUSTOM_QUERY, COMMUNES_CUSTOM_QUERY, HOSPITALS_CUSTOM_QUERY, DISTRICTS_QUARTIERS_CUSTOM_QUERY, CHWS_CUSTOM_QUERY, VILLAGES_SECTEURS_CUSTOM_QUERY, RECOS_CUSTOM_QUERY } from '../controllers/ORGUNITS/org-units-custom';
import { SECRET_PRIVATE_KEY } from '../providers/constantes';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap, GetCountryMap, GetRegionsMap, GetPrefecturesMap, GetCommunesMap, GetHospitalsMap, GetDistrictQuartiersMap, GetVillageSecteursMap, GetChwsMap, GetRecosMap } from '../models/org-units/orgunits-map';

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

    @Column({ type: 'varchar', nullable: true })
    phone!: string | null

    @Column({ type: 'timestamp', nullable: true })
    email_verified_at!: Date;

    @Column({ type: 'varchar', nullable: true })
    remember_token!: string

    @Column({ type: 'text', nullable: true })
    password!: string

    @Column({ type: 'text', nullable: true })
    salt!: string

    @Column({ type: 'jsonb', nullable: true })
    roles!: number[]

    @Column({ type: 'text', nullable: true })
    token!: string

    @Column({ nullable: false, default: false })
    isActive!: boolean

    @Column({ nullable: false, default: false })
    isDeleted!: boolean

    @Column({ nullable: false, default: false })
    hasChangedPassword!: boolean

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

    @Column({ type: 'text', nullable: true })
    created_by!: Users

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date

    @Column({ type: 'text', nullable: true })
    updated_by!: Users
}

export async function getUsersRepository(): Promise<Repository<Users>> {
    return Connection.getRepository(Users);
}


export interface TokenUser {
    id: string
    username: string
    fullname: string
    email: string
    phone: string | null
    rolesIds?: number[]
    rolesNames?: string[]
    roles?: Roles[]
    routes: Routes[]
    authorizations: string[]
    countries?: CountryMap[]
    regions?: RegionsMap[]
    prefectures?: PrefecturesMap[]
    communes?: CommunesMap[]
    hospitals?: HospitalsMap[]
    districtQuartiers?: DistrictQuartiersMap[]
    villageSecteurs?: VillageSecteursMap[]
    chws?: ChwsMap[]
    recos?: RecosMap[]
}

export interface Routes {
    path: string;
    label: string
    authorizations: string[];
}

export interface UserRole {
    isAdmin: boolean,
    canUseOfflineMode: boolean,
    canViewReports: boolean,
    canViewDashboards: boolean,
    canManageData: boolean,
    canCreateUser: boolean,
    canUpdateUser: boolean,
    canDeleteUser: boolean,
    canCreateRole: boolean,
    canUpdateRole: boolean,
    canDeleteRole: boolean,
    changeDefaultPassword: boolean,
    canValidateData: boolean,
    canSendDataToDhis2: boolean,
    canViewUsers: boolean,
    canViewRoles: boolean,
    canDownloadData: boolean,
    canSendSms: boolean,
    canLogout: boolean,
    canUpdateProfile: boolean,
    canUpdateLanguage: boolean,
    canViewNotifications: boolean,
}

export interface FullRolesUtils {
    rolesObj: Roles[]
    rolesIds: number[]
    rolesNames: string[]
    routes: Routes[]
    authorizations: string[]
}

export async function jwSecretKey({ userId, user, userToken, isOfflineUser }: { userId?: string, user?: Users, userToken?: TokenUser, isOfflineUser?: boolean }): Promise<{ expiredIn: number, secretOrPrivateKey: string }> {
    isOfflineUser = isOfflineUser ?? false;

    if (userId || user) {
        if (userId) {
            const _repo = await getUsersRepository();
            const userF = await _repo.findOneBy({ id: userId });
            if (userF) user = userF;
        }

        if (user) {
            const data = await GetRolesAndNamesPagesAuthorizations(user.roles);
            isOfflineUser = (data?.authorizations ?? []).includes(can_use_offline_mode);
        }
    } else if (userToken) {
        isOfflineUser = userToken.authorizations.includes(can_use_offline_mode);
    }

    const offlinetimesecond = 60 * 60 * 24 * 366;
    const onlinetimesecond = 60 * 60;
    return {
        expiredIn: isOfflineUser ? offlinetimesecond : onlinetimesecond,
        secretOrPrivateKey: SECRET_PRIVATE_KEY,
    }
}

export async function userTokenGenerated(user: Users, param: { checkValidation?: boolean, outPutInitialRoles?: boolean, outPutOrgUnits?: boolean } = { checkValidation: true, outPutInitialRoles: false, outPutOrgUnits: false }): Promise<TokenUser | null> {

    const data = await GetRolesAndNamesPagesAuthorizations(user.roles);

    var rolesIds: number[] = data && notEmpty(data) ? data.rolesIds : [];
    var rolesNames: string[] = data && notEmpty(data) ? data.rolesNames : [];
    var roles: Roles[] = data && notEmpty(data) ? data.rolesObj : [];
    var routes: Routes[] = data && notEmpty(data) ? data.routes : [];
    var authorizations: string[] = data && notEmpty(data) ? data.authorizations : [];
    var isAdmin: boolean = data && notEmpty(data) ? (data.authorizations.includes(_admin)) : false;

    if (param.checkValidation === true && (!user.isActive || user.isDeleted || rolesIds.length == 0 && !isAdmin || routes.length == 0 && !isAdmin || authorizations.length == 0)) {
        return null;
    }

    const tokenUser: TokenUser = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        routes: isAdmin ? ROUTES_LIST : routes,
        authorizations: isAdmin ? [...AUTHORIZATIONS_LIST, _admin] : authorizations,

        countries: param.outPutOrgUnits === true ? (isAdmin !== true ? user.countries : (await COUNTRIES_CUSTOM_QUERY()).map(d => GetCountryMap(d))) : undefined,
        regions: param.outPutOrgUnits === true ? (isAdmin !== true ? user.regions : (await REGIONS_CUSTOM_QUERY()).map(d => GetRegionsMap(d))) : undefined,
        prefectures: param.outPutOrgUnits === true ? (isAdmin !== true ? user.prefectures : (await PREFECTURES_CUSTOM_QUERY()).map(d => GetPrefecturesMap(d))) : undefined,
        communes: param.outPutOrgUnits === true ? (isAdmin !== true ? user.communes : (await COMMUNES_CUSTOM_QUERY()).map(d => GetCommunesMap(d))) : undefined,
        hospitals: param.outPutOrgUnits === true ? (isAdmin !== true ? user.hospitals : (await HOSPITALS_CUSTOM_QUERY()).map(d => GetHospitalsMap(d))) : undefined,
        districtQuartiers: param.outPutOrgUnits === true ? (isAdmin !== true ? user.districtQuartiers : (await DISTRICTS_QUARTIERS_CUSTOM_QUERY()).map(d => GetDistrictQuartiersMap(d))) : undefined,
        villageSecteurs: param.outPutOrgUnits === true ? (isAdmin !== true ? user.villageSecteurs : (await VILLAGES_SECTEURS_CUSTOM_QUERY()).map(d => GetVillageSecteursMap(d))) : undefined,
        chws: param.outPutOrgUnits === true ? (isAdmin !== true ? user.chws : (await CHWS_CUSTOM_QUERY()).map(d => GetChwsMap(d))) : undefined,
        recos: param.outPutOrgUnits === true ? (isAdmin !== true ? user.recos : (await RECOS_CUSTOM_QUERY()).map(d => GetRecosMap(d))) : undefined,

        rolesIds: param.outPutInitialRoles === true ? rolesIds : undefined,
        rolesNames: param.outPutInitialRoles === true ? rolesNames : undefined,
        roles: param.outPutInitialRoles === true ? roles : undefined,

        // can_use_offline_mode: data && notEmpty(data) ? (isAdmin ? false : data.authorizations.includes(can_use_offline_mode)) : false,
        // can_view_reports: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_view_reports)) : false,
        // can_view_dashboards: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_view_dashboards)) : false,
        // can_manage_data: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_manage_data)) : false,
        // can_create_user: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_create_user)) : false,
        // can_update_user: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_update_user)) : false,
        // can_delete_user: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_delete_user)) : false,
        // can_create_role: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_create_role)) : false,
        // can_update_role: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_update_role)) : false,
        // can_delete_role: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_delete_role)) : false,
        // can_logout: data && notEmpty(data) ? (isAdmin ? true : data.authorizations.includes(can_logout)) : false,
    };

    // if (param.outPutInitialRoles === true) {
    //     const _repoRole = await getRolesRepository();
    //     var rolesList: Roles[] = await _repoRole.find({ where: { id: In(user.roles.map(r => parseInt(r))) } });
    //     tokenUser.roleIds = user.roles;
    //     tokenUser.roles = rolesList;
    // }

    return tokenUser;
}

export async function hashUserToken(user: TokenUser): Promise<string> {
    const secret = await jwSecretKey({ userToken: user });
    return jwt.sign(user, secret.secretOrPrivateKey, { expiresIn: secret.expiredIn });
}