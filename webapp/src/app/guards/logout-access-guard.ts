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
export class LogoutAccessGuard implements CanActivate, OnDestroy {

    private destroy$ = new Subject<void>();

    constructor(private userCtx: UserContextService, private cst: ConstanteService, private titleService: Title, private activatedRoute: ActivatedRoute, private router: Router, private auth: AuthService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (this.userCtx.isLoggedIn) {
            this.auth.GoToDefaultPage();
            return false;
        }

        const value = route.data?.['title'] || this.cst.defaultTitle;;
        this.setRouteTitle(value);
        const requestedRoute = state.url.substring(1);
        if (!this.logoutAccessPages.includes(requestedRoute)) {
            this.auth.GoToDefaultPage();
            return false;
        }
        return true;
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
                return this.cst.defaultTitle;;
            })
        ).subscribe((ttl: string) => {
            this.setRouteTitle(ttl);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    logoutAccessPages:string[] = [
        "auths/lock-screen",
        "auths/login",
        "auths/register",
        "auths/forgot-password"
    ]
}
