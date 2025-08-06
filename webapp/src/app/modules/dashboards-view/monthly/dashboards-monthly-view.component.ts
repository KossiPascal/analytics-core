import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'dashboards-monthly-view',
  templateUrl: './dashboards-monthly-view.component.html',
  styleUrl: './dashboards-monthly-view.component.css',
})
export class DashboardsMonthlyViewComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}
