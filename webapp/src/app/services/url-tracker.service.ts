import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppStorageService } from './local-storage.service';
import { DEFAULT_SECOND_LOCAL_DB } from '../utils/const';

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
        this.store.set({ db: DEFAULT_SECOND_LOCAL_DB, name: 'lastVisitedUrl', value: currentUrl });
      }
    });
  }
}
