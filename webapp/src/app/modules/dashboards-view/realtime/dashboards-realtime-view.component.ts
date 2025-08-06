import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'dashboards-realtime-view',
  templateUrl: './dashboards-realtime-view.component.html',
  styleUrl: './dashboards-realtime-view.component.css',
})
export class DashboardsRealtimeViewComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}
