import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@kossi-services/auth.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  selector: 'app-side-navigation',
  templateUrl: `./side-nav.component.html`,
  styleUrls: ['./side-nav.component.css'],
})
export class SideNavigationComponent implements OnInit {
  APP_NAME: string;
  ROUTES_GROUPED:{ group: string, routes: {path:string, label:string}[] }[] = [];

  constructor(private router: Router, private auth: AuthService, private userCtx: UserContextService) {
    this.APP_NAME = this.auth.APP_NAME;
    this.ROUTES_GROUPED = this.userCtx.groupedRoutes;
  }

  ngOnInit(): void {
    // Subscribe to router events
  }


  getPaths(routes: { path: string; label: string; }[]): string[] {
    return routes.map(route => route.path);
  }

  activePage(href: string[]): string {
    const url = this.router.routerState.snapshot.url;
    // const pageHref = this.router.routerState.snapshot.root.firstChild?.data['href'];
    return href.includes(url.replace(/^\/+|\/+$/g, '')) ? 'active' : '';
  }

  showDropdown(href: string[]): string {
    const url = this.router.routerState.snapshot.url;
    // const pageHref = this.router.routerState.snapshot.root.firstChild?.data['href'];
    return href.includes(url.replace(/^\/+|\/+$/g, '')) ? 'show' : '';
  }




// "fa fa-user-edit me-2"
// "fa fa-laptop me-2"

// "far fa-file-alt me-2"
// "fa fa-tachometer-alt me-2"
// "fa fa-keyboard me-2"
// "fa fa-table me-2"
// "fa fa-chart-bar me-2"
// "fa fa-th me-2"

}
