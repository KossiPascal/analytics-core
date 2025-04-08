import { Component } from '@angular/core';
import { LogoutConfirmComponent } from '@kossi-modals/logout/logout-confirm.component';
import { SyncForOfflineConfirmComponent } from '@kossi-modals/sync-for-offline/sync-for-offline.component';
import { UserProfileComponent } from '@kossi-modals/user-profile/user-profile.component';
import { User } from '@kossi-models/user-role';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { ModalService } from '@kossi-services/modal.service';
import { UserContextService } from '@kossi-services/user-context.service';
import $ from 'jquery';
// declare var $: any;

@Component({
  standalone: false,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  isOnline!: boolean;

  USER!: User | null;
  APP_NAME!: string;
  APP_LOGO!: string;
  COUNTRY_LOGO!: string;

  APP_ROUTES: { name: string, link: string, dataName: string, icon: string }[] = [];

  isAuthenticated!: boolean;


  constructor(private cst: ConstanteService, private conn: ConnectivityService, private mService: ModalService, private userCtx: UserContextService) {

    this.initializeComponent();
  }

  private async initializeComponent() {
    this.APP_NAME = this.cst.APP_TITLE;
    this.APP_LOGO = this.cst.APP_LOGO;
    this.COUNTRY_LOGO = this.cst.COUNTRY_LOGO;
    this.USER = await this.userCtx.currentUser();
    this.initAppRoutes();

    this.isAuthenticated = await this.userCtx.isLoggedIn(this.USER)

    this.isOnline = window.navigator.onLine;
    this.conn.getOnlineStatus().subscribe(isOnline => this.isOnline = isOnline);

    this.initNavBar();
  }

  initAppRoutes() {
    let outputRoutes = [];

    const routes = [
      { name: 'Rapports', link: '/reports', dataName: 'Rapports', icon: 'fas fa-chart-line' },
      { name: 'Tableau de bord', link: '/dashboards', dataName: 'Dashboards', icon: 'fas fa-chart-bar' },
      { name: 'Synchronisation', link: '/managements', dataName: 'Synchronisation', icon: 'fas fa-cogs' },
      { name: 'Utilisateurs', link: '/users', dataName: 'Utilisateurs', icon: 'fas fa-users-cog' },
      { name: 'Administration', link: '/administration', dataName: 'Administration', icon: 'fas fa-shield-alt' },
      { name: 'Charts', link: '/charts', dataName: 'Charts', icon: 'fas fa-chart-line' },
      { name: 'XlsForms', link: '/xlsform', dataName: 'xlsform', icon: 'fas fa-comments' },
      { name: 'Renderer Form', link: '/rendererform', dataName: 'xlsform', icon: 'fas fa-comments' },
      { name: 'Documentations', link: '/documentations', dataName: 'Publics', icon: 'fas fa-file-alt' },
      // <i class="fas fa-user-cog"></i>
      // <i class="fas fa-user-shield"></i>
      // <i class="fas fa-bell"></i>
      // <i class="fas fa-home"></i>
      // <i class="fas fa-user"></i>
      // <i class="fas fa-calendar-alt"></i>
    ];
    if (this.USER?.role.isAdmin == true) {
      outputRoutes = routes;
    } else {

      const mappedRoutes = (this.USER?.routes ?? []).map(rt => `/${rt.path}`)

      for (const route of routes) {
        if (mappedRoutes.includes(route.link)) {
          outputRoutes.push(route);
        }
      }
    }
    this.APP_ROUTES = outputRoutes;
  }

  async syncForOffline(event: Event) {
    event.preventDefault();
    this.mService.open(SyncForOfflineConfirmComponent).subscribe((result) => {
      if (result) {
        console.log("Données reçues depuis la modal :", result);
      }
    });
  }

  logout(event: Event) {
    event.preventDefault();
    this.mService.open(LogoutConfirmComponent).subscribe((result) => {
      if (result) {
        console.log("Données reçues depuis la modal :", result);
      }
    });
  }

  viewProfile(event: Event) {
    event.preventDefault();
    this.mService.open(UserProfileComponent).subscribe((result) => {
      if (result) {
        console.log("Données reçues depuis la modal :", result);
      }
    });
  }

  setLanguage(event: Event) {
  }
  



  // redirect(routerLink: string) {
  //   location.href = routerLink;
  //   // this.router.navigate([routerLink]);
  // }

  initNavBar() {
    $(document).ready(function () {
      // Affichage du menu popup
      $("#menu-toggle").click(function (event: any) {
        event.stopPropagation();
        $("#popup-menu").toggle();
      });

      // Affichage ou masquage du popup de profil
      $("#profile-icon").click(function (event: any) {
        event.stopPropagation();
        $("#profile-popup").toggle();
      });

      // Fermer les menus en cliquant ailleurs
      $(document).click(function (event: any) {
        if (!$(event.target).closest("#popup-menu, #menu-toggle").length) {
          $("#popup-menu").hide();
        }
        if (!$(event.target).closest("#profile-popup, #profile-icon").length) {
          $("#profile-popup").hide();
        }
      });

      // Filtrage du menu de recherche
      $("#search-input").on("input", (event: JQuery.TriggeredEvent) => {
        // Convertir event.target en HTMLInputElement
        const target = event.target as HTMLInputElement;

        // Assurez-vous que le type est correct avant d'y accéder
        const searchValue = target.value.toLowerCase();
        let found = false;

        $(".menu-item").each((index: number, element: HTMLElement) => {
          const itemName = $(element).data("name").toLowerCase();
          if (itemName.includes(searchValue)) {
            $(element).show();
            found = true;
          } else {
            $(element).hide();
          }
        });

        $("#no-results").toggle(!found);
      });
    });
  }
}

