import { Injectable } from '@angular/core';
import { LocalDbName } from '@kossi-models/db';
import { CookieService } from 'ngx-cookie-service';


@Injectable({
  providedIn: "root",
})
export class AppStorageService {

  constructor(private coo: CookieService) { }

  get = ({ db, name }: { db: LocalDbName, name: string }): string => {
    if (db === 'local') {
      return localStorage.getItem(name) ?? '';
    } else if (db === 'session') {
      return sessionStorage.getItem(name) ?? '';
    } else if (db === 'coockie') {
      return this.coo.get(name);
    }
    return '';
  }

  set = ({ db, name, value }: { db: LocalDbName, name: string, value: string }) => {
    if (db === 'local') {
      sessionStorage.removeItem(name);
      this.coo.delete(name);
      localStorage.setItem(name, value);
    } else if (db === 'session') {
      localStorage.removeItem(name);
      this.coo.delete(name);
      sessionStorage.setItem(name, value);
    } else if (db === 'coockie') {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
      this.coo.set(name, value);
    }
  }

  delete = ({ db, name }: { db: LocalDbName, name: string }) => {
    if (db === 'local') {
      localStorage.removeItem(name);
    } else if (db === 'session') {
      sessionStorage.removeItem(name);
    } else if (db === 'coockie') {
      this.coo.delete(name);
    }
  };

  deleteSelected = ({ db, names }: { db: LocalDbName, names: string[] }) => {
    for (const name of names) {
      this.delete({db, name})
    }
  };

  deleteAll = (db: LocalDbName) => {
    if (db === 'local') {
      localStorage.clear();
    } else if (db === 'session') {
      sessionStorage.clear();
    } else if (db === 'coockie') {
      this.coo.deleteAll();
    }
  }

  // check = (name: string): boolean => this.cookieService.check(name);
  // get = (name: string): string => this.cookieService.get(name);
  // getAll = (): { [key: string]: string } => this.cookieService.getAll();
  // set(name: string, value: string, expires?: number | Date | undefined, path?: string | undefined, domain?: string | undefined, secure?: boolean | undefined, sameSite?: SameSite | undefined) {
  //     this.cookieService.set(name, value, expires, path, domain, secure, sameSite);
  // }
  // delete(name: string, path?: string | undefined, domain?: string | undefined, secure?: boolean | undefined, sameSite?: SameSite | undefined) {
  //     this.cookieService.delete(name, path, domain, secure, sameSite);
  // }
  // deleteAll(path?: string | undefined, domain?: string | undefined, secure?: boolean | undefined, sameSite?: SameSite | undefined) {
  //     this.cookieService.deleteAll(path, domain, secure, sameSite);
  // }
}
