import { Request, Response, NextFunction } from 'express';
import { Users, getUsersRepository, userToken } from '../entities/User';
import { httpHeaders, notEmpty } from '../utils/functions';
import { GetRolesAndNamesPagesAutorizations, Roles, getRolesRepository } from '../entities/Roles';
import crypto from 'crypto';
import { ROUTES_LIST, AUTORISATIONS_LIST } from '../utils/autorizations-pages';
import { TokenUser } from '../utils/Interfaces';
import { COUNTRIES_COUSTOM_QUERY, REGIONS_COUSTOM_QUERY, PREFECTURES_COUSTOM_QUERY, COMMUNES_COUSTOM_QUERY, HOSPITALS_COUSTOM_QUERY, DISTRICTS_QUARTIERS_COUSTOM_QUERY, VILLAGES_SECTEURS_COUSTOM_QUERY, CHWS_COUSTOM_QUERY, RECOS_COUSTOM_QUERY, RecoCoustomQuery, ChwCoustomQuery } from './orgunit-query/org-units-coustom';
import { ChwsMap, CommunesMap, CountryMap, DistrictQuartiersMap, GetChwsMap, GetCommunesMap, GetCountryMap, GetDistrictQuartiersMap, GetHospitalsMap, GetPrefecturesMap, GetRecosMap, GetRegionsMap, GetVillageSecteursMap, HospitalsMap, PrefecturesMap, RecosMap, RegionsMap, VillageSecteursMap } from '../utils/org-unit-interface';
import { join } from 'path';
import { APP_ENV } from '../utils/constantes';
import request from 'request';
import { Chw, getChwRepository, getRecoRepository, Reco } from '../entities/Org-units';

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
            user2.id = ADMIN_USER_ID;
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

    static getRecoParam = (recos: RecoCoustomQuery[]): RecosMap[] => {
        return recos.map(r => ({
            id: r.id,
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

    static getChwParam = (chws: ChwCoustomQuery[]): ChwsMap[] => {
        return chws.map(r => ({
            id: r.id,
            name: r.name,
            country_id: r.country.id,
            region_id: r.region.id,
            prefecture_id: r.prefecture.id,
            commune_id: r.commune.id,
            hospital_id: r.hospital.id,
            district_quartier_id: r.district_quartier.id
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

            var countries: CountryMap[] = isAdmin !== true ? user.countries : (await COUNTRIES_COUSTOM_QUERY()).map(d => GetCountryMap(d));
            var regions: RegionsMap[] = isAdmin !== true ? user.regions : (await REGIONS_COUSTOM_QUERY()).map(d => GetRegionsMap(d));
            var prefectures: PrefecturesMap[] = isAdmin !== true ? user.prefectures : (await PREFECTURES_COUSTOM_QUERY()).map(d => GetPrefecturesMap(d));
            var communes: CommunesMap[] = isAdmin !== true ? user.communes : (await COMMUNES_COUSTOM_QUERY()).map(d => GetCommunesMap(d));
            var hospitals: HospitalsMap[] = isAdmin !== true ? user.hospitals : (await HOSPITALS_COUSTOM_QUERY()).map(d => GetHospitalsMap(d));
            var districtQuartiers: DistrictQuartiersMap[] = isAdmin !== true ? user.districtQuartiers : (await DISTRICTS_QUARTIERS_COUSTOM_QUERY()).map(d => GetDistrictQuartiersMap(d));
            var villageSecteurs: VillageSecteursMap[] = isAdmin !== true ? user.villageSecteurs : (await VILLAGES_SECTEURS_COUSTOM_QUERY()).map(d => GetVillageSecteursMap(d));
            var chws: ChwsMap[] = isAdmin !== true ? user.chws : (await CHWS_COUSTOM_QUERY()).map(d => GetChwsMap(d));
            var recos: RecosMap[] = isAdmin !== true ? user.recos : (await RECOS_COUSTOM_QUERY()).map(d => GetRecosMap(d));
            // FAMILIES_COUSTOM_QUERY();
            // PATIENTS_COUSTOM_QUERY();

            // return res.status(200).json({ status: 200, data: token });
            return res.status(200).json({ status: 200, data: token, countries: countries, regions: regions, prefectures: prefectures, communes: communes, hospitals: hospitals, districtQuartiers: districtQuartiers, villageSecteurs: villageSecteurs, chws: chws, recos: recos });
        }
        return res.status(201).json({ status: 201, data: 'Not autorized' });
    }

    static login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { credential, password } = req.body;
            if (!credential || !password) return res.status(201).json({ status: 201, data: 'Invalid credentials' });

            const userRepo = await getUsersRepository();
            const user = await userRepo.findOne({ where: [{ username: credential }, { email: credential }] });

            if (!user) {
                // return res.status(201).json({ status: 201, data: 'Not autorized' });
                request({
                    url: `https://${USER_CHT_HOST}/medic/org.couchdb.user:${credential}`,
                    method: 'GET',
                    headers: httpHeaders(credential, password)
                }, async function (error: any, response: any, body: any) {
                    if (!error) {
                        const { _id, name, roles, facility_id, contact_id } = JSON.parse(body);
                        const isReco:boolean = roles.includes('reco');
                        const isChw:boolean = roles.includes('chw');
                        if (isReco || isChw) {
                            // const recoRepo = await getRecoRepository();
                            // const chwRepo = await getChwRepository();
                            const recoList = await RECOS_COUSTOM_QUERY();
                            const chwList = await CHWS_COUSTOM_QUERY();
                            // hospital_manager
                            let RECO: RecoCoustomQuery[] = [];
                            let CHWS: ChwCoustomQuery[] = [];
                            if (isReco) {
                                const RC = recoList.find(r  => r.id === contact_id);
                                if(RC) RECO.push(RC);
                            }
                            if (isChw) {
                                const CH = chwList.find(r  => r.id === contact_id);
                                if(CH) CHWS.push(CH);
                                RECO = recoList.filter(r  => r.chw.id === contact_id);
                                //  await recoRepo.findBy({ chw: { id: contact_id } });
                            }
        
                            if (RECO.length > 0 || CHWS.length  > 0) {
                                var users: Users[] = await userRepo.find();
                                const u = new Users();
                                const { salt, hashedPassword } = hashPassword(password);
                                u.id = availableUid(users);
                                u.username = name;
                                u.fullname = name.toUpperCase();
                                u.password = hashedPassword;
                                u.salt = salt;
                                u.roles = isReco ? ['3'] : isChw ? ['4'] : [];
                                u.isActive = true;
                                u.mustLogin = true;
                                u.recos = AuthUserController.getRecoParam(RECO);
                                if(isChw && CHWS.length  > 0) u.chws = AuthUserController.getChwParam(CHWS);
                                // countries // regions // prefectures // communes // hospitals // districtQuartiers // villageSecteurs
                                const sUser = await userRepo.save(u);

                                await AuthUserController.startTchecking(sUser, res);
                            }
                        }
                    }
                });
            } else {
                if (!user.isActive || user.isDeleted) return res.status(201).json({ status: 201, data: "Sorry! You don't have permission to login. Contact the administrator." });
                const isPasswordValid = verifyPassword(password, user.salt ?? 'ZerD2345~@PRET', user.password);
                if (!isPasswordValid) return res.status(201).json({ status: 201, data: 'Invalid password' });
                await AuthUserController.startTchecking(user, res);
            }
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
        }
    };

    static register = async (req: Request, res: Response, next: NextFunction) => {
        // try {
        const { userId, username, email, password, fullname, roles, isActive, countries, regions, prefectures, communes, hospitals, districtQuartiers, villageSecteurs, chws, recos } = req.body;
        if (!username || !password) return res.status(201).json({ status: 201, data: 'Invalid credentials' });

        const userRepo = await getUsersRepository();
        const userFound = await userRepo.findOne({ where: [{ username: username }, notEmpty(email) && email !== '@' ? { email: email } : {}] });

        if (userFound && notEmpty(userFound)) return res.status(201).json({ status: 201, data: 'Username or email already in use' });
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

        return res.status(200).json({ status: 200, data: 'User registered successfully' });
        // } catch (err: any) {
        //     return res.status(500).json({ status: 500, data: `${err?.message || 'Internal Server Error'}` });
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
                return res.status(201).json({ status: 201, data: 'not autorized' });
            }
            return res.status(201).json({ status: 201, data: 'no user ID provided' });
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
            return res.status(201).json({ status: 201, data: 'no user ID provided' });
        } catch (err) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    };


    static allUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.body;
            const userRepo = await getUsersRepository();
            var currentUser: Users | null = await userRepo.findOneBy({ id: userId });
            if (!currentUser) return res.status(201).json({ status: 200, data: 'You must logout and re-login' });
            const currentUserToken = await userToken(currentUser, { hashToken: false, checkValidation: false, outPutInitialRoles: true, outPutOrgUnits: true });
            if (!currentUserToken) return res.status(201).json({ status: 200, data: 'You must logout and re-login' });

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
            if (!id) return res.status(201).json({ status: 201, data: 'Invalid user ID' });

            const userRepo = await getUsersRepository();
            const user = await userRepo.findOneBy({ id: id });
            if (!user) return res.status(201).json({ status: 201, data: 'User not found' });

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
            return res.status(500).json({ status: 500, data: `${err.message || 'Internal Server Error'}` });
        }
    };

    static updateUserPassWord = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, old_password, new_password } = req.body;
            if (!userId) return res.status(201).json({ status: 201, data: 'Invalid user ID' });

            const userRepo = await getUsersRepository();
            const user = await userRepo.findOneBy({ id: userId });
            if (!user) return res.status(201).json({ status: 201, data: 'User not found' });

            if (old_password && notEmpty(old_password) && new_password && notEmpty(new_password)) {
                const isOldPasswordValid = verifyPassword(old_password, user.salt, user.password);
                if (!isOldPasswordValid) return res.status(201).json({ status: 201, data: 'Old password does not match' });
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
            return res.status(500).json({ status: 500, data: `${err.message || 'Internal Server Error'}` });
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
                return res.status(201).json({ status: 201, data: 'Role already exist' });
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
            return res.status(201).json({ status: 201, data: 'No Id Provided' });
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
                return res.status(201).json({ status: 201, data: 'No role found' });
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
