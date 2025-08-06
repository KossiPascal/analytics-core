import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ErrorNavigatorService {
  constructor(private router: Router) {}

  /**
   * Redirige vers une page d'erreur avec code et message.
   * Si message est vide, il sera remplacé dans le composant.
   */
  navigateTo(code: '404' | '500' | '401', message?: string) {
    const encodedMsg = message && message.trim() !== '' ? encodeURIComponent(message) : '';
    this.router.navigate([`/errors/${code}/${encodedMsg}`]);
  }
}
