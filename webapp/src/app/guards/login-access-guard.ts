// Import necessary modules
import { Injectable, OnDestroy } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { UserContextService } from '@kossi-services/user-context.service';
import { ConstanteService } from '@kossi-services/constantes.service';

@Injectable({
  providedIn: 'root',
})
export class LoginAccessGuard implements CanActivate, OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private titleService: Title, private cst: ConstanteService, private activatedRoute: ActivatedRoute, private router: Router, private userCtx: UserContextService, private auth: AuthService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.userCtx.currentUserCtx;

    if (!this.userCtx.isLoggedIn || !user) {
      this.auth.logout();
      return false;
    }

    const pageHref = route.data?.['href'];
    const f = [].concat.apply([], ) ;

    if (!pageHref || pageHref && (user.isAdmin || (user.routes??[]).map(val=>val.path).includes(pageHref))) {
      const title = route.data?.['title'] || this.cst.defaultTitle;
      this.setRouteTitle(title);

      const requestedRoute = state.url.substring(1);

      return true;
    } else {
      this.router.navigate(["errors/unauthorized"]);
      // this.router.createUrlTree(['errors/unauthorized']);
      return false;
    }
  }

  setRouteTitle(title: string): void {
    this.titleService.setTitle(title);
  }

  subscribeToNavigationEnd(): void {
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const child = this.activatedRoute.firstChild;
        if (child && child.snapshot.data['title']) {
          return child.snapshot.data['title'];
        }
        return this.cst.defaultTitle;
      })
    ).subscribe((ttl: string) => {
      this.setRouteTitle(ttl);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
