import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'publics-view',
  templateUrl: './publics-view.component.html',
  styleUrl: './publics-view.component.css',
})
export class PublicsViewComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}
