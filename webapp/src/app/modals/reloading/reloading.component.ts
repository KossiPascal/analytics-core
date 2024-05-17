import { Component } from '@angular/core';
import { UpdateServiceWorkerService } from '@kossi-services/update-service-worker.service';
@Component({
  selector: 'reloading-modal',
  templateUrl: './reloading.component.html'
})
export class ReloadingComponent {

  constructor(
    private usw: UpdateServiceWorkerService,) { }

  close() {
    this.usw.UPDATE_INTERVAL = this.usw.TWO_HOURS;
  }


  submit() {
    this.usw.cleanToUpdateWebApp();
  }
}
