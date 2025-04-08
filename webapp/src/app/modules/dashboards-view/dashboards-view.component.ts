import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'dashboards-view',
  templateUrl: './dashboards-view.component.html',
  styleUrl: './dashboards-view.component.css',
})
export class DashboardsViewComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}
