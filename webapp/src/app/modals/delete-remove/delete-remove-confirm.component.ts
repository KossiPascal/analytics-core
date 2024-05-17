import { Component } from '@angular/core';
import { AuthService } from '@kossi-src/app/services/auth.service';

@Component({
  selector: 'delete-remove-confirm-modal',
  templateUrl: './delete-remove-confirm.component.html'
})
export class DeleteRemoveConfirmComponent {

  constructor(private auth: AuthService) { }


  close() {
  }

  DeleteRemove() {
    this.auth.logout();
  }
}
