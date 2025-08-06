import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'maps-view',
  templateUrl: './maps-view.component.html',
  styleUrl: './maps-view.component.css',
})
export class MapsViewComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}
