import { Injectable, OnDestroy } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Title } from '@angular/platform-browser';
import { UserContextService } from '@kossi-services/user-context.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginAccessGuard implements CanActivate, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  constructor(
    private titleService: Title,
    private constants: ConstanteService,
    private router: Router,
    private userContext: UserContextService,
    private authService: AuthService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const user = await this.userContext.currentUser();

    // Redirect if user is not logged in
    if (!this.userContext.isLoggedIn() || !user) {
      this.authService.logout();
      return false;
    }

    const routeAccess: string[] = route.data?.['access'] ?? [];
    const routeTitle: string = route.data?.['title'] || this.constants.APP_TITLE;

    // Build user's effective access rights
    const userAuthorizations = new Set<string>();
    for (const r of user.routes ?? []) {
      for (const auth of r.authorizations ?? []) {
        userAuthorizations.add(auth);
      }
    }

    // Check if user has access
    const hasAccess = user.role?.isAdmin === true || this.hasAnyMatch(userAuthorizations, routeAccess);

    if (hasAccess) {
      this.titleService.setTitle(routeTitle);
      return true;
    } else {
      this.router.navigate(['/errors/unauthorized']);
      return false;
    }
  }

  /**
   * Returns true if any of the required accesses is in user's authorizations.
   */
  private hasAnyMatch(userAuths: Set<string>, required: string[]): boolean {
    return required.some(access => userAuths.has(access));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
