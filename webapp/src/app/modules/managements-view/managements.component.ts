import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';


@Component({
  standalone: false,
  selector: 'app-managements-data',
  templateUrl: `./managements.component.html`,
  styleUrls: ['./managements.component.css'],
})
export class ManagementsComponent {
  CHANGE_STATE: any = null;

  constructor() {
    initTabsLinkView();
  }

}

