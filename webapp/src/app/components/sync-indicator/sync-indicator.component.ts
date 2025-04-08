import { Component, OnInit } from '@angular/core';
import { LocalSyncStatusService } from '@kossi-services/local-sync-status.service';


@Component({
    standalone: false,
    selector: 'app-sync-indicator',
    templateUrl: './sync-indicator.component.html',
    styleUrl: './sync-indicator.component.css'
  })
  export class LocalSyncIndicatorComponent implements OnInit {
    status: string | null = null;

    constructor(private syncStatus: LocalSyncStatusService) {}
  
    ngOnInit() {
      this.syncStatus.status$.subscribe(status => {
        this.status = status;
      });
    }
  }
  
