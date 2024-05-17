import { Component } from '@angular/core';
import { AuthService } from '@kossi-src/app/services/auth.service';

@Component({
  selector: 'logout-confirm-modal',
  templateUrl: './logout-confirm.component.html'
})
export class LogoutConfirmComponent {

  constructor(private auth: AuthService) { }


  close() {
  }

  logout() {
    this.auth.logout();
  }
}
