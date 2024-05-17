import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConstanteService } from './constantes.service';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  backendUrl:any;
  headers:any;

    constructor(private api: ApiService, private http: HttpClient, private cst:ConstanteService) {
      if (!this.backendUrl) this.backendUrl = this.cst.backenUrl();
      if (!this.headers) this.headers = this.cst.CustomHttpHeaders();
     }


    getConfigs(): Observable<any> {
      const fparams = this.api.ApiParams();
      return this.http.post(`${this.backendUrl}/configs`, fparams, this.headers);
    }

    appVersion(): Observable<any> {
      const fparams = this.api.ApiParams();
      return this.http.post(`${this.backendUrl}/configs/version`, fparams, this.headers);
    }

}
