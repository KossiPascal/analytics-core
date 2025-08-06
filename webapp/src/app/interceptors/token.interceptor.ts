import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from "@angular/common/http";
import { catchError, Observable, throwError, from, switchMap, of } from "rxjs";
import { UserContextService } from "@kossi-services/user-context.service";
import { AuthService } from "@kossi-services/auth.service";
import { jwtDecode } from "jwt-decode";
import { AuthResponse } from "@kossi-models/user-role";

@Injectable({
  providedIn: "root",
})
export class TokenExpiredInterceptor implements HttpInterceptor {
  private refreshInProgress = false;

  constructor(private auth: AuthService, private userCtx: UserContextService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isLoginRequest(request)) {
      return next.handle(request); // Skip the interceptor for login requests
    }
    
    return from(this.userCtx.token()).pipe(
      switchMap((token: string | null) => {
        if (!token || token=='') {
          this.auth.logout(); // Aucun token, déconnexion immédiate
          return throwError(() => new Error("Utilisateur non authentifié"));
        }

        if (this.isTokenExpired(token)) {
          this.auth.logout(); // Token déjà expiré, on déconnecte
          return throwError(() => new Error("Token expiré"));
        }

        if (this.shouldRefreshToken(token)) {
          return this.refreshToken().pipe(
            switchMap((newToken) => {
              request = request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(request);
            }),
            catchError((error) => this.handleError(error))
          );
        }

        request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` },});
        return next.handle(request).pipe(catchError((error) => this.handleError(error)));
      }),
      catchError((error) => this.handleError(error))
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true; // Considérer expiré si erreur
    }
  }

  private shouldRefreshToken(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 60; // Rafraîchir 1 min avant expiration
      return decoded.exp - now < bufferTime;
    } catch (error) {
      return false;
    }
  }

  private refreshToken(): Observable<string> {
    if (this.refreshInProgress) {
      return from(this.userCtx.token()); // Si déjà en cours, utiliser le token actuel
    }
    this.refreshInProgress = true;

    return this.auth.refreshToken().pipe(
      switchMap((res:AuthResponse) => {
        this.refreshInProgress = false;
        return from(this.auth.saveToken(res)).pipe(
          switchMap(() => {
            this.refreshInProgress = false;
            return of(res.token);
          }),
          catchError((saveError) => {
            this.refreshInProgress = false;
            console.error('Erreur lors de la sauvegarde du token :', saveError);
            this.auth.logout();
            return throwError(() => new Error("Échec de la sauvegarde du token"));
          })
        );
      }),
      catchError((error) => {
        this.refreshInProgress = false;
        console.error('Erreur lors du rafraîchissement du token :', error);
        this.auth.logout();
        return throwError(() => new Error("Impossible de rafraîchir le token"));
      })
    );
  }

  private handleError(error: any): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if ([401, 403].includes(error.status) || error.error?.action === "logout") {
        this.auth.logout();
      }
    }
    return throwError(() => new Error(error?.message || "Une erreur est survenue"));
  }

  private isLoginRequest(request: HttpRequest<any>): boolean {
    if (request.url.includes('/auths/login') || request.body?.loginModeCredents === true) {
      return true;
    }
    return false; 
  }  
}
