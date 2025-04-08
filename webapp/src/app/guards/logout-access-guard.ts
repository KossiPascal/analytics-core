import { Injectable, OnDestroy } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { UserContextService } from '@kossi-services/user-context.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LogoutAccessGuard implements CanActivate, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  // Whitelisted routes accessible when user is *not* logged in
  private readonly publicAccessPages: string[] = [
    'auths/lock-screen',
    'auths/login',
    // 'auths/register',
    'auths/forgot-password'
  ];

  constructor(
    private userCtx: UserContextService,
    private constants: ConstanteService,
    private titleService: Title,
    private router: Router,
    private authService: AuthService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const isLoggedIn = await this.userCtx.isLoggedIn();
    const requestedPath = state.url.slice(1); // remove leading slash
    const routeTitle = route.data?.['title'] || this.constants.APP_TITLE;

    // Set page title
    this.titleService.setTitle(routeTitle);

    if (isLoggedIn) {
      // User is logged in but tries to access a public page
      await this.authService.GoToDefaultPage();
      return false;
    }

    if (!this.publicAccessPages.includes(requestedPath)) {
      // Accessing a non-public page while logged out
      await this.authService.GoToDefaultPage();
      return false;
    }

    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
