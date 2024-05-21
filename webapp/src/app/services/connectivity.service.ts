import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private onlineStatus$: BehaviorSubject<boolean>;

  constructor() {
    this.onlineStatus$ = new BehaviorSubject<boolean>(window.navigator.onLine);
    window.addEventListener("load", () => {
      window.addEventListener('online', () => {
        this.onlineStatus$.next(true);
      });

      window.addEventListener('offline', () => {
        this.onlineStatus$.next(false);
      });
    });
  }

  getOnlineStatus(): Observable<boolean> {
    return this.onlineStatus$.asObservable();
  }
}
