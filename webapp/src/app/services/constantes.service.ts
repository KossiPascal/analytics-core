// env.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserContextService } from './user-context.service';

@Injectable({
  providedIn: 'root'
})
export class ConstanteService {
  private env: any;
  APP_LOGO: string = '';

  get defaultTitle(): string {
    return 'KENDEYA DASHBOARD';
  }

  constructor(private http: HttpClient, private userCtx: UserContextService) { }


  CustomHttpHeaders(): { headers: HttpHeaders } {
    const token = this.userCtx.token;
    return {
      headers: new HttpHeaders({
        Authorization: token != '' ? `Bearer ${token}` : ''
        // "Content-Type": "application/json"
      }),
    };
  }

  getEnvVariable(key: string): string {
    return this.env[key];
  }

  // getPort(): { port: number; isLocal: boolean; } {
  //   if (location.port == '4200') {
  //     return { isLocal: true, port: this.isProduction ?  4437 : 8837 };
  //   }
  //   return { isLocal: false, port: parseInt(location.port) };
  // }

  // backenUrl(cible: string = 'api'): string {
  //   const portInfo = this.getPort();
  //   if (portInfo.isLocal == true) {
  //     return `${location.protocol}//${location.hostname}:${portInfo.port}/${cible}`;
  //   }
  //   return `${location.origin}/${cible}`;
  //   // return 'https://portal-integratehealth.org:4437/api'
  // }

  backenUrl(cible: string = 'api'): string {
    if (location.port == '4200') {
      const isProduction: boolean = false;
      const port = isProduction ? 4437 : 8837;
      return `${location.protocol}//${location.hostname}:${port}/${cible}`;
    }
    return `${location.origin}/${cible}`;
  }
  
}
