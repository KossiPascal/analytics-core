import * as jwt from 'jsonwebtoken';
import { Entity, Column, Repository, DataSource, PrimaryColumn, In } from "typeorm"
import { AppDataSource } from '../data_source';
import { notEmpty } from '../utils/functions';
import { ChwCoustomQuery, CommuneCoustomQuery, CountryCoustomQuery, DistrictQuartierCoustomQuery, HospitalCoustomQuery, PrefectureCoustomQuery, RecoCoustomQuery, RegionCoustomQuery, Routes, TokenUser, VillageSecteurCoustomQuery } from '../utils/Interfaces';
import { GetRolesAndNamesPagesAutorizations, Roles, getRolesRepository } from './Roles';
import { ROUTES_LIST, AUTORISATIONS_LIST } from '../utils/autorizations-pages';
import { COUNTRIES_COUSTOM_QUERY, REGIONS_COUSTOM_QUERY, PREFECTURES_COUSTOM_QUERY, COMMUNES_COUSTOM_QUERY, HOSPITALS_COUSTOM_QUERY, DISTRICTS_QUARTIERS_COUSTOM_QUERY, CHWS_COUSTOM_QUERY, VILLAGES_SECTEURS_COUSTOM_QUERY, RECOS_COUSTOM_QUERY, FAMILIES_COUSTOM_QUERY, PATIENTS_COUSTOM_QUERY } from '../controllers/orgunit-query/org-units-coustom';

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
    countries!: CountryCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    regions!: RegionCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    prefectures!: PrefectureCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    communes!: CommuneCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    hospitals!: HospitalCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    districtQuartiers!: DistrictQuartierCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    villageSecteurs!: VillageSecteurCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    chws!: ChwCoustomQuery[]

    @Column({ type: 'jsonb', nullable: true })
    recos!: RecoCoustomQuery[]

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
    var isOnlyOnlineUser: boolean = true;

    const data = await GetRolesAndNamesPagesAutorizations(user.roles);

    if (data && notEmpty(data)) {
        roleIds = data.roles;
        roles = data.rolesObj;
        autorizations = data.autorizations;
        isAdmin = data.autorizations.includes('_admin');
        isOnlyOnlineUser = isAdmin ? true : !data.autorizations.includes('can_use_offline_mode');
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
        isOnlyOnlineUser: isOnlyOnlineUser,
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
        tokenUser.countries = isAdmin !== true ? user.countries : await COUNTRIES_COUSTOM_QUERY();
        tokenUser.regions = isAdmin !== true ? user.regions : await REGIONS_COUSTOM_QUERY();
        tokenUser.prefectures = isAdmin !== true ? user.prefectures : await PREFECTURES_COUSTOM_QUERY();
        tokenUser.communes = isAdmin !== true ? user.communes : await COMMUNES_COUSTOM_QUERY();
        tokenUser.hospitals = isAdmin !== true ? user.hospitals : await HOSPITALS_COUSTOM_QUERY();
        tokenUser.districtQuartiers = isAdmin !== true ? user.districtQuartiers : await DISTRICTS_QUARTIERS_COUSTOM_QUERY();
        tokenUser.villageSecteurs = isAdmin !== true ? user.villageSecteurs : await VILLAGES_SECTEURS_COUSTOM_QUERY();
        tokenUser.chws = isAdmin !== true ? user.chws : await CHWS_COUSTOM_QUERY();
        tokenUser.recos = isAdmin !== true ? user.recos : await RECOS_COUSTOM_QUERY();
        // FAMILIES_COUSTOM_QUERY();
        // PATIENTS_COUSTOM_QUERY();
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
