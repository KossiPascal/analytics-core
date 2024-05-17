import { Injectable } from '@angular/core';
import { AppStorageService } from './local-storage.service';
import { AdminUser, Routes, User } from '../models/user';
import { jwtDecode } from "jwt-decode";
import { DEFAULT_LOCAL_DB, DEFAULT_SECOND_LOCAL_DB } from '../utils/const';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {

  constructor(private store: AppStorageService) { }

  get appLoadToken(): string | null | undefined {
    return 'Kossi TSOLEGNAGBO';
  }

  get isLoggedIn(): boolean {
    const user = this.currentUserCtx;
    return user ? Math.floor(Date.now() / 1000) < user.exp : false;
  }

  get currentUserCtx(): User | null {
    if (this.token !== '') {
      const user = jwtDecode(this.token) as User;
      const countries = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'countries' });
      const regions = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'regions' });
      const prefectures = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'prefectures' });
      const communes = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'communes' });
      const hospitals = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'hospitals' });
      const districtQuartiers = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'districtQuartiers' });
      const villageSecteurs = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'villageSecteurs' });
      const chws = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'chws' });
      const recos = this.store.get({ db: DEFAULT_LOCAL_DB, name: 'recos' });

      if (countries !== '') user.countries = JSON.parse(countries);
      if (regions !== '') user.regions = JSON.parse(regions);
      if (prefectures !== '') user.prefectures = JSON.parse(prefectures);
      if (communes !== '') user.communes = JSON.parse(communes);
      if (hospitals !== '') user.hospitals = JSON.parse(hospitals);
      if (districtQuartiers !== '') user.districtQuartiers = JSON.parse(districtQuartiers);
      if (villageSecteurs !== '') user.villageSecteurs = JSON.parse(villageSecteurs);
      if (chws !== '') user.chws = JSON.parse(chws);
      if (recos !== '') user.recos = JSON.parse(recos);
      return user;
    }
    return null;
  }

  async getCurrentUserCtx(): Promise<User | null> {
    return this.currentUserCtx;
  }

  get token(): string {
    return this.store.get({ db: DEFAULT_LOCAL_DB, name: 'token' });
  }

  get defaultPage(): string {
    const user = this.currentUserCtx;
    if (user) {
      const lastVisitedUrl = this.store.get({ db: DEFAULT_SECOND_LOCAL_DB, name: 'lastVisitedUrl' })
      if ((lastVisitedUrl ?? '') != '') return lastVisitedUrl!;
      const dph = user.default_route?.path ?? '';
      if (dph != '') return dph;
      if (user.isAdmin) return 'admin/users';
      const uph = user.routes?.[0]?.path ?? '';
      if (uph != '') return uph;
    }
    return '';
  }

  get routesObg(): Routes[] {
    const user = this.currentUserCtx;
    return user && user.routes ? user.routes : [];
  }

  get allRoutes(): string[] {
    return this.routesObg.map(route => route.path);
  }

  get groupedRoutes(): { group: string, routes: { path: string, label: string }[] }[] {
    const groups: { group: string, routes: { path: string, label: string }[] }[] = [];
    var gMap: { [key: string]: { path: string, label: string }[] } = {};
    for (const rt of this.routesObg) {
      if (!(rt.group in gMap)) {
        gMap[`${rt.group}`] = [];
      }
      gMap[`${rt.group}`].push({ path: rt.path, label: rt.label })
    }

    for (let [group, routes] of Object.entries(gMap)) {
      groups.push({ group: group, routes: routes })
    }
    return groups;
  }

  autorizations(userCtx: User | AdminUser | null = null): string[] {
    userCtx = userCtx || this.currentUserCtx;
    return userCtx?.autorizations ?? [];
  }

  hasRole(role: any, userCtx: User | AdminUser | null = null) {
    userCtx = userCtx || this.currentUserCtx;
    return !!(userCtx && this.autorizations(userCtx)?.includes(role));
  }

  isOnlineOnly(userCtx: User | AdminUser | null = null) {
    userCtx = userCtx || this.currentUserCtx;
    return userCtx?.isAdmin === true || this.hasRole('can_use_offline_mode', userCtx);
  }

}
