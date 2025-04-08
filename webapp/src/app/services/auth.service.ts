import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { AppStorageService } from './local-storage.service';
import { UserContextService } from './user-context.service';
import { IndexedDbService } from './indexed-db.service';
import { Observable } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private api: ApiService, private router: Router, private store: AppStorageService, private userCtx: UserContextService, private indexdb: IndexedDbService) { }

  async isAlreadyLogin(): Promise<boolean> {
    const isLoggedIn = await this.userCtx.isLoggedIn();
    if (isLoggedIn) {
      await this.GoToDefaultPage();
      return true;
    }
    return false;
  }

  refreshToken(): Observable<{ status: number, data: string, token: any, orgunits: any, persons: any, message: any }> {
    return new Observable<{ status: number, data: string, token: any, orgunits: any, persons: any, message: any }>((observer) => {
      this.api.newToken().subscribe({
        next: (res: { status: number, data: string, token: any, orgunits: any, persons: any, message: any }) => {
          if (res.status === 200) {
            observer.next(res);
            observer.complete();
          } else {
            observer.error(new Error('Échec de la mise à jour du token'));
          }
        },
        error: (err: any) => {
          observer.error(err);
        }
      });
    });
  }
  
  saveToken(
    res: { status: number; data:string; token: any; orgunits: any; persons: any; message: any },
    redirectTo?: string
  ): Observable<void> {
    return new Observable<void>((observer) => {
      try {
        if (res.status === 200 && res.token && res.orgunits && res.persons) {
          const userData = Object.entries(res).map(([key, value]) => ({
            id: key === 'token' ? 'user' : key,
            data: value
          }));
  
          this.indexdb.saveMany<{ id: string; data: any }>({ dbName: 'token', datas: userData }).then(() => {
            // localStorage.setItem('token', res.token);
            if (redirectTo) location.href = redirectTo;
            observer.next();
            observer.complete();
          }).catch((error) => {
            console.error('Erreur lors de la sauvegarde du token :', error);
            observer.error(error);
          });
        } else {
          console.log(res.data);
          observer.error(new Error(res.data));
          // observer.error(new Error('Données de token invalides.'));
        }
      } catch (e) {
        observer.error(e);
      }
    });
  }



  login(params: { credential: string; password: string }, redirectTo?: string): Observable<void> {
    return new Observable<void>((observer) => {
      this.api.login(params).subscribe({
        next: (res: { status: number; data: string; token: any; orgunits: any; persons: any; message: any }) => {
          this.saveToken(res, redirectTo).subscribe({
            next: () => {
              observer.next();
              observer.complete();
            },
            error: (saveError) => {
              // console.log(saveError)
              observer.error(saveError);
            }
          });
        },
        error: (err: any) => {
          // console.log(err)
          const errorMessage = err?.message || 'Erreur lors de la connexion';
          observer.error(errorMessage);
        }
      });
    });
  }
  
  async clearToken(): Promise<void> {
    try {
      await this.indexdb.deleteAllFromDB({ dbName: 'token' });
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Erreur lors de la suppression du token :', error);
    }
  }

  async GoToDefaultPage(forcelogout: boolean = false) {
    const user = await this.userCtx.currentUser();
    if (forcelogout) {
      this.logout();
      return;
    }
    const default_page = await this.userCtx.defaultPage(user);
    if ((default_page ?? '') != '') return this.router.navigate([default_page]);
    if (user && user.routes.length == 0 && this.userCtx.authorizations(user).length == 0) {
      const msg = "Vous n'avez aucun role attribué, Contacter votre administrateur!";
      return this.router.navigate([`/auths/error/500/${msg}`]);
    }
    return this.logout();
  }

  async logout(): Promise<any> {
    await this.indexdb.deleteAllFromDB({ dbName: 'token' });
    this.store.delete({ db: 'session', name: 'lastVisitedUrl' });
    location.href = "auths/login";
  
    // const namesToDelete = ['token', 'countries', 'regions', 'prefectures', 'communes', 'hospitals', 'districtQuartiers', 'villageSecteurs', 'chws', 'recos'];
    // this.store.deleteSelected({ db: 'local', names: namesToDelete });
    // this.store.delete({ db: 'local', name: '_versions' });
    // this.router.navigate(["auths/login"]);
  }

}


// export async function logoutApplication(store: AppStorageService, indexdb: IndexedDbService): Promise<any> {
// }
