import { Component } from '@angular/core';
import { initTabsLinkView } from '@kossi-shared/functions';
import { User } from '@kossi-models/user-role';
import { ConstanteService } from '@kossi-services/constantes.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  standalone: false,
  selector: 'dashboards-view',
  templateUrl: './users-roles-view.component.html',
  styleUrl: './users-roles-view.component.css',
})
export class UsersRolesViewComponent {
  CHANGE_STATE: any = null;

  APP_LOGO: string = '';
  USER!: User | null;


  constructor(private userCtx: UserContextService, private cst: ConstanteService) {
    this.initializeComponent();
  }

  private async initializeComponent() {
    this.APP_LOGO = this.cst.APP_LOGO;
    this.USER = await this.userCtx.currentUser();
  
    initTabsLinkView();
  }

}
