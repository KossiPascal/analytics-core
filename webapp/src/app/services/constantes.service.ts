// env.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserContextService } from './user-context.service';

@Injectable({
  providedIn: 'root'
})
export class ConstanteService {
  private env: any;
  APP_LOGO: string = '';

  isProduction: boolean = true;

  get defaultTitle(): string {
    return 'ANALYTICS APP';
  }

  constructor(private http: HttpClient, private userCtx: UserContextService) { }

  private readonly envPath: string = '../../../../../ssl/analytics/.env';

  loadEnv(): Observable<any> {
    return this.http.get<any>(this.envPath).pipe(
      tap(env => {
        this.env = env;
      })
    );
  }

  async loadEnv2(): Promise<any> {
    try {
      const env = this.http.get<any>(this.envPath);
      return env;
    } catch (error) {
      console.error('Error loading environment variables:', error);
      return {};
    }
  }

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
      const port = this.isProduction ? 4437 : 8837;
      return `${location.protocol}//${location.hostname}:${port}/${cible}`;
    }
    return `${location.origin}/${cible}`;
  }
}
