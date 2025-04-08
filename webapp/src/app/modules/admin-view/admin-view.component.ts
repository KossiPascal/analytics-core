import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'dashboards-view',
  templateUrl: './admin-view.component.html',
  styleUrl: './admin-view.component.css',
})
export class AdminViewComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}
