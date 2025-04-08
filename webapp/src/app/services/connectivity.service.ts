import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private onlineStatus$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly testUrl: string = 'https://clients3.google.com/generate_204'; // returns 204 if connected
  private readonly checkIntervalMs: number = 15000; // check every 15s

  constructor() {
    this.initConnectivityCheck();
  }

  private initConnectivityCheck(): void {
    // First check
    this.verifyInternetAccess();

    // Listen to browser online/offline events
    window.addEventListener('online', () => this.verifyInternetAccess());
    window.addEventListener('offline', () => this.setStatus(false));

    // Periodic checks
    setInterval(() => this.verifyInternetAccess(), this.checkIntervalMs);
  }

  private async verifyInternetAccess(): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(this.testUrl, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeout);

      // Even if fetch doesn't return status (no-cors), reaching here means we got a response
      this.setStatus(true);
    } catch (err) {
      this.setStatus(false);
    }
  }

  private setStatus(status: boolean): void {
    if (this.onlineStatus$.value !== status) {
      this.onlineStatus$.next(status);
    }
  }

  /**
   * Observable that emits online status changes.
   */
  getOnlineStatus(): Observable<boolean> {
    return this.onlineStatus$.asObservable();
  }

  /**
   * Get the current online status (real-time).
   */
  isOnline(): boolean {
    return this.onlineStatus$.getValue();
  }
}
