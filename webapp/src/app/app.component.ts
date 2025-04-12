import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocalSyncService } from '@kossi-services/local-sync.service';
import { PrivacyPoliciesService } from '@kossi-services/privacy-policies.service';
import { UpdateServiceWorkerService } from '@kossi-services/update-service-worker.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private initialisationComplete: boolean = false;
  private setupPromise: any;

  isAuthenticated!:boolean;

  YEAR:number = new Date().getFullYear();
  
 
  constructor(
    private userCtx: UserContextService, 
    private lSync:LocalSyncService,

    private router: Router,
    private privacyPoliciesService: PrivacyPoliciesService,
    private usw: UpdateServiceWorkerService,
  ) {
    this.initializeComponent();
  }

  private async initializeComponent(){
    // window.addEventListener('online', () => this.lSync. initializeSync());
    // window.addEventListener('offline', () => this.lSync.setStatus('offline'));

    this.isAuthenticated = await this.userCtx.isLoggedIn();
    await this.lSync.initializeSync()


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

  hideMainPage(): boolean {
    const s = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return s.includes('errors') || s.includes('auths/login');
  }

  isPublicPage(): boolean {
    const s = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return s.includes('public') || s.includes('publics');
  }

  isChartsPage(): boolean {
    const s = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return s.includes('charts') || s.includes('/charts');
  }

  private requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage
        .persist()
        .then(granted => {
          if (granted) {
            console.info('Persistent storage granted: storage will not be cleared except by explicit user action');
          } else {
            console.info('Persistent storage denied: storage may be cleared by the UA under storage pressure.');
          }
        });
    }
  }


  private checkPrivacyPolicy() {
    return this.privacyPoliciesService
      .hasAccepted()
      .then(({ privacyPolicy, accepted }: any = {}) => {
      })
      .catch(err => console.error('Failed to load privacy policy', err));
  }

}

