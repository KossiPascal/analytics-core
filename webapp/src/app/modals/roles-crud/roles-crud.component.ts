import { Component } from '@angular/core';
import { AuthService } from '@kossi-src/app/services/auth.service';

@Component({
  selector: 'roles-crud-modal',
  templateUrl: './roles-crud.component.html'
})
export class RolesCrudComponent {

  constructor(private auth: AuthService) { }


  close() {
  }

  logout() {
    this.auth.logout();
  }
}
