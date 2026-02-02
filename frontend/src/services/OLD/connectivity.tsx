import { useEffect, useRef } from "react";
import { BehaviorSubject } from "rxjs";
import { debounceTime } from "rxjs/operators";

// Singleton service
class ConnectivityService {
  private _status$ = new BehaviorSubject<boolean>(navigator.onLine);
  private readonly _checkUrl = "https://www.gstatic.com/generate_204";
  private intervalId?: number;

  constructor() {
    this.monitorBrowserEvents();
    this.checkOfflineFallback();
    // this.autoPingEvery(15000); // Optional: auto-check every 15s
  }

  private monitorBrowserEvents() {
    const handleChange = this.debounce(() => this.checkOfflineFallback(), 300);
    window.addEventListener("online", handleChange);
    window.addEventListener("offline", handleChange);
  }

  private debounce(fn: () => void, delay: number) {
    let timer: number;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(fn, delay) as any;
    };
  }

  public autoPingEvery(intervalMs: number) {
    this.intervalId = setInterval(() => this.checkOfflineFallback(), intervalMs) as any;
  }

  private async checkOfflineFallback() {
    if (!navigator.onLine) {
      this._status$.next(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(this._checkUrl, {
        method: "GET",
        cache: "no-cache",
        mode: "no-cors",
        signal,
      });

      clearTimeout(timeout);

      // If opaque (no-cors) or 2xx-3xx status, consider online
      if (response.type === "opaque" || (response.status >= 200 && response.status < 400)) {
        this._status$.next(true);
      } else {
        this._status$.next(false);
      }
    } catch (err) {
      clearTimeout(timeout);
      this._status$.next(false);
    }
  }

  get onlineStatus$() {
    return this._status$.asObservable();
  }

  get isOnline(): boolean {
    return this._status$.value;
  }
}

// Export singleton
export const connectivityService = new ConnectivityService();

/**
 * React hook to use connectivity status
 */
export function useOnlineStatus(): boolean {
  const onlineStatusRef = useRef<boolean>(connectivityService.isOnline);

  useEffect(() => {
    const sub = connectivityService.onlineStatus$.subscribe((status) => {
      onlineStatusRef.current = status;
    });

    return () => sub.unsubscribe();
  }, []);

  return onlineStatusRef.current;
}
