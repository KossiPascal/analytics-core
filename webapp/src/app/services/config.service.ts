import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConstanteService } from './constantes.service';
import { from, Observable, switchMap } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  backendUrl: any;
  headers: any;

  constructor(private api: ApiService, private http: HttpClient, private cst: ConstanteService) {
    if (!this.backendUrl) this.backendUrl = this.cst.backenUrl();
    if (!this.headers) this.headers = this.cst.CustomHttpHeaders();
  }


  getConfigs(): Observable<any> {
    return from(this.api.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/configs`, fparams, this.headers)
      )
    );
  }

  appVersion(): Observable<any> {
    return from(this.api.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/configs/version`, fparams, this.headers)
      )
    );
  }

}
