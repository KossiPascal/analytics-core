import { Injectable } from "@angular/core";
import { SyncStatus } from "@kossi-models/db";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class LocalSyncStatusService {
  private statusSubject = new BehaviorSubject<SyncStatus>('success');
  status$ = this.statusSubject.asObservable();

  setStatus(status: SyncStatus) {
    this.statusSubject.next(status);
  }
}

