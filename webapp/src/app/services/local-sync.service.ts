import { Injectable } from '@angular/core';
import { Observable, from, of, interval, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LocalSyncStatusService } from './local-sync-status.service';
import { DbSyncService } from './db-sync.service';
import { UserContextService } from './user-context.service';
import { SyncStatus } from '@kossi-models/db';
import { User } from '@kossi-models/user-role';



@Injectable({ providedIn: 'root' })
export class LocalSyncService {
  private readonly SYNC_INTERVAL_MS = 60 * 1000 * 50; // 5 minutes
  private lastSyncTime: number = 0;
  private syncSubscription: Subscription | null = null;

  constructor(private db: DbSyncService, private userContext: UserContextService, private syncStatus: LocalSyncStatusService) { }

  /**
   * Initialiser la première synchronisation après login
   */
  public async initializeSync(): Promise<void> {
    this.setStatus('pending');
    const user = await this.userContext.currentUser();
    if (user?.role.canUseOfflineMode == true) {
      this.syncWithServer(user).subscribe(success => {
        if (success) {
          this.lastSyncTime = Date.now();
          this.setStatus('success');
          this.startRecurringSync(user);
        } else {
          this.setStatus('error');
        }
      });
    }
  }

  /**
   * Lance une synchronisation manuelle
   */
  public async forceSync(): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }
    const user = await this.userContext.currentUser();
    if (user?.role.canUseOfflineMode == true) {

      this.setStatus('pending');
      this.syncWithServer(user).subscribe(success => {
        if (success) {
          this.lastSyncTime = Date.now();
          this.setStatus('success');
        } else {
          this.setStatus('error');
        }
      });
    }
  }

  /**
   * Planifie une synchronisation récurrente toutes les 5 minutes si nécessaire
   */
  private startRecurringSync(user: User | null): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe(); // évite les doublons
    }

    if (user?.role.canUseOfflineMode == true) {
      this.syncSubscription = interval(this.SYNC_INTERVAL_MS).subscribe(() => {
        if (!navigator.onLine) {
          this.setStatus('offline');
          return;
        }

        const now = Date.now();
        const timeSinceLastSync = now - this.lastSyncTime;

        if (timeSinceLastSync >= this.SYNC_INTERVAL_MS) {
          this.setStatus('pending');
          this.syncWithServer(user).subscribe(success => {
            if (success) {
              this.lastSyncTime = Date.now();
              this.setStatus('success');
            } else {
              this.setStatus('error');
            }
          });
        } else {
          this.setStatus('outdated'); // sync pas encore nécessaire
        }
      });
    }
  }

  /**
   * Méthode principale de synchronisation avec le serveur
   */
  public syncWithServer(user: User | null, param?: { months: string[]; year: number; recos: string[] }): Observable<boolean> {

    if (!user) {
      // console.warn('[SYNC] Aucun utilisateur connecté.');
      return of(false);
    }

    if (user?.role.canUseOfflineMode == true) {
      const today = new Date();
      const defaultMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const months = param?.months ?? [defaultMonth];

      const recos = param?.recos ?? user.recos.map(r => r.id);

      return from(this.db.all({ months, year, recos })).pipe(
        map(res => res === true),
        catchError(err => {
          // console.error('[SYNC] Erreur DB:', err);
          return of(false);
        })
      );

      // return from(this.userContext.currentUser()).pipe(
      //   switchMap(user => {

      //   }),
      //   catchError(err => {
      //     // console.error('[SYNC] Erreur utilisateur:', err);
      //     return of(false);
      //   })
      // );
    } else {
      return of(false);
    }
  }

  /**
   * Définit et diffuse le statut de la synchronisation
   */
  public setStatus(status: SyncStatus): void {
    // console.log(`[SYNC STATUS] ${status.toUpperCase()}`);
    this.syncStatus.setStatus(status);
  }

}
