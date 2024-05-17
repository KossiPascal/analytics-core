import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppStorageService } from './local-storage.service';
import { ConstanteService } from './constantes.service';
import { UserContextService } from './user-context.service';
import { DEFAULT_LOCAL_DB, DEFAULT_SECOND_LOCAL_DB } from '../utils/const';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  APP_NAME: string;

  constructor(private router: Router, private store: AppStorageService, private cst: ConstanteService, private userCtx: UserContextService) {
    this.APP_NAME = this.cst.defaultTitle
  }

  get isAlreadyLogin(): boolean {
    if (this.userCtx.isLoggedIn) {
      this.GoToDefaultPage();
      return true;
    }
    return false;
  }

  GoToDefaultPage(forcelogout: boolean = false) {
    if (forcelogout) return this.logout();
    const default_page = this.userCtx.defaultPage;
    if ((default_page ?? '') != '') return this.router.navigate([default_page]);
    const user = this.userCtx.currentUserCtx;
    if (user && user.routes.length == 0 && this.userCtx.autorizations().length == 0) {
      const msg = "Vous n'avez aucun role attribué, Contacter votre administrateur!";
      return this.router.navigate([`auths/error/500/${msg}`]);
    }
    return this.logout();
  }


  logout(): any {
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'token' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'countries' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'regions' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'prefectures' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'communes' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'hospitals' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'districtQuartiers' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'villageSecteurs' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'chws' });
    this.store.delete({ db: DEFAULT_LOCAL_DB, name: 'recos' });
    // this.store.delete({ db: DEFAULT_LOCAL_DB, name: '_versions' });
    this.store.delete({ db: DEFAULT_SECOND_LOCAL_DB, name: 'lastVisitedUrl' });

    // this.router.navigate(["auths/login"]);
    location.href = "auths/login";
  }
}
