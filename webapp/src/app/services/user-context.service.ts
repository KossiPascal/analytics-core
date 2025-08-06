import { Injectable } from '@angular/core';
import { AppStorageService } from './local-storage.service';
import { User } from '../models/user-role';
import { jwtDecode } from "jwt-decode";
import { IndexedDbService } from './indexed-db.service';
import { userRoles } from '@kossi-shared/functions';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {

  constructor(private indexdb: IndexedDbService, private store: AppStorageService) { }

  APP_AUTH_TOKEN: string = 'Kossi TSOLEGNAGBO Pascal 26/03/1989 Lomé/Kara Integrate Health (+228) 92645651 (Token du 12 Avril 2025 à 16:10:23)';
  APP_ADMIN_PRIVILEGE: string = `${this.APP_AUTH_TOKEN} PRIVILEGES`;

  async isLoggedIn(userObj: User | null = null): Promise<boolean> {
    try {
      const user = (userObj ?? await this.currentUser()) as User | null;
      const currentTime = Math.floor(Date.now() / 1000);
      return user && user != null ? (currentTime < user.exp) : false;
    } catch (error) {
      return false;
    }
  }

  async currentUser(userTokens?:{ id: string, data: string}[]): Promise<User | null> {
    userTokens = userTokens ?? await this.indexdb.getAll<{ id: string, data: string }>('token');


    const mcdp: { id: string, data: boolean } | undefined = await this.indexdb.getOne<{ id: string; data: any }>('user_info', 'mustChangeDefaultPassword');

    const jsonUser: any = userTokens.reduce((acc, { id, data }) => {
      (acc as any)[id] = data;
      return acc;
    }, {});

    if (!jsonUser || !jsonUser.user || !jsonUser.persons) return null;

    const user = jwtDecode(jsonUser.user) as User;
    if (!user) return null;

    user.mustChangeDefaultPassword = jsonUser.mustChangeDefaultPassword;

    if (jsonUser.orgunits) {
      const ou = jwtDecode(jsonUser.orgunits) as any;
      if ((ou.countries ?? '') !== '') user.countries = ou.countries;
      if ((ou.regions ?? '') !== '') user.regions = ou.regions;
      if ((ou.prefectures ?? '') !== '') user.prefectures = ou.prefectures;
      if ((ou.communes ?? '') !== '') user.communes = ou.communes;
      if ((ou.hospitals ?? '') !== '') user.hospitals = ou.hospitals;
      if ((ou.districtQuartiers ?? '') !== '') user.districtQuartiers = ou.districtQuartiers;
      if ((ou.villageSecteurs ?? '') !== '') user.villageSecteurs = ou.villageSecteurs;
    }
    if (!jsonUser.persons) return null
    const ps = jwtDecode(jsonUser.persons) as any;
    if ((ps.chws ?? '') !== '') user.chws = ps.chws;
    if ((ps.recos ?? '') !== '') user.recos = ps.recos;

    if (!user.recos || user.recos.length === 0) return null;
   
    user.role = userRoles(user.authorizations ?? [], user.routes ?? [])

    return user;
  }

  async token(): Promise<string> {
    const token = await this.indexdb.getOne<{ id: string, data: string }>('token', 'user');
    return token?.data ?? '';
  }

  async defaultPage(userObj: User | null = null): Promise<string> {
    const user = userObj ?? await this.currentUser();
    if (user) {
      const lastVisitedUrl = this.store.get({ db: 'session', name: 'lastVisitedUrl' })
      if ((lastVisitedUrl ?? '') != '') return lastVisitedUrl!;
      if (user.role.isSuperUser) return '/admin/users';
    }
    return '/dashboards';
  }




  authorizations(userCtx: User | null): string[] {
    return userCtx?.authorizations ?? [];
  }


  // routesObg(user: User | null): Routes[] {
  //   return user && user.routes ? user.routes : [];
  // }

  // allRoutes(user: User | null): string[] {
  //   return this.routesObg(user).map(route => route.path);
  // }

  // groupedRoutes(user: User | null): { group: string, routes: { path: string, label: string }[] }[] {
  //   const groups: { group: string, routes: { path: string, label: string }[] }[] = [];
  //   var gMap: { [key: string]: { path: string, label: string }[] } = {};
  //   for (const rt of this.routesObg(user)) {
  //     if (!(rt.group in gMap)) {
  //       gMap[`${rt.group}`] = [];
  //     }
  //     gMap[`${rt.group}`].push({ path: rt.path, label: rt.label })
  //   }

  //   for (let [group, routes] of Object.entries(gMap)) {
  //     groups.push({ group: group, routes: routes })
  //   }
  //   return groups;
  // }

  // hasRole(role: any, userCtx: User | null) {
  //   return !!(userCtx && this.authorizations(userCtx)?.includes(role));
  // }

  // isOnlineOnly(userCtx: User | null) {
  //   return userCtx?.isSuperUser === true || this.hasRole('can_use_offline_mode', userCtx);
  // }

  // canValidateReportsData(userCtx: User | null) {
  //   return userCtx?.isSuperUser === true || this.hasRole('can_validate_data', userCtx);
  // }

  // canSendValidatedReportToDhis2(userCtx: User | null) {
  //   return userCtx?.isSuperUser === true || this.hasRole('can_send_data_to_dhis2', userCtx);
  // }

}
