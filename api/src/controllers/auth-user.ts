import { Request, Response, NextFunction } from 'express';
import { Users, getUsersRepository, userToken } from '../entities/User';
import { httpHeaders, notEmpty } from '../utils/functions';
import { GetRolesAndNamesPagesAutorizations, Roles, getRolesRepository } from '../entities/Roles';
import crypto from 'crypto';
import { ROUTES_LIST, AUTORISATIONS_LIST } from '../utils/autorizations-pages';
import { TokenUser } from '../utils/Interfaces';
import { COUNTRIES_CUSTOM_QUERY, REGIONS_CUSTOM_QUERY, PREFECTURES_CUSTOM_QUERY, COMMUNES_CUSTOM_QUERY, HOSPITALS_CUSTOM_QUERY, DISTRICTS_QUARTIERS_CUSTOM_QUERY, VILLAGES_SECTEURS_CUSTOM_QUERY, CHWS_CUSTOM_QUERY, RECOS_CUSTOM_QUERY, RecoCustomQuery, ChwCustomQuery, COMMUNES_MANAGER_CUSTOM_QUERY, COUNTRIES_MANAGER_CUSTOM_QUERY, HOSPITALS_MANAGER_CUSTOM_QUERY, PREFECTURES_MANAGER_CUSTOM_QUERY, REGIONS_MANAGER_CUSTOM_QUERY, CommuneCustomQuery, HospitalCustomQuery, PrefectureCustomQuery, RegionCustomQuery, CountryCustomQuery, DistrictQuartierCustomQuery, VillageSecteurCustomQuery } from './orgunit-query/org-units-custom';
import { ChwsMap, CommunesMap, CountryMap, DistrictQuartiersMap, GetChwsMap, GetCommunesMap, GetCountryMap, GetDistrictQuartiersMap, GetHospitalsMap, GetPrefecturesMap, GetRecosMap, GetRegionsMap, GetVillageSecteursMap, HospitalsMap, PrefecturesMap, RecosMap, RegionsMap, VillageSecteursMap } from '../utils/org-unit-interface';
import { APP_ENV } from '../utils/constantes';
import request from 'request';

// import uuidv4 from 'uuid';


const { NODE_ENV, CHT_PROD_HOST, CHT_DEV_HOST, CHT_PORT } = APP_ENV;

const USER_CHT_HOST = `${NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST}:${CHT_PORT}`;


function hashPassword(password: string): { salt: string, hashedPassword: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    return { salt, hashedPassword };
}

function verifyPassword(password: string, salt: string, hashedPassword: string): boolean {
    const inputHashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    return inputHashedPassword === hashedPassword;
}

function generateShortId(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

export const ADMIN_USER_ID: string = 'Wy9bzA7a5kF'


function availableUid<T>(datas: Array<T>): string {
    let newId: string;
    do {
        newId = generateShortId(11);
    } while (datas.some((d: any) => (d.id ?? d.uid ?? d.uuid ?? d._id) === newId));
    return newId;
}

export async function CurrentUser(currentUserId: string): Promise<Users | null> {
    const userRepo = await getUsersRepository();
    const userFound = await userRepo.findOneBy({ id: currentUserId });
    return userFound;
}

export class AuthUserController {
    static DefaultAdminCreation = async () => {
        const userRepo = await getUsersRepository();

        const users = await userRepo.find();

        if (users.length == 0) {
            const rolRepo = await getRolesRepository();
            const roles = await rolRepo.find();
            if (roles.length == 0) {
                const role1: Roles = new Roles();
                role1.id = 1;
                role1.name = 'super_admin';
                role1.routes = [];
                role1.autorizations = ['_admin'];
                role1.default_route = ROUTES_LIST[10];
                await rolRepo.save(role1);

                const role2: Roles = new Roles();
                role2.id = 2;
                role2.name = 'admin';
                role2.routes = ROUTES_LIST.slice(0, 12);
                role2.autorizations = AUTORISATIONS_LIST.slice(0, 10);
                role2.default_route = ROUTES_LIST[10];
                await rolRepo.save(role2);


                const RL = ROUTES_LIST.slice(0, 9);

                const role3: Roles = new Roles();
                role3.id = 3;
                role3.name = 'reco';
                role3.routes = RL;
                role3.autorizations = AUTORISATIONS_LIST.slice(0, 5);
                role3.default_route = RL[6];
                await rolRepo.save(role3);

                const role4: Roles = new Roles();
                role4.id = 4;
                role4.name = 'chws';
                role4.routes = RL;
                role4.autorizations = AUTORISATIONS_LIST.slice(0, 6);
                role4.default_route = RL[6];
                await rolRepo.save(role4);

                const role5: Roles = new Roles();
                role5.id = 5;
                role5.name = 'hospital_manager';
                role5.routes = RL;
                role5.autorizations = AUTORISATIONS_LIST.slice(0, 6);
                role5.default_route = RL[6];
                await rolRepo.save(role5);

                const role6: Roles = new Roles();
                role6.id = 6;
                role6.name = 'commune_manager';
                role6.routes = RL;
                role6.autorizations = AUTORISATIONS_LIST.slice(0, 6);
                role6.default_route = RL[6];
                await rolRepo.save(role6);

                const role7: Roles = new Roles();
                role7.id = 7;
                role7.name = 'prefecture_manager';
                role7.routes = RL;
                role7.autorizations = AUTORISATIONS_LIST.slice(0, 6);
                role7.default_route = RL[6];
                await rolRepo.save(role7);

                const role8: Roles = new Roles();
                role8.id = 8;
                role8.name = 'region_manager';
                role8.routes = RL;
                role8.autorizations = AUTORISATIONS_LIST.slice(0, 6);
                role8.default_route = RL[6];
                await rolRepo.save(role8);

                const role9: Roles = new Roles();
                role9.id = 9;
                role9.name = 'country_manager';
                role9.routes = RL;
                role9.autorizations = AUTORISATIONS_LIST.slice(0, 6);
                role9.default_route = RL[6];
                await rolRepo.save(role9);

            }

            const user1 = new Users();
            const hash1 = hashPassword('district');
            user1.id = ADMIN_USER_ID;
            user1.username = 'admin';
            user1.fullname = 'Admin';
            user1.password = hash1.hashedPassword;
            user1.salt = hash1.salt;
            user1.roles = ['1'];
            user1.isActive = true;
            user1.mustLogin = true;
            await userRepo.save(user1);

            const user2 = new Users();
            const hash2 = hashPassword('manager');
            user2.id = availableUid([user1]);;
            user2.username = 'manager';
            user2.fullname = 'Manager';
            user2.password = hash2.hashedPassword;
            user2.salt = hash2.salt;
            user2.roles = ['2'];
            user2.isActive = true;
            user2.mustLogin = true;
            await userRepo.save(user2);
        }
    };

    static getRecoParam = (recos: RecoCustomQuery[]): RecosMap[] => {
        return recos.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
            prefecture_id: r.prefecture.id,
            commune_id: r.commune.id,
            hospital_id: r.hospital.id,
            district_quartier_id: r.district_quartier.id,
            village_secteur_id: r.village_secteur.id
        }));
    };

    static getChwParam = (chws: ChwCustomQuery[]): ChwsMap[] => {
        return chws.map(chw => ({
            id: chw.id,
            external_id: chw.external_id,
            name: chw.name,
            country_id: chw.country.id,
            region_id: chw.region.id,
            prefecture_id: chw.prefecture.id,
            commune_id: chw.commune.id,
            hospital_id: chw.hospital.id,
            district_quartier_id: chw.district_quartier.id
        }));
    };

    static getVillageSecteurParam = (data: VillageSecteurCustomQuery[]): VillageSecteursMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
            prefecture_id: r.prefecture.id,
            commune_id: r.commune.id,
            hospital_id: r.hospital.id,
            district_quartier_id: r.district_quartier.id,
        }));
    };

    static getDistrictQuartierParam = (data: DistrictQuartierCustomQuery[]): DistrictQuartiersMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
            prefecture_id: r.prefecture.id,
            commune_id: r.commune.id,
            hospital_id: r.hospital.id,
        }));
    };
    
    
    static getHospitalParam = (data: HospitalCustomQuery[]): HospitalsMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
            prefecture_id: r.prefecture.id,
            commune_id: r.commune.id,
        }));
    };

    static getCommuneParam = (data: CommuneCustomQuery[]): CommunesMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
            prefecture_id: r.prefecture.id,
        }));
    };

    static getPrefectureParam = (data: PrefectureCustomQuery[]): PrefecturesMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
        }));
    };

    static getRegionParam = (data: RegionCustomQuery[]): RegionsMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
            country_id: r.country.id,
        }));
    };

    static getCountryParam = (data: CountryCustomQuery[]): CountryMap[] => {
        return data.map(r => ({
            id: r.id,
            external_id: r.external_id,
            name: r.name,
        }));
    };



    static startTchecking = async (user: Users, res: Response) => {
        const token = await userToken(user);

        if (token) {
            const userRepo = await getUsersRepository();
            user.token = token as string;
            user.mustLogin = false;
            await userRepo.save(user);

            const data = await GetRolesAndNamesPagesAutorizations(user.roles);
            const isAdmin = (data?.autorizations ?? []).includes('_admin');

            var countries: CountryMap[] = isAdmin !== true ? user.countries : (await COUNTRIES_CUSTOM_QUERY()).map(d => GetCountryMap(d));
            var regions: RegionsMap[] = isAdmin !== true ? user.regions : (await REGIONS_CUSTOM_QUERY()).map(d => GetRegionsMap(d));
            var prefectures: PrefecturesMap[] = isAdmin !== true ? user.prefectures : (await PREFECTURES_CUSTOM_QUERY()).map(d => GetPrefecturesMap(d));
            var communes: CommunesMap[] = isAdmin !== true ? user.communes : (await COMMUNES_CUSTOM_QUERY()).map(d => GetCommunesMap(d));
            var hospitals: HospitalsMap[] = isAdmin !== true ? user.hospitals : (await HOSPITALS_CUSTOM_QUERY()).map(d => GetHospitalsMap(d));
            var districtQuartiers: DistrictQuartiersMap[] = isAdmin !== true ? user.districtQuartiers : (await DISTRICTS_QUARTIERS_CUSTOM_QUERY()).map(d => GetDistrictQuartiersMap(d));
            var villageSecteurs: VillageSecteursMap[] = isAdmin !== true ? user.villageSecteurs : (await VILLAGES_SECTEURS_CUSTOM_QUERY()).map(d => GetVillageSecteursMap(d));
            var chws: ChwsMap[] = isAdmin !== true ? user.chws : (await CHWS_CUSTOM_QUERY()).map(d => GetChwsMap(d));
            var recos: RecosMap[] = isAdmin !== true ? user.recos : (await RECOS_CUSTOM_QUERY()).map(d => GetRecosMap(d));
            // FAMILIES_CUSTOM_QUERY();
            // PATIENTS_CUSTOM_QUERY();

            // const isReco = user.roles.length == 1 && user.roles[0] == '3';
            // const isChws = user.roles.length == 1 && user.roles[0] == '4';

            // return res.status(200).json({ status: 200, data: token });
            return res.status(200).json({ status: 200, data: token, countries: countries, regions: regions, prefectures: prefectures, communes: communes, hospitals: hospitals, districtQuartiers: districtQuartiers, villageSecteurs: villageSecteurs, chws: chws, recos: recos });
        }
        return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
    }

    static login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { credential, password } = req.body;
            if (!credential || !password) return res.status(201).json({ status: 201, data: 'Informations Invalide, Reesayer!' });

            const userRepo = await getUsersRepository();
            const user = await userRepo.findOne({ where: [{ username: credential }, { email: credential }] });

            if (!user) {
                // return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
                const chtUrl = `https://${USER_CHT_HOST}/medic/org.couchdb.user:${credential}`;

                request({
                    url: chtUrl,
                    method: 'GET',
                    headers: httpHeaders(credential, password)
                }, async function (error: any, response: any, body: any) {
                    if (!error) {
                        const { _id, name, roles, facility_id, contact_id } = JSON.parse(body);

                        if (roles && Array.isArray(roles)) {
                            const isReco: boolean = roles.includes('reco');
                            const isChw: boolean = roles.includes('chw');
                            const isHospitalManager: boolean = roles.includes('hospital_manager');
                            const isCommuneManager: boolean = roles.includes('commune_manager');
                            const isPrefectureManager: boolean = roles.includes('prefecture_manager');
                            const isRegionManager: boolean = roles.includes('region_manager');
                            const isCountryManager: boolean = roles.includes('country_manager');


                            if (isReco || isChw || isHospitalManager || isCommuneManager || isPrefectureManager || isRegionManager || isCountryManager) {
                                // const recoRepo = await getRecoRepository();
                                // const chwRepo = await getChwRepository();

                                const recoList = await RECOS_CUSTOM_QUERY();

                                const villageList = await VILLAGES_SECTEURS_CUSTOM_QUERY();
                                const districtList = await DISTRICTS_QUARTIERS_CUSTOM_QUERY();
                                const hospitalList = await HOSPITALS_CUSTOM_QUERY();
                                const communeList = await COMMUNES_CUSTOM_QUERY();
                                const prefectureList = await PREFECTURES_CUSTOM_QUERY();
                                const regionList = await REGIONS_CUSTOM_QUERY();
                                const countryList = await COUNTRIES_CUSTOM_QUERY();
                                

                                let RECO: RecoCustomQuery[] = [];
                                let CHWS: ChwCustomQuery[] = [];
                                // let HOSPITALS_MANAGER: HospitalManagerCustomQuery[] = [];
                                // let COMMUNES_MANAGER: CommuneManagerCustomQuery[] = [];
                                // let PREFECTURES_MANAGER: PrefectureManagerCustomQuery[] = [];
                                // let REGIONS_MANAGER: RegionManagerCustomQuery[] = [];
                                // let COUNTRIES_MANAGER: CountryManagerCustomQuery[] = [];

                                let VILLAGES: VillageSecteurCustomQuery[] = [];
                                let DISTRICTS: DistrictQuartierCustomQuery[] = [];
                                let HOSPITALS: HospitalCustomQuery[] = [];
                                let COMMUNES: CommuneCustomQuery[] = [];
                                let PREFECTURES: PrefectureCustomQuery[] = [];
                                let REGIONS: RegionCustomQuery[] = [];
                                let COUNTRIES: CountryCustomQuery[] = [];

                                if (isReco) {
                                    RECO = recoList.filter(r => r.id === contact_id);
                                }

                                if (isChw) {
                                    const chwList = await CHWS_CUSTOM_QUERY();
                                    CHWS = chwList.filter(r => r.id === contact_id);
                                    const DISTRICTS_IDS = CHWS.map(c => c.district_quartier.id)
                                    RECO = recoList.filter(r => DISTRICTS_IDS.includes(r.district_quartier.id));
                                }

                                if (isHospitalManager) {
                                    const chwList = await CHWS_CUSTOM_QUERY();
                                    const hospitalManagerList = await HOSPITALS_MANAGER_CUSTOM_QUERY();
                                    const HOSPITALS_MANAGER = hospitalManagerList.filter(r => r.id === contact_id);
                                    const HOSTPITAL_IDS = HOSPITALS_MANAGER.map(c => c.hospital.id);
                                    RECO = recoList.filter(r => HOSTPITAL_IDS.includes(r.hospital.id));
                                    CHWS = chwList.filter(r => HOSTPITAL_IDS.includes(r.hospital.id));
                                }

                                if (isCommuneManager) {
                                    const chwList = await CHWS_CUSTOM_QUERY();
                                    const communeManagerList = await COMMUNES_MANAGER_CUSTOM_QUERY();
                                    const COMMUNES_MANAGER = communeManagerList.filter(r => r.id === contact_id);
                                    const COMMUNE_IDS = COMMUNES_MANAGER.map(c => c.commune.id);
                                    RECO = recoList.filter(r => COMMUNE_IDS.includes(r.commune.id));
                                    CHWS = chwList.filter(r => COMMUNE_IDS.includes(r.commune.id));
                                }

                                if (isPrefectureManager) {
                                    const chwList = await CHWS_CUSTOM_QUERY();
                                    const prefectureManagerList = await PREFECTURES_MANAGER_CUSTOM_QUERY();
                                    const PREFECTURES_MANAGER = prefectureManagerList.filter(r => r.id === contact_id);
                                    const PREFECTURE_IDS = PREFECTURES_MANAGER.map(c => c.prefecture.id);
                                    RECO = recoList.filter(r => PREFECTURE_IDS.includes(r.prefecture.id));
                                    CHWS = chwList.filter(r => PREFECTURE_IDS.includes(r.prefecture.id));
                                }

                                if (isRegionManager) {
                                    const chwList = await CHWS_CUSTOM_QUERY();
                                    const regionManagerList = await REGIONS_MANAGER_CUSTOM_QUERY();
                                    const REGIONS_MANAGER = regionManagerList.filter(r => r.id === contact_id);
                                    const REGION_IDS = REGIONS_MANAGER.map(c => c.region.id);
                                    RECO = recoList.filter(r => REGION_IDS.includes(r.region.id));
                                    CHWS = chwList.filter(r => REGION_IDS.includes(r.region.id));
                                }

                                if (isCountryManager) {
                                    const chwList = await CHWS_CUSTOM_QUERY();
                                    const countryManagerList = await COUNTRIES_MANAGER_CUSTOM_QUERY();
                                    const COUNTRIES_MANAGER = countryManagerList.filter(r => r.id === contact_id);
                                    const COUNTRY_IDS = COUNTRIES_MANAGER.map(c => c.country.id);
                                    RECO = recoList.filter(r => COUNTRY_IDS.includes(r.country.id));
                                    CHWS = chwList.filter(r => COUNTRY_IDS.includes(r.country.id));
                                }


                                if (RECO.length > 0) {
                                    // if (RECO.length > 0 || CHWS.length > 0) {
                                    
                                    VILLAGES = villageList.filter(r => (RECO.map(c => c.village_secteur.id)).includes(r.id));
                                    DISTRICTS = districtList.filter(r => (RECO.map(c => c.district_quartier.id)).includes(r.id));
                                    HOSPITALS = hospitalList.filter(r => (RECO.map(c => c.hospital.id)).includes(r.id));
                                    COMMUNES = communeList.filter(r => (RECO.map(c => c.commune.id)).includes(r.id));
                                    PREFECTURES = prefectureList.filter(r => (RECO.map(c => c.prefecture.id)).includes(r.id));
                                    REGIONS = regionList.filter(r => (RECO.map(c => c.region.id)).includes(r.id));
                                    COUNTRIES = countryList.filter(r => (RECO.map(c => c.country.id)).includes(r.id));
                                    
                                    var users: Users[] = await userRepo.find();
                                    const u = new Users();
                                    const { salt, hashedPassword } = hashPassword(password);
                                    u.id = availableUid(users);
                                    u.username = name;
                                    u.fullname = name.toUpperCase();
                                    u.password = hashedPassword;
                                    u.salt = salt;
                                    u.roles = isReco ? ['3'] : isChw ? ['4'] : isHospitalManager ? ['5'] : isCommuneManager ? ['6'] : isPrefectureManager ? ['7'] : isRegionManager ? ['8'] : isCountryManager ? ['9'] : [];
                                    u.isActive = true;
                                    u.mustLogin = true;
                                    u.recos = AuthUserController.getRecoParam(RECO);
                                    if (CHWS.length > 0) u.chws = AuthUserController.getChwParam(CHWS);
                                    if (VILLAGES.length > 0) u.villageSecteurs = AuthUserController.getVillageSecteurParam(VILLAGES);
                                    if (DISTRICTS.length > 0) u.districtQuartiers = AuthUserController.getDistrictQuartierParam(DISTRICTS);
                                    if (HOSPITALS.length > 0) u.hospitals = AuthUserController.getHospitalParam(HOSPITALS);
                                    if (COMMUNES.length > 0) u.communes = AuthUserController.getCommuneParam(COMMUNES);
                                    if (PREFECTURES.length > 0) u.prefectures = AuthUserController.getPrefectureParam(PREFECTURES);
                                    if (REGIONS.length > 0) u.regions = AuthUserController.getRegionParam(REGIONS);
                                    if (COUNTRIES.length > 0) u.countries = AuthUserController.getCountryParam(COUNTRIES);

                                    const sUser = await userRepo.save(u);
                                    await AuthUserController.startTchecking(sUser, res);
                                }
                            }
                        } else {

                        }
                    }
                });
            } else {
                if (!user.isActive || user.isDeleted) return res.status(201).json({ status: 201, data: "Vous n'avez pas les Sorry! You don't have permission to login. Contact the administrator." });
                const isPasswordValid = verifyPassword(password, user.salt ?? 'ZerD2345~@PRET', user.password);
                if (!isPasswordValid) return res.status(201).json({ status: 201, data: 'Invalid password' });
                await AuthUserController.startTchecking(user, res);
            }
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err || 'Erreur Interne Du Serveur'}` });
        }
    };

    static register = async (req: Request, res: Response, next: NextFunction) => {
        // try {
        const { userId, username, email, password, fullname, roles, isActive, countries, regions, prefectures, communes, hospitals, districtQuartiers, villageSecteurs, chws, recos } = req.body;
        if (!username || !password) return res.status(201).json({ status: 201, data: 'Informations Invalide, Reesayer!' });

        const userRepo = await getUsersRepository();
        const userFound = await userRepo.findOne({ where: [{ username: username }, notEmpty(email) && email !== '@' ? { email: email } : {}] });

        if (userFound && notEmpty(userFound)) return res.status(201).json({ status: 201, data: 'Identifiants Invalides, Reesayer un autre!' });
        var users: Users[] = await userRepo.find();

        const { salt, hashedPassword } = hashPassword(password);

        const user = new Users();
        user.id = availableUid(users);
        user.username = username;
        user.fullname = fullname;
        user.email = email;
        user.password = hashedPassword;
        user.salt = salt;
        user.roles = roles;
        user.isActive = isActive === true;
        user.countries = countries;
        user.regions = regions;
        user.prefectures = prefectures;
        user.communes = communes;
        user.hospitals = hospitals;
        user.districtQuartiers = districtQuartiers;
        user.villageSecteurs = villageSecteurs;
        user.chws = chws;
        user.recos = recos;
        user.created_at = new Date();

        await userRepo.save(user);

        return res.status(200).json({ status: 200, data: 'Utilisateur enrégistré avec succès' });
        // } catch (err: any) {
        //     return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        // }
    };

    static newToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, updateReload } = req.body;
            if (userId) {
                const userRepo = await getUsersRepository();
                const user = await userRepo.findOneBy({ id: userId });
                if (!user || user && (!user.isActive || user.isDeleted)) return res.status(201).json({ status: 201, data: 'error' });

                const token = await userToken(user);
                if (token) {
                    user.token = token as string;
                    if (updateReload == true) user.mustLogin = false;
                    await userRepo.save(user);
                    return res.status(200).json({ status: 200, data: token });
                }
                return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
            }
            return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });
        } catch (err) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static CheckReloadUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.body;
            if (userId) {
                const userRepo = await getUsersRepository();
                const user = await userRepo.findOneBy({ id: userId });
                if (!user || user && (!user.isActive || user.isDeleted)) return res.status(201).json({ status: 201, data: 'error' });
                if (user.mustLogin) return res.status(202).json({ status: 202, data: 'error' });
                return res.status(200).json({ status: 200, data: user.token });
            }
            return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });
        } catch (err) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    };


    static allUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.body;
            const userRepo = await getUsersRepository();
            var currentUser: Users | null = await userRepo.findOneBy({ id: userId });
            if (!currentUser) return res.status(201).json({ status: 200, data: 'Vous devez vous déconnecter et reessayer!' });
            const currentUserToken = await userToken(currentUser, { hashToken: false, checkValidation: false, outPutInitialRoles: true, outPutOrgUnits: true });
            if (!currentUserToken) return res.status(201).json({ status: 200, data: 'Vous devez vous déconnecter et reessayer!' });

            var users: Users[] = await userRepo.find();
            var finalUsers = await Promise.all(users.map(async user => {
                // const formatedRoles = await GetRolesAndNamesPagesAutorizations(user.roles);
                const tokenUser = await userToken(user, { hashToken: false, checkValidation: false, outPutInitialRoles: true, outPutOrgUnits: true });
                // const finalRoles = formatedRoles && notEmpty(formatedRoles) ? formatedRoles.rolesObj : [];
                const newUser: any = { ...(tokenUser as TokenUser), isDeleted: user.isDeleted, isActive: user.isActive };
                return newUser;
            }));

            if ((currentUserToken as TokenUser).isAdmin !== true) {
                finalUsers = finalUsers.filter(u => u.isAdmin !== true)
            }
            return res.status(200).json({ status: 200, data: finalUsers });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, id, username, email, password, fullname, roles, isActive, countries, regions, prefectures, communes, hospitals, districtQuartiers, villageSecteurs, chws, recos } = req.body;
            if (!id) return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });

            const userRepo = await getUsersRepository();
            const user = await userRepo.findOneBy({ id: id });
            if (!user) return res.status(201).json({ status: 201, data: 'Aucun utilisateur trouvé' });

            if (password && notEmpty(password)) {
                const { salt, hashedPassword } = hashPassword(password);
                user.password = hashedPassword;
                user.salt = salt;
            }
            user.fullname = fullname;
            user.email = email;
            user.roles = roles;
            user.isActive = isActive === true;
            user.countries = countries;
            user.regions = regions;
            user.prefectures = prefectures;
            user.communes = communes;
            user.hospitals = hospitals;
            user.districtQuartiers = districtQuartiers;
            user.villageSecteurs = villageSecteurs;
            user.chws = chws;
            user.recos = recos;
            user.updated_at = new Date();

            user.mustLogin = true;
            await userRepo.update(user.id, user);

            return res.status(200).json({ status: 200, data: user.token });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static updateUserPassWord = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, old_password, new_password } = req.body;
            if (!userId) return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });

            const userRepo = await getUsersRepository();
            const user = await userRepo.findOneBy({ id: userId });
            if (!user) return res.status(201).json({ status: 201, data: 'Aucun utilisateur trouvé' });

            if (old_password && notEmpty(old_password) && new_password && notEmpty(new_password)) {
                const isOldPasswordValid = verifyPassword(old_password, user.salt, user.password);
                if (!isOldPasswordValid) return res.status(201).json({ status: 201, data: 'L\'ancien mot de passe n\'est pas correct' });
                if (new_password && notEmpty(new_password)) {
                    const { salt, hashedPassword } = hashPassword(new_password);
                    user.password = hashedPassword;
                    user.salt = salt;
                }
            }
            user.mustLogin = true;
            user.updated_at = new Date();
            await userRepo.save(user);

            return res.status(200).json({ status: 200, data: user.token });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, id, permanentDelete } = req.body;
            const userRepo = await getUsersRepository();
            const isSuperAdmin = true;

            if (isSuperAdmin == true && id) {
                const user = await userRepo.findOneBy({ id: id });
                if (user) {
                    if (permanentDelete != true) {
                        user.token = '';
                        user.roles = [];
                        user.isActive = false;
                        user.isDeleted = true;
                        user.deletedAt = new Date();
                        user.mustLogin = true;
                        await userRepo.update(id, user);
                    } else {
                        await userRepo.delete({ id: id });
                    }
                    return res.status(200).json({ status: 200, data: 'success' });
                }
                return res.status(201).json({ status: 201, data: 'No user found' });
            }
            return res.status(201).json({ status: 201, data: 'Vous ne pouvez pas supprimer cet utilisateur' });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static GetRolesList = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const repo = await getRolesRepository();
            var roles: Roles[] = await repo.find();
            return res.status(200).json({ status: 200, data: roles });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static CreateRole = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id, name, routes, autorizations, default_route, userId } = req.body;
            const repo = await getRolesRepository();
            const roleFound = await repo.findOne({ where: [notEmpty(id) ? { id: id } : {}, notEmpty(name) ? { name: name } : {}] });

            if (roleFound && notEmpty(roleFound)) {
                return res.status(201).json({ status: 201, data: 'Le Role existe deja' });
            }
            const role: Roles = new Roles();
            role.name = name;
            role.autorizations = autorizations;
            role.routes = routes;
            role.default_route = default_route;
            await repo.save(role);
            var roles: Roles[] = await repo.find();
            return res.status(200).json({ status: 200, data: roles });

        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static UpdateRole = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id, name, autorizations, routes, default_route, userId } = req.body;
            const repo = await getRolesRepository();
            const role = await repo.findOne({ where: [{ id: id }, { name: name }] });
            if (role && notEmpty(role) && id) {
                const userRepo = await getUsersRepository();
                const users = await userRepo.find();
                const selectedUsers = users.filter(user => ((user.roles ?? []) as string[]).includes(`${id}`));
                selectedUsers.forEach(user => {
                    user.mustLogin = true;
                    userRepo.update(user.id, user);
                });

                role.id = id;
                role.name = name;
                role.routes = routes;
                role.autorizations = autorizations;
                role.default_route = default_route;
                await repo.update(id, role);

                var roles: Roles[] = await repo.find();
                return res.status(200).json({ status: 200, data: roles });
            }
            return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static DeleteRole = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id, isSuperAdmin, userId } = req.body;
            if (isSuperAdmin !== true) {
                const repo = await getRolesRepository();
                const role = await repo.findOneBy({ id: id });
                if (role) {
                    const userRepo = await getUsersRepository();
                    const users = await userRepo.find();
                    const selectedUsers = users.filter(user => (user.roles as string[]).includes(`${id}`));

                    role.isDeleted = true;
                    role.deletedAt = new Date();
                    repo.update(role.id, role);

                    selectedUsers.forEach(user => {
                        const index = (user.roles as string[]).indexOf(`${id}`);

                        if (index !== -1) {
                            user.roles.splice(index, 1);
                            user.mustLogin = true;
                            userRepo.update(user.id, user);
                        }
                    });

                    return res.status(200).json({ status: 200, data: 'success' });
                }
                return res.status(201).json({ status: 201, data: 'Pas de role trouvé' });
            }
            return res.status(201).json({ status: 201, data: 'Vous ne pouvez pas supprimer cet utilisateur' });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static UserAutorizations = async (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({ status: 200, data: AUTORISATIONS_LIST });
    }

    static UserRoutes = async (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({ status: 200, data: ROUTES_LIST });
    }

}
