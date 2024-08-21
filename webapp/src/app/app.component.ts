import { Component, OnInit } from '@angular/core';
import { WebSocketService } from './services/web-socket.service';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { PrivacyPoliciesService } from './services/privacy-policies.service';
import { ModalService } from './services/modal.service';
import { UpdateServiceWorkerService } from '@kossi-services/update-service-worker.service';
import { SessionExpiredComponent } from '@kossi-modals/session-expired/session-expired.component';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { ResponsiveService } from '@kossi-services/responsive.service';

declare var $: any;

const SYNC_STATUS = {
  inProgress: {
    icon: 'fa-refresh',
    key: 'sync.status.in_progress',
    disableSyncButton: true
  },
  success: {
    icon: 'fa-check',
    key: 'sync.status.not_required',
    className: 'success'
  },
  required: {
    icon: 'fa-exclamation-triangle',
    key: 'sync.status.required',
    className: 'required'
  },
  unknown: {
    icon: 'fa-info-circle',
    key: 'sync.status.unknown'
  }
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'webapp';
  navStyleControl: number = 0;
  private initialisationComplete: boolean = false;
  private setupPromise: any;

  public showCustom:boolean = false;

  YEAR:number = new Date().getFullYear();


  constructor(
    private webSocketService: WebSocketService,
    private auth: AuthService,
    private router: Router,
    private modalService: ModalService,
    private privacyPoliciesService: PrivacyPoliciesService,
    private usw: UpdateServiceWorkerService,
    private snackbar: SnackbarService,
    private userCtx: UserContextService,
    private responsiveService:ResponsiveService,
  ) {

  }

  ngOnInit(): void {

    setTimeout(() => {
      const self = this;
      $(".body-container").click(function () {
        if (self.responsiveService.isMobile || self.responsiveService.isTablette) {
          const elm = $(".sidebar, .content");
          if (elm.hasClass("open")) {
            elm.removeClass("open");
          }
        }
      });
    }, 500);

    if (![4200, '4200'].includes(location.port)) {
      this.usw.registerServiceWorker();
      this.setupDb();
      this.setupPromise = Promise.resolve()
        .then(() => this.checkPrivacyPolicy())
        .catch(err => {
          this.initialisationComplete = true;
          console.error('Error during initialisation', err);
          this.router.navigate(['/errors', '503']);
        });
      this.usw.watchForChanges();
      this.requestPersistentStorage();
      // this.sw.checkForUpdates();
    }
  }

  showMessage() {
    this.makeSpinner(() => { }, 5000)
    this.snackbar.show('Your message here', { backgroundColor: 'danger', duration: 5000 });
  }

  hideMainPage(): boolean {
    const s = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return s.includes('errors') || s.includes('auths/login');
  }

  isPublicPage(): boolean {
    const s = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return s.includes('public') || s.includes('publics');
  }

  isAuthenticated(): boolean {
    return this.userCtx.isLoggedIn;
  }

  logout() {
    this.auth.logout();
  }

  reload() {
    this.webSocketService.sendReloadMessage();
  }

  async makeSpinner(callBack: () => any, duration: number = 1000): Promise<void> {
    $("#spinner").addClass("show");
    await new Promise<void>((resolve) => {
      const result = callBack();
      if (!(result instanceof Promise)) {
        resolve();
      } else {
        result.then(() => resolve());
      }
    });
    setTimeout(() => {
      $("#spinner").removeClass("show");
    }, duration);
  }


  private setupDb() {
    // if (this.dbSyncService.isEnabled()) {
    //   setTimeout(() => this.dbSyncService.sync(), 10 * 1000);
    // } else {
    //   console.debug('You have administrative privileges; not replicating');
    // }

    // if (1==1) {
    //   this.showSessionExpired();
    //   setTimeout(() => {
    //     console.info('Redirect to login after 1 minute of inactivity');
    //     this.sessionService.navigateToLogin();
    //   }, 60000);
    // }
  }

  private showSessionExpired() {
    this.modalService.open({ component: SessionExpiredComponent });
  }

  private requestPersistentStorage() {
    // if (navigator.storage && navigator.storage.persist) {
    //   navigator.storage
    //     .persist()
    //     .then(granted => {
    //       if (granted) {
    //         console.info('Persistent storage granted: storage will not be cleared except by explicit user action');
    //       } else {
    //         console.info('Persistent storage denied: storage may be cleared by the UA under storage pressure.');
    //       }
    //     });
    // }
  }

  private checkPrivacyPolicy() {
    // return this.privacyPoliciesService
    //   .hasAccepted()
    //   .then(({ privacyPolicy, accepted }: any = {}) => {
    //   })
    //   .catch(err => console.error('Failed to load privacy policy', err));
  }
}
