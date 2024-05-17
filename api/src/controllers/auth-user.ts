import { Request, Response, NextFunction } from 'express';
import { Users, getUsersRepository, userToken } from '../entities/User';
import { notEmpty } from '../utils/functions';
import { GetRolesAndNamesPagesAutorizations, Roles, getRolesRepository } from '../entities/Roles';
import crypto from 'crypto';
import { ROUTES_LIST, AUTORISATIONS_LIST } from '../utils/autorizations-pages';
import { ChwCoustomQuery, CommuneCoustomQuery, CountryCoustomQuery, DistrictQuartierCoustomQuery, HospitalCoustomQuery, PrefectureCoustomQuery, RecoCoustomQuery, RegionCoustomQuery, TokenUser, VillageSecteurCoustomQuery } from '../utils/Interfaces';
import { COUNTRIES_COUSTOM_QUERY, REGIONS_COUSTOM_QUERY, PREFECTURES_COUSTOM_QUERY, COMMUNES_COUSTOM_QUERY, HOSPITALS_COUSTOM_QUERY, DISTRICTS_QUARTIERS_COUSTOM_QUERY, VILLAGES_SECTEURS_COUSTOM_QUERY, CHWS_COUSTOM_QUERY, RECOS_COUSTOM_QUERY } from './orgunit-query/org-units-coustom';

// import uuidv4 from 'uuid';

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
                const role: Roles = new Roles();
                role.id = 1;
                role.name = 'super_admin';
                role.routes = [];
                role.autorizations = ['_admin'];
                role.default_route = ROUTES_LIST[0];
                await rolRepo.save(role);
            }
            const user = new Users();
            const { salt, hashedPassword } = hashPassword('district');
            user.id = ADMIN_USER_ID;
            user.username = 'admin';
            user.fullname = 'Admin';
            user.password = hashedPassword;
            user.salt = salt;
            user.roles = ['1'];
            user.isActive = true;
            user.mustLogin = true;
            await userRepo.save(user);
        }
    }

    static login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { credential, password } = req.body;
            if (!credential || !password) return res.status(201).json({ status: 201, data: 'Invalid credentials' });
            const userRepo = await getUsersRepository();
            const user = await userRepo.findOne({ where: [{ username: credential }, { email: credential }] });
            if (!user) return res.status(201).json({ status: 201, data: 'No user with this credential' });
            if (!user.isActive || user.isDeleted) return res.status(201).json({ status: 201, data: "Sorry! You don't have permission to login. Contact the administrator." });
            const isPasswordValid = verifyPassword(password, user.salt ?? 'ZerD2345~@PRET', user.password);
            if (!isPasswordValid) return res.status(201).json({ status: 201, data: 'Invalid password' });

            const token = await userToken(user);

            if (token) {
                user.token = token as string;
                user.mustLogin = false;
                await userRepo.save(user);

                const data = await GetRolesAndNamesPagesAutorizations(user.roles);
                const isAdmin = (data?.autorizations ?? []).includes('_admin');

                var countries: CountryCoustomQuery[] = isAdmin !== true ? user.countries : await COUNTRIES_COUSTOM_QUERY();
                var regions: RegionCoustomQuery[] = isAdmin !== true ? user.regions : await REGIONS_COUSTOM_QUERY();
                var prefectures: PrefectureCoustomQuery[] = isAdmin !== true ? user.prefectures : await PREFECTURES_COUSTOM_QUERY();
                var communes: CommuneCoustomQuery[] = isAdmin !== true ? user.communes : await COMMUNES_COUSTOM_QUERY();
                var hospitals: HospitalCoustomQuery[] = isAdmin !== true ? user.hospitals : await HOSPITALS_COUSTOM_QUERY();
                var districtQuartiers: DistrictQuartierCoustomQuery[] = isAdmin !== true ? user.districtQuartiers : await DISTRICTS_QUARTIERS_COUSTOM_QUERY();
                var villageSecteurs: VillageSecteurCoustomQuery[] = isAdmin !== true ? user.villageSecteurs : await VILLAGES_SECTEURS_COUSTOM_QUERY();
                var chws: ChwCoustomQuery[] = isAdmin !== true ? user.chws : await CHWS_COUSTOM_QUERY();
                var recos: RecoCoustomQuery[] = isAdmin !== true ? user.recos : await RECOS_COUSTOM_QUERY();
                // FAMILIES_COUSTOM_QUERY();
                // PATIENTS_COUSTOM_QUERY();

                // return res.status(200).json({ status: 200, data: token });
                return res.status(200).json({ status: 200, data: token, countries: countries, regions: regions, prefectures: prefectures, communes: communes, hospitals: hospitals, districtQuartiers: districtQuartiers, villageSecteurs: villageSecteurs, chws: chws, recos: recos });
            }

            return res.status(201).json({ status: 201, data: 'Not autorized' });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
        }
    };

    static register = async (req: Request, res: Response, next: NextFunction) => {
        try {
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
            user.isActive = isActive;
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
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Internal Server Error'}` });
        }
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
            var users: Users[] = await userRepo.find();
            const finalUsers = await Promise.all(users.map(async user => {
                // const formatedRoles = await GetRolesAndNamesPagesAutorizations(user.roles);
                const tokenUser = await userToken(user, { hashToken: false, checkValidation: false, outPutInitialRoles: true, outPutOrgUnits: true });
                // const finalRoles = formatedRoles && notEmpty(formatedRoles) ? formatedRoles.rolesObj : [];
                const newUser: any = { ...(tokenUser as TokenUser), isDeleted: user.isDeleted, isActive: user.isActive };
                return newUser;
            }));
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
