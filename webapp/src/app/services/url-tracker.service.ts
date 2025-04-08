import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UrlTrackerService {

  constructor(private router: Router, private store: AppStorageService) {
    this.initUrlTracking();
  }

  initUrlTracking() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const currentUrl = this.router.url;
        this.store.set({ db: 'session', name: 'lastVisitedUrl', value: currentUrl });
      }
    });
  }
}
