import * as jwt from 'jsonwebtoken';
import { Entity, Column, Repository, DataSource, PrimaryColumn, In } from "typeorm"
import { AppDataSource } from '../data-source';
import { notEmpty } from '../functions/functions';
import { GetRolesAndNamesPagesAuthorizations, Roles } from './Roles';
import { ROUTES_LIST, AUTHORIZATIONS_LIST, _superuser, can_use_offline_mode, roleAuthorizations } from '../providers/authorizations-pages';
import { COUNTRIES_CUSTOM_QUERY, REGIONS_CUSTOM_QUERY, PREFECTURES_CUSTOM_QUERY, COMMUNES_CUSTOM_QUERY, HOSPITALS_CUSTOM_QUERY, DISTRICTS_QUARTIERS_CUSTOM_QUERY, CHWS_CUSTOM_QUERY, VILLAGES_SECTEURS_CUSTOM_QUERY, RECOS_CUSTOM_QUERY } from '../controllers/ORGUNITS/org-units-custom';
import { SECRET_PRIVATE_KEY } from '../providers/constantes';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap, GetCountryMap, GetRegionsMap, GetPrefecturesMap, GetCommunesMap, GetHospitalsMap, GetDistrictQuartiersMap, GetVillageSecteursMap, GetChwsMap, GetRecosMap } from '../models/org-units/orgunits-map';
import { ChwCustomQuery, CommuneCustomQuery, CountryCustomQuery, DistrictQuartierCustomQuery, HospitalCustomQuery, PrefectureCustomQuery, RecoCustomQuery, RegionCustomQuery, VillageSecteurCustomQuery } from '../models/org-units/orgunits-query';

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

export interface SelectedUserOrgUnitsAndContact {
    countries: CountryMap[]
    regions: RegionsMap[]
    prefectures: PrefecturesMap[]
    communes: CommunesMap[]
    hospitals: HospitalsMap[]
    districtQuartiers: DistrictQuartiersMap[]
    villageSecteurs: VillageSecteursMap[]
    chws: ChwsMap[]
    recos: RecosMap[]
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
    isSuperUser: boolean,
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
    canValidateData: boolean,
    canSendDataToDhis2: boolean,
    canViewUsers: boolean,
    canViewRoles: boolean,
    canDownloadData: boolean,
    canSendSms: boolean,
    canLogout: boolean,
    canUpdateProfile: boolean,
    canUpdatePassword: boolean,
    canUpdateLanguage: boolean,
    canViewNotifications: boolean,
    mustChangeDefaultPassword: boolean,
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
    var isSuperUser: boolean = data && notEmpty(data) ? (data.authorizations.includes(_superuser)) : false;

    if (param.checkValidation === true && (!user.isActive || user.isDeleted || rolesIds.length == 0 && !isSuperUser || routes.length == 0 && !isSuperUser || authorizations.length == 0)) {
        return null;
    }

    const tokenUser: TokenUser = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        routes: isSuperUser ? ROUTES_LIST : routes,
        authorizations: isSuperUser ? [...AUTHORIZATIONS_LIST, _superuser] : authorizations,
        rolesIds: param.outPutInitialRoles === true ? rolesIds : undefined,
        rolesNames: param.outPutInitialRoles === true ? rolesNames : undefined,
        roles: param.outPutInitialRoles === true ? roles : undefined,
    };

    if (param.outPutOrgUnits === true) {
        const orgUnits = await generateSelectedUserOrgUnitsAndContact({tokenUser:tokenUser, isSuperUser:isSuperUser, recos: user.recos});
        if (orgUnits) {
            tokenUser.countries = orgUnits.countries;
            tokenUser.regions = orgUnits.regions;
            tokenUser.prefectures = orgUnits.prefectures;
            tokenUser.communes = orgUnits.communes;
            tokenUser.hospitals = orgUnits.hospitals;
            tokenUser.districtQuartiers = orgUnits.districtQuartiers;
            tokenUser.villageSecteurs = orgUnits.villageSecteurs;
            tokenUser.chws = orgUnits.chws;
            tokenUser.recos = orgUnits.recos;
        }
    }

    return tokenUser;
}

export async function generateSelectedUserOrgUnitsAndContact({recos, tokenUser, isSuperUser }:{recos: RecosMap[], tokenUser?: TokenUser, isSuperUser?:boolean}): Promise<SelectedUserOrgUnitsAndContact|undefined> {
    
    if (isSuperUser !== false && isSuperUser != true) {
        if (!tokenUser) return;
        const role = roleAuthorizations(tokenUser.authorizations ?? [], tokenUser.routes ?? []);
        isSuperUser = role.isSuperUser;
    }
    
    const allCountries = await COUNTRIES_CUSTOM_QUERY();
    const allRegions = await REGIONS_CUSTOM_QUERY();
    const allPrefectures = await PREFECTURES_CUSTOM_QUERY();
    const allCommunes = await COMMUNES_CUSTOM_QUERY();
    const allHospitals = await HOSPITALS_CUSTOM_QUERY();
    const allDistrictQuartiers = await DISTRICTS_QUARTIERS_CUSTOM_QUERY();
    const allVillageSecteursd = await VILLAGES_SECTEURS_CUSTOM_QUERY();
    const allChws = await CHWS_CUSTOM_QUERY();
    const allRecos = await RECOS_CUSTOM_QUERY();

    let countriesQuery:CountryCustomQuery[] = [];
    let regionsQuery:RegionCustomQuery[] = [];
    let prefecturesQuery:PrefectureCustomQuery[] = [];
    let communesQuery:CommuneCustomQuery[] = [];
    let hospitalsQuery:HospitalCustomQuery[] = [];
    let districtQuartiersQuery:DistrictQuartierCustomQuery[] = [];
    let villageSecteursQuery:VillageSecteurCustomQuery[] = [];
    let chwsQuery:ChwCustomQuery[] = [];
    let recosQuery:RecoCustomQuery[] = [];

    if (isSuperUser !== true) {
        const countriesIds = recos ? [...new Set(recos.map(r => r.country_id))] : [];
        const regionsIds = recos ? [...new Set(recos.map(r => r.region_id))] : [];
        const prefecturesIds = recos ? [...new Set(recos.map(r => r.prefecture_id))] : [];
        const communesIds = recos ? [...new Set(recos.map(r => r.commune_id))] : [];
        const hospitalsIds = recos ? [...new Set(recos.map(r => r.hospital_id))] : [];
        const districtQuartiersIds = recos ? [...new Set(recos.map(r => r.district_quartier_id))] : [];
        const villageSecteursIds = recos ? [...new Set(recos.map(r => r.village_secteur_id))] : [];
        const recosIds = recos ? [...new Set(recos.map(r => r.id))] : [];
    
        countriesQuery = countriesIds.length > 0 ? allCountries.filter(r=>r.id && countriesIds.includes(r.id)) : [];
        regionsQuery = regionsIds.length > 0 ? allRegions.filter(r=>r.id && regionsIds.includes(r.id)) : [];
        prefecturesQuery = prefecturesIds.length > 0 ? allPrefectures.filter(r=>r.id && prefecturesIds.includes(r.id)) : [];
        communesQuery = communesIds.length > 0 ? allCommunes.filter(r=>r.id && communesIds.includes(r.id)) : [];
        hospitalsQuery = hospitalsIds.length > 0 ? allHospitals.filter(r=>r.id && hospitalsIds.includes(r.id)) : [];
        districtQuartiersQuery = districtQuartiersIds.length > 0 ? allDistrictQuartiers.filter(r=>r.id && districtQuartiersIds.includes(r.id)) : [];
        villageSecteursQuery = villageSecteursIds.length > 0 ? allVillageSecteursd.filter(r=>r.id && villageSecteursIds.includes(r.id)) : [];
        chwsQuery = allChws.filter(r=>r.district_quartier && r.district_quartier.id && districtQuartiersIds.includes(r.district_quartier.id));
        recosQuery = recosIds.length > 0 ? allRecos.filter(r=>r.id && recosIds.includes(r.id)) : [];
    }

    return {
        countries: (isSuperUser === true ? allCountries : countriesQuery).map(d => GetCountryMap(d)),
        regions: (isSuperUser === true ? allRegions : regionsQuery).map(d => GetRegionsMap(d)),
        prefectures: (isSuperUser === true ? allPrefectures : prefecturesQuery).map(d => GetPrefecturesMap(d)),
        communes: (isSuperUser === true ? allCommunes : communesQuery).map(d => GetCommunesMap(d)),
        hospitals: (isSuperUser === true ? allHospitals : hospitalsQuery).map(d => GetHospitalsMap(d)),
        districtQuartiers: (isSuperUser === true ? allDistrictQuartiers : districtQuartiersQuery).map(d => GetDistrictQuartiersMap(d)),
        villageSecteurs: (isSuperUser === true ? allVillageSecteursd : villageSecteursQuery).map(d => GetVillageSecteursMap(d)),
        chws: (isSuperUser === true ? allChws : chwsQuery).map(d => GetChwsMap(d)),
        recos: (isSuperUser === true ? allRecos : recosQuery).map(d => GetRecosMap(d)),
    }
    
}

export async function hashUserToken(user: TokenUser): Promise<string> {
    const secret = await jwSecretKey({ userToken: user });
    return jwt.sign(user, secret.secretOrPrivateKey, { expiresIn: secret.expiredIn });
}