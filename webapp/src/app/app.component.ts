import { Component, HostListener, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit{

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
  ngOnInit(): void {
    // const isAndroid = /android/i.test(navigator.userAgent);
    // if (isAndroid) {
    //   document.body.classList.add('no-pull-to-refresh');
    // }
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



  zoom = 1;
  baseScale = 1;

  // Touch pinch
  onPinch(event: any) {
    this.zoom = this.baseScale * event.scale;
  }

  onPinchEnd() {
    this.baseScale = this.zoom;
  }

  // PC trackpad pinch (interpreted as ctrl+wheel)
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();

      const scaleStep = 0.05;
      if (event.deltaY < 0) {
        this.zoom += scaleStep;
      } else {
        this.zoom = Math.max(0.1, this.zoom - scaleStep);
      }
      this.baseScale = this.zoom;
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
    return s.includes('errors') || s.includes('auths/login') || s.includes('auths/change-default-password');
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

